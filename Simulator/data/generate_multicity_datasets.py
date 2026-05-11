"""Generate reproducible multi-city SolarChain benchmark datasets.

The generator combines pvlib solar geometry / clear-sky modeling with cached
Open-Meteo historical weather observations for a 24-hour China Standard Time
cycle. It writes four CSV files used by anomaly detection and market liquidity
benchmarks.
"""

from __future__ import annotations

import json
from dataclasses import dataclass
from pathlib import Path

import numpy as np
import pandas as pd
import requests
from pvlib.location import Location


BASE_DIR = Path(__file__).resolve().parent
OUTPUT_DIR = BASE_DIR / "datasets"
CACHE_DIR = BASE_DIR / "cache"
WEATHER_CACHE = CACHE_DIR / "open_meteo_weather_2026-05-01.json"

SIM_DATE = "2026-05-01"
TIMEZONE = "Asia/Shanghai"
RNG_SEED = 20260511
NODES_PER_CITY = 10


@dataclass(frozen=True)
class City:
    name: str
    latitude: float
    longitude: float


CITIES = [
    City("Beijing", 39.9042, 116.4074),
    City("Shanghai", 31.2304, 121.4737),
    City("Chengdu", 30.5728, 104.0668),
    City("Shenzhen", 22.5431, 114.0579),
    City("Hangzhou", 30.2741, 120.1551),
]


def fetch_weather_cache() -> dict:
    """Fetch one day of observed hourly weather, or reuse the local cache."""
    CACHE_DIR.mkdir(parents=True, exist_ok=True)
    if WEATHER_CACHE.exists():
        return json.loads(WEATHER_CACHE.read_text(encoding="utf-8"))

    weather = {}
    for city in CITIES:
        response = requests.get(
            "https://archive-api.open-meteo.com/v1/archive",
            params={
                "latitude": city.latitude,
                "longitude": city.longitude,
                "start_date": SIM_DATE,
                "end_date": SIM_DATE,
                "hourly": "temperature_2m,shortwave_radiation",
                "timezone": TIMEZONE,
            },
            timeout=20,
        )
        response.raise_for_status()
        payload = response.json()
        hourly = payload["hourly"]
        weather[city.name] = {
            "source": "Open-Meteo Historical Weather API",
            "latitude": payload.get("latitude"),
            "longitude": payload.get("longitude"),
            "timezone": payload.get("timezone"),
            "time": hourly["time"],
            "temperature_2m_C": hourly["temperature_2m"],
            "shortwave_radiation_Wm2": hourly["shortwave_radiation"],
        }

    WEATHER_CACHE.write_text(json.dumps(weather, indent=2), encoding="utf-8")
    return weather


def make_nodes(rng: np.random.Generator) -> pd.DataFrame:
    rows = []
    install_start = pd.Timestamp("2020-01-01")
    install_days = (pd.Timestamp("2024-05-31") - install_start).days

    for city in CITIES:
        for idx in range(NODES_PER_CITY):
            rows.append(
                {
                    "node_id": f"{city.name[:3].upper()}-{idx + 1:03d}",
                    "city": city.name,
                    "latitude": round(city.latitude + rng.normal(0, 0.035), 6),
                    "longitude": round(city.longitude + rng.normal(0, 0.035), 6),
                    "panel_area_m2": round(float(rng.uniform(18.0, 64.0)), 2),
                    "efficiency": round(float(rng.uniform(0.176, 0.226)), 4),
                    "temp_coefficient": round(float(rng.uniform(-0.0046, -0.0032)), 5),
                    "install_date": (
                        install_start + pd.Timedelta(days=int(rng.integers(0, install_days)))
                    ).date().isoformat(),
                }
            )

    return pd.DataFrame(rows)


def city_weather_frame(city: City, weather_cache: dict) -> pd.DataFrame:
    observed = weather_cache[city.name]
    times = pd.DatetimeIndex(pd.to_datetime(observed["time"])).tz_localize(TIMEZONE)

    site = Location(city.latitude, city.longitude, tz=TIMEZONE)
    clearsky = site.get_clearsky(times, model="ineichen")
    solar_position = site.get_solarposition(times)

    frame = pd.DataFrame(
        {
            "timestamp": times,
            "hour": times.hour,
            "city": city.name,
            "observed_shortwave_Wm2": observed["shortwave_radiation_Wm2"],
            "air_temp_C": observed["temperature_2m_C"],
            "clearsky_ghi_Wm2": clearsky["ghi"].to_numpy(),
            "solar_zenith": solar_position["zenith"].to_numpy(),
        }
    )

    daylight = frame["solar_zenith"] < 90
    capped_observed = np.minimum(
        frame["observed_shortwave_Wm2"].clip(lower=0),
        frame["clearsky_ghi_Wm2"].clip(lower=0) * 1.08,
    )
    frame["irradiance_Wm2"] = np.where(daylight, capped_observed, 0.0)
    return frame


def make_generation(
    nodes: pd.DataFrame, weather_cache: dict, rng: np.random.Generator
) -> pd.DataFrame:
    weather_by_city = {city.name: city_weather_frame(city, weather_cache) for city in CITIES}
    rows = []

    for node in nodes.to_dict("records"):
        city_weather = weather_by_city[node["city"]]
        for _, hour in city_weather.iterrows():
            irradiance = float(hour["irradiance_Wm2"])
            temp_loss = 1.0 + float(node["temp_coefficient"]) * (float(hour["air_temp_C"]) - 25.0)
            temp_loss = float(np.clip(temp_loss, 0.78, 1.08))
            inverter_derate = float(rng.uniform(0.965, 0.992))
            p_max = max(0.0, irradiance * node["panel_area_m2"] * node["efficiency"] * temp_loss)
            reported = p_max * inverter_derate * float(rng.normal(1.0, 0.012))

            rows.append(
                {
                    "timestamp": hour["timestamp"].isoformat(),
                    "hour": int(hour["hour"]),
                    "node_id": node["node_id"],
                    "city": node["city"],
                    "latitude": node["latitude"],
                    "longitude": node["longitude"],
                    "irradiance_Wm2": round(irradiance, 2),
                    "air_temp_C": round(float(hour["air_temp_C"]), 2),
                    "P_max_W": round(p_max, 2),
                    "P_reported_W": round(max(0.0, reported), 2),
                    "fdia_detected": False,
                    "verification_status": "verified",
                }
            )

    generation = pd.DataFrame(rows)
    attack_count = int(round(len(generation) * 0.05))
    attack_indices = rng.choice(generation.index.to_numpy(), size=attack_count, replace=False)

    for index in attack_indices:
        p_max = generation.at[index, "P_max_W"]
        if p_max <= 1:
            generation.at[index, "P_reported_W"] = round(float(rng.uniform(350.0, 1200.0)), 2)
        else:
            generation.at[index, "P_reported_W"] = round(
                p_max * float(rng.choice([0.42, 1.38, 1.55, 1.82])), 2
            )
        generation.at[index, "fdia_detected"] = True
        generation.at[index, "verification_status"] = "rejected"

    return generation


def make_market_liquidity(generation: pd.DataFrame) -> pd.DataFrame:
    verified = generation[generation["verification_status"] == "verified"].copy()
    verified["verified_MW"] = verified["P_reported_W"] / 1_000_000

    hourly = (
        verified.groupby(["timestamp", "hour"], as_index=False)["verified_MW"]
        .sum()
        .rename(columns={"verified_MW": "total_verified_MW"})
        .sort_values("hour")
    )
    hourly["solarchain_liquidity_MW"] = hourly["total_verified_MW"] * 0.92 + 0.018
    hourly["baseline_liquidity_MW"] = hourly["total_verified_MW"] * 0.61 + 0.008
    hourly["slippage_solarchain_pct"] = 0.18 / (
        hourly["solarchain_liquidity_MW"] + 0.045
    )
    hourly["slippage_baseline_pct"] = 0.31 / (hourly["baseline_liquidity_MW"] + 0.028)

    columns = [
        "timestamp",
        "hour",
        "total_verified_MW",
        "solarchain_liquidity_MW",
        "baseline_liquidity_MW",
        "slippage_solarchain_pct",
        "slippage_baseline_pct",
    ]
    return hourly[columns].round(
        {
            "total_verified_MW": 6,
            "solarchain_liquidity_MW": 6,
            "baseline_liquidity_MW": 6,
            "slippage_solarchain_pct": 4,
            "slippage_baseline_pct": 4,
        }
    )


def make_trades(market: pd.DataFrame, rng: np.random.Generator) -> pd.DataFrame:
    factories = [
        ("FAC-BJ-01", "Beijing"),
        ("FAC-SH-01", "Shanghai"),
        ("FAC-CD-01", "Chengdu"),
        ("FAC-SZ-01", "Shenzhen"),
        ("FAC-HZ-01", "Hangzhou"),
        ("FAC-SH-02", "Shanghai"),
    ]
    daylight = market[market["total_verified_MW"] > 0.002].reset_index(drop=True)
    rows = []

    for hour_index, hour_row in daylight.iterrows():
        for trade_slot in range(3):
            factory_id, city = factories[(hour_index + trade_slot) % len(factories)]
            purchase = min(
                float(hour_row["solarchain_liquidity_MW"]) * float(rng.uniform(0.055, 0.16)),
                float(hour_row["total_verified_MW"]) * float(rng.uniform(0.08, 0.22)),
            )
            if purchase <= 0:
                continue
            rows.append(
                {
                    "trade_id": f"TRD-{len(rows) + 1:04d}",
                    "timestamp": hour_row["timestamp"],
                    "hour": int(hour_row["hour"]),
                    "factory_id": factory_id,
                    "city": city,
                    "energy_purchased_MW": round(purchase, 6),
                    "tokens_burned": round(purchase * 1000 * float(rng.uniform(0.93, 1.08)), 4),
                    "exergy_dissipated_MJ": round(purchase * 3600 * float(rng.uniform(0.015, 0.038)), 4),
                }
            )

    return pd.DataFrame(rows)


def main() -> None:
    rng = np.random.default_rng(RNG_SEED)
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    weather_cache = fetch_weather_cache()
    nodes = make_nodes(rng)
    generation = make_generation(nodes, weather_cache, rng)
    market = make_market_liquidity(generation)
    trades = make_trades(market, rng)

    nodes.to_csv(OUTPUT_DIR / "urban_energy_nodes.csv", index=False)
    generation.to_csv(OUTPUT_DIR / "spatiotemporal_generation.csv", index=False)
    market.to_csv(OUTPUT_DIR / "market_liquidity.csv", index=False)
    trades.to_csv(OUTPUT_DIR / "p2p_trades.csv", index=False)

    print(f"urban_energy_nodes.csv: {len(nodes)} rows")
    print(f"spatiotemporal_generation.csv: {len(generation)} rows")
    print(f"FDIA rows: {int(generation['fdia_detected'].sum())}")
    print(f"market_liquidity.csv: {len(market)} rows")
    print(f"p2p_trades.csv: {len(trades)} rows")


if __name__ == "__main__":
    main()

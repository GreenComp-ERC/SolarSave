"""Day-ahead market data for the SolarChain RL environment.

The generator is intentionally independent from the live blockchain stack. It
supports a fast synthetic mode and a Level-2 pvlib physical-simulation mode.
"""

from __future__ import annotations

from dataclasses import dataclass
from functools import lru_cache
import json
import os
from pathlib import Path
from typing import Literal, Sequence

import numpy as np


ScenarioName = Literal[
    "normal",
    "cloudy_supply_drop",
    "factory_demand_spike",
    "oversupply",
    "demand_collapse",
    "token_volatility",
    "mixed_shock",
]

DataSource = Literal["synthetic", "pvlib", "openweather"]


@dataclass(frozen=True)
class MarketSeries:
    supply: np.ndarray
    demand: np.ndarray
    external_volatility: np.ndarray
    shock_name: str


def _solar_curve(steps: int) -> np.ndarray:
    hours = np.arange(steps) % 24
    daylight = np.sin((hours - 6) / 12 * np.pi)
    return np.maximum(daylight, 0.0) ** 1.6


def _demand_curve(steps: int) -> np.ndarray:
    hours = np.arange(steps) % 24
    morning = 0.35 * np.exp(-((hours - 9) ** 2) / 14)
    afternoon = 0.55 * np.exp(-((hours - 15) ** 2) / 18)
    base = 0.55 + morning + afternoon
    return base


def _pvlib_supply(
    steps: int,
    seed: int,
    scale: float,
    coordinates: Sequence[tuple[float, float]] | None = None,
) -> np.ndarray:
    """Generate Level-2 physical PV supply from pvlib clear-sky irradiance.

    This uses deterministic historical timestamps and synthetic cloud derating,
    avoiding weather API calls while retaining location/time solar physics.
    """

    try:
        import pandas as pd
        from pvlib import location
    except Exception as exc:
        raise RuntimeError(
            "pvlib data source requires pvlib and pandas. "
            "Install rl_env/requirements-rl.txt in SolarChain-rl."
        ) from exc

    rng = np.random.default_rng(seed)
    coords = list(coordinates or [(31.2, 121.5), (32.1, 118.8), (30.6, 114.3)])
    times = pd.date_range("2025-06-01", periods=steps, freq="60min", tz="UTC")
    combined = np.zeros(steps, dtype=np.float64)

    for index, (lat, lon) in enumerate(coords):
        site = location.Location(float(lat), float(lon), tz="UTC")
        clearsky = site.get_clearsky(times, model="ineichen")
        ghi = np.asarray(clearsky["ghi"], dtype=np.float64)
        dni = np.asarray(clearsky["dni"], dtype=np.float64)
        dhi = np.asarray(clearsky["dhi"], dtype=np.float64)

        irradiance = 0.72 * ghi + 0.20 * dni + 0.08 * dhi
        panel_capacity = rng.uniform(0.85, 1.20)
        temp_derate = 1.0 - 0.04 * np.maximum(irradiance / 1000.0 - 0.65, 0.0)
        cloud_noise = rng.normal(0.0, 0.08, steps)
        cloud_wave = 0.88 + 0.10 * np.sin(np.arange(steps) / 24 * 2 * np.pi + index)
        cloud_factor = np.clip(cloud_wave + cloud_noise, 0.35, 1.08)

        combined += np.maximum(irradiance, 0.0) * temp_derate * cloud_factor * panel_capacity

    if combined.max() <= 0:
        return _solar_curve(steps) * scale
    return combined / combined.max() * scale


def _weather_cache_path() -> Path:
    return Path(__file__).resolve().parent / "cache" / "openweather_weather.json"


def _load_weather_cache() -> dict[str, dict[str, float]]:
    cache_path = _weather_cache_path()
    if not cache_path.exists():
        return {}
    try:
        return json.loads(cache_path.read_text(encoding="utf-8"))
    except Exception:
        return {}


def _save_weather_cache(cache: dict[str, dict[str, float]]) -> None:
    cache_path = _weather_cache_path()
    cache_path.parent.mkdir(parents=True, exist_ok=True)
    cache_path.write_text(json.dumps(cache, indent=2), encoding="utf-8")


def _openweather_api_key() -> str:
    return os.getenv("OPENWEATHER_API_KEY") or os.getenv("OPENWEATHERMAP_API_KEY") or "0771554279f9204c977c7bf619352830"


def _fetch_openweather(lat: float, lon: float) -> dict[str, float]:
    import requests

    key = _openweather_api_key()
    if not key:
        raise RuntimeError("OPENWEATHER_API_KEY is required for data_source='openweather'")

    cache_key = f"{lat:.4f},{lon:.4f}"
    cache = _load_weather_cache()
    if cache_key in cache:
        return cache[cache_key]

    response = requests.get(
        "https://api.openweathermap.org/data/2.5/weather",
        params={"lat": lat, "lon": lon, "appid": key, "units": "metric"},
        timeout=20,
    )
    response.raise_for_status()
    payload = response.json()
    weather = {
        "temp_air": float(payload.get("main", {}).get("temp", 25.0)),
        "wind_speed": float(payload.get("wind", {}).get("speed", 1.0)),
        "clouds": float(payload.get("clouds", {}).get("all", 0.0)),
    }
    cache[cache_key] = weather
    _save_weather_cache(cache)
    return weather


@lru_cache(maxsize=16)
def _openweather_supply_cached(
    steps: int,
    scale: float,
    coordinates_key: tuple[tuple[float, float], ...],
) -> tuple[float, ...]:
    """Generate Level-2 PV supply using real OpenWeather current conditions.

    OpenWeather's free current-weather endpoint gives live weather rather than
    historical market data. We use that real weather snapshot as the physical
    condition input and combine it with pvlib clear-sky irradiance over the
    simulated day-ahead horizon.
    """

    try:
        import pandas as pd
        from pvlib import location
    except Exception as exc:
        raise RuntimeError(
            "OpenWeather Level-2 data source requires pvlib and pandas."
        ) from exc

    coords = list(coordinates_key)
    times = pd.date_range("2025-06-01", periods=steps, freq="60min", tz="UTC")
    combined = np.zeros(steps, dtype=np.float64)

    for lat, lon in coords:
        weather = _fetch_openweather(lat, lon)
        site = location.Location(float(lat), float(lon), tz="UTC")
        clearsky = site.get_clearsky(times, model="ineichen")
        ghi = np.asarray(clearsky["ghi"], dtype=np.float64)
        dni = np.asarray(clearsky["dni"], dtype=np.float64)
        dhi = np.asarray(clearsky["dhi"], dtype=np.float64)

        irradiance = 0.72 * ghi + 0.20 * dni + 0.08 * dhi
        temp_air = weather["temp_air"]
        wind_speed = weather["wind_speed"]
        cloud_cover = np.clip(weather["clouds"], 0.0, 100.0)

        cloud_derate = np.clip(1.0 - cloud_cover / 100.0 * 0.68, 0.25, 1.0)
        cell_temp_estimate = temp_air + 0.03 * irradiance - 1.8 * wind_speed
        temp_derate = np.clip(1.0 - 0.004 * np.maximum(cell_temp_estimate - 25.0, 0.0), 0.65, 1.05)
        wind_cooling = np.clip(1.0 + 0.012 * min(wind_speed, 10.0), 1.0, 1.12)

        combined += np.maximum(irradiance, 0.0) * cloud_derate * temp_derate * wind_cooling

    if combined.max() <= 0:
        combined = _solar_curve(steps)
    else:
        combined = combined / combined.max()
    return tuple((combined * scale).astype(float))


def _openweather_supply(
    steps: int,
    seed: int,
    scale: float,
    coordinates: Sequence[tuple[float, float]] | None = None,
) -> np.ndarray:
    coords = tuple((float(lat), float(lon)) for lat, lon in (coordinates or [(31.2, 121.5), (32.1, 118.8), (30.6, 114.3)]))
    base = np.asarray(_openweather_supply_cached(steps, scale, coords), dtype=np.float64)

    rng = np.random.default_rng(seed)
    cloud_variability = rng.normal(1.0, 0.035, steps)
    return np.maximum(base * np.clip(cloud_variability, 0.85, 1.08), 0.0)


def generate_market_series(
    scenario: ScenarioName = "normal",
    steps: int = 24 * 30,
    seed: int = 7,
    data_source: DataSource = "synthetic",
    coordinates: Sequence[tuple[float, float]] | None = None,
    use_pvmodel: bool = False,
) -> MarketSeries:
    rng = np.random.default_rng(seed)
    base_supply = 100_000.0
    base_demand = 86_000.0

    if use_pvmodel:
        data_source = "pvlib"

    if data_source == "openweather":
        supply_shape = _openweather_supply(steps, seed, base_supply, coordinates)
    elif data_source == "pvlib":
        supply_shape = _pvlib_supply(steps, seed, base_supply, coordinates)
    else:
        supply_shape = _solar_curve(steps) * base_supply
    demand_shape = _demand_curve(steps) * base_demand

    weekly_supply = 1.0 + 0.08 * np.sin(np.arange(steps) / 24 / 7 * 2 * np.pi)
    weekly_demand = 1.0 + 0.05 * np.cos(np.arange(steps) / 24 / 7 * 2 * np.pi)
    supply = supply_shape * weekly_supply + rng.normal(0, base_supply * 0.025, steps)
    demand = demand_shape * weekly_demand + rng.normal(0, base_demand * 0.035, steps)
    external_volatility = np.full(steps, 0.025, dtype=np.float32)

    start = steps // 3
    end = min(steps, start + steps // 5)

    if scenario == "cloudy_supply_drop":
        supply[start:end] *= rng.uniform(0.25, 0.55)
    elif scenario == "factory_demand_spike":
        demand[start:end] *= rng.uniform(1.9, 2.8)
    elif scenario == "oversupply":
        supply[start:end] *= rng.uniform(1.7, 2.4)
        demand[start:end] *= rng.uniform(0.55, 0.8)
    elif scenario == "demand_collapse":
        demand[start:end] *= rng.uniform(0.2, 0.45)
    elif scenario == "token_volatility":
        external_volatility[start:end] = rng.uniform(0.08, 0.16)
    elif scenario == "mixed_shock":
        supply[start:end] *= rng.uniform(0.25, 0.5)
        demand[start:end] *= rng.uniform(1.8, 2.6)
        external_volatility[start:end] = rng.uniform(0.08, 0.14)

    supply = np.maximum(supply, 0.0).astype(np.float32)
    demand = np.maximum(demand, 1.0).astype(np.float32)
    return MarketSeries(
        supply=supply,
        demand=demand,
        external_volatility=external_volatility.astype(np.float32),
        shock_name=scenario,
    )


def scenario_names() -> list[ScenarioName]:
    return [
        "normal",
        "cloudy_supply_drop",
        "factory_demand_spike",
        "oversupply",
        "demand_collapse",
        "token_volatility",
        "mixed_shock",
    ]

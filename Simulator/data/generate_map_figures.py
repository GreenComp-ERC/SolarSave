"""Generate GeoJSON-based map figures for the SolarChain urban benchmark."""

from __future__ import annotations

import json
from pathlib import Path
from typing import Iterable

import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
import requests
from matplotlib.lines import Line2D
from matplotlib.patches import Circle, Polygon, Wedge


BASE_DIR = Path(__file__).resolve().parent
DATASET_DIR = BASE_DIR / "datasets"
OUTPUT_DIR = BASE_DIR / "visualizations"
MAP_DIR = BASE_DIR / "assets" / "china_map"
CHINA_GEOJSON = MAP_DIR / "china_boundary_full.geojson"

CHINA_GEOJSON_URLS = [
    "https://geo.datav.aliyun.com/areas_v3/bound/100000_full.json",
    "https://geo.datav.aliyun.com/areas_v3/bound/100000.json",
    "https://raw.githubusercontent.com/johan/world.geo.json/master/countries/CHN.geo.json",
    "https://raw.githubusercontent.com/datasets/geo-countries/master/data/countries.geojson",
]

CITY_LABEL_OFFSETS = {
    "Beijing": (1.0, 1.1),
    "Shanghai": (2.6, 0.45),
    "Chengdu": (-5.0, -0.7),
    "Shenzhen": (1.0, -0.9),
    "Hangzhou": (-1.8, -1.8),
}

MAP_FACE = "#f7faf8"
MAP_EDGE = "#9aa7a0"
GRID_COLOR = "#dce3df"
LABEL_BOX = {
    "boxstyle": "round,pad=0.16",
    "facecolor": "white",
    "edgecolor": "none",
    "alpha": 0.78,
}


def setup_academic_style() -> None:
    plt.rcParams.update(
        {
            "font.family": "sans-serif",
            "font.sans-serif": ["Arial", "DejaVu Sans", "Liberation Sans"],
            "font.size": 10,
            "axes.titlesize": 12,
            "axes.labelsize": 10,
            "legend.fontsize": 9,
            "xtick.labelsize": 9,
            "ytick.labelsize": 9,
            "figure.dpi": 300,
            "savefig.dpi": 300,
            "savefig.bbox": "tight",
            "axes.titleweight": "semibold",
        }
    )


def load_data() -> tuple[pd.DataFrame, pd.DataFrame]:
    nodes = pd.read_csv(DATASET_DIR / "urban_energy_nodes.csv")
    generation = pd.read_csv(DATASET_DIR / "spatiotemporal_generation.csv")
    generation["fdia_detected"] = generation["fdia_detected"].astype(bool)
    nodes["capacity_kW"] = nodes["panel_area_m2"] * nodes["efficiency"]
    generation["verified_generation_W"] = np.where(
        generation["verification_status"].eq("verified"),
        generation["P_reported_W"],
        np.nan,
    )
    return nodes, generation


def fetch_china_geojson() -> dict:
    MAP_DIR.mkdir(parents=True, exist_ok=True)
    if CHINA_GEOJSON.exists():
        return json.loads(CHINA_GEOJSON.read_text(encoding="utf-8"))

    errors = []
    for url in CHINA_GEOJSON_URLS:
        try:
            response = requests.get(url, timeout=30)
            response.raise_for_status()
            payload = response.json()
            china = normalize_china_geojson(payload)
            CHINA_GEOJSON.write_text(json.dumps(china, indent=2), encoding="utf-8")
            return china
        except Exception as exc:  # noqa: BLE001 - preserve each fallback failure.
            errors.append(f"{url}: {exc}")

    joined = "\n".join(errors)
    raise RuntimeError(
        "Unable to download China GeoJSON and no cached boundary exists. "
        f"Tried:\n{joined}"
    )


def normalize_china_geojson(payload: dict) -> dict:
    if payload.get("type") == "FeatureCollection":
        return payload

    if payload.get("type") == "Feature" and payload.get("geometry"):
        return payload

    if payload.get("type") in {"Polygon", "MultiPolygon"}:
        return {"type": "Feature", "properties": {"name": "China"}, "geometry": payload}

    raise ValueError("Downloaded GeoJSON does not contain a China feature.")


def iter_geometries(geojson: dict) -> Iterable[dict]:
    if geojson.get("type") == "FeatureCollection":
        for feature in geojson.get("features", []):
            geometry = feature.get("geometry")
            if geometry:
                yield geometry
    elif geojson.get("type") == "Feature":
        yield geojson["geometry"]
    elif geojson.get("type") in {"Polygon", "MultiPolygon", "GeometryCollection"}:
        yield geojson
    else:
        raise ValueError(f"Unsupported GeoJSON object type: {geojson.get('type')}")


def geometry_polygons(geometry: dict) -> Iterable[list[list[float]]]:
    geom_type = geometry.get("type")
    coordinates = geometry.get("coordinates", [])
    if geom_type == "Polygon":
        if coordinates:
            yield coordinates[0]
    elif geom_type == "MultiPolygon":
        for polygon in coordinates:
            if polygon:
                yield polygon[0]
    elif geom_type == "GeometryCollection":
        for child in geometry.get("geometries", []):
            yield from geometry_polygons(child)
    else:
        raise ValueError(f"Unsupported GeoJSON geometry type: {geom_type}")


def draw_geojson_boundary(
    ax: plt.Axes,
    china_geojson: dict,
    *,
    facecolor: str = MAP_FACE,
    edgecolor: str = MAP_EDGE,
    linewidth: float = 0.45,
    zorder: int = 1,
) -> None:
    for geometry in iter_geometries(china_geojson):
        for ring in geometry_polygons(geometry):
            patch = Polygon(
                ring,
                closed=True,
                facecolor=facecolor,
                edgecolor=edgecolor,
                linewidth=linewidth,
                zorder=zorder,
            )
            ax.add_patch(patch)


def city_metrics(nodes: pd.DataFrame, generation: pd.DataFrame) -> pd.DataFrame:
    capacity = nodes.groupby("city", as_index=False).agg(
        latitude=("latitude", "mean"),
        longitude=("longitude", "mean"),
        node_count=("node_id", "count"),
        capacity_kW=("capacity_kW", "sum"),
    )
    generation_stats = generation.groupby("city", as_index=False).agg(
        records=("node_id", "count"),
        fdia_records=("fdia_detected", "sum"),
        verified_generation_W=("verified_generation_W", "sum"),
    )
    metrics = capacity.merge(generation_stats, on="city")
    metrics["fdia_rate"] = metrics["fdia_records"] / metrics["records"]
    metrics["verified_generation_MWh"] = metrics["verified_generation_W"] / 1_000_000
    return metrics


def node_metrics(nodes: pd.DataFrame, generation: pd.DataFrame) -> pd.DataFrame:
    fdia = generation.groupby("node_id", as_index=False).agg(
        fdia_records=("fdia_detected", "sum"),
        daylight_verified_W=("verified_generation_W", "mean"),
    )
    merged = nodes.merge(fdia, on="node_id", how="left")
    merged["fdia_presence"] = merged["fdia_records"].fillna(0).gt(0)
    return merged


def scaled_sizes(values: pd.Series, min_size: float, max_size: float) -> pd.Series:
    if np.isclose(values.max(), values.min()):
        return pd.Series(np.full(len(values), (min_size + max_size) / 2), index=values.index)
    scaled = (values - values.min()) / (values.max() - values.min())
    return min_size + scaled * (max_size - min_size)


def add_capacity_legend(ax: plt.Axes, values: pd.Series, size_values: pd.Series) -> None:
    legend_values = np.linspace(values.min(), values.max(), 3)
    handles = []
    for value in legend_values:
        size = np.interp(value, values, size_values)
        handles.append(
            plt.scatter(
                [],
                [],
                s=size,
                facecolor="white",
                edgecolor="#324047",
                linewidth=0.8,
                label=f"{value:.1f} kW",
            )
        )
    legend = ax.legend(
        handles=handles,
        title="PV capacity",
        loc="lower left",
        frameon=True,
        framealpha=0.92,
        borderpad=0.8,
    )
    legend.get_frame().set_edgecolor("#cccccc")


def add_south_china_sea_inset(ax: plt.Axes, china_geojson: dict) -> None:
    inset = ax.inset_axes([0.84, 0.06, 0.14, 0.23])
    draw_geojson_boundary(
        inset,
        china_geojson,
        facecolor=MAP_FACE,
        edgecolor=MAP_EDGE,
        linewidth=0.35,
    )
    inset.set_xlim(105, 125)
    inset.set_ylim(3, 25)
    inset.set_aspect("equal", adjustable="box")
    inset.set_xticks([])
    inset.set_yticks([])
    inset.text(
        0.5,
        0.96,
        "South China Sea",
        transform=inset.transAxes,
        ha="center",
        va="top",
        fontsize=6.5,
        bbox={"facecolor": "white", "edgecolor": "none", "alpha": 0.75, "pad": 0.5},
    )
    for spine in inset.spines.values():
        spine.set_color("#9a9a9a")
        spine.set_linewidth(0.5)


def annotate_city(
    ax: plt.Axes,
    row: pd.Series,
    label: str,
    *,
    fontsize: float = 8.3,
    zorder: int = 6,
) -> None:
    dx, dy = CITY_LABEL_OFFSETS.get(row["city"], (0.8, 0.8))
    ax.annotate(
        label,
        xy=(row["longitude"], row["latitude"]),
        xytext=(row["longitude"] + dx, row["latitude"] + dy),
        ha="left" if dx >= 0 else "right",
        va="center",
        fontsize=fontsize,
        color="#1f2933",
        bbox=LABEL_BOX,
        arrowprops={
            "arrowstyle": "-",
            "color": "#5b6460",
            "linewidth": 0.65,
            "shrinkA": 4,
            "shrinkB": 4,
        },
        zorder=zorder,
    )


def save_figure(fig: plt.Figure, stem: str) -> None:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    fig.savefig(OUTPUT_DIR / f"{stem}.png")
    fig.savefig(OUTPUT_DIR / f"{stem}.pdf")
    plt.close(fig)


def china_urban_energy_map(nodes: pd.DataFrame, generation: pd.DataFrame, china_geojson: dict) -> None:
    metrics = city_metrics(nodes, generation).sort_values("capacity_kW")
    sizes = scaled_sizes(metrics["capacity_kW"], 140, 620)

    fig, ax = plt.subplots(figsize=(7.2, 5.8))
    draw_geojson_boundary(ax, china_geojson)
    scatter = ax.scatter(
        metrics["longitude"],
        metrics["latitude"],
        s=sizes,
        c=metrics["fdia_rate"] * 100,
        cmap="YlOrRd",
        vmin=0,
        vmax=max(8.0, float(metrics["fdia_rate"].max() * 100)),
        edgecolor="#29323a",
        linewidth=1.05,
        alpha=0.92,
        zorder=3,
    )

    for _, row in metrics.iterrows():
        annotate_city(ax, row, f"{row['city']}\n{int(row['node_count'])} nodes")

    cbar = fig.colorbar(scatter, ax=ax, fraction=0.035, pad=0.02)
    cbar.set_label("FDIA records (%)")
    add_capacity_legend(ax, metrics["capacity_kW"], sizes)
    add_south_china_sea_inset(ax, china_geojson)

    ax.set_title("China-Wide SolarChain Urban Energy Nodes", fontsize=13)
    ax.set_xlabel("Longitude")
    ax.set_ylabel("Latitude")
    ax.set_xlim(73, 135)
    ax.set_ylim(18, 54)
    ax.set_aspect("equal", adjustable="box")
    ax.grid(color=GRID_COLOR, linestyle="--", linewidth=0.35, alpha=0.55)
    for spine in ax.spines.values():
        spine.set_visible(False)

    save_figure(fig, "canonical_04_china_urban_energy_map")


def draw_pie_marker(
    ax: plt.Axes,
    center: tuple[float, float],
    values: tuple[float, float],
    radius: float,
    colors: tuple[str, str],
) -> None:
    total = sum(values)
    if total <= 0:
        return

    start = 90.0
    for value, color in zip(values, colors):
        theta = 360.0 * value / total
        wedge = Wedge(
            center,
            radius,
            start,
            start + theta,
            facecolor=color,
            edgecolor="white",
            linewidth=0.65,
            zorder=4,
        )
        ax.add_patch(wedge)
        start += theta

    ax.add_patch(
        Circle(
            center,
            radius,
            facecolor="none",
            edgecolor="#29323a",
            linewidth=0.85,
            zorder=5,
        )
    )


def china_fdia_pie_map(nodes: pd.DataFrame, generation: pd.DataFrame, china_geojson: dict) -> None:
    metrics = city_metrics(nodes, generation).sort_values("capacity_kW")
    radii = scaled_sizes(metrics["capacity_kW"], 0.72, 1.15)
    pie_colors = ("#3b75af", "#d1495b")

    fig, ax = plt.subplots(figsize=(7.2, 5.8))
    draw_geojson_boundary(ax, china_geojson)

    for index, row in metrics.iterrows():
        verified_records = row["records"] - row["fdia_records"]
        draw_pie_marker(
            ax,
            (row["longitude"], row["latitude"]),
            (verified_records, row["fdia_records"]),
            float(radii.loc[index]),
            pie_colors,
        )

        annotate_city(
            ax,
            row,
            f"{row['city']}\nFDIA {row['fdia_rate'] * 100:.1f}%",
            zorder=7,
        )

    legend_handles = [
        Wedge((0, 0), 0.2, 0, 360, facecolor=pie_colors[0], edgecolor="white", label="Verified records"),
        Wedge((0, 0), 0.2, 0, 360, facecolor=pie_colors[1], edgecolor="white", label="FDIA records"),
    ]
    legend = ax.legend(
        handles=legend_handles,
        loc="lower left",
        frameon=True,
        framealpha=0.92,
        borderpad=0.8,
        title="Record status",
    )
    legend.get_frame().set_edgecolor("#cccccc")
    add_south_china_sea_inset(ax, china_geojson)

    ax.set_title("Spatial Composition of Verified and FDIA Records", fontsize=13)
    ax.set_xlabel("Longitude")
    ax.set_ylabel("Latitude")
    ax.set_xlim(73, 135)
    ax.set_ylim(18, 54)
    ax.set_aspect("equal", adjustable="box")
    ax.grid(color=GRID_COLOR, linestyle="--", linewidth=0.35, alpha=0.55)
    for spine in ax.spines.values():
        spine.set_visible(False)

    save_figure(fig, "supp_china_fdia_pie_map")


def city_node_distribution_insets(nodes: pd.DataFrame, generation: pd.DataFrame) -> None:
    metrics = node_metrics(nodes, generation)
    cities = ["Beijing", "Shanghai", "Chengdu", "Shenzhen", "Hangzhou"]
    sizes = scaled_sizes(metrics["capacity_kW"], 35, 180)

    fig, axes = plt.subplots(2, 3, figsize=(8.8, 5.8))
    axes_flat = axes.ravel()
    color_map = {False: "#2f6fa8", True: "#d1495b"}

    for ax, city in zip(axes_flat, cities):
        city_nodes = metrics[metrics["city"].eq(city)].copy()
        city_sizes = sizes.loc[city_nodes.index]
        colors = city_nodes["fdia_presence"].map(color_map)

        ax.scatter(
            city_nodes["longitude"],
            city_nodes["latitude"],
            s=city_sizes,
            c=colors,
            edgecolor="#29323a",
            linewidth=0.65,
            alpha=0.9,
            zorder=3,
        )

        padding = 0.035
        ax.set_xlim(city_nodes["longitude"].min() - padding, city_nodes["longitude"].max() + padding)
        ax.set_ylim(city_nodes["latitude"].min() - padding, city_nodes["latitude"].max() + padding)
        ax.set_title(
            f"{city}: {len(city_nodes)} nodes, {city_nodes['capacity_kW'].sum():.1f} kW",
            fontsize=10,
        )
        ax.set_xlabel("Longitude")
        ax.set_ylabel("Latitude")
        ax.grid(color=GRID_COLOR, linestyle="--", linewidth=0.35, alpha=0.55)
        ax.set_aspect("equal", adjustable="box")
        for spine in ax.spines.values():
            spine.set_color("#cccccc")
            spine.set_linewidth(0.7)

    axes_flat[-1].axis("off")
    legend_handles = [
        Line2D(
            [0],
            [0],
            marker="o",
            color="none",
            markerfacecolor=color_map[False],
            markeredgecolor="#202020",
            label="No FDIA observed",
            markersize=8,
        ),
        Line2D(
            [0],
            [0],
            marker="o",
            color="none",
            markerfacecolor=color_map[True],
            markeredgecolor="#202020",
            label="FDIA observed",
            markersize=8,
        ),
    ]
    axes_flat[-1].legend(handles=legend_handles, loc="center", frameon=False)
    fig.suptitle("City-Scale Distribution of SolarChain PV Nodes", y=0.965, fontsize=12)
    fig.tight_layout(rect=(0, 0, 1, 0.93))

    save_figure(fig, "supp_city_node_distribution_insets")


def main() -> None:
    setup_academic_style()
    nodes, generation = load_data()
    china_geojson = fetch_china_geojson()
    china_urban_energy_map(nodes, generation, china_geojson)
    china_fdia_pie_map(nodes, generation, china_geojson)
    city_node_distribution_insets(nodes, generation)

    outputs = [
        "canonical_04_china_urban_energy_map.png",
        "canonical_04_china_urban_energy_map.pdf",
        "supp_china_fdia_pie_map.png",
        "supp_china_fdia_pie_map.pdf",
        "supp_city_node_distribution_insets.png",
        "supp_city_node_distribution_insets.pdf",
    ]
    print(f"Generated GeoJSON map figures in {OUTPUT_DIR}")
    for name in outputs:
        print(f" - {name}")


if __name__ == "__main__":
    main()

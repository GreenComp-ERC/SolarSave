"""Generate reviewer and canonical urban-computing figures from CSV datasets."""

from __future__ import annotations

from pathlib import Path

import matplotlib.dates as mdates
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
import seaborn as sns


BASE_DIR = Path(__file__).resolve().parent
DATASET_DIR = BASE_DIR / "datasets"
OUTPUT_DIR = BASE_DIR / "visualizations"


def setup_academic_style():
    """Apply academic publication formatting suitable for ACM/IEEE."""
    sns.set_theme(style="ticks", context="paper")
    plt.rcParams.update({
        "font.family": "serif",
        "font.serif": ["Times New Roman", "DejaVu Serif"],
        "font.size": 11,
        "axes.titlesize": 12,
        "axes.labelsize": 11,
        "legend.fontsize": 10,
        "xtick.labelsize": 10,
        "ytick.labelsize": 10,
        "axes.grid": True,
        "grid.alpha": 0.3,
        "grid.linestyle": "--",
        "axes.spines.top": False,
        "axes.spines.right": False,
        "legend.frameon": False,
        "figure.dpi": 300,
        "savefig.dpi": 300,
        "savefig.bbox": "tight"
    })


def load_data(dataset_dir: Path = DATASET_DIR) -> tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame, pd.DataFrame]:
    nodes = pd.read_csv(dataset_dir / "urban_energy_nodes.csv")
    generation = pd.read_csv(dataset_dir / "spatiotemporal_generation.csv")
    market = pd.read_csv(dataset_dir / "market_liquidity.csv")
    trades = pd.read_csv(dataset_dir / "p2p_trades.csv")

    generation["timestamp"] = pd.to_datetime(generation["timestamp"])
    market["timestamp"] = pd.to_datetime(market["timestamp"])
    trades["timestamp"] = pd.to_datetime(trades["timestamp"])
    generation["fdia_detected"] = generation["fdia_detected"].astype(bool)
    
    generation["verified_generation_W"] = np.where(
        generation["verification_status"].eq("verified"),
        generation["P_reported_W"],
        np.nan,
    )
    generation["generation_MW"] = generation["P_reported_W"] / 1_000_000
    nodes["capacity_kW"] = (
        nodes["panel_area_m2"] * nodes["efficiency"] * 1000 / 1000
    )
    return nodes, generation, market, trades


def save_current(name: str) -> None:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    plt.tight_layout()
    plt.savefig(OUTPUT_DIR / name)
    plt.close()


def reviewer_generation_timeseries(generation: pd.DataFrame) -> None:
    hourly = generation.groupby("timestamp", as_index=False).agg(
        theoretical_W=("P_max_W", "sum"),
        reported_W=("P_reported_W", "sum"),
    )
    rejected = generation[generation["fdia_detected"]].groupby("timestamp", as_index=False)[
        "P_reported_W"
    ].sum()

    fig, ax = plt.subplots(figsize=(8, 4.5))
    
    # Use different linestyles for BW printability
    ax.plot(hourly["timestamp"], hourly["theoretical_W"] / 1_000_000, 
            label="Theoretical Gen. (Upper Bound)", linestyle="--", color="#1f77b4", linewidth=1.8)
    ax.plot(hourly["timestamp"], hourly["reported_W"] / 1_000_000, 
            label="Aggregated Reported Gen.", linestyle="-", color="#2ca02c", linewidth=1.8)
    
    ax.scatter(
        rejected["timestamp"],
        rejected["P_reported_W"] / 1_000_000,
        color="#d62728",
        marker="x", # Academic preference for anomalies
        s=60,
        zorder=5,
        label="Rejected FDIA Points",
    )
    
    ax.set_xlabel("Time (24h Cycle)")
    ax.set_ylabel("Power (MW)")
    ax.xaxis.set_major_formatter(mdates.DateFormatter("%H:%M"))
    ax.legend(loc="upper left")
    save_current("reviewer_a_generation_vs_reported_fdia.png")


def reviewer_liquidity_depth(market: pd.DataFrame) -> None:
    totals = pd.DataFrame(
        {
            "Policy": ["1:3 Forced-Split", "No-Split Baseline"],
            "Average": [
                market["solarchain_liquidity_MW"].mean(),
                market["baseline_liquidity_MW"].mean(),
            ],
            "Peak": [
                market["solarchain_liquidity_MW"].max(),
                market["baseline_liquidity_MW"].max(),
            ],
        }
    )

    melted = totals.melt(id_vars="Policy", var_name="Metric", value_name="Liquidity Depth (MW)")
    fig, ax = plt.subplots(figsize=(6, 4.5))
    
    # Add hatching for academic aesthetic
    sns.barplot(data=melted, x="Policy", y="Liquidity Depth (MW)", hue="Metric", 
                ax=ax, palette="Greys_r", edgecolor="black")
    
    # Apply hatch patterns
    hatches = ['//', '..']
    for i, bar in enumerate(ax.patches):
        hatch = hatches[0] if i < 2 else hatches[1]
        bar.set_hatch(hatch)

    ax.set_xlabel("Market Policy")
    ax.set_ylabel("Liquidity Depth (MW)")
    ax.legend(title="Metric")
    save_current("reviewer_a_liquidity_depth_comparison.png")


def spatiotemporal_heatmap(generation: pd.DataFrame) -> None:
    heat = generation.pivot_table(
        values="P_reported_W",
        index="city",
        columns="hour",
        aggfunc="mean",
        fill_value=0,
    ) / 1000
    
    fig, ax = plt.subplots(figsize=(8, 4))
    sns.heatmap(heat, cmap="YlGnBu", linewidths=0.5, linecolor="white", 
                cbar_kws={"label": "Mean Reported Power (kW)"}, ax=ax)
    
    ax.set_xlabel("Hour of Day")
    ax.set_ylabel("City Node Cluster")
    plt.yticks(rotation=0)
    save_current("canonical_01_spatiotemporal_heatmap.png")


def physics_bounded_anomaly_scatter(generation: pd.DataFrame) -> None:
    normal = generation[~generation["fdia_detected"]]
    anomaly = generation[generation["fdia_detected"]]

    fig, ax = plt.subplots(figsize=(6, 5))
    
    ax.scatter(normal["P_max_W"], normal["P_reported_W"], s=15, alpha=0.6, 
               label="Verified Records", color="#1f77b4", marker="o")
    ax.scatter(anomaly["P_max_W"], anomaly["P_reported_W"], s=40, alpha=0.9, 
               label="Rejected FDIA", color="#d62728", marker="^", edgecolor="black", linewidth=0.5)

    limit = max(generation["P_max_W"].max(), generation["P_reported_W"].max()) * 1.05
    x = np.linspace(0, limit, 100)
    
    # Physics bounds
    ax.plot(x, x, color="black", linestyle="--", linewidth=1.5, label="Physical Upper Bound ($P_{max}$)")
    ax.fill_between(x, 0, x, color="#2ca02c", alpha=0.1, label="Physically Plausible Space")
    
    ax.set_xlim(0, limit)
    ax.set_ylim(0, limit)
    ax.set_xlabel("Theoretical Maximum Power (W)")
    ax.set_ylabel("Reported Power (W)")
    ax.legend(loc="upper left")
    save_current("canonical_02_physics_bounded_anomaly_scatter.png")


def comparative_policy_line_chart(market: pd.DataFrame) -> None:
    fig, ax1 = plt.subplots(figsize=(8, 4.5))
    
    ax1.plot(market["hour"], market["solarchain_liquidity_MW"], marker="o", 
             label="1:3 Forced-Split (Liquidity)", color="#1f77b4", linestyle="-")
    ax1.plot(market["hour"], market["baseline_liquidity_MW"], marker="s", 
             label="No-Split Baseline (Liquidity)", color="#7f7f7f", linestyle="-")
    ax1.set_xlabel("Hour of Day")
    ax1.set_ylabel("Liquidity Depth (MW)", color="black")
    
    ax2 = ax1.twinx()
    ax2.plot(market["hour"], market["slippage_solarchain_pct"], marker="^", 
             label="1:3 Forced-Split (Slippage)", color="#d62728", linestyle="--")
    ax2.plot(market["hour"], market["slippage_baseline_pct"], marker="x", 
             label="No-Split Baseline (Slippage)", color="#8c564b", linestyle="--")
    ax2.set_ylabel("Estimated Slippage (%)", color="black")

    # Combine legends cleanly
    lines_1, labels_1 = ax1.get_legend_handles_labels()
    lines_2, labels_2 = ax2.get_legend_handles_labels()
    ax1.legend(lines_1 + lines_2, labels_1 + labels_2, loc="upper center", 
               bbox_to_anchor=(0.5, 1.15), ncol=2)
    
    save_current("canonical_03_comparative_policy_line_chart.png")


def geospatial_der_distribution(nodes: pd.DataFrame) -> None:
    city_capacity = nodes.groupby("city", as_index=False).agg(
        latitude=("latitude", "mean"),
        longitude=("longitude", "mean"),
        node_count=("node_id", "count"),
        capacity_kW=("capacity_kW", "sum"),
    )

    fig, ax = plt.subplots(figsize=(6, 5))
    sizes = 100 + city_capacity["capacity_kW"] * 50
    
    scatter = ax.scatter(
        city_capacity["longitude"],
        city_capacity["latitude"],
        s=sizes,
        c=city_capacity["capacity_kW"],
        cmap="coolwarm",
        alpha=0.8,
        edgecolor="black",
        linewidth=1.0,
    )
    
    for _, row in city_capacity.iterrows():
        ax.text(row["longitude"] + 0.3, row["latitude"] + 0.1, 
                f"{row['city']}\n({int(row['node_count'])} nodes)", 
                fontsize=9, ha="left")
                
    ax.set_xlabel("Longitude")
    ax.set_ylabel("Latitude")
    
    cbar = fig.colorbar(scatter, ax=ax)
    cbar.set_label("Aggregated Capacity (kW)")
    save_current("canonical_04_geospatial_der_distribution.png")


def digital_physical_correlation(generation: pd.DataFrame) -> None:
    verified = generation[~generation["fdia_detected"]].copy()
    correlation = verified["P_max_W"].corr(verified["P_reported_W"])

    fig, ax = plt.subplots(figsize=(5, 5))
    sns.regplot(
        data=verified,
        x="P_max_W",
        y="P_reported_W",
        scatter_kws={"s": 15, "alpha": 0.3, "color": "gray"},
        line_kws={"color": "black", "linewidth": 2, "linestyle": "--"},
        ax=ax,
    )
    
    # Academic style annotation for R value
    ax.text(0.05, 0.95, f"Pearson's $r = {correlation:.3f}$", 
            transform=ax.transAxes, fontsize=11, 
            verticalalignment='top', bbox=dict(boxstyle='round', facecolor='white', alpha=0.8))

    ax.set_xlabel("Physics Engine Estimate ($P_{max}$, W)")
    ax.set_ylabel("On-Chain Verified Record (W)")
    save_current("canonical_05_digital_physical_correlation.png")


def intra_city_generation_boxplots(generation: pd.DataFrame) -> None:
    daylight = generation[(generation["irradiance_Wm2"] > 20) & (~generation["fdia_detected"])].copy()
    daylight["reported_kW"] = daylight["P_reported_W"] / 1000

    fig, ax = plt.subplots(figsize=(7, 4.5))
    
    # Muted academic colors
    sns.boxplot(data=daylight, x="city", y="reported_kW", hue="city", ax=ax, 
                palette="Pastel1", showfliers=False, width=0.6, legend=False)
    sns.stripplot(data=daylight, x="city", y="reported_kW", ax=ax, 
                  color="black", alpha=0.15, size=2, jitter=True)
                  
    ax.set_xlabel("Urban Node Cluster")
    ax.set_ylabel("Daylight Reported Power (kW)")
    save_current("canonical_06_intra_city_generation_boxplots.png")


def main() -> None:
    setup_academic_style()
    nodes, generation, market, trades = load_data()

    reviewer_generation_timeseries(generation)
    reviewer_liquidity_depth(market)
    spatiotemporal_heatmap(generation)
    physics_bounded_anomaly_scatter(generation)
    comparative_policy_line_chart(market)
    geospatial_der_distribution(nodes)
    digital_physical_correlation(generation)
    intra_city_generation_boxplots(generation)

    print(f"Generated 8 high-resolution academic figures in {OUTPUT_DIR}")
    for path in sorted(OUTPUT_DIR.glob("*.png")):
        print(f" - {path.name}")


if __name__ == "__main__":
    main()
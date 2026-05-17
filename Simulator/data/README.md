# Multi-City SolarChain Datasets

This directory contains a reproducible 24-hour benchmark dataset for distributed
solar generation, FDIA detection, market liquidity, and P2P trading simulation.

## Files

- `datasets/urban_energy_nodes.csv`: 50 distributed PV nodes across Beijing,
  Shanghai, Chengdu, Shenzhen, and Hangzhou.
- `datasets/spatiotemporal_generation.csv`: 1,200 hourly node-generation records
  for 2026-05-01 in `Asia/Shanghai`, including exactly 5% FDIA records.
- `datasets/market_liquidity.csv`: 24 hourly verified-liquidity records.
- `datasets/p2p_trades.csv`: 42 simulated factory purchase records.
- `cache/open_meteo_weather_2026-05-01.json`: cached Open-Meteo historical
  hourly weather observations used by the generator.

## Generation

```powershell
conda run -n SolarSave python Simulator\data\generate_multicity_datasets.py
```

The generator uses `pvlib` for solar location, solar position, and clear-sky GHI
modeling. It combines those physics-based estimates with cached Open-Meteo
historical `temperature_2m` and `shortwave_radiation` observations.

FDIA samples are selected with a deterministic random seed and replace reported
power with physically inconsistent values. These rows have
`fdia_detected=True` and `verification_status=rejected`.

## Visualizations

```powershell
conda run -n SolarSave python Simulator\data\visualizations.py
```

The visualization script reads the four CSV files in `datasets/` and writes the
following English-language PNG figures to `visualizations/`:

- `reviewer_a_generation_vs_reported_fdia.png`
- `reviewer_a_liquidity_depth_comparison.png`
- `canonical_01_spatiotemporal_heatmap.png`
- `canonical_02_physics_bounded_anomaly_scatter.png`
- `canonical_03_comparative_policy_line_chart.png`
- `canonical_04_geospatial_der_distribution.png`
- `canonical_05_digital_physical_correlation.png`
- `canonical_06_intra_city_generation_boxplots.png`

GeoJSON-based map figures can be generated separately:

```powershell
conda run -n SolarSave python Simulator\data\generate_map_figures.py
```

This writes China-wide, FDIA pie-map, and city-inset map figures to
`visualizations/` and caches the downloaded China boundary in
`assets/china_map/`.

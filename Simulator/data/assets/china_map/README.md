# China Map Assets

This directory caches the China boundary GeoJSON used by
`Simulator/data/generate_map_figures.py`.

The script first tries to download:

- `https://geo.datav.aliyun.com/areas_v3/bound/100000_full.json`
- `https://geo.datav.aliyun.com/areas_v3/bound/100000.json`
- `https://raw.githubusercontent.com/johan/world.geo.json/master/countries/CHN.geo.json`
- `https://raw.githubusercontent.com/datasets/geo-countries/master/data/countries.geojson`

The preferred full boundary is cached as `china_boundary_full.geojson` so later figure generation can run offline. The full boundary source is used to include Taiwan and South China Sea features where available.

Run from the repository root:

```powershell
conda run -n SolarSave python Simulator\data\generate_map_figures.py
```

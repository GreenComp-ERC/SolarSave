# SolarChain Simulator API

This service provides solar PV prediction endpoints and an optional on-chain market update loop used by the SolarChain frontend.

## Features

- FastAPI endpoints for single-location and multi-location prediction
- CORS enabled for local frontend development
- Optional background loop that reads on-chain panels/factories and updates market state

## Prerequisites

- Python 3.9+
- Installed dependencies from `requirements.txt`
- (Optional) A local Hardhat node and deployed contracts for energy simulation loop

## Install

```bash
pip install -r requirements.txt
```

## Run

```bash
python -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload
```

Base URL: `http://127.0.0.1:8000`

## Environment Variables

Create `.env` in this folder when needed:

```env
SIMULATOR_RPC_URL=http://127.0.0.1:8545
SIMULATOR_PRIVATE_KEY=
SIMULATOR_STEP_SECONDS=3600
ENABLE_ENERGY_SIM=auto
```

Notes:
- `ENABLE_ENERGY_SIM=auto` enables the loop only when a valid private key is available.
- Contract addresses are loaded from `../smart_contract/scripts/contractAddress.json`.

## API Endpoints

### GET /

Health check endpoint.

### POST /run_model/

Runs solar output modeling for one coordinate.

Example request:

```json
{
  "lat": 45.739,
  "lon": 120.683,
  "start_date": "2022-06-21",
  "end_date": "2022-06-22",
  "freq": "60min"
}
```

### POST /run_combined_model/

Runs aggregated modeling for multiple coordinates.

Example request:

```json
{
  "coordinates": [
    {"lat": 45.739, "lon": 120.683},
    {"lat": 46.739, "lon": 121.683}
  ],
  "start_date": "2022-06-21",
  "end_date": "2022-06-22",
  "freq": "60min"
}
```

## Troubleshooting

- API not reachable from frontend:
  - Confirm service is running on port `8000`.
- Energy simulator loop does not start:
  - Set `ENABLE_ENERGY_SIM=true`, provide valid `SIMULATOR_PRIVATE_KEY`, and verify RPC URL.
- On-chain updates fail:
  - Ensure contracts are deployed and addresses exist in `smart_contract/scripts/contractAddress.json`.


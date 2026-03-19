# SolarChain Client

This folder contains the React frontend for SolarChain. The app provides map-based asset registration, energy market views, wallet/token actions, and reward interactions.

## Tech Stack

- React 18
- Vite 6
- ethers.js
- Leaflet / react-leaflet

## Prerequisites

- Node.js 18+
- npm
- A running local chain (Hardhat node)
- Deployed contracts with addresses written to `src/utils/contractAddress.json`
- Simulator API running on `http://127.0.0.1:8000`

## Install

```bash
npm install
```

## Run in Development

```bash
npm run dev
```

Default URL: `http://127.0.0.1:3000`

## Build and Preview

```bash
npm run build
npm run preview
```

## Important Runtime Dependencies

- Contract addresses are loaded from:
	- `src/utils/contractAddress.json`
- Simulator API requests are currently hardcoded in components to:
	- `http://127.0.0.1:8000/run_model/`

If you change backend host or port, update those API URLs in frontend components.

## Troubleshooting

- `npm run dev` fails:
	- Check Node.js version (`node -v`) is 18+.
	- Reinstall dependencies: remove `node_modules` and run `npm install`.
- Frontend shows empty on-chain data:
	- Make sure contracts are deployed to local chain and `src/utils/contractAddress.json` is up to date.
- Prediction request fails:
	- Ensure simulator is running on `127.0.0.1:8000`.


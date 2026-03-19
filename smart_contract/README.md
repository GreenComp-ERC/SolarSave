# SolarChain Smart Contracts

This folder contains the Solidity contracts and deployment scripts for SolarChain.

## Included Contracts

- `SolarToken.sol` - ERC-20 token used by the app
- `SolarPanels.sol` - panel registry and ownership
- `Factory.sol` - factory registry and demand data
- `EnergyExchange.sol` - market supply/demand and reward logic
- `PowerReward.sol` - reward pool and claiming support
- `Shop.sol` - panel marketplace logic

## Prerequisites

- Node.js 18+
- npm

## Install

```bash
npm install
```

## Compile

```bash
npx hardhat compile
```

## Run Local Chain

```bash
npx hardhat node
```

Default RPC URL: `http://127.0.0.1:8545`

## Deploy to Local Chain

In another terminal:

```bash
npx hardhat run scripts/deployAll.js --network localhost
```

`deployAll.js` will:

- Deploy all core contracts
- Set simulator step seconds in exchange/reward contracts
- Authorize shop contract in panel contract
- Airdrop SOLR to test accounts
- Fund reward pool and exchange reward balance
- Write contract addresses for contract and frontend usage

## Address Output Files

- `scripts/contractAddress.json`
- `../client/src/utils/contractAddress.json` (auto-synced)

## Optional Environment Variables

Create `.env` in this folder to customize deployment/network behavior:

```env
SIMULATOR_STEP_SECONDS=60
AIRDROP_AMOUNT=1000
REWARD_FUND_AMOUNT=10000
DEPLOYER_PRIVATE_KEY=
SIMULATOR_PRIVATE_KEY=

# Sepolia config (optional)
ALCHEMY_API_KEY=
SEPOLIA_PRIVATE_KEY=
```

## Network Configuration

`hardhat.config.js` includes:

- Solidity compiler `0.8.20`
- Optional `sepolia` network via Alchemy

## Scripts

- `scripts/deployAll.js` - full local deployment flow
- `scripts/deployToken.js` - token-only deployment
- `scripts/deployPanels.js` - panel contract deployment
- `scripts/deployShop.js` - shop deployment
- `scripts/deployReward.js` - reward deployment

## Troubleshooting

- `npx hardhat node` fails:
	- Confirm dependencies are installed with `npm install`.
	- Ensure port `8545` is available.
- Frontend cannot read contracts:
	- Re-run deployment and verify `client/src/utils/contractAddress.json` exists and has fresh addresses.

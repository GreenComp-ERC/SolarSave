# **SolarChain: Blockchain for Sustainable Energy Optimization**

## **Overview**

**SolarChain** is an open-source platform for urban distributed-energy verification and blockchain-backed solar asset registration. It combines geospatial interaction, physics-bounded solar modeling, planner review, wallet-signed on-chain registration, factory-side energy demand, and a simulator-driven market update flow.

SolarChain is designed as an interactive decision-support tool for urban planners, energy communities, and researchers. The machine computes physical generation boundaries; the human reviews candidate distributed-energy-resource (DER) samples; approved candidates are cryptographically signed through MetaMask before becoming on-chain solar panels.

Project naming note: the product name is **SolarChain**, while the repository/folder name remains `SolarSave`.

---
## **Demo Video**

https://github.com/user-attachments/assets/958c321f-7562-49f2-bd08-97209db8f078

## **Key Features**

### **Planner Decision Console**
- **Candidate DER Queue**: Load hourly urban solar samples from CSV and review machine-checked records in a planner-facing queue.
- **Human-in-the-Loop Verification**: Compare reported power against the physics maximum (`P_max_W`) before approving or rejecting a candidate.
- **Audit Trail**: Track machine computation, planner review, wallet signature, and on-chain registration in one workflow.

### **Interactive Map and Asset Creation**
- **Candidate DER Samples**: Display imported DER records as map markers grouped by `node_id`.
- **Solar Panel Registration**: Convert approved candidates, or manually selected coordinates, into on-chain solar panels.
- **Factory Registration**: Register factories with location and power consumption to model energy demand on-chain.
- **Layer Controls**: Toggle candidate DER samples, on-chain solar panels, and factory demand nodes.

### **Physics-Bounded Generation Verification**
- **Prediction API Integration**: Uses the simulator API to predict panel values such as battery temperature, DC power, and AC power for selected locations.
- **Boundary-Based Validation**: Imported records include `P_max_W`, `P_reported_W`, FDIA labels, and verification status.
- **Planner Review Before Submission**: Panel registration requires explicit planner approval before the MetaMask signature and on-chain transaction.

### **On-Chain Energy Market**
- **Supply and Demand Tracking**: Maintains global supply energy and total market demand on-chain.
- **Factory Energy Purchase**: Buy energy for a selected factory using SOLR, with on-chain cost preview.
- **Factory Energy Balances**: Track per-factory energy balance and deficits in the UI.
- **Market Impact View**: Compare verified SolarChain liquidity against a no-split baseline and inspect slippage reduction.

### **Rewards and Cooldown Logic**
- **Personal Reward Accrual**: Rewards accumulate from simulator market steps.
- **Claim with Cooldown**: Reward claiming respects `simulatorStepSeconds` cooldown logic from the contract.
- **Live Reward Preview**: Frontend previews claimable rewards before submission.

### **Wallet and Token Operations**
- **MetaMask Integration**: Connect wallet and interact with contracts through ethers.js.
- **SOLR Transfers**: Transfer SOLR between addresses from the wallet UI.
- **Owner Mint Tools (Local/Test)**: Token owner can mint SOLR for local testing workflows.

---

## **Tech Stack**

| Technology    | Purpose                           |
|---------------|-----------------------------------|
| **Python (FastAPI + Uvicorn)** | Simulator and prediction API |
| **React.js**  | Frontend interface and dashboards |
| **Leaflet**   | Interactive map rendering         |
| **Solidity**  | Smart contract development        |
| **Hardhat**   | Local blockchain development and deployment |
| **ethers.js** | Frontend and script blockchain integration |

---

## **Dataset & Research Enablement**

SolarChain includes a reproducible, multi-city simulation dataset under
`Simulator/data/datasets/`. The dataset covers a 24-hour cycle on
`2026-05-01` in `Asia/Shanghai`, combines `pvlib` solar modeling with
Open-Meteo historical weather observations, and injects exactly 5% FDIA
records for anomaly-detection benchmarking.

Generate or refresh the dataset:

```bash
conda run -n SolarSave python Simulator/data/generate_multicity_datasets.py
```

Generate the reviewer and canonical research figures:

```bash
conda run -n SolarSave python Simulator/data/visualizations.py
```

### **Frontend Dataset Import**

The planner workbench reads static CSV files from `client/public/datasets/`:

| Frontend File | Used For |
|---------------|----------|
| `client/public/datasets/spatiotemporal_generation.csv` | Candidate DER queue, map markers, physics-boundary review, FDIA status |
| `client/public/datasets/market_liquidity.csv` | Market Impact view and SolarChain-vs-baseline liquidity comparison |

To update the client-side candidate data, replace those CSV files and refresh the frontend.
The queue displays all hourly records from `spatiotemporal_generation.csv`; the map groups
those records by `node_id`, so 24 hourly samples for one DER node appear as one location
marker. Approved candidates can be converted into on-chain solar panels through the
planner review and MetaMask signature workflow.

Important planner metrics:

| Metric | Meaning |
|--------|---------|
| **Verified DER** | Candidate records whose machine verification status is `verified`. |
| **Rejected FDIA** | Candidate records rejected by the physics-boundary check. |
| **On-chain** | Candidates registered as blockchain solar panels during the current client session. |
| **Ready MW** | Verified, non-rejected generation estimate, computed from `min(P_reported_W, P_max_W)` and converted from W to MW. |

### **Dataset Dictionary and Metadata**

| CSV File | Description | Records | Fields |
|----------|-------------|---------|--------|
| `urban_energy_nodes.csv` | Static metadata for distributed urban solar nodes across Beijing, Shanghai, Chengdu, Shenzhen, and Hangzhou. | 50 | `node_id`, `city`, `latitude`, `longitude`, `panel_area_m2`, `efficiency`, `temp_coefficient`, `install_date` |
| `spatiotemporal_generation.csv` | Hourly node-level solar generation records with physical power bounds, reported power, and FDIA labels. | 1,200 | `timestamp`, `hour`, `node_id`, `city`, `latitude`, `longitude`, `irradiance_Wm2`, `air_temp_C`, `P_max_W`, `P_reported_W`, `fdia_detected`, `verification_status` |
| `market_liquidity.csv` | Hourly market-liquidity comparison between SolarChain's 1:3 forced-split mechanism and the no-split baseline. | 24 | `timestamp`, `hour`, `total_verified_MW`, `solarchain_liquidity_MW`, `baseline_liquidity_MW`, `slippage_solarchain_pct`, `slippage_baseline_pct` |
| `p2p_trades.csv` | Simulated P2P energy purchases by factories using verified liquidity and token-burning records. | 42 | `trade_id`, `timestamp`, `hour`, `factory_id`, `city`, `energy_purchased_MW`, `tokens_burned`, `exergy_dissipated_MJ` |

#### **`urban_energy_nodes.csv` Field Definitions**

| Field | Definition |
|-------|------------|
| `node_id` | Unique identifier for each distributed solar node. |
| `city` | Chinese city where the node is located. |
| `latitude` | Node latitude in decimal degrees. |
| `longitude` | Node longitude in decimal degrees. |
| `panel_area_m2` | Installed photovoltaic panel area in square meters. |
| `efficiency` | Panel conversion efficiency used by the simulator. |
| `temp_coefficient` | Temperature coefficient used to derate output under non-standard temperature conditions. |
| `install_date` | Synthetic installation date for the node. |

#### **`spatiotemporal_generation.csv` Field Definitions**

| Field | Definition |
|-------|------------|
| `timestamp` | Hourly timestamp with `Asia/Shanghai` timezone offset. |
| `hour` | Hour of day, from 0 to 23. |
| `node_id` | Node identifier matching `urban_energy_nodes.csv`. |
| `city` | City associated with the node. |
| `latitude` | Node latitude in decimal degrees. |
| `longitude` | Node longitude in decimal degrees. |
| `irradiance_Wm2` | Modeled/observed solar irradiance in watts per square meter. |
| `air_temp_C` | Hourly air temperature in degrees Celsius. |
| `P_max_W` | Physics-based maximum generation bound in watts. |
| `P_reported_W` | Reported node generation in watts, including injected FDIA samples. |
| `fdia_detected` | Ground-truth Boolean label for rejected false-data injection records. |
| `verification_status` | Verification result, either `verified` or `rejected`. |

#### **`market_liquidity.csv` Field Definitions**

| Field | Definition |
|-------|------------|
| `timestamp` | Hourly market timestamp with `Asia/Shanghai` timezone offset. |
| `hour` | Hour of day, from 0 to 23. |
| `total_verified_MW` | Aggregated verified generation available to the market in megawatts. |
| `solarchain_liquidity_MW` | Liquidity depth under the 1:3 forced-split SolarChain mechanism. |
| `baseline_liquidity_MW` | Liquidity depth under the no-split baseline. |
| `slippage_solarchain_pct` | Estimated slippage percentage under the SolarChain mechanism. |
| `slippage_baseline_pct` | Estimated slippage percentage under the no-split baseline. |

#### **`p2p_trades.csv` Field Definitions**

| Field | Definition |
|-------|------------|
| `trade_id` | Unique identifier for each simulated P2P trade. |
| `timestamp` | Trade timestamp with `Asia/Shanghai` timezone offset. |
| `hour` | Hour of day, from 0 to 23. |
| `factory_id` | Simulated factory buyer identifier. |
| `city` | City associated with the factory buyer. |
| `energy_purchased_MW` | Purchased energy volume in megawatts. |
| `tokens_burned` | SOLR-equivalent tokens burned by the trade. |
| `exergy_dissipated_MJ` | Estimated dissipated exergy in megajoules. |

### **Research Enablement**

**Urban Resilience**  
Urban-computing and resilience researchers can use `urban_energy_nodes.csv` and
`spatiotemporal_generation.csv` to evaluate whether DER nodes are distributed
reasonably across dense urban regions. Useful visual diagnostics include
geospatial DER distribution maps, city-level node-density plots, installed
capacity bubble maps, spatio-temporal heatmaps by city and hour, and intra-city
generation boxplots. These figures help assess whether solar capacity is
clustered too heavily in one city, whether generation diversity improves
resilience during low-irradiance hours, and whether specific cities show
abnormal volatility that could weaken local energy reliability.

**Incentive Mechanisms**  
Economists and market-design researchers can extract trade and liquidity
variables from `p2p_trades.csv` and `market_liquidity.csv` to test alternative
token policies. Key variables include `energy_purchased_MW`, `tokens_burned`,
`exergy_dissipated_MJ`, `total_verified_MW`, `solarchain_liquidity_MW`,
`baseline_liquidity_MW`, `slippage_solarchain_pct`, and
`slippage_baseline_pct`. These records support counterfactual analysis of burn
rates, liquidity incentives, slippage controls, and the effect of SolarChain's
1:3 forced-split mechanism compared with a no-split baseline.

**FDIA Anomaly Detection**  
Machine-learning researchers can treat `spatiotemporal_generation.csv` as a
supervised benchmark for false-data injection detection. `P_max_W` provides a
physics-based upper bound, while `P_reported_W`, `irradiance_Wm2`, `air_temp_C`,
`hour`, city, and node metadata provide model features. The `fdia_detected`
column is the ground-truth classification label, and `verification_status`
records the system-level decision. A typical pipeline is to split records by
node or city to avoid leakage, train classifiers on physical residuals such as
`P_reported_W - P_max_W` or ratios such as `P_reported_W / P_max_W`, and validate
precision, recall, F1, ROC-AUC, and false-rejection rates against the labeled
FDIA samples.

The visualization script already produces eight English-language PNG figures
covering reviewer-response plots and canonical urban-computing figures:

| Figure | Output File |
|--------|-------------|
| Theoretical generation vs reported generation with rejected FDIA points | `Simulator/data/visualizations/reviewer_a_generation_vs_reported_fdia.png` |
| Liquidity depth comparison: 1:3 forced-split vs no-split baseline | `Simulator/data/visualizations/reviewer_a_liquidity_depth_comparison.png` |
| Spatio-temporal heatmap | `Simulator/data/visualizations/canonical_01_spatiotemporal_heatmap.png` |
| Physics-bounded anomaly scatter plot | `Simulator/data/visualizations/canonical_02_physics_bounded_anomaly_scatter.png` |
| Comparative policy line chart | `Simulator/data/visualizations/canonical_03_comparative_policy_line_chart.png` |
| Geospatial DER distribution map | `Simulator/data/visualizations/canonical_04_geospatial_der_distribution.png` |
| Digital-physical correlation plot | `Simulator/data/visualizations/canonical_05_digital_physical_correlation.png` |
| Intra-city generation boxplot | `Simulator/data/visualizations/canonical_06_intra_city_generation_boxplots.png` |

---

## **Installation and Running**

### **1. Prerequisites**
- **Node.js**: 18+ (LTS recommended)
- **Python**: 3.9+ (3.10 recommended)
- **Git**: latest
- **MetaMask**: for local wallet interactions
- **npm**: comes with Node.js (used by `client/` and `smart_contract/`)

### **2. Clone the Project**
```bash
git clone https://github.com/GreenComp-ERC/SolarSave.git
cd SolarSave
```

### **3. Install Dependencies**
Frontend:
```bash
cd client
npm install
```

Smart contracts:
```bash
cd ../smart_contract
npm install
```

Simulator:
```bash
cd ../Simulator
pip install -r requirements.txt
```

### **4. Optional Environment Variables**
Create `.env` in `smart_contract/` if you want to customize deployment behavior:

```env
# Optional: simulator update interval written to contracts and Simulator/.env
SIMULATOR_STEP_SECONDS=60

# Optional: token airdrop and reward pool setup
AIRDROP_AMOUNT=1000
REWARD_FUND_AMOUNT=10000

# Optional: explicit private key for simulator sync (0x...)
DEPLOYER_PRIVATE_KEY=
SIMULATOR_PRIVATE_KEY=
```

Notes:
- If keys are omitted in local Hardhat mode, deploy script tries to derive from default Hardhat mnemonic.
- Contract addresses are auto-written to frontend files during deployment.

### **5. Start Local Blockchain**
```bash
cd ../smart_contract
npx hardhat node
```

### **6. Deploy Contracts (Local Hardhat)**
In a second terminal:
```bash
cd smart_contract
npx hardhat run scripts/deployAll.js --network localhost
```

This script also:
- Authorizes the Shop contract in SolarPanels
- Airdrops SOLR to local accounts
- Funds the PowerReward pool
- Syncs `Simulator/.env` for the simulator

The deployment scripts write addresses to:
- `smart_contract/scripts/contractAddress.json`
- `client/src/utils/contractAddress.json` (auto-synced for the frontend)

### **7. Start the Simulator**
```bash
cd ../Simulator
python -m uvicorn main:app --reload
```

Default API URL used by frontend: `http://127.0.0.1:8000`

### **8. Start the Frontend**
In another terminal:
```bash
cd client
npm run dev
```

Default frontend URL: `http://127.0.0.1:3000`

### **9. Local Run Checklist (Recommended Order)**
Run these in separate terminals:

1. `smart_contract`: `npx hardhat node`
2. `smart_contract`: `npx hardhat run scripts/deployAll.js --network localhost`
3. `Simulator`: `python -m uvicorn main:app --reload`
4. `client`: `npm run dev`

Then in MetaMask:
- Add local chain `http://127.0.0.1:8545`, chain ID `31337`
- Import a local Hardhat test account key for development only

### **10. MetaMask (Private Chain / Server)**
For private-chain deployment on a server, users should manually add a custom network in MetaMask:

- Network Name: `SolarChain Private`
- RPC URL: `https://<your-domain-or-ip>/rpc`
- Chain ID: `<your-private-chain-id>`
- Currency Symbol: `<native-gas-token-symbol>`
- Block Explorer URL: optional

Notes:
- The `Chain ID` in MetaMask must exactly match the node's configured chain ID.
- Use HTTPS RPC in production and ensure public access from user browsers.
- Do not share or import server/operator private keys into user wallets.
- Ensure users have enough native gas token to submit transactions.
- Frontend contract addresses must be the server-deployed addresses (not localhost addresses).

Local development fallback (Hardhat):
- Network: `Hardhat Local`
- RPC URL: `http://127.0.0.1:8545`
- Chain ID: `31337`
- Import a Hardhat test account private key only for local testing

---

## **Troubleshooting**
- **`npx hardhat node` exits with code 1**:
   - Make sure you are inside `smart_contract/`.
   - Run `npm install` in `smart_contract/` first.
   - Check if port `8545` is already in use (stop the existing process or change port).

- **`npm run dev` exits with code 1 in `client/`**:
   - Ensure `npm install` was executed in `client/`.
   - Confirm Node.js version is 18+ (`node -v`).
   - If port `3000` is occupied, free it or change `server.port` in `client/vite.config.js`.

- **Frontend cannot call simulator API**:
   - Ensure simulator is running on `127.0.0.1:8000`.
   - Client components call `http://127.0.0.1:8000/run_model/`; if you change backend host/port, update frontend API URLs accordingly.

- **Candidate DER Queue is empty**:
   - Ensure `client/public/datasets/spatiotemporal_generation.csv` exists.
   - Confirm the CSV header matches the documented dataset fields.
   - Refresh the frontend after replacing CSV files.

- **Map shows fewer candidate markers than queue rows**:
   - This is expected: the queue shows hourly samples, while the map groups samples by `node_id`.
   - For the bundled dataset, 1,200 hourly records become 50 DER node markers.

- **Approve opens registration but MetaMask does not sign**:
   - Ensure MetaMask is connected to the expected local/private chain.
   - Ensure the connected account has enough native gas token and SOLR for the local registration flow.

- **Global Supply / Global Demand is 0**: make sure the simulator is running and that at least one solar panel and factory are created on-chain.
- **Rewards are 0**: the energy simulator must run at least one step to update the market and reward balances.
- **Next update stuck at 0m 0s or countdown jumps**:
   - Ensure `Simulator/.env` has a valid `SIMULATOR_PRIVATE_KEY` and `ENABLE_ENERGY_SIM=true`.
   - The simulator now syncs contract `simulatorStepSeconds` from `SIMULATOR_STEP_SECONDS` at startup.
   - Restart simulator after changing `SIMULATOR_STEP_SECONDS`.

---

## **Project Structure**

```
SolarSave/
├── client/                         # Frontend code
│   ├── public/datasets/             # Static CSVs loaded by Planner Workbench
│   ├── src/                        # Frontend source
│   │   ├── components/             # Shared React components
│   │   ├── style/                  # CSS and style files
│   │   ├── utils/                  # Utility functions
│   │   ├── App.jsx                 # Main application file
│   │   ├── index.jsx               # Entry file
│   └── package.json
├── Simulator/                      # Simulator
│   ├── SolarPVModel.py             # Solar panel logic simulation
│   ├── main.py                     # Simulator entry point
│   ├── requirements.txt            # Python dependencies
├── smart_contract/                 # Smart contracts
│   ├── contracts/                  # Smart contract files
│   │   ├── SolarPanels.sol         # Solar panel registry
│   │   ├── Factory.sol             # Factory registry
│   │   ├── EnergyExchange.sol      # Supply/demand and reward market
│   │   ├── Shop.sol                # Panel marketplace
│   │   ├── PowerReward.sol         # Reward distribution
│   │   ├── SolarToken.sol          # ERC-20 token (SOLR)
│   ├── scripts/                    # Deployment and interaction scripts
│   ├── hardhat.config.js           # Hardhat configuration
│   ├── package.json
│   ├── README.md                   # Smart contract documentation
└── README.md                       # Project documentation
```

---

## **How to Use SolarChain**

1. **Connect Wallet and Load Contracts**:
   - Open the frontend application.
   - Connect MetaMask to the local Hardhat network.

2. **Review Candidate DER Samples**:
   - Open the Planner Decision Console.
   - Use the left-side Planner Workbench to inspect verification metrics and toggle data layers.
   - Select an hourly record from Candidate DER Queue or click a DER marker on the map.

3. **Approve, Reject, or Convert a Candidate**:
   - Review irradiance, air temperature, `P_max_W`, reported power, residual, and risk status.
   - Reject suspicious FDIA records without sending an on-chain transaction.
   - Approve trusted candidates and use the Planner Review & Registration window to sign and register them as on-chain solar panels.

4. **Create Manual Solar Panels and Factories**:
   - Right-click the map to manually create a solar panel or register a factory.
   - Manual panel creation still uses simulator prediction data and now passes through planner review before wallet signature.
   - Factory registration saves location and consumption for demand-side market modeling.

5. **Run Market Updates with Simulator**:
   - Start the simulator to generate/update panel output.
   - Let the simulator update market supply, demand, and personal rewards.

6. **Trade and Allocate Energy**:
   - Use the market dashboard to inspect global supply/demand.
   - Purchase energy for factories and monitor factory balances.
   - Use Market Impact to compare verified SolarChain liquidity with the no-split baseline.

7. **Claim Rewards and Manage SOLR**:
   - Claim personal rewards when cooldown allows.
   - Manage SOLR balances and transfers through wallet UI.

---

## **Smart Contract Features**

### **Core Contracts**
- **SolarPanels.sol**: create/update panels, query all panels, query panels by owner.
- **Factory.sol**: register factories and query personal/global factory lists.
- **EnergyExchange.sol**: tracks market supply/demand, accrues personal rewards, handles reward claiming, and supports factory energy purchases.
- **Shop.sol**: list panels for sale, buy panels, approve sales.
- **PowerReward.sol**: claim rewards based on panel DC power; owner can deposit reward tokens.
- **SolarToken.sol**: ERC-20 token (SOLR) used for payments and rewards.

### **Local Rewards Note**
For local testing, the reward contract must hold SOLR. Deposit SOLR from the owner account before claiming rewards.

---

## **Contribution Guide**

Welcome to contribute! Ways to contribute:
1. Fork the repository.
2. Create a new branch for modifications.
3. Submit a Pull Request with a clear description.

---

## **License**

This project is licensed under the [MIT License](LICENSE).

---

## **Future Plans**

- **Dataset Upload UI**: Add browser-side CSV upload for candidate DER and market-liquidity records.
- **Machine Learning Integration**: Improve FDIA detection and generation-boundary confidence scoring.
- **Planner Collaboration**: Support multi-reviewer approval policies and persistent audit logs.
- **Cross-chain Support**: Extend to other blockchain platforms.
- **Advanced Market Strategy**: Improve matching between distributed generation and factory demand.

---

## **Contact**

For questions or suggestions, please contact:
- **GitHub Issue**: [Submit an issue](https://github.com/GreenComp-ERC/SolarSave/issues)

---

Through **SolarChain**, let's contribute to a sustainable future!

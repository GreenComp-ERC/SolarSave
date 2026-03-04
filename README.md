# **SolarSave: Blockchain for Sustainable Energy Optimization**

## **Overview**

**SolarSave** is an open-source platform dedicated to optimizing solar energy usage through blockchain, IoT, and artificial intelligence (AI) technologies. This project allows users to track solar energy production in real-time, predict efficiency, and incentivize energy-saving behaviors through a reward mechanism (SolarToken, abbreviated as SOLR).

SolarSave is designed for individuals, communities, and organizations aiming to reduce energy costs, lower carbon footprints, and participate in the renewable energy revolution.

---

## **Key Features**

### ? **Interactive Solar Map**
- **View and Create Solar Panels**: Users can view existing solar panels on the map or create new ones by selecting coordinates.
- **Real-Time Status Display**: Displays the real-time status of solar panels (e.g., coordinates, battery temperature, DC power, AC power, and owner information).

### ? **Efficiency Prediction**
- **Location-Based Power Generation Prediction**: Predicts solar power generation efficiency at a specific location based on historical data and weather conditions.
- **AI Optimization Suggestions**: Provides specific recommendations, such as cleaning solar panels or adjusting installation angles, to improve power generation efficiency.

### ? **Blockchain Integration**
- **Device Registration**: Registers solar panels on the blockchain for transparent data management.
- **Data Submission**: Submits solar energy production data and earns SolarToken based on contributions.
- **Ownership Transactions**: Supports secure transactions of solar panel ownership between users.

### ? **Real-Time Monitoring**
- **Performance Dashboard**: Users can view real-time solar panel power generation, historical data, and predicted efficiency.
- **Historical Data Visualization**: Analyzes historical trends to make better decisions.

### ? **Reward Mechanism**
- **SolarToken Incentives**: Rewards users for submitting energy data or optimizing energy usage.
- **Wallet Support**: Supports reward withdrawals to Ethereum-compatible wallets like MetaMask.

---

## **Tech Stack**

| Technology    | Purpose                           |
|---------------|-----------------------------------|
| **Python**    | Backend simulator and data processing |
| **React.js**  | Frontend interface and interactive dashboard |
| **Solidity**  | Smart contract development        |
| **Hardhat**   | Blockchain development and testing |
| **ethers.js** | Frontend-blockchain interaction   |
| **Docker**    | Deployment and containerization   |

---

## **Installation and Running**

### **1. Clone the Project**
```bash
git clone https://github.com/GreenComp-ERC/SolarSave.git
cd SolarSave
```

### **2. Frontend Setup**
Navigate to the `client` directory and install dependencies:
```bash
cd client
npm install
npm run dev
```

### **3. Simulator Setup**
Install Python dependencies and run the simulator:
```bash
cd ../Simulator
pip install -r requirements.txt
python main.py
Or run in the terminal:
uvicorn main:app --reload
```

### **4. Smart Contract Deployment (Local Hardhat)**
```bash
cd ../smart_contract
npm install
npx hardhat node
```
In a second terminal:
```bash
cd smart_contract
npx hardhat run scripts/deployAll.js --network localhost
```

This script also:
- Authorizes the Shop contract in SolarPanels
- Airdrops SOLR to local accounts
- Funds the PowerReward pool

Optional environment variables:
- `AIRDROP_AMOUNT` (default `1000` SOLR)
- `REWARD_FUND_AMOUNT` (default `10000` SOLR)
- `AIRDROP_ACCOUNTS` (comma-separated addresses)

The deployment scripts write addresses to:
- `smart_contract/scripts/contractAddress.json`
- `client/src/utils/contractAddress.json` (auto-synced for the frontend)

### **5. MetaMask (Local)**
- Network: `Hardhat Local`
- RPC URL: `http://127.0.0.1:8545`
- Chain ID: `31337`
- Import a Hardhat account private key to get test ETH

---

## **Project Structure**

```
SolarSave/
├── client/                         # Frontend code
│   ├── src/                        # Frontend source
│   │   ├── components/             # Shared React components
│   │   ├── style/                  # CSS and style files
│   │   ├── utils/                  # Utility functions
│   │   ├── App.jsx                 # Main application file
│   │   ├── index.jsx               # Entry file
│   ├── package.json
│   └── package.json
├── Simulator/                      # Simulator
│   ├── SolarPVModel.py             # Solar panel logic simulation
│   ├── main.py                     # Simulator entry point
│   ├── requirements.txt            # Python dependencies
├── smart_contract/                 # Smart contracts
│   ├── contracts/                  # Smart contract files
│   │   ├── SolarPanels.sol         # Solar panel registry
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

## **How to Use SolarSave**

1. **Create Solar Panels**:
   - Open the frontend application.
   - Select coordinates on the map and click the create button.

2. **Submit Energy Data**:
   - Use the simulator to generate solar panel data.
   - Submit data to the blockchain and earn SolarToken.

3. **View Efficiency**:
   - View real-time and historical data on the dashboard.
   - Use AI suggestions to optimize solar panel performance.

4. **Withdraw Rewards**:
   - Withdraw SolarToken to compatible wallets (e.g., MetaMask).

---

## **Smart Contract Features**

### **Core Contracts**
- **SolarPanels.sol**: create/update panels, query all panels, query panels by owner.
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

- **Machine Learning Integration**: Improve the accuracy of efficiency predictions.
- **Cross-chain Support**: Extend to other blockchain platforms.
- **Solar Panel Market**: Allow users to trade solar panel ownership and rewards.

---

## **Contact**

For questions or suggestions, please contact:
- **Email**: support@solarsave.com
- **GitHub Issue**: [Submit an issue](https://github.com/GreenComp-ERC/SolarSave.git)

---

Through **SolarSave**, let's contribute to a sustainable future!

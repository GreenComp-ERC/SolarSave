# **SolarSave: Blockchain for Sustainable Energy Optimization**

## **Overview**

**SolarSave** is an open-source platform dedicated to optimizing solar energy usage through blockchain, IoT, and artificial intelligence (AI) technologies. This project allows users to track solar energy production in real-time, predict efficiency, and incentivize energy-saving behaviors through a reward mechanism (SolarToken, abbreviated as SQC).

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
| **Web3.js**   | Frontend-blockchain interaction   |
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

### **4. Smart Contract Deployment**
Use Hardhat to deploy smart contracts:
```bash
cd ../smart_contract
npm install
npx hardhat run scripts/deploy.js --network ganache
(Each smart contract deployment file can be run separately)
```

> **Note**: Replace the network with Ethereum mainnet or testnet as needed.

---

## **Project Structure**

```
SolarSave/
├── client/                         # Frontend code
│   ├── components/                 # Shared React components
│   ├── pages/                      # Page components
│   ├── styles/                     # CSS and style files
│   ├── utils/                      # Utility functions
│   ├── Aapp.js                     # Main application file
│   ├── index.js                    # Entry file
│   └── package.json
├── Simulator/                      # Simulator
│   ├── SolarPVModel.py             # Solar panel logic simulation
│   ├── main.py                     # Simulator entry point
│   ├── requirements.txt            # Python dependencies
├── smart_contract/                 # Smart contracts
│   ├── contracts/                  # Smart contract files
│   │   ├── SolarPanelStore.sol     # Solar panel management contract
│   │   ├── MessageStore.sol        # Chat feature contract (optional)
│   ├── scripts/                    # Deployment and interaction scripts
│   ├── test/                       # Contract tests
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

### **Core Functions**

#### **SolarPanelCreate.sol**
1. **createPanel**  
   Creates a new solar panel, recording its location (latitude and longitude), battery temperature, DC power, AC power, and owner information.

2. **updatePanel**  
   Allows the owner to update the solar panel's battery temperature, DC power, and AC power every 24 hours.

3. **getPanel**  
   Queries detailed information about a specific solar panel, including owner, location, power generation data, and last update time.

4. **getTotalPanels**  
   Retrieves the total number of registered solar panels for statistics and frontend display.

---

#### **PanelTrade.sol**
1. **createPanel**  
   Registers a new solar panel, including location description, status (e.g., "Active"), transaction count, and ownership information.

2. **purchasePanel**  
   Allows users to purchase a solar panel by paying tokens, completing secure ownership transfer, and recording transaction history.

3. **updatePanel**  
   Updates the transaction count, status, or power generation data of a solar panel. Only the owner has permission to perform this operation.

4. **getPanel**  
   Queries detailed information about a specific solar panel, including transaction history and status.

---

#### **GiveRewards.sol**
1. **registerPanel**  
   Registers a solar panel to participate in the reward mechanism while recording DC power and AC power data.

2. **distributeRewards**  
   Calculates rewards based on the solar panel's power generation data (DC power and AC power) and distributes them to the owner every 24 hours.

3. **updatePanel**  
   Updates the panel's power generation data (DC power and AC power). Only the owner has permission to perform this operation.

4. **claimRewards**  
   Allows users to withdraw accumulated SolarToken rewards to their personal wallets.

5. **getPanel**  
   Queries information about a specific solar panel, including power generation data and reward status.

---

#### **SolarToken.sol**
1. **ERC-20 Standard**  
   The token is named `SolarToken` with the symbol `SQC`, compliant with the ERC-20 standard.

2. **Mint Tokens**  
   The contract owner can mint new tokens to distribute rewards to users.

3. **Burn Tokens**  
   The contract owner can burn unused tokens to reduce the total supply.

---

### **Integration Notes**
These contracts are modularly designed, each responsible for specific functions:
- **SolarPanelCreate.sol**: Manages solar panel creation and maintenance.
- **PanelTrade.sol**: Supports user transactions and status management.
- **GiveRewards.sol**: Automatically distributes rewards based on power generation.
- **SolarToken.sol**: As a smart token, manages the distribution and management of rewards.

The combination of these contracts enables comprehensive solar panel lifecycle management, including creation, updates, transactions, incentives, and reward distribution.

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

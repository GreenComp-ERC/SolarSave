
# **SolarSave: 利用区块链实现可持续能源优化**

## **概述**

**SolarSave** 是一个开源平台，致力于通过区块链、物联网（IoT）和人工智能（AI）技术优化太阳能的使用。该项目允许用户实时追踪太阳能生产情况、预测效率，并通过奖励机制（SolarToken，简称 SQC）激励用户节能行为。

SolarSave 专为希望降低能源成本、减少碳足迹并参与可再生能源革命的个人、社区和机构设计。

---

## **功能亮点**

### ? **互动式太阳能地图**
- **查看和创建太阳能板**：用户可以在地图上查看现有的太阳能板或通过选择坐标创建新的太阳能板。
- **实时状态显示**：展示太阳能板的实时状态（如坐标、电池温度、直流功率、交流功率和所有者信息）。

### ? **效率预测**
- **基于位置的发电预测**：根据历史数据和天气条件，预测某个坐标的太阳能发电效率。
- **AI 优化建议**：提供清洗太阳能板、调整安装角度等具体操作建议，以提升发电效率。

### ? **区块链集成**
- **设备注册**：将太阳能板注册到区块链，实现数据透明化管理。
- **数据提交**：提交太阳能生产数据并根据贡献赚取 SolarToken。
- **所有权交易**：支持用户之间的太阳能板所有权安全交易。

### ? **实时监控**
- **性能仪表盘**：用户可以实时查看太阳能板的发电量、历史数据和预测效率。
- **历史数据可视化**：分析历史趋势以做出更优决策。

### ? **奖励机制**
- **SolarToken 激励**：用户因提交能源数据或优化能源使用获得奖励。
- **钱包支持**：支持 MetaMask 等以太坊兼容钱包的奖励提取。

---

## **技术栈**

| 技术         | 用途                              |
|--------------|-----------------------------------|
| **Python**   | 后端模拟器和数据处理              |
| **React.js** | 前端界面和交互式仪表板            |
| **Solidity** | 智能合约开发                      |
| **Hardhat**  | 区块链开发与测试                  |
| **Web3.js**  | 前端与区块链交互                  |
| **Docker**   | 部署与容器化                      |

---

## **安装与运行**

### **1. 克隆项目**
```bash
git clone https://github.com/GreenComp-ERC/SolarSave.git
cd SolarSave
```

### **2. 前端设置**
进入 `client` 目录并安装依赖：
```bash
cd client
npm install
npm run dev
```

### **3. 模拟器设置**
安装 Python 依赖并运行模拟器：
```bash
cd ../Simulator
pip install -r requirements.txt
python main.py
或者在终端中输入
uvicorn main:app --reload

```

### **4. 智能合约部署**
使用 Hardhat 部署智能合约：
```bash
cd ../smart_contract
npm install
npx hardhat run scripts/deploy.js --network ganache
(可单独运行每个智能合约对应部署文件)
```

> **注意**: 根据需要替换网络为以太坊主网或测试网。

---

## **项目结构**

```
SolarSave/
├── client/                         # 前端代码
│   ├── components/                 # 公用 React 组件
│   ├── pages/                      # 页面组件
│   ├── styles/                     # CSS 和样式文件
│   ├── utils/                      # 工具函数
│   ├── Aapp.js                      # 主应用文件
│   ├── index.js                    # 入口文件
│   └── package.json
├── Simulator/                      # 模拟器
│   ├── SolarPVModel.py             # 模拟太阳能板逻辑
│   ├── main.py                     # 模拟器入口
│   ├── requirements.txt            # Python 依赖
├── smart_contract/                 # 智能合约
│   ├── contracts/                  # 智能合约文件
│   │   ├── SolarPanelStore.sol     # 太阳能板管理合约
│   │   ├── MessageStore.sol        # 聊天功能合约（可选）
│   ├── scripts/                    # 部署和交互脚本
│   ├── test/                       # 合约测试
│   ├── hardhat.config.js           # Hardhat 配置
│   ├── package.json
│   ├── README.md                   # 智能合约文档
└── README.md                       # 项目总文档
```

---

## **如何使用 SolarSave**

1. **创建太阳能板**：
   - 打开前端应用。
   - 在地图上选择坐标并点击创建按钮。

2. **提交能源数据**：
   - 使用模拟器生成太阳能板数据。
   - 提交数据到区块链并赚取 SolarToken。

3. **查看效率**：
   - 在仪表盘查看实时和历史数据。
   - 使用 AI 建议优化太阳能板性能。

4. **提取奖励**：
   - 提取 SolarToken 到兼容钱包（如 MetaMask）。

---

## **智能合约功能**

### **核心功能**

#### **SolarPanelCreate.sol**
1. **createPanel**  
   创建新的太阳能板，记录其位置（纬度和经度）、电池温度、直流功率、交流功率以及所有者信息。

2. **updatePanel**  
   每24小时允许所有者更新太阳能板的电池温度、直流功率和交流功率。

3. **getPanel**  
   查询指定太阳能板的详细信息，包括所有者、位置、发电数据和最后更新时间。

4. **getTotalPanels**  
   获取已注册的太阳能板总数，便于统计和前端展示。

---

#### **PanelTrade.sol**
1. **createPanel**  
   注册新的太阳能板，包含位置描述、状态（如“Active”）、交易次数及所有权等信息。

2. **purchasePanel**  
   用户支付一定代币购买太阳能板，完成所有权的安全转移，并记录交易历史。

3. **updatePanel**  
   更新太阳能板的交易次数、状态或发电数据，操作权限仅限所有者。

4. **getPanel**  
   查询指定太阳能板的详细信息，包括交易历史和状态。

---

#### **GiveRewards.sol**
1. **registerPanel**  
   注册太阳能板以参与奖励机制，同时记录直流功率和交流功率数据。

2. **distributeRewards**  
   根据太阳能板的发电数据（直流功率和交流功率）计算奖励，并每24小时分发给所有者。

3. **updatePanel**  
   更新面板的发电数据（直流功率和交流功率），操作权限仅限所有者。

4. **claimRewards**  
   用户提取已累积的 SolarToken 奖励到个人钱包。

5. **getPanel**  
   查询指定太阳能板的信息，包括发电数据和奖励状态。

---

#### **SolarToken.sol**
1. **ERC-20 标准**  
   代币名称为 `SolarToken`，符号为 `SQC`，兼容 ERC-20 标准。

2. **铸造代币（mint）**  
   合约所有者可以铸造新的代币，用于向用户分发奖励。

3. **销毁代币（burn）**  
   合约所有者可以销毁未使用的代币，减少代币的流通供应量。

4. **代币转账**  
   用户可以通过标准的 ERC-20 功能自由转账代币。

---

### **整合说明**
这些合约的功能模块化设计，分别负责太阳能板的创建与更新、所有权交易、奖励分发以及代币管理。它们可以独立运行，也可以通过接口整合，实现如下整体功能：
- **SolarPanelCreate.sol**：负责创建和维护太阳能板基础数据。
- **PanelTrade.sol**：支持用户之间的太阳能板交易和状态管理。
- **GiveRewards.sol**：根据发电数据自动分发奖励，激励太阳能发电行为。
- **SolarToken.sol**：作为奖励的智能凭证，用于分发和管理奖励代币。

通过合约的组合，能够实现全面的太阳能板生命周期管理，包括创建、更新、交易、激励和奖励分发。

---

## **贡献指南**

欢迎社区贡献！贡献方法：
1. Fork 仓库。
2. 新建分支进行修改。
3. 提交 Pull Request，清晰描述变更内容。

---

## **许可证**

本项目基于 [MIT 许可证](LICENSE)。

---

## **未来计划**

- **机器学习集成**：提升发电效率预测的准确性。
- **跨链支持**：扩展到其他区块链平台。
- **太阳能板市场**：允许用户交易太阳能板所有权及奖励。

---

## **联系我们**

如有疑问或建议，请联系：
- **邮件**: support@solarsave.com
- **GitHub Issue**: [提交问题](https://github.com/GreenComp-ERC/SolarSave.git)

---

通过 **SolarSave**，让我们一起为可持续发展贡献力量！

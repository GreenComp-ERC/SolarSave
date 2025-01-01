// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract PanelTrade {
    // 太阳能板结构体
    struct SolarPanel {
        uint256 id; // 太阳能板唯一标识符
        address owner; // 太阳能板所有者地址
        string location; // 太阳能板的具体位置
        uint256 batteryTemp; // 电池温度
        uint256 dcPower; // 直流功率
        uint256 acPower; // 交流功率
        uint256 transactions; // 完成的交易数量
        uint256 price; // 销售价格（单位：Wei）
        uint256 timestamp; // 创建时间戳
        string status; // 当前状态（如 "Active"、"Inactive"）
    }

    // 太阳能板存储映射
    mapping(uint256 => SolarPanel) public panels;

    // 下一个太阳能板的唯一ID
    uint256 public nextPanelId;

    // 事件定义
    event PanelCreated(
        uint256 id,
        address indexed owner,
        string location,
        uint256 batteryTemp,
        uint256 dcPower,
        uint256 acPower,
        uint256 price,
        uint256 timestamp,
        string status
    );

    event PanelPurchased(
        uint256 id,
        address indexed previousOwner,
        address indexed newOwner,
        uint256 price
    );

    event PanelUpdated(
        uint256 id,
        uint256 batteryTemp,
        uint256 dcPower,
        uint256 acPower,
        string status
    );

    // 创建太阳能板
    function createPanel(
        string memory _location,
        uint256 _batteryTemp,
        uint256 _dcPower,
        uint256 _acPower,
        uint256 _price,
        string memory _status
    ) external {
        require(_price > 0, "Price must be greater than zero");

        panels[nextPanelId] = SolarPanel({
            id: nextPanelId,
            owner: msg.sender,
            location: _location,
            batteryTemp: _batteryTemp,
            dcPower: _dcPower,
            acPower: _acPower,
            transactions: 0,
            price: _price,
            timestamp: block.timestamp,
            status: _status
        });

        emit PanelCreated(
            nextPanelId,
            msg.sender,
            _location,
            _batteryTemp,
            _dcPower,
            _acPower,
            _price,
            block.timestamp,
            _status
        );

        nextPanelId++;
    }

    // 购买太阳能板
    function purchasePanel(uint256 _id) external payable {
        SolarPanel storage panel = panels[_id];
        require(panel.owner != address(0), "Panel does not exist");
        require(msg.sender != panel.owner, "Owner cannot purchase their own panel");
        require(msg.value >= panel.price, "Insufficient payment");

        address previousOwner = panel.owner;
        panel.owner = msg.sender;
        panel.transactions += 1;

        payable(previousOwner).transfer(msg.value);

        emit PanelPurchased(_id, previousOwner, msg.sender, panel.price);
    }

    // 更新太阳能板数据
    function updatePanel(
        uint256 _id,
        uint256 _batteryTemp,
        uint256 _dcPower,
        uint256 _acPower,
        string memory _status
    ) external {
        SolarPanel storage panel = panels[_id];
        require(panel.owner == msg.sender, "Only the owner can update the panel");

        panel.batteryTemp = _batteryTemp;
        panel.dcPower = _dcPower;
        panel.acPower = _acPower;
        panel.status = _status;

        emit PanelUpdated(_id, _batteryTemp, _dcPower, _acPower, _status);
    }

    // 查询太阳能板信息
    function getPanel(uint256 _id)
        external
        view
        returns (
            uint256 id,
            address owner,
            string memory location,
            uint256 batteryTemp,
            uint256 dcPower,
            uint256 acPower,
            uint256 transactions,
            uint256 price,
            uint256 timestamp,
            string memory status
        )
    {
        SolarPanel memory panel = panels[_id];
        return (
            panel.id,
            panel.owner,
            panel.location,
            panel.batteryTemp,
            panel.dcPower,
            panel.acPower,
            panel.transactions,
            panel.price,
            panel.timestamp,
            panel.status
        );
    }

    // 获取所有太阳能板的数量
    function getTotalPanels() external view returns (uint256) {
        return nextPanelId;
    }
}

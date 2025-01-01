// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract SolarPanelCreate {
    // 太阳能板结构体
    struct SolarPanel {
        uint256 id; // 唯一标识符
        address owner; // 太阳能板所有者
        int256 latitude; // 纬度
        int256 longitude; // 经度
        uint256 batteryTemp; // 电池温度
        uint256 dcPower; // 直流功率
        uint256 acPower; // 交流功率
        uint256 lastUpdated; // 上次更新的时间戳
    }

    // 太阳能板映射存储
    mapping(uint256 => SolarPanel) public panels;

    // 下一个太阳能板ID
    uint256 public nextPanelId;

    // 事件定义
    event PanelCreated(
        uint256 id,
        address indexed owner,
        int256 latitude,
        int256 longitude,
        uint256 batteryTemp,
        uint256 dcPower,
        uint256 acPower,
        uint256 timestamp
    );

    event PanelUpdated(
        uint256 id,
        uint256 batteryTemp,
        uint256 dcPower,
        uint256 acPower,
        uint256 timestamp
    );

    // 创建太阳能板
    function createPanel(
        int256 _latitude,
        int256 _longitude,
        uint256 _batteryTemp,
        uint256 _dcPower,
        uint256 _acPower
    ) external {
        // 创建新太阳能板
        panels[nextPanelId] = SolarPanel({
            id: nextPanelId,
            owner: msg.sender,
            latitude: _latitude,
            longitude: _longitude,
            batteryTemp: _batteryTemp,
            dcPower: _dcPower,
            acPower: _acPower,
            lastUpdated: block.timestamp
        });

        emit PanelCreated(
            nextPanelId,
            msg.sender,
            _latitude,
            _longitude,
            _batteryTemp,
            _dcPower,
            _acPower,
            block.timestamp
        );

        // 更新下一个太阳能板ID
        nextPanelId++;
    }

    // 更新太阳能板信息
    function updatePanel(
        uint256 _id,
        uint256 _batteryTemp,
        uint256 _dcPower,
        uint256 _acPower
    ) external {
        SolarPanel storage panel = panels[_id];
        require(panel.owner == msg.sender, "Only the owner can update the panel");
        require(
            block.timestamp >= panel.lastUpdated + 24 hours,
            "You can only update once every 24 hours"
        );

        // 更新数据
        panel.batteryTemp = _batteryTemp;
        panel.dcPower = _dcPower;
        panel.acPower = _acPower;
        panel.lastUpdated = block.timestamp;

        emit PanelUpdated(_id, _batteryTemp, _dcPower, _acPower, block.timestamp);
    }

    // 查询太阳能板信息
    function getPanel(uint256 _id)
        external
        view
        returns (
            uint256 id,
            address owner,
            int256 latitude,
            int256 longitude,
            uint256 batteryTemp,
            uint256 dcPower,
            uint256 acPower,
            uint256 lastUpdated
        )
    {
        SolarPanel memory panel = panels[_id];
        return (
            panel.id,
            panel.owner,
            panel.latitude,
            panel.longitude,
            panel.batteryTemp,
            panel.dcPower,
            panel.acPower,
            panel.lastUpdated
        );
    }

    // 获取所有太阳能板的数量
    function getTotalPanels() external view returns (uint256) {
        return nextPanelId;
    }
}

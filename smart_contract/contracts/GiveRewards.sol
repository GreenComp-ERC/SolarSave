// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract GiveRewards {
    // 太阳能板结构体
    struct SolarPanel {
        uint256 id; // 唯一标识符
        address owner; // 太阳能板所有者
        uint256 dcPower; // 直流功率 (W)
        uint256 acPower; // 交流功率 (W)
        uint256 lastRewardTime; // 上次奖励发放时间
    }

    // 每个太阳能板的奖励倍率
    uint256 public rewardRate = 1 ether; // 每瓦奖励的代币数量（假设为ERC20标准）

    // 用于存储所有太阳能板信息
    mapping(uint256 => SolarPanel) public panels;

    // 代币余额映射，记录每个地址的奖励余额
    mapping(address => uint256) public rewards;

    // 太阳能板计数
    uint256 public nextPanelId;

    // 事件
    event PanelRegistered(uint256 id, address indexed owner, uint256 dcPower, uint256 acPower);
    event RewardsDistributed(uint256 id, address indexed owner, uint256 rewardAmount);

    // 注册太阳能板
    function registerPanel(uint256 _dcPower, uint256 _acPower) external {
        panels[nextPanelId] = SolarPanel({
            id: nextPanelId,
            owner: msg.sender,
            dcPower: _dcPower,
            acPower: _acPower,
            lastRewardTime: block.timestamp
        });

        emit PanelRegistered(nextPanelId, msg.sender, _dcPower, _acPower);

        nextPanelId++;
    }

    // 更新太阳能板的功率数据
    function updatePanel(uint256 _id, uint256 _dcPower, uint256 _acPower) external {
        SolarPanel storage panel = panels[_id];
        require(panel.owner == msg.sender, "Only the owner can update the panel data");

        panel.dcPower = _dcPower;
        panel.acPower = _acPower;
    }

    // 分发奖励（自动调用或手动触发）
    function distributeRewards(uint256 _id) public {
        SolarPanel storage panel = panels[_id];
        require(block.timestamp >= panel.lastRewardTime + 24 hours, "Rewards can only be claimed every 24 hours");

        // 计算奖励数量（直流功率 + 交流功率）
        uint256 rewardAmount = (panel.dcPower + panel.acPower) * rewardRate;

        // 更新上次奖励时间
        panel.lastRewardTime = block.timestamp;

        // 增加用户奖励余额
        rewards[panel.owner] += rewardAmount;

        emit RewardsDistributed(_id, panel.owner, rewardAmount);
    }

    // 提取奖励
    function claimRewards() external {
        uint256 reward = rewards[msg.sender];
        require(reward > 0, "No rewards available");

        // 清空余额并转移奖励
        rewards[msg.sender] = 0;
        payable(msg.sender).transfer(reward);
    }

    // 查询面板信息
    function getPanel(uint256 _id) external view returns (
        uint256 id,
        address owner,
        uint256 dcPower,
        uint256 acPower,
        uint256 lastRewardTime
    ) {
        SolarPanel memory panel = panels[_id];
        return (
            panel.id,
            panel.owner,
            panel.dcPower,
            panel.acPower,
            panel.lastRewardTime
        );
    }

    // 合约接收以太币
    receive() external payable {}
}

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

// 引入 SolarPanels 合约接口
interface ISolarPanels {
    struct Panel {
        uint256 id;
        address owner;
        uint256 latitude;
        uint256 longitude;
        uint256 batteryTemperature;
        uint256 dcPower;
        uint256 acPower;
        uint256 createdAt;
        bool exists;
    }

    function getMyPanels() external view returns (Panel[] memory);
}

contract PowerReward {
    IERC20 public rewardToken;
    ISolarPanels public solarPanelContract;
    address public owner;

    mapping(address => bool) public hasClaimed;

    event RewardClaimed(address indexed user, uint totalPower, uint rewardAmount);

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    constructor(address _rewardToken, address _solarPanelContract) {
        rewardToken = IERC20(_rewardToken);
        solarPanelContract = ISolarPanels(_solarPanelContract);
        owner = msg.sender;
    }

    // 🚀 主功能：领取奖励
    function claimReward() public {
        require(!hasClaimed[msg.sender], "Already claimed");

        ISolarPanels.Panel[] memory panels = solarPanelContract.getMyPanels();
        require(panels.length > 0, "No panels found");

        uint totalPower = 0;

        for (uint i = 0; i < panels.length; i++) {
            totalPower += panels[i].acPower;
        }

        require(totalPower > 0, "No power output");

        uint rewardAmount = totalPower; // 1W = 1 token，可换成更复杂的公式
        hasClaimed[msg.sender] = true;

        require(rewardToken.transfer(msg.sender, rewardAmount), "Token transfer failed");

        emit RewardClaimed(msg.sender, totalPower, rewardAmount);
    }

    // 🔧 后备方法：合约充值（owner 发送奖励池）
    function deposit(uint amount) public onlyOwner {
        require(rewardToken.transferFrom(msg.sender, address(this), amount), "Deposit failed");
    }

    // 🔍 查询我的可领取奖励
    function previewReward() public view returns (uint) {
        if (hasClaimed[msg.sender]) return 0;

        ISolarPanels.Panel[] memory panels = solarPanelContract.getMyPanels();
        uint totalPower = 0;
        for (uint i = 0; i < panels.length; i++) {
            totalPower += panels[i].acPower;
        }
        return totalPower;
    }
}

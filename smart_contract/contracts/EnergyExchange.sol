// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

interface ISolarToken {
    function transfer(address to, uint256 amount) external returns (bool);
    function burnFrom(address account, uint256 amount) external;
}

contract EnergyExchange is Ownable {
    ISolarToken public rewardToken;

    uint256 public globalSupplyEnergy;
    uint256 public totalDemandEnergy;
    uint256 public simulatorStepSeconds;
    uint256 public lastMarketStepAt;

    mapping(address => uint256) public personalRewardWei;
    mapping(address => uint256) public lastClaimedAt;
    mapping(uint256 => uint256) public factoryEnergyBalance;

    event MarketStepUpdated(uint256 supplyAdded, uint256 totalDemand, uint256 timestamp);
    event PersonalRewardAdded(address indexed user, uint256 amountWei);
    event PersonalRewardClaimed(address indexed user, uint256 amountWei);
    event EnergyPurchased(address indexed buyer, uint256 factoryId, uint256 energyAmount, uint256 costWei);
    event FactoryEnergyConsumed(uint256 factoryId, uint256 amount);

    constructor(address _rewardToken) Ownable(msg.sender) {
        rewardToken = ISolarToken(_rewardToken);
        simulatorStepSeconds = 3600;
    }

    function updateMarketStep(
        address[] calldata users,
        uint256[] calldata userEnergy,
        uint256 totalEnergy,
        uint256 demandEnergy
    ) external onlyOwner {
        require(users.length == userEnergy.length, "Length mismatch");

        for (uint256 i = 0; i < users.length; i++) {
            uint256 rewardEnergy = (userEnergy[i] * 25) / 100;
            uint256 rewardWei = (rewardEnergy * 1e18) / 100_000;
            if (rewardWei > 0) {
                personalRewardWei[users[i]] += rewardWei;
                emit PersonalRewardAdded(users[i], rewardWei);
            }
        }

        uint256 supplyEnergy = (totalEnergy * 75) / 100;
        if (supplyEnergy > 0) {
            globalSupplyEnergy += supplyEnergy;
        }

        totalDemandEnergy = demandEnergy;
        lastMarketStepAt = block.timestamp;
        emit MarketStepUpdated(supplyEnergy, demandEnergy, block.timestamp);
    }

    function setSimulatorStepSeconds(uint256 stepSeconds) external onlyOwner {
        require(stepSeconds > 0, "Step must be > 0");
        simulatorStepSeconds = stepSeconds;
    }

    function claimPersonalReward() external {
        require(
            block.timestamp - lastClaimedAt[msg.sender] >= simulatorStepSeconds,
            "Claim cooldown active"
        );
        uint256 amount = personalRewardWei[msg.sender];
        require(amount > 0, "No reward to claim");

        personalRewardWei[msg.sender] = 0;
        lastClaimedAt[msg.sender] = block.timestamp;
        require(rewardToken.transfer(msg.sender, amount), "Token transfer failed");

        emit PersonalRewardClaimed(msg.sender, amount);
    }

    function previewPersonalReward(address user) external view returns (uint256) {
        if (block.timestamp - lastClaimedAt[user] < simulatorStepSeconds) return 0;
        return personalRewardWei[user];
    }

    function buyEnergyForFactory(uint256 factoryId, uint256 energyAmount) external {
        require(energyAmount > 0, "Energy amount required");
        require(globalSupplyEnergy >= energyAmount, "Insufficient supply");

        uint256 costWei = (energyAmount * 1e18) / 100_000;
        require(costWei > 0, "Cost too small");

        rewardToken.burnFrom(msg.sender, costWei);
        globalSupplyEnergy -= energyAmount;
        factoryEnergyBalance[factoryId] += energyAmount;

        emit EnergyPurchased(msg.sender, factoryId, energyAmount, costWei);
    }

    function consumeFactoryEnergy(uint256 factoryId, uint256 energyAmount) external onlyOwner {
        require(factoryEnergyBalance[factoryId] >= energyAmount, "Insufficient factory energy");
        factoryEnergyBalance[factoryId] -= energyAmount;
        emit FactoryEnergyConsumed(factoryId, energyAmount);
    }

    function previewCost(uint256 energyAmount) external pure returns (uint256) {
        return (energyAmount * 1e18) / 100_000;
    }
}

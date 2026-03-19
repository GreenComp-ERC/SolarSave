// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

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
    function getPanelsOf(address user) external view returns (Panel[] memory); // ✅ Add function declaration
}

contract PowerReward {
    IERC20 public rewardToken;
    ISolarPanels public solarPanelContract;
    address public owner;
    uint256 public simulatorStepSeconds;

    mapping(address => uint256) public lastClaimedAt;

    event RewardClaimed(
        address indexed user,
        uint256 totalDCPower,
        uint256 totalACPower,
        uint256 rewardAmount,
        uint256 timestamp
    );

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    constructor(address _rewardToken, address _solarPanelContract) {
        rewardToken = IERC20(_rewardToken);
        solarPanelContract = ISolarPanels(_solarPanelContract);
        owner = msg.sender;
        simulatorStepSeconds = 3600;
    }

    function setSimulatorStepSeconds(uint256 stepSeconds) external onlyOwner {
        require(stepSeconds > 0, "Step must be > 0");
        simulatorStepSeconds = stepSeconds;
    }

    function claimReward() external {
        require(
            block.timestamp - lastClaimedAt[msg.sender] >= simulatorStepSeconds,
            "Claim cooldown active"
        );

        // ✅ Change here: use getPanelsOf(msg.sender) instead of getMyPanels()
        ISolarPanels.Panel[] memory panels = solarPanelContract.getPanelsOf(msg.sender);
        require(panels.length > 0, "No panels found");

        uint256 totalDC = 0;
        uint256 totalAC = 0;

        for (uint256 i = 0; i < panels.length; i++) {
            totalDC += panels[i].dcPower;
            totalAC += panels[i].acPower;
        }

        require(totalDC > 0, "No DC power to claim");

        uint256 rewardAmount = (totalDC * 1e18) / 100_000;

        require(rewardAmount > 0, "Reward too small");

        lastClaimedAt[msg.sender] = block.timestamp;
        require(rewardToken.transfer(msg.sender, rewardAmount), "Token transfer failed");

        emit RewardClaimed(msg.sender, totalDC, totalAC, rewardAmount, block.timestamp);
    }


    function deposit(uint256 amount) external onlyOwner {
        require(
            rewardToken.transferFrom(msg.sender, address(this), amount),
            "Deposit failed"
        );
    }

    // ✅ Use user address to fetch panels
    function previewReward(address user) external view returns (uint256 estimatedReward) {
        if (block.timestamp - lastClaimedAt[user] < simulatorStepSeconds) return 0;

        ISolarPanels.Panel[] memory panels = solarPanelContract.getPanelsOf(user);
        uint256 totalDC = 0;

        for (uint256 i = 0; i < panels.length; i++) {
            totalDC += panels[i].dcPower;
        }

        return (totalDC * 1e18) / 100_000;

    }
}

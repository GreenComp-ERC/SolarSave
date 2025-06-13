// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract SolarPanels {
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

    address public shopContract; // ✅ 添加授权合约地址

    uint256 public panelCount = 0;
    mapping(uint256 => Panel) public panels;
    mapping(address => uint256[]) public ownerPanels;

    event PanelCreated(
        uint256 indexed panelId,
        address indexed owner,
        uint256 latitude,
        uint256 longitude,
        uint256 batteryTemperature,
        uint256 dcPower,
        uint256 acPower,
        uint256 createdAt
    );

    event PanelUpdated(
        uint256 indexed panelId,
        uint256 batteryTemperature,
        uint256 dcPower,
        uint256 acPower
    );

    event PanelOwnershipTransferred(
        uint256 indexed panelId,
        address indexed from,
        address indexed to
    );

    // ✅ 一次性设置 Shop 合约地址
    function setShopContract(address _shop) external {
        require(shopContract == address(0), "Shop contract already set");
        require(_shop != address(0), "Invalid shop address");
        shopContract = _shop;
    }

    // ✅ 新增权限控制修饰符
    modifier onlyOwnerOrShop(uint256 _panelId) {
        require(
            panels[_panelId].owner == msg.sender || msg.sender == shopContract,
            "Not authorized to transfer this panel"
        );
        _;
    }

    modifier onlyOwner(uint256 _panelId) {
        require(panels[_panelId].owner == msg.sender, "Not the owner of this panel");
        _;
    }

    function createPanel(
        uint256 _latitude,
        uint256 _longitude,
        uint256 _batteryTemperature,
        uint256 _dcPower,
        uint256 _acPower
    ) public {
        panelCount++;
        panels[panelCount] = Panel({
            id: panelCount,
            owner: msg.sender,
            latitude: _latitude,
            longitude: _longitude,
            batteryTemperature: _batteryTemperature,
            dcPower: _dcPower,
            acPower: _acPower,
            createdAt: block.timestamp,
            exists: true
        });

        ownerPanels[msg.sender].push(panelCount);

        emit PanelCreated(
            panelCount,
            msg.sender,
            _latitude,
            _longitude,
            _batteryTemperature,
            _dcPower,
            _acPower,
            block.timestamp
        );
    }

    function updatePanel(
        uint256 _panelId,
        uint256 _batteryTemperature,
        uint256 _dcPower,
        uint256 _acPower
    ) public onlyOwner(_panelId) {
        require(panels[_panelId].exists, "Panel does not exist");

        panels[_panelId].batteryTemperature = _batteryTemperature;
        panels[_panelId].dcPower = _dcPower;
        panels[_panelId].acPower = _acPower;

        emit PanelUpdated(_panelId, _batteryTemperature, _dcPower, _acPower);
    }

    // ✅ 修改：允许面板原 owner 或 shop 合约调用
    function transferPanelOwnership(uint256 _panelId, address _newOwner) public onlyOwnerOrShop(_panelId) {
        require(panels[_panelId].exists, "Panel does not exist");
        require(_newOwner != address(0), "New owner cannot be zero address");

        address currentOwner = panels[_panelId].owner;

        // Remove panel from current owner's list
        uint256[] storage senderPanels = ownerPanels[currentOwner];
        for (uint256 i = 0; i < senderPanels.length; i++) {
            if (senderPanels[i] == _panelId) {
                senderPanels[i] = senderPanels[senderPanels.length - 1];
                senderPanels.pop();
                break;
            }
        }

        // Transfer ownership
        panels[_panelId].owner = _newOwner;
        ownerPanels[_newOwner].push(_panelId);

        emit PanelOwnershipTransferred(_panelId, currentOwner, _newOwner);
    }

    function getPanel(uint256 _panelId) public view returns (
        address owner,
        uint256 latitude,
        uint256 longitude,
        uint256 batteryTemperature,
        uint256 dcPower,
        uint256 acPower,
        uint256 createdAt
    ) {
        require(panels[_panelId].exists, "Panel does not exist");

        Panel memory panel = panels[_panelId];
        return (
            panel.owner,
            panel.latitude,
            panel.longitude,
            panel.batteryTemperature,
            panel.dcPower,
            panel.acPower,
            panel.createdAt
        );
    }

    function getAllPanels() public view returns (Panel[] memory) {
        Panel[] memory allPanels = new Panel[](panelCount);
        for (uint256 i = 1; i <= panelCount; i++) {
            allPanels[i - 1] = panels[i];
        }
        return allPanels;
    }

    function getMyPanels() public view returns (Panel[] memory) {
        uint256[] memory myPanelIds = ownerPanels[msg.sender];
        Panel[] memory myPanels = new Panel[](myPanelIds.length);
        for (uint256 i = 0; i < myPanelIds.length; i++) {
            myPanels[i] = panels[myPanelIds[i]];
        }
        return myPanels;
    }
    function getPanelsOf(address user) public view returns (Panel[] memory) {
    uint256[] memory ids = ownerPanels[user];
    Panel[] memory result = new Panel[](ids.length);
    for (uint256 i = 0; i < ids.length; i++) {
        result[i] = panels[ids[i]];
    }
    return result;
}

}

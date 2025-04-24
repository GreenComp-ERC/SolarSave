// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

// 接入 SolarPanels 合约接口
interface ISolarPanels {
    function transferPanelOwnership(uint panelId, address newOwner) external;
    function getPanel(uint panelId) external view returns (
        address owner,
        uint latitude,
        uint longitude,
        uint batteryTemperature,
        uint dcPower,
        uint acPower,
        uint createdAt
    );
}

contract Shop {
    address public owner;
    uint public itemCount = 0;
    IERC20 public token; // 绑定 ERC20 代币
    ISolarPanels public solarPanelContract; // 外部 SolarPanels 合约

    struct Item {
        uint id;
        string name;
        uint price;
        address seller;
        bool purchased;
        uint latitude;
        uint longitude;
        uint batteryTemperature;
        uint dcPower;
        uint acPower;
        uint createdAt;
        uint panelId; // 新增：对应的太阳能板 ID
    }

    struct Purchase {
        uint itemId;
        address buyer;
        uint price;
        uint timestamp;
    }

    mapping(uint => Item) public items;
    mapping(address => Purchase[]) public purchaseHistory;

    event ItemListed(uint id, string name, uint price, address seller);
    event ItemPurchased(uint id, address buyer, uint price);

    modifier onlyOwner() {
        require(msg.sender == owner, "Not the contract owner");
        _;
    }

    modifier itemExists(uint _id) {
        require(_id > 0 && _id <= itemCount, "Item does not exist");
        _;
    }

    constructor(address _tokenAddress, address _solarPanelAddress) {
        require(_tokenAddress != address(0), "Invalid token address");
        require(_solarPanelAddress != address(0), "Invalid solar panel contract");
        owner = msg.sender;
        token = IERC20(_tokenAddress);
        solarPanelContract = ISolarPanels(_solarPanelAddress);
    }

    // 上架商品，并关联面板 ID
    function listItem(
        string memory _name,
        uint _price,
        uint _latitude,
        uint _longitude,
        uint _batteryTemperature,
        uint _dcPower,
        uint _acPower,
        uint _createdAt,
        uint _panelId // 新增参数
    ) public {
        require(_price > 0, "Price must be greater than zero");

        // 校验 seller 拥有该面板
        (address panelOwner,,,,,,) = solarPanelContract.getPanel(_panelId);
        require(panelOwner == msg.sender, "You do not own this panel");

        itemCount++;
        items[itemCount] = Item(
            itemCount,
            _name,
            _price,
            msg.sender,
            false,
            _latitude,
            _longitude,
            _batteryTemperature,
            _dcPower,
            _acPower,
            _createdAt,
            _panelId
        );

        emit ItemListed(itemCount, _name, _price, msg.sender);
    }

    // 购买并转移面板所有权
    function buyItem(uint _id) public itemExists(_id) {
        Item storage item = items[_id];
        require(!item.purchased, "Item already sold");
        require(token.balanceOf(msg.sender) >= item.price, "Insufficient token balance");
        require(token.allowance(msg.sender, address(this)) >= item.price, "Allowance too low");

        // 校验 panel 仍属于 seller
        (address panelOwner,,,,,,) = solarPanelContract.getPanel(item.panelId);
        require(panelOwner == item.seller, "Seller no longer owns the panel");

        require(token.transferFrom(msg.sender, item.seller, item.price), "Token transfer failed");

        // 转移所有权
        solarPanelContract.transferPanelOwnership(item.panelId, msg.sender);

        item.purchased = true;

        purchaseHistory[msg.sender].push(Purchase(_id, msg.sender, item.price, block.timestamp));

        emit ItemPurchased(_id, msg.sender, item.price);
    }

    function getItem(uint _id) public view itemExists(_id) returns (Item memory) {
        return items[_id];
    }

    function getPanelInfo(uint _id)
        public
        view
        itemExists(_id)
        returns (uint latitude, uint longitude, uint batteryTemperature, uint dcPower, uint acPower, uint createdAt)
    {
        Item memory item = items[_id];
        return (item.latitude, item.longitude, item.batteryTemperature, item.dcPower, item.acPower, item.createdAt);
    }

    function getPurchaseHistory(address _buyer) public view returns (Purchase[] memory) {
        return purchaseHistory[_buyer];
    }
}

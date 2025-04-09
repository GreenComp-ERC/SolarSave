// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract Shop {
    address public owner;
    uint public itemCount = 0;
    IERC20 public token; // 绑定 ERC20 代币

    struct Item {
        uint id;
        string name;
        uint price; // 价格以 ERC20 代币单位计价
        address seller;
        bool purchased;
        uint latitude;       // 📍 纬度
        uint longitude;      // 📍 经度
        uint batteryTemperature; // 🔥 电池温度
        uint dcPower;        // ⚡ 直流功率
        uint acPower;        // 🔌 交流功率
        uint createdAt;      // 📅 创建时间
    }

    struct Purchase {
        uint itemId;
        address buyer;
        uint price;
        uint timestamp;
    }

    mapping(uint => Item) public items;
    mapping(address => Purchase[]) public purchaseHistory; // 记录每个用户的购买历史

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

    constructor(address _tokenAddress) {
        require(_tokenAddress != address(0), "Invalid token address");
        owner = msg.sender;
        token = IERC20(_tokenAddress);
    }

    // 🛒 上架商品，同时存储太阳能板信息
    function listItem(
        string memory _name,
        uint _price,
        uint _latitude,
        uint _longitude,
        uint _batteryTemperature,
        uint _dcPower,
        uint _acPower,
        uint _createdAt
    ) public {
        require(_price > 0, "Price must be greater than zero");

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
            _createdAt
        );

        emit ItemListed(itemCount, _name, _price, msg.sender);
    }

    // 🏦 通过 ERC20 代币购买商品
    function buyItem(uint _id) public itemExists(_id) {
        Item storage item = items[_id];
        require(!item.purchased, "Item already sold");
        require(token.balanceOf(msg.sender) >= item.price, "Insufficient token balance");
        require(token.allowance(msg.sender, address(this)) >= item.price, "Allowance too low");

        // 🔄 交易逻辑
        require(token.transferFrom(msg.sender, item.seller, item.price), "Token transfer failed");

        item.purchased = true;

        // 📜 记录购买历史
        purchaseHistory[msg.sender].push(Purchase(_id, msg.sender, item.price, block.timestamp));

        emit ItemPurchased(_id, msg.sender, item.price);
    }

    // 🔍 获取商品信息
    function getItem(uint _id) public view itemExists(_id) returns (Item memory) {
        return items[_id];
    }

    // 🔍 获取太阳能板详细信息
    function getPanelInfo(uint _id)
        public
        view
        itemExists(_id)
        returns (uint latitude, uint longitude, uint batteryTemperature, uint dcPower, uint acPower, uint createdAt)
    {
        Item memory item = items[_id];
        return (item.latitude, item.longitude, item.batteryTemperature, item.dcPower, item.acPower, item.createdAt);
    }

    // 🔍 获取用户购买历史
    function getPurchaseHistory(address _buyer) public view returns (Purchase[] memory) {
        return purchaseHistory[_buyer];
    }
}

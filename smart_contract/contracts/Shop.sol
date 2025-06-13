// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

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
    IERC20 public token;
    ISolarPanels public solarPanelContract;

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
        uint panelId;
    }

    struct Purchase {
        uint itemId;
        address buyer;
        uint price;
        uint timestamp;
    }

    mapping(uint => Item) public items;
    mapping(address => Purchase[]) public purchaseHistory;
    mapping(uint => address[]) public pendingBuyers;
    mapping(uint => mapping(address => bool)) public hasOffered;

    event ItemListed(uint id, string name, uint price, address seller);
    event OfferPlaced(uint id, address buyer);
    event ItemSold(uint id, address buyer);

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

    function listItem(
        string memory _name,
        uint _price,
        uint _latitude,
        uint _longitude,
        uint _batteryTemperature,
        uint _dcPower,
        uint _acPower,
        uint _createdAt,
        uint _panelId
    ) public {
        require(_price > 0, "Price must be greater than zero");
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

    function offerToBuy(uint _id) public itemExists(_id) {
        Item storage item = items[_id];
        require(!item.purchased, "Item already sold");
        require(token.balanceOf(msg.sender) >= item.price, "Insufficient token balance");
        require(token.allowance(msg.sender, address(this)) >= item.price, "Allowance too low");
        require(!hasOffered[_id][msg.sender], "Already offered");

        hasOffered[_id][msg.sender] = true;
        pendingBuyers[_id].push(msg.sender);

        emit OfferPlaced(_id, msg.sender);
    }

    function approveSale(uint _id, address buyer) public itemExists(_id) {
        Item storage item = items[_id];
        require(item.seller == msg.sender, "Not the seller");
        require(hasOffered[_id][buyer], "Buyer has not offered");
        require(!item.purchased, "Item already sold");

        require(token.transferFrom(buyer, item.seller, item.price), "Token transfer failed");
        solarPanelContract.transferPanelOwnership(item.panelId, buyer);

        item.purchased = true;
        purchaseHistory[buyer].push(Purchase(_id, buyer, item.price, block.timestamp));

        emit ItemSold(_id, buyer);
    }

    function getItem(uint _id) public view itemExists(_id) returns (Item memory) {
        return items[_id];
    }

    function getPanelInfo(uint _id) public view itemExists(_id)
        returns (uint, uint, uint, uint, uint, uint) {
        Item memory item = items[_id];
        return (item.latitude, item.longitude, item.batteryTemperature, item.dcPower, item.acPower, item.createdAt);
    }

    function getPurchaseHistory(address _buyer) public view returns (Purchase[] memory) {
        return purchaseHistory[_buyer];
    }

    function getPendingBuyers(uint _id) public view returns (address[] memory) {
        return pendingBuyers[_id];
    }

    function hasUserOffered(uint _id, address user) public view returns (bool) {
        return hasOffered[_id][user];
    }

}

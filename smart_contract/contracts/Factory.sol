// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract FactoryRegistry {
    struct Factory {
        uint256 id;
        address owner;
        uint256 latitude;
        uint256 longitude;
        uint256 powerConsumption;
        uint256 createdAt;
        bool exists;
    }

    uint256 public factoryCount = 0;
    mapping(uint256 => Factory) public factories;
    mapping(address => uint256[]) public ownerFactories;

    event FactoryCreated(
        uint256 indexed factoryId,
        address indexed owner,
        uint256 latitude,
        uint256 longitude,
        uint256 powerConsumption,
        uint256 createdAt
    );

    function createFactory(
        uint256 _latitude,
        uint256 _longitude,
        uint256 _powerConsumption
    ) external {
        factoryCount++;
        factories[factoryCount] = Factory({
            id: factoryCount,
            owner: msg.sender,
            latitude: _latitude,
            longitude: _longitude,
            powerConsumption: _powerConsumption,
            createdAt: block.timestamp,
            exists: true
        });

        ownerFactories[msg.sender].push(factoryCount);

        emit FactoryCreated(
            factoryCount,
            msg.sender,
            _latitude,
            _longitude,
            _powerConsumption,
            block.timestamp
        );
    }

    function getFactory(uint256 _factoryId)
        external
        view
        returns (
            address owner,
            uint256 latitude,
            uint256 longitude,
            uint256 powerConsumption,
            uint256 createdAt
        )
    {
        require(factories[_factoryId].exists, "Factory does not exist");
        Factory memory factory = factories[_factoryId];
        return (
            factory.owner,
            factory.latitude,
            factory.longitude,
            factory.powerConsumption,
            factory.createdAt
        );
    }

    function getFactoriesOf(address user) external view returns (Factory[] memory) {
        uint256[] memory ids = ownerFactories[user];
        Factory[] memory result = new Factory[](ids.length);
        for (uint256 i = 0; i < ids.length; i++) {
            result[i] = factories[ids[i]];
        }
        return result;
    }

    function getAllFactories() external view returns (Factory[] memory) {
        Factory[] memory allFactories = new Factory[](factoryCount);
        for (uint256 i = 1; i <= factoryCount; i++) {
            allFactories[i - 1] = factories[i];
        }
        return allFactories;
    }
}

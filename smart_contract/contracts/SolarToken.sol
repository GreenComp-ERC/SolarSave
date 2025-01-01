// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract SolarToken is ERC20, Ownable {
    // 构造函数：初始化代币名称、符号和总供应量
    constructor(uint256 initialSupply) ERC20("SolarToken", "SQC") {
        _mint(msg.sender, initialSupply); // 将初始供应量分配给合约部署者
    }

    // 铸造新代币，仅允许合约所有者调用
    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }

    // 销毁代币，仅允许合约所有者调用
    function burn(address from, uint256 amount) external onlyOwner {
        _burn(from, amount);
    }
}

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract SolarToken is ERC20, Ownable {
    uint256 public cap = 100000000 * 10 ** 18; // 1 亿 SOLR 作为总量上限

    constructor() ERC20("SolarToken", "SOLR") Ownable(msg.sender) {
        _mint(msg.sender, 1000000 * 10 ** 18); // 100 万 SOLR 初始供应
    }

    // 仅限合约拥有者（管理员）可以铸造新的 SOLR
    function mint(address to, uint256 amount) external onlyOwner {
        require(totalSupply() + amount <= cap, "over limit");
        _mint(to, amount);
    }

    // 允许销毁 SOLR 代币
    function burn(uint256 amount) external {
        _burn(msg.sender, amount);
    }
}

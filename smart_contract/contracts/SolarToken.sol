// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract SolarToken is ERC20, Ownable {
    uint256 public cap = 100000000 * 10 ** 18; // 100 million SOLR as the total supply cap

    constructor() ERC20("SolarToken", "SOLR") Ownable(msg.sender) {
        _mint(msg.sender, 1000000 * 10 ** 18); // 1 million SOLR initial supply
    }

    // Only the contract owner (admin) can mint new SOLR
    function mint(address to, uint256 amount) external onlyOwner {
        require(totalSupply() + amount <= cap, "over limit");
        _mint(to, amount);
    }

    // Allow burning SOLR tokens
    function burn(uint256 amount) external {
        _burn(msg.sender, amount);
    }
}

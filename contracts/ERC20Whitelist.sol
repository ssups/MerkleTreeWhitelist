// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity 0.8.20;

import "./MerkleTreeWhitelist.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract ERC20Whitelist is MerkleTreeWhitelist, ERC20 {
    uint public constant WHITELIST_MINT_AMOUNT = 10_000 ether; 
    mapping(address => uint) public isMinted;

    constructor(bytes32 _rootHash, string memory name, string memory symbol) MerkleTreeWhitelist(_rootHash) ERC20(name, symbol) {}

    modifier onlyFirstMinter() {
        require(isMinted[msg.sender] == 0, "Already Minted");
        _;
    }

    function whitelistMint(bytes32[] calldata proof) external onlyWhitelisted(proof) onlyFirstMinter {
        isMinted[msg.sender] = 1;
        _mint(msg.sender, WHITELIST_MINT_AMOUNT);
    }
}
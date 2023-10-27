// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity 0.8.20;

import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";


contract MerkleTreeWhitelist {
    bytes32 public rootHash;

    constructor(bytes32 _rootHash) {
        rootHash = _rootHash;
    }

    modifier onlyWhitelisted(bytes32[] calldata proof) {
        require(isWhitelisted(proof, msg.sender), "MerkleTreeWhitelist: Not Whitelisted");
        _;
    }

    function isWhitelisted(bytes32[] calldata proof, address addr) public view returns (bool) {
        return MerkleProof.verify(proof, rootHash, keccak256(abi.encodePacked(addr)));
    }
}

import { ethers } from "hardhat";
import keccak256 = require("keccak256");
import MerkleTree from "merkletreejs";
import fs from "fs";

const WALLETS_AMOUNT = 100;

async function main() {
  const wallets = [];

  for (let i = 0; i < WALLETS_AMOUNT; i++) {
    const wallet = ethers.Wallet.createRandom();
    wallets.push(wallet);
  }

  const leaves = wallets.map((wallet) => keccak256(wallet.address));
  const tree = new MerkleTree(leaves, keccak256, { sortPairs: true });
  const rootHash = "0x" + tree.getRoot().toString("hex");

  const whitelist = wallets.map((wallet) => {
    const address = wallet.address;
    const leaf = "0x" + keccak256(wallet.address).toString("hex");
    const proof = tree.getProof(leaf).map((proof) => "0x" + proof.data.toString("hex"));
    return {
      address,
      leaf,
      proof,
    };
  });

  const saveData = JSON.stringify({ rootHash, whitelist }, null, 2);
  fs.writeFileSync("whitelist.json", saveData);
}

main().catch((err) => {
  console.log(err);
  process.exitCode = 1;
});

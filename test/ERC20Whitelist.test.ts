import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import keccak256 from "keccak256";
import MerkleTree from "merkletreejs";
import { ERC20Whitelist, ERC20Whitelist__factory } from "../typechain-types";
import { expect } from "chai";

type Whitelist = {
  wallet: SignerWithAddress;
  address: string;
  leaf: string;
  proof: string[];
}[];

describe("ERC20-Whitelist", () => {
  let rootHash: string;
  let whitelistedWallets: SignerWithAddress[];
  let nonWhiteListedWallets: SignerWithAddress[];
  let whitelist: Whitelist;
  let nonWhitelist: Whitelist;
  let erc20Whitelist: ERC20Whitelist;

  before("Divde Wallets", async () => {
    const signers = await ethers.getSigners();
    whitelistedWallets = signers.splice(0, Math.ceil(signers.length / 2));
    nonWhiteListedWallets = [...signers];
  });

  before("Make Whitelist Wallets", async () => {
    const leaves = whitelistedWallets.map((wallet) => keccak256(wallet.address));
    const tree = new MerkleTree(leaves, keccak256, { sortPairs: true });
    rootHash = "0x" + tree.getRoot().toString("hex");

    whitelist = whitelistedWallets.map((wallet) => {
      const address = wallet.address;
      const leaf = "0x" + keccak256(wallet.address).toString("hex");
      const proof = tree.getProof(leaf).map((proof) => "0x" + proof.data.toString("hex"));
      return {
        wallet,
        address,
        leaf,
        proof,
      };
    });
  });

  before("Make Non-Whitelist Wallets", async () => {
    const leaves = nonWhiteListedWallets.map((wallet) => keccak256(wallet.address));
    const tree = new MerkleTree(leaves, keccak256, { sortPairs: true });

    nonWhitelist = nonWhiteListedWallets.map((wallet) => {
      const address = wallet.address;
      const leaf = "0x" + keccak256(wallet.address).toString("hex");
      const proof = tree.getProof(leaf).map((proof) => "0x" + proof.data.toString("hex"));
      return {
        wallet,
        address,
        leaf,
        proof,
      };
    });
  });

  before("Deploy ERC20Whitelist", async () => {
    const factory = await ethers.getContractFactory("ERC20Whitelist");
    erc20Whitelist = await factory.deploy(rootHash, "WhiteListToken", "WLT");
    await erc20Whitelist.deployed();
  });

  it("Is Whitelist", async () => {
    for (const info of whitelist) {
      expect(await erc20Whitelist.isWhitelisted(info.proof, info.address)).to.be.eq(true);
    }

    for (const info of nonWhitelist) {
      expect(await erc20Whitelist.isWhitelisted(info.proof, info.address)).to.be.eq(false);
    }
  });

  it("Whitelisted Wallets Mint", async () => {
    const whitelistMintAmount = await erc20Whitelist.WHITELIST_MINT_AMOUNT();

    for (const info of whitelist) {
      expect(await erc20Whitelist.balanceOf(info.address)).to.be.eq(ethers.BigNumber.from(0));
      await expect(erc20Whitelist.connect(info.wallet).whitelistMint(info.proof)).emit(
        erc20Whitelist,
        "Transfer"
      );
      expect(await erc20Whitelist.balanceOf(info.address)).to.be.eq(whitelistMintAmount);
    }
  });

  it("NonWhitelisted Wallets Try Mint", async () => {
    for (const info of nonWhitelist) {
      await expect(
        erc20Whitelist.connect(info.wallet).whitelistMint(info.proof)
      ).to.be.revertedWith("MerkleTreeWhitelist: Not Whitelisted");
    }
  });
});

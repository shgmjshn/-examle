import { expect } from "chai";
import { ethers } from "hardhat";
import { MerkleTree } from "merkletreejs";
import { keccak256, solidityPacked } from "ethers";

function leafFor(address: string, amount: number) {
  return keccak256(solidityPacked(["address", "uint256"], [address, amount]));
}

describe("KomlockMerkleNFT", function () {
  it("claim success, prevents double claim, and returns fixed tokenURI", async function () {
    const [alice, bob, carol] = await ethers.getSigners();

    const entries = [
      { address: await alice.getAddress(), amount: 2 },
      { address: await bob.getAddress(), amount: 1 },
    ];
    const leaves = entries.map((e) => leafFor(e.address, e.amount));
    const tree = new MerkleTree(leaves, keccak256, { sortPairs: true });
    const root = tree.getHexRoot();

    const Factory = await ethers.getContractFactory("KomlockMerkleNFT");
    const metadata = "ipfs://QmExampleMetadataHash/metadata.json";
    const contract = await Factory.deploy("Komlock Lab NFT", "KOM", metadata, root);
    await contract.waitForDeployment();

    // Alice valid claim (2 mints)
    const aliceLeaf = leafFor(await alice.getAddress(), 2);
    const aliceProof = tree.getHexProof(aliceLeaf);
    await expect(contract.connect(alice).claim(2, aliceProof))
      .to.emit(contract, "Claimed")
      .withArgs(await alice.getAddress(), 2, 1);

    expect(await contract.balanceOf(await alice.getAddress())).to.equal(2n);
    // tokenURI is fixed for all tokens
    expect(await contract.tokenURI(1)).to.equal(metadata);
    expect(await contract.tokenURI(2)).to.equal(metadata);

    // Double claim should revert
    await expect(contract.connect(alice).claim(2, aliceProof)).to.be.revertedWith("Already claimed");

    // Bob with wrong amount should fail (proof does not match amount)
    const wrongLeaf = leafFor(await bob.getAddress(), 2);
    const wrongProof = tree.getHexProof(wrongLeaf);
    await expect(contract.connect(bob).claim(2, wrongProof)).to.be.revertedWith("Invalid proof");

    // Bob with correct proof works
    const bobLeaf = leafFor(await bob.getAddress(), 1);
    const bobProof = tree.getHexProof(bobLeaf);
    await contract.connect(bob).claim(1, bobProof);
    expect(await contract.balanceOf(await bob.getAddress())).to.equal(1n);

    // Carol not in list should fail
    const carolLeaf = leafFor(await carol.getAddress(), 1);
    const carolProof = tree.getHexProof(carolLeaf);
    await expect(contract.connect(carol).claim(1, carolProof)).to.be.revertedWith("Invalid proof");
  });
});



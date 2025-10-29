import { readFileSync, mkdirSync, writeFileSync } from "fs";
import path from "path";
import { MerkleTree } from "merkletreejs";
import { keccak256, solidityPacked } from "ethers";

type Entry = { address: string; amount: number };

const rootDir = path.join(__dirname, "..");
const inputPath = path.join(rootDir, "data", "whitelist.json");
const outputDir = path.join(rootDir, "generated");

const entries: Entry[] = JSON.parse(readFileSync(inputPath, "utf8"));

if (!Array.isArray(entries) || entries.length === 0) {
  throw new Error("data/whitelist.json が空です。アドレスとamountを入力してください。");
}

const leaves = entries.map(({ address, amount }) =>
  keccak256(solidityPacked(["address", "uint256"], [address, amount]))
);

const tree = new MerkleTree(leaves, keccak256, { sortPairs: true });
const root = tree.getHexRoot();

mkdirSync(outputDir, { recursive: true });
writeFileSync(path.join(outputDir, "merkle-root.json"), JSON.stringify({ merkleRoot: root }, null, 2));

const proofs: Record<string, { amount: number; proof: string[] }> = {};
for (const { address, amount } of entries) {
  const leaf = keccak256(solidityPacked(["address", "uint256"], [address, amount]));
  proofs[address.toLowerCase()] = { amount, proof: tree.getHexProof(leaf) };
}
writeFileSync(path.join(outputDir, "proofs.json"), JSON.stringify(proofs, null, 2));

console.log("Merkle root:", root);


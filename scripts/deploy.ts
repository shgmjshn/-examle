import { ethers } from "hardhat";
import "dotenv/config";

async function main() {
  const name = "Sample NFT";
  const symbol = "NFT";
  const metadataURI = process.env.NFT_METADATA_URL || "";

  if (!metadataURI) throw new Error("NFT_METADATA_URL が未設定です");

  // 生成済みの merkle-root.json を読み込み
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { merkleRoot } = require("../generated/merkle-root.json");
  if (!merkleRoot) throw new Error("generated/merkle-root.json が見つかりません");

  const Factory = await ethers.getContractFactory("MerkleNFT");
  const contract = await Factory.deploy(name, symbol, metadataURI, merkleRoot);
  await contract.waitForDeployment();

  console.log("Deployed:", await contract.getAddress());
  console.log("MerkleRoot:", await contract.merkleRoot());
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});



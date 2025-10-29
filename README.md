## Komlock Lab: Merkle Tree を利用したNFTクレームシステム

Base Sepolia で動作する Merkle Airdrop 対応 ERC721。`merkleRoot` を保存し、`claim(uint256 amount, bytes32[] proof)` で検証・ミントします。`tokenURI` は全トークン同一の `NFT_METADATA_URL` を返します。

### 要件
- 当選アドレスのみ1回だけ claim 可能（`hasClaimed`で管理）
- `leaf = keccak256(abi.encodePacked(address, amount))` を使用
- MerkleTree は `sortPairs: true` で生成

### 環境変数 (.env)
```
BASE_SEPOLIA_RPC_URL=https://sepolia.base.org
PRIVATE_KEY=0x<あなたの秘密鍵>
NFT_METADATA_URL=https://example.com/metadata.json
```

### セットアップ
```bash
npm install
npx hardhat compile
npx hardhat test
```

### ホワイトリスト → Merkle 生成
`data/whitelist.json` を編集（`address` と `amount`）。
```bash
npm run gen:merkle
# generated/merkle-root.json と generated/proofs.json を出力
```

### デプロイ（Base Sepolia）
```bash
npm run deploy:base-sepolia
```

### コントラクト
- `contracts/KomlockMerkleNFT.sol`
  - `merkleRoot` 保存/更新 (`setMerkleRoot`)
  - `claim(amount, proof)`：検証→一括ミント（1アドレス1回のみ）
  - `tokenURI(tokenId)`：常に `NFT_METADATA_URL` を返す

### 備考
- 生成した `generated/proofs.json` はDAppやスクリプト側で各アドレスの `amount` と `proof` を取り出すために使用できます。
- 本番前に `NFT_METADATA_URL` を最終版へ差し替えてください。



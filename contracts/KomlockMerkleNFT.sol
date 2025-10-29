// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";

contract KomlockMerkleNFT is ERC721, Ownable {
    bytes32 public merkleRoot;
    string private metadataURI;
    uint256 public nextTokenId = 1;
    mapping(address => bool) public hasClaimed;

    event Claimed(address indexed account, uint256 amount, uint256 firstTokenId);
    event MerkleRootUpdated(bytes32 newMerkleRoot);
    event MetadataURIUpdated(string newURI);

    constructor(
        string memory name_,
        string memory symbol_,
        string memory metadataURI_,
        bytes32 merkleRoot_
    ) ERC721(name_, symbol_) Ownable(msg.sender) {
        metadataURI = metadataURI_;
        merkleRoot = merkleRoot_;
    }

    function setMerkleRoot(bytes32 newRoot) external onlyOwner {
        merkleRoot = newRoot;
        emit MerkleRootUpdated(newRoot);
    }

    function setMetadataURI(string calldata newURI) external onlyOwner {
        metadataURI = newURI;
        emit MetadataURIUpdated(newURI);
    }

    function claim(uint256 amount, bytes32[] calldata proof) external {
        require(!hasClaimed[msg.sender], "Already claimed");
        require(amount > 0, "Invalid amount");
        require(merkleRoot != bytes32(0), "Merkle root not set");

        bytes32 leaf = keccak256(abi.encodePacked(msg.sender, amount));
        require(MerkleProof.verify(proof, merkleRoot, leaf), "Invalid proof");

        hasClaimed[msg.sender] = true;

        uint256 firstTokenId = nextTokenId;
        for (uint256 i = 0; i < amount; i++) {
            _safeMint(msg.sender, nextTokenId++);
        }

        emit Claimed(msg.sender, amount, firstTokenId);
    }

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        _requireOwned(tokenId);
        return metadataURI;
    }
}



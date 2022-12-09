// SPDX-License-Identifier: MIT
pragma solidity >=0.7.21 <0.9.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol"; 
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract MyPROP is ERC721, ERC721URIStorage, Ownable {
    using Counters for Counters.Counter;

    Counters.Counter private _tokenIdCounter;

    constructor() ERC721("MyPROP", "PRP") {}

    string uri = "https://gateway.pinata.cloud/ipfs/QmRDnkaHEEV4wk2vNnyK8cHf7iD6tTzH9BfH5x5Ca9sCQC";
    mapping(uint=>string) tokenURIs;

    function safeMint(address to) public payable {
        uint256 tokenId = _tokenIdCounter.current();
        _tokenIdCounter.increment();
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, uri);
        tokenURIs[tokenId] = uri;
    }
    mapping(address => mapping(string=>uint[])) public ownerDetails;

    function safeMint(address to, string memory propertyId) public payable {
        uint256 tokenId = _tokenIdCounter.current();
        _tokenIdCounter.increment();
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, uri);
        tokenURIs[tokenId] = uri;
        ownerDetails[to][propertyId].push(tokenId);
    }

    function transfer(address from, address to, string memory propertyId) public payable{
        uint tknId = ownerDetails[from][propertyId][0];
        require(tknId>0, "Seller doesnt have the corresponding token");
        safeTransferFrom(from, to, tknId);
        ownerDetails[to][propertyId].push(tknId);
        uint[] storage tokens = ownerDetails[from][propertyId];
        for(uint i = 1;i<tokens.length;i++){
            tokens[i]=tokens[i++];
        }
        tokens.pop();
    }


    // The following functions are overrides required by Solidity.
    function _burn(uint256 tokenId) internal override(ERC721, ERC721URIStorage) {
        super._burn(tokenId);
    }

    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return tokenURIs[tokenId];
    }
}

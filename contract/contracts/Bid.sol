// SPDX-License-Identifier: MIT
pragma solidity >=0.7.21 <0.9.0;
contract Bid{
    struct voteDetails {
        mapping (address => bool) userIds;
        uint voteCount;
    }
    mapping(string=>voteDetails) public propertyVoteDetails;

    function vote(string memory propertyId)public returns(bool){
        voteDetails storage vd = propertyVoteDetails[propertyId];
        require(vd.voteCount <5, "Bidding is Over");
        mapping (address => bool) storage userIds = vd.userIds;
        require(!userIds[msg.sender], "User has already voted");
        vd.voteCount++;
        vd.userIds[msg.sender] = true;
        return vd.voteCount>=5;
    }

    function getVoteCount(string memory propertyId)public view returns (uint){
        voteDetails storage vd = propertyVoteDetails[propertyId];
        return vd.voteCount;
    }
}
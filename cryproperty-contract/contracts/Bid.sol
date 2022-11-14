pragma solidity >=0.4.21 <0.7.0;
contract Bid{
    struct voteDetails {
        mapping (address => bool) userIds;
        uint voteCount;
    }
    mapping(string=>voteDetails) public propertyVoteDetails;

    function vote(string memory propertyId)public{
        voteDetails storage vd = propertyVoteDetails[propertyId];
        require(vd.voteCount <5, "Bidding is Over");
        mapping (address => bool) storage userIds = vd.userIds;
        require(!userIds[msg.sender], "User has already voted");
        vd.voteCount++;
        vd.userIds[msg.sender] = true;
        propertyVoteDetails[propertyId] = vd;
    }

    function getVoteCount(string memory propertyId)public view returns (uint){
        voteDetails storage vd = propertyVoteDetails[propertyId];
        return vd.voteCount;
    }
}
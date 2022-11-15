pragma solidity >=0.4.21 <0.7.0;
contract Trade{
    struct trans{
        address buyer;
        address seller;
        uint value;
    }
    mapping (string=>trans[]) propertytransactions;

    function sendMoney(address seller, string memory propertyId) public payable{
        address payable to  = address(uint160(address(seller)));
        address(to).transfer(msg.value);
        trans[] storage transactions = propertytransactions[propertyId];
        trans memory newTrans = trans(msg.sender,seller, msg.value);
        transactions.push(newTrans);
        propertytransactions[propertyId] = transactions;
    }
}
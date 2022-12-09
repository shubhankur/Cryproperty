pragma solidity >=0.7.21 <0.9.0;
contract Trade{
    function sendMoney(address seller) public payable{
        //address payable to  = address(uint160(address(buyer)));
        address payable to = payable(seller);
        to.transfer(msg.value);
    }
}
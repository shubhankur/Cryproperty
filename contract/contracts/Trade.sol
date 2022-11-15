pragma solidity >=0.4.21 <0.7.0;
contract Trade{
    function sendMoney(address buyer) public payable{
        address payable to  = address(uint160(address(buyer)));
        address(to).transfer(msg.value);
    }
}
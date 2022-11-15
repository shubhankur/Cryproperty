pragma solidity >=0.4.21 <0.7.0;
import "./Trade.sol";
contract Trading{
    Trade trade;
    struct request{
        mapping(address=>bool) users;
        address payable[] usersaddress;
        bool exists;
    }
    mapping(string=>request) buyingRequests;
    mapping(string=>request) sellingRequests;

    function buy(address useraddress, string memory propertyId) payable public {
        request storage buyingRequest = buyingRequests[propertyId];
        require(!buyingRequest.users[useraddress], "Buying Request already exists");
        request memory sellingRequest = sellingRequests[propertyId];
        if(sellingRequest.exists){
            address payable seller = sellingRequest.usersaddress[0];
            trade.sendMoney.value(msg.value)(seller);
        }
        else{
            buyingRequest.exists = true;
            buyingRequest.users[useraddress] = true;
            address payable buyer  = address(uint160(address(useraddress)));
            buyingRequest.usersaddress.push(buyer);
        }

    }
    function sell(address useraddress, string memory propertyId) payable public {
        request storage sellingRequest = sellingRequests[propertyId];
        require(!sellingRequest.users[useraddress], "Selling Request already exists");
        request memory buyingRequest = buyingRequests[propertyId];
        if(buyingRequest.exists){
            address payable buyer = buyingRequest.usersaddress[0];
            trade.sendMoney.value(msg.value)(useraddress);
        }
        else{
            sellingRequest.exists = true;
            sellingRequest.users[useraddress] = true;
            address payable seller  = address(uint160(address(useraddress)));
            sellingRequest.usersaddress.push(seller);
        }

    }
}

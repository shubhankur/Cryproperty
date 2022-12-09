// SPDX-License-Identifier: MIT
pragma solidity >=0.7.21 <0.9.0;
import "./Trade.sol";
contract Trading{
    Trade trade;
    struct request{
        mapping(address=>uint) users;
        address[] usersaddress;
        bool exists;
    }
    mapping(string=>request) buyingRequests;
    mapping(string=>request) sellingRequests;

    function buy(string memory propertyId) payable public returns(string memory) {
        request storage buyingRequest = buyingRequests[propertyId];
        require(buyingRequest.users[msg.sender]==0, "Buying Request already exists");
        request storage sellingRequest = sellingRequests[propertyId];
        if(sellingRequest.exists){
            address payable seller = payable(sellingRequest.usersaddress[0]);
            for(uint i = 0;i<sellingRequest.usersaddress.length-1;i++){
                sellingRequest.usersaddress[i]=sellingRequest.usersaddress[i+1];
            }
            sellingRequest.usersaddress.pop();
            sellingRequest.users[seller]--;
            if(sellingRequest.usersaddress.length==0){
                sellingRequest.exists=false;
            }
            trade.sendMoney{value:msg.value}(seller);
            return "Transaction Succesfull";
        }
        else{
            buyingRequest.exists = true;
            buyingRequest.users[msg.sender]++;
            address payable buyer  = payable(msg.sender);
            buyingRequest.usersaddress.push(buyer);
            return "Request Registered";
        }

    }
    function sell(address useraddress, string memory propertyId) payable public returns(address){
        request storage sellingRequest = sellingRequests[propertyId];
        require(sellingRequest.users[useraddress]==0, "Selling Request already exists");
        request storage buyingRequest = buyingRequests[propertyId];
        if(buyingRequest.exists){
            address payable buyer = payable(buyingRequest.usersaddress[0]);
            for(uint i = 0;i<buyingRequest.usersaddress.length-1;i++){
                buyingRequest.usersaddress[i]=buyingRequest.usersaddress[i+1];
            }
            buyingRequest.usersaddress.pop();
            buyingRequest.users[buyer]--;
            if(buyingRequest.usersaddress.length==0){
                buyingRequest.exists=false;
            }
            return buyer;
        }
        else{
            sellingRequest.exists = true;
            sellingRequest.users[useraddress]++;
            address payable seller  = payable(useraddress);
            sellingRequest.usersaddress.push(seller);
            return seller;
        }

    }
}

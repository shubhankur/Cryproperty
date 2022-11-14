var Trade = artifacts.require("Trade");
var Bid = artifacts.require("Bid");

module.exports = function(deployer) {
  deployer.deploy(Trade);
  deployer.deploy(Bid);
};

var Trade = artifacts.require("Trade");
var Bid = artifacts.require("Bid");
var Trading = artifacts.require("Trading");

module.exports = function(deployer) {
  deployer.deploy(Trade);
  deployer.deploy(Bid);
  deployer.deploy(Trading);
};

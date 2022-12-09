var Trade = artifacts.require("Trade");
var Bid = artifacts.require("Bid");
var Trading = artifacts.require("Trading");
var Prop = artifacts.require("MyProp");

module.exports = function(deployer) {
  deployer.deploy(Trade);
  deployer.deploy(Bid);
  deployer.deploy(Trading);
  deployer.deploy(Prop);
};

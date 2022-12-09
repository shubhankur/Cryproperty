const express = require('express');
const app = express();
const alert = require('alert');
const path = require('path');
const mongoose = require('mongoose');
const Property = require('./models/property.js');
const User = require('./models/user.js');
const Listing = require('./models/listings.js');
const Holding = require('./models/holdings.js');
const Request = require('./models/requests.js');
const url = require('url');
const Web3 = require('web3');
const WalletConnectProvider = require("@walletconnect/web3-provider");
const Trade = require('../contract/abis/Trade.json')
const Bid = require('../contract/abis/Bid.json')
const Trading = require('../contract/abis/Trading.json')
const Prop = require('../contract/abis/MyPROP.json')
require('dotenv').config();
const { INFURA_URL} = process.env;


const detectEthereumProvider = require('@metamask/detect-provider');

app.use(express.static('../contract/abis'));


//Connecting our database
const uri = "mongodb+srv://shubh99:Shubh%401998@cryproperty.zypeh.mongodb.net/Cryproperty";
mongoose.connect(uri);

const db = mongoose.connection;
db.on('error', console.error.bind(console, "DB Connection Error"));
db.on('open', () => {
    console.log("Database Connected");
})
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.urlencoded({ extended: true }))
app.use(express.static(__dirname + '/public'));

//Global Variables
var tradeContract;
var tradingContract;
var bidContract;
var web3Provider;
var prop;
var networkId;

//Landing Page
app.get('/', (req, res) => {
    res.render('landing.ejs')
})

//login view page
app.get('/user/loginpage', (req, res) => {
    res.render('auth/login.ejs')
})

//register view page
app.get('/user/registerpage', (req, res) => {
    res.render('auth/register.ejs')
})

//login 
app.post('/user/login', async (req, res) => {
    var user = await User.findOne({ ethaddress: req.body.user.ethaddress });
    if (!user) {
        alert("User Does Not Exist");
        res.redirect("/user/registerpage");
        return;
    }
    else {
        openDashboard(user, res);
    }
})

//register
app.post('/user/register', async (req, res) => {
    var user = await User.findOne({ ethaddress: req.body.user.ethaddress });
    if (user) {
        alert("Could Not Create New User. User with this eth address already exists");
        res.redirect("/user/registerpage");
        return;
    }
    else {
        console.log("Saving new user");
        user = new User(req.body.user);
        await user.save();
    }
    openDashboard(user, res);
})

//open dashboard
async function openDashboard(user, res) {
    var listings = [];
    //merchant
    if (user.role == 1) {
        listings = await Listing.find({ userId: user._id });
        var propertyIds = [];
        if (listings) {
            for (let listing of listings) {
                //console.log(listing.propertyId);
                propertyIds.push(listing.propertyId);
            }
            var properties = await Property.find({
                '_id': { $in: propertyIds }
            });
            //console.log(properties);
            res.user
            res.render('merchantDashboard', { user: user, properties: properties })
        }
        else {
            res.redirect(url.format({
                pathname: "/property/new",
                query: {
                    "user": user
                }
            }));
        }
    }
    //user
    else {
        var holdings = await Holding.find({ userId: user._id });
        var requests = await Request.find({ useraddress: user.ethaddress })
        if (holdings) {
            var propertyAmountMap = [];
            for (let holding of holdings) {
                var property = await Property.findById(holding.propertyId);
                const map = { property: property, amount: holding.amount };
                propertyAmountMap.push(map);
            }
            res.render('userDashboard.ejs', { user, propertyAmountMap, requests })
        }
        else {
            res.redirect('/properties/list')
        }
    }
}
app.get('/user/dashboard', async (req, res) => {
    const user = req.query.user;
    openDashboard(user, res);
});

//View Create Property Page
app.get('/property/new', async (req, res) => {
    const user = req.query.user;
    res.render("properties/new", { user });
})

//create new property
app.post('/property', async (req, res) => {
    console.log(req.body.user.ethaddress);
    const user = await User.findOne({ ethaddress: req.body.user.ethaddress });
    console.log(user);
    if (!user || user.role != 1) {
        alert("User is not signed in as a Merchant");
        res.redirect("/user/loginpage");
    }
    const property = new Property(req.body.property)
    property.available = property.fractions;
    property.phase = 1;
    property.owner = user.ethaddress;
    property.rate = property.price / property.fractions;
    await property.save();
    var listing = { userId: user._id, propertyId: property._id };
    listing = new Listing(listing);
    await listing.save();
    openDashboard(user, res);
})

//list all the properties
app.get('/property/list', async (req, res) => {
    const properties = await Property.find({ phase: req.query.phase });
    res.render("properties/index.ejs", { properties })
})

//list particular property
app.get('/property/:id', async (req, res) => {
    const property = await Property.findById(req.params.id);
    res.render("properties/show.ejs", { property })
})

//buy
app.get('/buy', async (req, res) => {
    initWeb3();
    initTradeContract();
    initTradingContract();
    initPropContract();
    const useraddress = req.query.useraddress;
    const propertyId = req.query.propertyId;
    var user = await User.findOne({ ethaddress: useraddress });
    if (!user) {
        alert("Could not find user");
        openDashboard(user, res);
        return;
    }
    if (user.role == 1) {
        alert("User Account is registered as a Merchant");
        openDashboard(user, res);
        return;
    }
    var buyingRequest = await Request.findOne({
        propertyId: propertyId,
        type: 1,
        useraddress: useraddress
    })
    if (buyingRequest) {
        alert("Buying Request already raised");
        openDashboard(user, res);
        return;
    }
    var property = await Property.findById(propertyId);
    var rate = property.rate;
    var request = await Request.findOne({
        propertyId: propertyId,
        type: 2
    })
    var flag = -1;
    if (request) {
        await tradeContract.methods.sendMoney(request.useraddress).send({ from: useraddress, value: web3.utils.toWei(rate.toString(), 'Ether') })
            .once('receipt', async (receipt) => {
                if (receipt.status) {
                    flag = 0;
                    await prop.methods.transfer(request.useraddress, useraddress, propertyId)
                        .then(result => {
                            alert(result);
                        })
                        .catch(revertReason => alert(revertReason));
                }
                else {
                    alert("Buying could not be processed. Amount will be reverted soon");
                    await tradeContract.methods.sendMoney(useraddress).send({ from: property.owner, value: web3.utils.toWei(rate.toString(), 'Ether') })
                }
            });
    }
    else if (property.available > 0) {
        await tradeContract.methods.sendMoney(property.owner).send({ from: useraddress, value: web3.utils.toWei(rate.toString(), 'Ether') })
            .once('receipt', async (receipt) => {
                if (receipt.status) {
                    flag = 1;
                    await prop.methods.safeMint(useraddress, propertyId);
                    //processBuy(user._id, property.owner, property, true);
                }
                else {
                    alert("Buying could not be processed. Amount will be reverted soon");
                    await tradeContract.methods.sendMoney(useraddress).send({ from: property.owner, value: web3.utils.toWei(rate.toString(), 'Ether') })
                }
            });
    }
    else {
        request = new Request({
            type: 1,
            propertyId: propertyId,
            useraddress: useraddress
        });
        await request.save();
    }
    if (flag == 0) {
        var seller = await User.findOne({
            ethaddress: request.useraddress
        })
        await Request.deleteOne({
            _id: request._id
        })
        await processBuy(user, seller._id, property, false, res);
        return;
    }
    else if (flag == 1) {
        await processBuy(user, property.owner, property, true, res);
        return;
    }
    openDashboard(user, res);
});

//buy
app.get('/buy/v2', async (req, res) => {
    initWeb3();
    initPropContract();
    const useraddress = req.query.useraddress;
    const propertyId = req.query.propertyId;
    var user = await User.findOne({ ethaddress: useraddress });
    if (!user) {
        alert("Could not find user");
        openDashboard(user, res);
        return;
    }
    if (user.role == 1) {
        alert("User Account is registered as a Merchant");
        openDashboard(user, res);
        return;
    }
    var property = await Property.findById(propertyId);
    var rate = property.rate;
    var flag = -1;

    if (property.available > 0) {
        await initTradeContract();
        await tradeContract.methods.sendMoney(property.owner).send({ from: useraddress, value: web3.utils.toWei(rate.toString(), 'Ether') })
            .once('receipt', async (receipt) => {
                if (receipt.status) {
                    flag = 1;
                }
                else {
                    alert("Buying could not be processed. Amount will be reverted soon");
                    await tradeContract.methods.sendMoney(useraddress).send({ from: property.owner, value: web3.utils.toWei(rate.toString(), 'Ether') })
                }
            });
        await prop.methods.safeMint(useraddress);
    }
    else {
        await initTradingContract();
        await tradingContract.methods.buy(propertyId).send({ from: useraddress, value: web3.utils.toWei(rate.toString(), 'Ether') })
            .then(result => {
                alert(result);
                flag = 0;
            })
            .catch(revertReason => alert(revertReason));
    }

    if (flag == 0) {
        await processBuy(user, seller._id, property, false, res);
        return;
    }
    else if (flag == 1) {
        await processBuy(user, property.owner, property, true, res);
        return;
    }
    openDashboard(user, res);
});

async function processBuy(buyer, sellerId, property, fromOwner, res) {
    if (!fromOwner) {
        var sellerHolding = await Holding.findOne({
            userId: sellerId,
            propertyId: property._id
        });
        if (sellerHolding.amount > 1) {
            sellerHolding.amount--;
            await sellerHolding.save();
        }
        else {
            await sellerHolding.delete();
        }
    }
    else {
        property.available = property.available - 1;
        await property.save();
    }
    alert("Bought Successfully");
    var buyerHolding = await Holding.findOne({
        userId: buyer._id,
        propertyId: property._id
    });
    if (!buyerHolding) {
        buyerHolding = new Holding({
            userId: buyer._id,
            propertyId: property._id,
            amount: 1
        });
    }
    else {
        buyerHolding.amount++;
    }
    await buyerHolding.save(function (error, holding) {
        if (error) {
            console.log(error);
        }
        else {
            console.log(holding);
            openDashboard(buyer, res);
        }
    });
}

//sell
app.get('/sell', async (req, res) => {
    initWeb3();
    initTradeContract();
    initTradingContract();
    initPropContract();
    const useraddress = req.query.useraddress;
    const propertyId = req.query.propertyId;
    var user = await User.findOne({ ethaddress: useraddress });
    if (!user) {
        alert("Could not find user");
        openDashboard(user, res);
        return;
    }
    if (user.role == 1) {
        alert("User Account is registered as a Merchant");
        openDashboard(user, res);
        return;
    }
    var sellingRequest = await Request.findOne({
        propertyId: propertyId,
        type: 2,
        useraddress: useraddress
    })
    if (sellingRequest) {
        alert("Selling Request is already raised");
        openDashboard(user, res);
        return;
    }
    var property = await Property.findById(propertyId);
    var holding = await Holding.findOne({
        userId: user._id,
        propertyId: propertyId
    })
    if (holding) {

    }
    else {
        alert("You dont own this property");
        openDashboard(user, res);
        return;
    }
    var request = await Request.findOne({
        propertyId: propertyId,
        type: 1
    })
    const rate = property.rate;
    if (request) {
        console.log("Request Matched");
        await tradeContract.methods.sendMoney(useraddress).send({ from: request.useraddress, value: web3.utils.toWei(rate.toString(), 'Ether') })
            .once('receipt', async (receipt) => {
                if (receipt.status) {
                    buyer = await User.findOne({
                        ethaddress: request.useraddress
                    })
                    await prop.methods.transfer(useraddress, request.useraddress, propertyId)
                        .then(result => {
                            alert(result);
                        })
                        .catch(revertReason => alert(revertReason));
                    await request.delete();
                    await processSell(user, buyer._id, propertyId, res);
                    return;
                }
                else {
                    alert("Sell could not be processed. Amount will be reverted soon");
                    await tradeContract.methods.sendMoney(useraddress).send({ from: property.owner, value: web3.utils.toWei(rate.toString(), 'Ether') })
                }
            });
    }
    else {
        request = new Request({
            type: 2,
            propertyId: propertyId,
            useraddress: useraddress
        });
        await request.save();
        openDashboard(user, res);
    }
})

async function processSell(seller, buyerId, propertyId, res) {
    alert("Sold Succesfully");
    var buyerHolding = await Holding.findOne({
        userId: buyerId,
        propertyId: propertyId
    });
    if (!buyerHolding) {
        const newHolding = new Holding({
            userId: buyerId,
            propertyId: propertyId,
            amount: 1
        });
        await newHolding.save();
    }
    else {
        buyerHolding.amount++;
        await buyerHolding.save();
    }
    var sellerHolding = await Holding.findOne({
        userId: seller._id,
        propertyId: propertyId
    });
    if (sellerHolding.amount > 1) {
        sellerHolding.amount--;
        await sellerHolding.save(function (error, holding) {
            if (holding) {
                console.log(sellerHolding);
                openDashboard(seller, res);
            }
            else if (error) {
                console.log(error);
            }
        });
    }
    else {
        await Holding.deleteOne({
            _id: sellerHolding._id
        })
        openDashboard(seller, res);
    }
}

app.get('/bid', async (req, res) => {
    await initWeb3();
    await initBidContract();
    const useraddress = req.query.useraddress;
    const propertyId = req.query.propertyId;
    const user = await User.findOne({
        ethaddress: useraddress
    })
    if (!user) {
        alert("You need to register before bidding");
        res.render('auth/register.ejs');
    }
    else if (user.role == 1) {
        alert("You are registeres as a Merchant");
        res.render('auth/login.ejs');
    }
    var property = await Property.findOne({
        "_id": propertyId
    })
    await bidContract.methods.vote(propertyId).call({ from: useraddress })
        .then(result => { alert("Bid Succesfull") })
        .catch(revertReason => alert(revertReason));
    var voteCount;
    voteCount = await bidContract.methods.getVoteCount(propertyId).call();
    console.log(voteCount);
    if (parseInt(voteCount) >= 5) {
        property.phase = 2;
        await property.save();
    }
    openDashboard(user, res);

});

app.listen(3000, () => {
    console.log('Serving on port 3000')
})

async function initWeb3() {
    // Is there is an injected web3 instance?
    if (typeof web3 !== 'undefined') {
        web3Provider = web3.currentProvider;
    } else {
        // If no injected web3 instance is detected, fallback to the TestRPC
        web3Provider = new Web3.providers.HttpProvider(process.env.INFURA_URL);
    }
    web3 = new Web3(web3Provider);
    web3.eth.handleRevert = true;
    networkId = 5;
};

async function initTradeContract() {
    const networkData = Trade.networks[networkId];
    tradeContract = new web3.eth.Contract(Trade.abi, networkData.address);
}
async function initBidContract() {
    const networkData = Bid.networks[networkId];
    bidContract = new web3.eth.Contract(Bid.abi, networkData.address);
}
async function initTradingContract() {
    const networkData = Trading.networks[networkId];
    tradingContract = new web3.eth.Contract(Trading.abi, networkData.address);
}
async function initPropContract() {
    const networkData = Prop.networks[networkId];
    prop = new web3.eth.Contract(Prop.abi, networkData.address);
}
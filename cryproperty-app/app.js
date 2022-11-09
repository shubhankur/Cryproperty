const express = require('express');
const app = express();
const alert = require('alert');
const path = require('path');
const mongoose = require('mongoose');
const Property = require('./models/property.js');
const User = require('./models/user.js');
const Listing = require('./models/listings.js');
const Holding = require('./models/holdings.js');
const url = require('url');
const Web3 = require('web3');
const Trade = require('../cryproperty-contract/abis/Trade.json')
const detectEthereumProvider = require('@metamask/detect-provider');

app.use(express.static('../cryproperty-contract/abis'));


var tradeContract;
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
var contracts = {};
var web3Provider;

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
    else{
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
    console.log(user);
    openDashboard(user,res);
})

//open dashboard
async function openDashboard(user,res) {
    var listings = [];
    //merchant
    if (user.role == 1) {
        listings = await Listing.find({ userId: user._id });
        var propertyIds = [];
        if (listings) {
            for(let listing of listings){
                //console.log(listing.propertyId);
                propertyIds.push(listing.propertyId);
            }
            var properties = await Property.find({
                '_id': { $in: propertyIds}
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
        var holdings = await Holding.find({ userId: user._id});
        if (holdings) {
            var propertyAmountMap = [];
            for (let holding of holdings) {
                var property = await Property.findById(holding.propertyId);
                const map = { property: property, amount: holding.amount };
                propertyAmountMap.push(map);
            }
            res.render('userDashboard.ejs', { user, propertyAmountMap })
        }
        else {
            res.redirect('/properties/list')
        }
    }
}
app.get('/user/dashboard', async (req,res)=>{
    const user = req.query.user;
    openDashboard(user);
});

//View Create Property Page
app.get('/property/new', async (req, res) => {
    const user = req.query.user;
    res.render("properties/new", {user});
})

//create new property
app.post('/property', async (req, res) => {
    console.log(req.body.user.ethaddress);
    const user = await User.findOne({ethaddress:req.body.user.ethaddress});
    console.log(user);
    if(!user || user.role!=1){
        alert("User is not signed in as a Merchant");
        res.redirect("/user/loginpage");
    }
    const property = new Property(req.body.property)
    property.available = property.fractions;
    property.phase = 1;
    property.owner = user.ethaddress;
    property.rate = property.price/property.fractions;
    await property.save();
    var listing = {userId:user._id, propertyId:property._id};
    listing = new Listing(listing);
    await listing.save();
    openDashboard(user,res);
})

//list all the properties
app.get('/property/list', async (req, res) => {
    const properties = await Property.find({phase:req.query.phase});
    res.render("properties/index.ejs", { properties })
})

//list particular property
app.get('/property/:id', async (req, res) => {
    const property = await Property.findById(req.params.id);
    res.render("properties/show.ejs", { property })
})

//buy
app.get('/buy', async(req, res) =>{
    initWeb3();
    const useraddress = req.query.useraddress;
    const propertyId = req.query.propertyId;
    var user = await User.findOne({ ethaddress: useraddress});
    if(!user){
        alert("Could not find user");
        return;
    }
    if(user.role==1){
        alert("User Account is registered as a Merchant");
        return;
    }
    var property = await Property.findById(propertyId);
    var rate = property.rate;
    await tradeContract.methods.sendMoney(property.owner).send({from:useraddress, value:web3.utils.toWei(rate.toString(), 'Ether')})
    .once('receipt',async (receipt)=>{
        if(receipt.status){
            await processBuy(property, user);
        }
        else{
            alert("Buying could not be processed. Amount will be reverted soon");
            await tradeContract.methods.sendMoney(useraddress).send({from: property.owner, value:web3.utils.toWei(rate.toString(), 'Ether')})
        }
    });
    openDashboard(user,res);
});

async function processBuy(property, user){
    alert("Bought Successfully");
    property.buyers.push(user.ethaddress);
    property.available = property.available-1;
    await property.save();
    var holding = await Holding.findOne({
        userId : user._id,
        propertyId : property._id
    });
    if(!holding){
        const newHolding = new Holding({
            userId :user._id,
            propertyId: property._id,
            amount: 1
        });
        await newHolding.save();
    }
    else{
        holding.amount++;
        await holding.save();
    }
}

//sell
app.get('/sell', async(req, res) =>{
    const useraddress = req.query.useraddress;
    const propertyId = req.query.propertyId;
    var property = await Property.findById(propertyId);
    res.send(useraddress+":"+property);
})

app.listen(3000, () => {
    console.log('Serving on port 3000')
})

async function initWeb3() {
    // Is there is an injected web3 instance?
    if (typeof web3 !== 'undefined') {
    web3Provider = web3.currentProvider;
    } else {
    // If no injected web3 instance is detected, fallback to the TestRPC
    web3Provider = new Web3.providers.HttpProvider('http://127.0.0.1:7545');
    }
    web3 = new Web3(web3Provider);
    initContract();
};

function initContract() {
    const networkData = Trade.networks[5777];
    tradeContract = new web3.eth.Contract(Trade.abi, networkData.address);
}
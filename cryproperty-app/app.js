const express =require('express');
const app= express();
const alert = require('alert');
const path = require('path');
const mongoose = require('mongoose');
const Property = require('./models/property.js');
const User = require('./models/user.js');
const { render } = require('ejs');


//Connecting our database
const uri = "mongodb+srv://shubh99:Shubh%401998@cryproperty.zypeh.mongodb.net/Cryproperty";
mongoose.connect(uri);

const db = mongoose.connection;
db.on('error', console.error.bind(console, "DB Connection Error"));
db.on('open', ()=>{
    console.log("Database Connected");
})
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.urlencoded({extended: true}))
app.use(express.static(__dirname + '/public'));

//Defining APIs

//Landing Page
app.get('/', (req,res)=> {
    res.render('landing.ejs')
})

//login view page
app.get('/user/loginpage', (req,res)=> {
    res.render('auth/login.ejs')
})

//register view page
app.get('/user/registerpage', (req,res)=> {
    res.render('auth/register.ejs')
})

//login 
app.post('/user/login', async (req,res)=> {
    var user = await User.findOne({ethaddress: req.body.user.ethaddress});
    if(!user){
        alert("User Does Not Exist");
        res.redirect("/user/registerpage");
        return;
    }
    res.redirect('/property/list')
})

//register
app.post('/user/register', async(req,res)=> {
    var user = await User.findOne({ethaddress: req.body.user.ethaddress});
    if(user){
        alert("Could Not Create New User. User with this eth address already exists");
        res.redirect("/user/registerpage");
        return;
    }
    else{
        console.log("Saving new user");
        user = new User(req.body.user);
        await user.save();
    }
    console.log(user);
    res.redirect("/property/list");
})

//create new property view page
app.get('/property/new', async(req, res)=>{
    res.render('properties/new');
})

//create new property
app.post('/property', async(req, res)=>{
    const property = new Property(req.body.property)
    await property.save();
    res.redirect(`/property/${property._id}`)
})

//list all the properties
app.get('/property/list', async (req,res)=>{
    const properties = await Property.find({});
    res.render("properties/index.ejs", {properties})
})

//list particular property
app.get('/property/:id', async(req,res)=>{
    const property = await Property.findById(req.params.id);
    res.render("properties/show.ejs", {property})
})

app.listen(3000,()=>{
    console.log('Serving on port 3000')
})
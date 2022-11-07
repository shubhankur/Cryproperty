const mongoose =require('mongoose');
const Property= require('../models/Property')
const User= require('../models/User')
const cities= require('./cities')
const {places, descriptors} = require('./seedhelpers')
mongoose.connect("mongodb+srv://shubh99:Shubh%401998@cryproperty.zypeh.mongodb.net/Cryproperty");

const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", ()=>{
    console.log("Database connected");
});

const sample = array => array[Math.floor(Math.random() * array.length)];
const seedDB = async () => {
    await Property.deleteMany({});
    // for (let i = 0; i < 50; i++) {
    //     const random1000 = Math.floor(Math.random() * 1000);
    //     const property = new Property({
    //         location: `${cities[random1000].city}, ${cities[random1000].state}`,
    //         title: `${sample(descriptors)} ${sample(places)}`
    //     })
    // await property.save();
    // }
    await User.deleteMany({});
}

seedDB().then(() => {
    mongoose.connection.close();
})
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const RequestScehma = new Schema({
    type:Number,
    useraddress:String,
    propertyId:String
});

module.exports = mongoose.model('Request', RequestScehma);
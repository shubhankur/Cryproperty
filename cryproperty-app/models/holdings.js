const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const HoldingSchema = new Schema({
    userAddress:String,
    propertyId:String,
    amount:Number
});

module.exports = mongoose.model('Holding', HoldingSchema);
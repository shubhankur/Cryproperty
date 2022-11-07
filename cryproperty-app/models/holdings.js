const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const HoldingSchema = new Schema({
    userId:String,
    propertyId:String,
    amount:Number
});

module.exports = mongoose.model('Holding', HoldingSchema);
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ListingSchema = new Schema({
    userAddress:String,
    propertyId:String
});

module.exports = mongoose.model('Listing', ListingSchema);
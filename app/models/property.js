const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const PropertySchema = new Schema({
    "title":String,
    "price":Number,
    "description":String,
    "location":String,
    "fractions":Number,
    "rate":Number,
    "available":Number,
    "phase":Number,
    "owner":String,
    "bidders":[String],
    "votes":Number
});

module.exports = mongoose.model('Property', PropertySchema);
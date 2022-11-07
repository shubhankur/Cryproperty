const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const PropertySchema = new Schema({
    "title":String,
    "price":Number,
    "description":String,
    "location":String,
    "fractions":Number,
    "available":Number,
    "phase":Number
});

module.exports = mongoose.model('Property', PropertySchema);
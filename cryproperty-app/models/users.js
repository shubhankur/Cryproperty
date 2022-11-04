const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const UserSchema = new Schema({
    "name":String,
    "address":String,
    "phone":String,
    "role":Number
});

module.exports = mongoose.model('User', UserSchema);
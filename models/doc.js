const mongoose = require('mongoose');

const Doc = mongoose.model('Doc', new mongoose.Schema({
    id: {
        type: String,
        required: true
    },
    name: {
        type: String,
        required: true,
    },
}));

exports.Doc = Doc;
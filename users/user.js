const Joi = require('joi');
const mongoose = require('mongoose');

const User = mongoose.model('User', new mongoose.Schema({
    username: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: true,
    }, 
    verified: {
        type: Boolean,
        required: true,
    }
}));

function validateUser(user) {
    const schema = Joi.object({
        username: Joi.string().required(),
        email: Joi.string().required().email(),
        password: Joi.string().required()
    });
    return schema.validate(user);
}

exports.User = User;
exports.validate = validateUser;
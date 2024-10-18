const mongoose  = require('mongoose');
const express =  require('express');
const app = express();

mongoose.connect('mongodb://127.0.0.1:27017/miniproject');

const userSchema =  mongoose.Schema({
    username: String,
    name: String,
    age: Number,
    email:String,
    password: String,
    profilepic:{
        type: String,
        default: "default.jpeg",
    },
    posts : [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref : "post"
        }

    ],
});

 module.exports =  mongoose.model('user',userSchema);

require('dotenv').config()
const express = require('express')
const ejs = require('ejs')
const bodyParser = require('body-parser')
const mongoose = require('mongoose')
// const encrypt = require('mongoose-encryption')
// const md5 = require('md5')
const bcrypt = require('bcrypt')
const saltRounds = 10 

const app = express()

app.set("view engine" , 'ejs')
app.use(bodyParser.urlencoded({extended : true}))
app.use(express.static("public"))
const port = 3000

mongoose.connect("mongodb://localhost:27017/userDB")

const userSchema = new mongoose.Schema({
    email : String,
    password : String
})
// const secret = process.env.SECRET
// userSchema.plugin(encrypt , {secret : secret , encryptedFields: ['password']})

const User = mongoose.model("User" , userSchema)



app.get("/" , (req, res) => {
    res.render("home")
})
app.get("/login" , (req, res) => {
    res.render("login")
})
app.get("/register" , (req, res) => {
    res.render("register")
})

app.post("/register" , (req , res) => {
    bcrypt.hash(req.body.password , saltRounds , (err , hash) =>{
      const newUser = new User({
        email : req.body.username,
        password : hash                                      //using bcrypt for hashing and salting
    })
    newUser.save((err) => {
        if(!err){
            res.render("secrets")
        }else{
            console.log(err)
        }
    })  
    })

    
})
app.post("/login" , (req ,res) => {
    const username = req.body.username
    const password = req.body.password                      // md5() hashing with md5 in prev ver

    User.findOne({email : username} , (err , foundUser) => {
        if(err){
            console.log(err);
        }else{
            if(foundUser){

                bcrypt.compare(password, foundUser.password , function(err, result) {  //decrypting hash with compare 
                    if(result === true){
                        res.render("secrets")
                    }else{
                        console.log(err)
                        console.log("wrong password");
                    }
                })
                    
            }else{
                console.log("user does not exists");
            }
        }
    })
})

app.listen(port , ()=>{
    console.log("server started at "+ port)
})
require('dotenv').config()
const express = require('express')
const ejs = require('ejs')
const bodyParser = require('body-parser')
const mongoose = require('mongoose')
const session = require('express-session')
const passport = require('passport')
const passportLocalMongoose = require('passport-local-mongoose')
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require('mongoose-findorcreate')


const app = express()
const port = 3000
app.set("view engine" , 'ejs')
app.use(bodyParser.urlencoded({extended : true}))
app.use(express.static("public"))

app.use(session({
    secret : 'thisismysecret' ,
    resave : false ,
    saveUninitialized: true,
    //cookie: { secure: true }
}))
app.use(passport.initialize())
app.use(passport.session())


mongoose.connect("mongodb://localhost:27017/userDB")


const userSchema = new mongoose.Schema({
    email : String,
    password : String,
    googleId : String
})
// const secret = process.env.SECRET
// userSchema.plugin(encrypt , {secret : secret , encryptedFields: ['password']})
userSchema.plugin(passportLocalMongoose)
userSchema.plugin(findOrCreate)

const User = mongoose.model("User" , userSchema)

passport.use(User.createStrategy())

passport.serializeUser(function(user, cb) {
    process.nextTick(function() {
      return cb(null, {
        id: user.id,
        username: user.username,
        picture: user.picture
      });
    });
  });
  
  passport.deserializeUser(function(user, cb) {
    process.nextTick(function() {
      return cb(null, user);
    });
  });

passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets"
    //userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
  },
  function(accessToken, refreshToken, profile, cb) {
    //console.log(profile);
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));





//--------------------------------GET request-----------------------------------




app.get("/" , (req, res) => {
    res.render("home")
})
app.get("/login" , (req, res) => {
    res.render("login")
})
app.get("/register" , (req, res) => {
    res.render("register")
})

app.get("/secrets" , (req , res) => {
    if(req.isAuthenticated()){
        res.render("secrets")
    }else{
        res.redirect("/login")
    }
})

app.get("/logout" , (req , res) => {
    req.logout((err) => {
        if(err){
            console.log(err)
        }
    })
    res.redirect("/")
})

app.get('/auth/google',
  passport.authenticate('google', { scope: ['profile'] })
);

app.get('/auth/google/secrets', 
  passport.authenticate('google', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect the page.
    res.redirect("/secrets");
});
  




//---------------------------------------POST requests----------------------------------------------------------


app.post("/register" , (req , res) => {
    User.register({username : req.body.username} , req.body.password , (err , user) => {
        if(err){
            console.log(err)
            res.redirect("/register")
        }else{
            passport.authenticate("local")(req , res , () => {
                res.redirect("/secrets")
            })
        }
    })
})
app.post("/login" , (req ,res) => {
    const user = new User({
        username : req.body.username ,
        password : req.body.password
    })
    req.login(user , (err) => {
        if(err){
            console.log(err)
        }else{
            passport.authenticate("local")(req , res , () => {
                res.redirect("/secrets")
            })
        }
    })
})




app.listen(port , ()=>{
    console.log("server started at "+ port)
})
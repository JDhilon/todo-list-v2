//jshint esversion:6
require('dotenv').config();
const express = require("express");
const ejs = require('ejs');
const mongoose = require('mongoose');
const _ = require('lodash');
const session = require('express-session');
const passport = require('passport');
const passportLocal = require('passport-local');
const passportLocalMongoose = require('passport-local-mongoose');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require('mongoose-findorcreate');


// Express set up
const app = express();

app.use(express.static('public'));
app.set('view engine', 'ejs');

app.use(express.urlencoded({extended: true}));

app.set('trust proxy', 1) // trust first proxy
app.use(session({
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: {}
}));

app.use(passport.initialize());
app.use(passport.session());


mongoose.connect("mongodb://localhost:27017/userDB", { useNewUrlParser: true, useUnifiedTopology: true });
mongoose.set('useCreateIndex', true);

const userSchema = new mongoose.Schema({
    email: String,
    password: String,
    googleId: String,
    secret: String
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

const User = mongoose.model("User", userSchema);

passport.serializeUser(function(user, done) {
    done(null, user.id);
});
  
passport.deserializeUser(function(id, done) {
    User.findById(id, function(err, user) {
        done(err, user);
    });
});

passport.use(new passportLocal(User.authenticate()));

passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets",
    userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"     // For G+ deprecation
    },
    function(accessToken, refreshToken, profile, cb) {
        // console.log(profile);
        User.findOrCreate({ googleId: profile.id }, function (err, user) {
            return cb(err, user);
    });
}));

app.get('/', function(req, res){
    res.render('home');
});

app.get('/auth/google', 
    passport.authenticate('google', {scope: ['profile']})
);

app.get('/auth/google/secrets', 
    passport.authenticate('google', { failureRedirect: '/login' }),
    function(req, res) {
        // Successful authentication, redirect
        res.redirect('/secrets');
});

app.get('/login', function(req, res){
    res.render('login');
});

app.get('/register', function(req, res){
    res.render('register');
});

app.get('/secrets', function(req, res){
    User.find({"secret": {$ne:null}}, function(err, results){
        if(err) {
           console.log(err);
        } else {
            if(results) {
                res.render('secrets', {secretsList: results});
            }
        }
    });
});

app.get('/logout', function(req, res){
    req.logout();
    res.redirect('/');
});

app.get('/submit', function(req, res){
    if (req.isAuthenticated()){
        res.render('submit');
    } else {
        res.redirect('/login');
    }
});

app.post('/register', function(req, res){
    User.register({username: req.body.username}, req.body.password, function(err, user){
        if(err) {
           console.log(err);
           res.redirect('/register');
        } else {
            passport.authenticate('local')(req, res, function(){
                res.redirect('/secrets');
            });
        }
    });
});

app.post('/login', passport.authenticate('local',  {failureRedirect: '/login'}), function(req, res){
    res.redirect('/secrets');
});

app.post('/submit', function(req, res){
    const secret = req.body.secret;

    User.findById(req.user.id, function(err, result){
        if(err) {
           console.log(err);
        } else {
            if(result) {
                result.secret = secret;
                result.save(function(){
                    res.redirect('/secrets');
                });
            }
        }
    });
});

app.listen(3000, function() {
    console.log('Server started on port 3000');
})
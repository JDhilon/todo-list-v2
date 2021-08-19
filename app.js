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

// --- Set up items and list -- //
const itemSchema = new mongoose.Schema({
    task: {
        type: String,
        required: true
    }
});

const Item = mongoose.model("Item", itemSchema);

const item1 = new Item({
    task: "Welcome to your todolist!"
});

const item2 = new Item({
    task: "Hit + to add a new item."
});

const item3 = new Item({
    task: "<-- Hit this to complete an item."
});

const defaultItems = [item1, item2, item3];

const listSchema = new mongoose.Schema({
    name: String,
    items: [itemSchema]
});

const List = mongoose.model("List", listSchema);


// --- Set up for passport and OAuth --- //

const userSchema = new mongoose.Schema({
    list: listSchema,
    email: String,
    password: String,
    googleId: String
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
    callbackURL: "http://localhost:3000/auth/google/list",
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

app.get('/auth/google/list', 
    passport.authenticate('google', { failureRedirect: '/login' }),
    function(req, res) {
        // Successful authentication, redirect
        res.redirect('/list');
});

app.get('/login', function(req, res){
    res.render('login');
});

app.get('/register', function(req, res){
    res.render('register');
});

app.get('/list', function(req, res){

    // Find current user by ID, and render their list if found
    if(req.isAuthenticated()) {
        User.findById(req.user.id, function(err, result){
            if(err) {
                console.log(err);
            } else {
                // If list is empty, initialize it
                if(!result.list) {
                    const list = new List({
                        name: "Your List",
                        items: defaultItems
                    });

                    result.list = list;
                    result.save();
                    console.log(result);
                    res.redirect("/list");
                } 
                // Show list if it exists
                else {
                    res.render("list", {listTitle: result.list.name, items: result.list.items});
                }
            }
        });
    } 
    else {
        res.redirect('/login');
    }
});

// TODO: Add logout button
app.get('/logout', function(req, res){
    req.logout();
    res.redirect('/');
});

app.post('/register', function(req, res){
    User.register({username: req.body.username}, req.body.password, function(err, user){
        if(err) {
           console.log(err);
           res.redirect('/register');
        } else {
            passport.authenticate('local')(req, res, function(){
                res.redirect('/list');
            });
        }
    });
});

app.post('/login', passport.authenticate('local',  {failureRedirect: '/login'}), function(req, res){
    res.redirect('/list');
});

// Add items by finding user and adding to their list items
app.post("/add", function(req, res){
    if(req.isAuthenticated()) {
        const item = new Item({
            task: req.body.newItem
        });

        User.findByIdAndUpdate(req.user.id, {$addToSet: {'list.items' : item}}, {useFindAndModify: false}, function(err, result) {
            if(err) {
                console.log(err);
            } else {
                res.redirect("/list");
            }
        });
    }
    else {
        res.redirect('/login');
    }
    
});

// Delete items by first finding the user and their list, then pulling by ID
app.post("/delete", function(req, res){
    if(req.isAuthenticated()){
    const itemID = req.body.checkbox;
        User.findByIdAndUpdate(req.user.id, {$pull: {'list.items': {_id: itemID}}}, {useFindAndModify: false}, function(err, result){
            if(err){
                console.log(err);
            }
            res.redirect("/list");
        });
    }
});

app.listen(3000, function() {
    console.log('Server started on port 3000');
})
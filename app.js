//jshint esversion:6

require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
// const encrypt = require("mongoose-encryption");
// var md5 = require('md5');
// const bcrypt = require('bcrypt');
// const saltRounds = 10;
const session = require('express-session');
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose"); 
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require("mongoose-findorcreate");

const app = express();

// console.log(process.env.SECRET);
app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

app.use(session({
  secret: "My secret password.",
  resave: false,
  saveUninitialized: true
}));

app.use(passport.initialize());
app.use(passport.session());


main().catch(err => console.log(err));

async function main() {
  await mongoose.connect('mongodb+srv://coltravi:StK29w2fHgsidSE2@cluster0.kuzhpg3.mongodb.net/userDB');
}

const userSchema = new mongoose.Schema ({
email: String,
password: String,
googleId: String,
secret: String
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

// userSchema.plugin(encrypt, {secret: process.env.SECRET, encryptedFields: ["password"]});


const User = new mongoose.model("User", userSchema);

passport.use(User.createStrategy());

// passport.serializeUser(User.serializeUser());
// passport.deserializeUser(User.deserializeUser());;
passport.serializeUser(function(user, done) {
  done(null, user);
});

passport.deserializeUser(function(user, done) {
  done(null, user);
});

passport.use(new GoogleStrategy({
  clientID: process.env.CLIENT_ID,
  clientSecret: process.env.CLIENT_SECRET,
  callbackURL: "https://submit-your-secrets-anonymously.onrender.com/auth/google/secrets"
},
function(accessToken, refreshToken, profile, cb) {
  User.findOrCreate({ googleId: profile.id }, function (err, user) {
    return cb(err, user);
  });
}
));

app.get("/", function(req, res){
res.render("home");
});

app.get("/auth/google",
  passport.authenticate('google', { scope: ['profile'] }
  ));

  app.get('/auth/google/secrets', 
  passport.authenticate('google', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect to secrets.
    res.redirect('/secrets');
  });
  
app.get("/login", function(req, res){
  res.render("login");
  });
  

  app.get("/register", function(req, res){
    res.render("register");
    });
    
  app.get("/secrets", function(req, res){
   User.find({"secret": {$ne: null}}).then(function(foundUsers){
   if (foundUsers){
    res.render("secrets", {usersWithSecrets: foundUsers});
   }
   });
      });

  app.get("/submit", function(req, res){
        if (req.isAuthenticated()){
          res.render("submit");
        } else{
          res.redirect("/login");
        }
        });
  

  app.get("/logout", function(req, res){
    req.logout(function(err) {
      if (err) { return next(err); }
      res.redirect('/');
    });

  });


app.post("/register", function(req, res){

//   bcrypt.hash(req.body.password, saltRounds, function(err, hash) {
//     const newUser = new User({
//       email: req.body.username,
//       // password: md5(req.body.password)
//       password: hash
//     });
//     newUser.save();
//     res.render("secrets");
// });
User.register({username: req.body.username}, req.body.password, function(err, user){
if (err){
  console.log(err);
  res.redirect("/register");
}else {
passport.authenticate("local") (req, res, function(){
  res.redirect("/secrets");
})

}
})

});

app.post("/login", function(req, res){
// userLogin = req.body.username;
// // userPassword = md5(req.body.password);
// userPassword = req.body.password;

// User.findOne({email: userLogin}).then(function(foundName){
// // if(err){
// //   // console.log(err);
// // }else{
//   if (foundName){
//     bcrypt.compare(userPassword, foundName.password, function(err, result) {
// if (result === true){
//   res.render("secrets");
// }
//   });
    
    
//   }
// }

const user = new User({
username: req.body.username,
password: req.body.password
});

req.login(user, function(err){
  if(err){
    console.log(err);
  }
  else{
    passport.authenticate("local") (req, res, function(){
      res.redirect("/secrets");
    })
  }

});



});


// });

app.post("/submit", function(req, res){
const submittedSecret = req.body.secret;
console.log(req.user._id);

User.findById(req.user._id).then(function(foundUser){

  if (foundUser){
      foundUser.secret = submittedSecret;
      foundUser.save().then(function(){
        res.redirect("/secrets");
      });


}
// if (err){
//   console.log(err);
// } else {
// if (foundUser){
//   foundUser.secret = submittedSecret;
//   foundUser.save(function(){
//     req.redirect("/secrets");
//   });
// }

// }

// })
});
});


let port = process.env.PORT;
if (port == null || port == ""){
  port = 3000;
}

// Start the server at Port 3000
app.listen(port, function () {
  console.log("Server started successfully.");
});

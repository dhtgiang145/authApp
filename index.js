const express = require("express");
const app = express();

app.use(express.static(__dirname));

const bodyParser = require("body-parser");
const expressSession = require("express-session")({
  secret: "secret",
  resave: false,
  saveUninitialized: false,
});

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(expressSession);

const port = process.env.PORT || 3000;
app.listen(port, () => console.log("App listening on port " + port));

// Passport setup
const passport = require("passport");

app.use(passport.initialize());
app.use(passport.session());

// Mongoose setup
const mongoose = require("mongoose");
const passportLocalMongoose = require("passport-local-mongoose");
const { Passport } = require("passport");

mongoose.connect("mongodb://localhost/MyDatabase", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const Schema = mongoose.Schema;
const UserDetail = new Schema({
  username: String,
  password: String,
});

UserDetail.plugin(passportLocalMongoose);
const UserDetails = mongoose.model("userInfo", UserDetail, "userInfo");

// Passport local authentication

passport.use(UserDetails.createStrategy());
passport.serializeUser(UserDetails.serializeUser());
passport.deserializeUser(UserDetails.deserializeUser());

// routes
const connectEnsureLogin = require("connect-ensure-login");
app.post("/login", (req, res, next) => {
  passport.authenticate("local", (err, user, info) => {
    if (err) {
      return next(err);
    }
    if (!user) {
      return res.redirect("/login?info=" + info);
    }

    req.login(user, function (err) {
      if (err) {
        return next(err);
      }

      return res.redirect("/");
    });
  })(req, res, next);
});

app.get("/login", (req, res) =>
  res.sendFile("html/login.html", { root: __dirname })
);

app.get("/", connectEnsureLogin.ensureLoggedIn(), (req, res) =>
  res.sendFile("html/index.html", { root: __dirname })
);

app.get("/private", connectEnsureLogin.ensureLoggedIn(), (req, res) =>
  res.sendFile("html/private.html", { root: __dirname })
);

app.get("/user", connectEnsureLogin.ensureLoggedIn(), (req, res) =>
  res.send({ user: req.user })
);

app.get("/logout", (req, res) => {
  req.logout();
  res.sendFile("html/logout.html", { root: __dirname });
});

// register some users
// UserDetails.register({ username: "paul", active: false }, "paul");
// UserDetails.register({ username: "joy", active: false }, "joy");
// UserDetails.register({ username: "ray", active: false }, "ray");

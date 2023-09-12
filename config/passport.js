const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const User = require("../models/userSchema");
const bcrypt = require("bcrypt");

passport.use(
  new LocalStrategy((username, password, done) => {
    User.findOne({ username }) // No need for a callback here
      .then((user) => {
        if (!user) {
          return done(null, false, { message: "Incorrect username" });
        }

        bcrypt.compare(password, user.password, (err, isPasswordValid) => {
          if (err) {
            return done(err);
          }
          if (!isPasswordValid) {
            return done(null, false, { message: "Incorrect password" });
          }
          return done(null, user);
        });
      })
      .catch((err) => {
        return done(err);
      });
  })
);

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser((id, done) => {
  User.findById(id)
    .then((user) => {
      done(null, user);
    })
    .catch((err) => {
      done(err);
    });
});

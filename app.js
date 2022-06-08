const express = require("express");
const path = require("path");
const session = require("express-session");
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const bcrypt = require("bcryptjs");
const bodyParser = require("body-parser");
const { GoogleSpreadsheet } = require("google-spreadsheet");
const GitHub = require("github-api");
require("dotenv").config();
var flash = require("connect-flash");

const mongoDb = process.env.MONGO_URL;
mongoose.connect(mongoDb, { useUnifiedTopology: true, useNewUrlParser: true });
const db = mongoose.connection;
db.on("error", console.error.bind(console, "mongo connection error"));

const User = mongoose.model(
  "User",
  new Schema({
    username: { type: String, required: true },
    password: { type: String, required: true },
    githubToken: { type: String, required: false },
    sheets: { type: Array, required: false },
  })
);

const app = express();
app.set("views", __dirname);
app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({ extended: true }));
app.use(flash());
app.use(
  session({
    secret: process.env.SECRET_KEY,
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 7 * 24 * 60 * 60 * 1000 },
  })
);

passport.use(
  new LocalStrategy((username, password, done) => {
    User.findOne({ username: username }, (err, user) => {
      if (err) {
        return done(err);
      }
      if (!user) {
        return done(null, false, { message: "Incorrect username or password" });
      }
      bcrypt.compare(password, user.password, (err, res) => {
        if (res) {
          return done(null, user);
        } else {
          return done(null, false, {
            message: "Incorrect username or password",
          });
        }
      });
    });
  })
);
passport.serializeUser(function (user, done) {
  done(null, user.id);
});
passport.deserializeUser(function (id, done) {
  User.findById(id, function (err, user) {
    done(err, user);
  });
});

app.use(passport.initialize());
app.use(passport.session());
app.use(express.urlencoded({ extended: false }));

app.use(function (req, res, next) {
  res.locals.currentUser = req.user;
  next();
});

app.get("/", (req, res) => {
  res.render("index", { user: req.user, message: req.flash("error") });
});
app.get("/sign-up", (req, res) => res.render("sign-up-form"));
app.get("/log-out", (req, res) => {
  req.logout(function (err) {
    if (err) {
      return next(err);
    }
    res.redirect("/");
  });
});

app.get("/failed-login", function (req, res) {
  res.redirect("/");
});

app.post(
  "/log-in",
  passport.authenticate("local", {
    successRedirect: "/",
    failureRedirect: "/failed-login",
    failureFlash: true,
  })
);
app.post("/sign-up", (req, res, next) => {
  bcrypt.hash(req.body.password, 10, (err, hashedPassword) => {
    const user = new User({
      username: req.body.username,
      password: hashedPassword,
    }).save((err) => {
      if (err) {
        return next(err);
      }
      res.redirect("/");
    });
  });
});
app.post("/save-github-token", (req, res) => {
  const token = req.body.githubToken;
  User.findByIdAndUpdate(req.user._id, { githubToken: token }, (err) => {
    if (err) {
      return next(err);
    }
    res.redirect("/");
  });
});

app.post("/save-google-spreadsheet", (req, res) => {
  const id = req.body.spreadsheetId;
  const name = req.body.spreadsheetName;
  const nameRow = req.body.nameRow;
  const taskName = req.body.taskName;
  const taskRow = req.body.taskRow;
  let tasks;
  if (taskName != undefined) {
    tasks = taskName.map((task, i) => {
      return {
        name: task,
        row: taskRow[i],
      };
    });
  } else {
    tasks = [];
  }

  const sheet = { id: id, name: name, nameRow: nameRow, tasks: tasks };
  let sheets = req.user.sheets;
  let index = sheets.findIndex((item) => item.name == name);
  if (index == -1) {
    sheets.push(sheet);
  } else {
    sheets[index] = sheet;
  }
  User.findByIdAndUpdate(req.user._id, { sheets: sheets }, (err) => {
    if (err) {
      return next(err);
    }
    res.redirect("/");
  });
});

app.get("/get-google-spreadsheet", (req, res) => {
  const id = req.query.sheetId;
  const doc = new GoogleSpreadsheet(id);
  var sheetConfig = res.locals.currentUser.sheets;
  var currentSheet = sheetConfig.find((item) => item.id == id);
  doc
    .useServiceAccountAuth({
      client_email: process.env.SERVICE_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY,
    })
    .then(() => {
      doc.loadInfo().then(() => {
        const sheet = doc.sheetsByIndex[0];
        sheet.getRows().then((rows) => {
          let data = rows.map((row) => {
            return row._rawData;
          });
          data.unshift(rows[0]._sheet.headerValues);
          res.json({
            sheetData: data,
            nameRow: currentSheet.nameRow,
            tasks: currentSheet.tasks,
          });
        });
      });
    });
});

app.get("/get-student-repo", (req, res) => {
  var gh = new GitHub({
    token: res.locals.currentUser.githubToken,
  });
  const username = req.query.username;
  const repo = req.query.repo;
  const filter = req.query.filter == undefined ? "" : req.query.filter;
  const commits = gh
    .getRepo(username, repo)
    .listCommits({ path: filter })
    .then((commits) => {
      let data = commits.data.map((commit) => {
        return {
          sha: commit.sha,
          message: commit.commit.message,
          date: commit.commit.author.date,
        };
      });
      data.forEach((commit) => {
        commit.date = new Date(commit.date);
      });
      console.log(data);
      const commitsLastDay = data.filter((commit) => {
        return (
          commit.date.getTime() >= new Date().getTime() - 24 * 60 * 60 * 1000
        );
      });
      const commitsLastWeek = data.filter((commit) => {
        return (
          commit.date.getDate() >=
            new Date().getTime() - 7 * 24 * 60 * 60 * 1000 &&
          commit.date.getTime() < new Date().getTime() - 24 * 60 * 60 * 1000
        );
      });
      const commitsLastMonth = data.filter((commit) => {
        return (
          commit.date.getTime() >=
            new Date().getTime() - 30 * 24 * 60 * 60 * 1000 &&
          commit.date.getTime() < new Date().getTime() - 7 * 24 * 60 * 60 * 1000
        );
      });
      res.json({
        commitsLastDay: commitsLastDay,
        commitsLastWeek: commitsLastWeek,
        commitsLastMonth: commitsLastMonth,
      });
    })
    .then(() => {
      console.log(commits);
    });
});

app.use(express.static(path.join(__dirname, "")));

app.listen(3000, () => console.log("app listening on port 3000!"));

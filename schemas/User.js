const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const User = mongoose.model(
  "User",
  new Schema({
    username: { type: String, required: true },
    password: { type: String, required: true },
    githubToken: { type: String, required: false },
    sheets: { type: Array, required: false },
  })
);

module.exports = User;

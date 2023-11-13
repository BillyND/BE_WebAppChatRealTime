const mongoose = require("mongoose");
const { isEmail } = require("validator");
var uniqueValidator = require("mongoose-unique-validator");

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
    },
    displayName: {
      type: String,
      default: "New User",
    },
    about: {
      type: String,
      default: "I'm a new user",
    },
    age: {
      type: Number,
      minlength: 14,
      default: 99,
    },
    email: {
      type: String,
      required: [true, "Required"],
      unique: true,
    },
    password: {
      type: String,
      required: [true, "Required"],
    },
    isAdmin: {
      type: Boolean,
      default: false,
    },
    profilePicture: {
      type: String,
      default:
        "https://preview.redd.it/rrz3hmsxcll71.png?width=640&crop=smart&auto=webp&s=87cc5ed38d8f088ef9fffef7a4c5756b64309d6a",
    },
    followers: {
      type: Array,
      default: [],
    },
    followings: {
      type: Array,
      default: [],
    },
    favorites: {
      type: Array,
      default: [],
    },
  },
  { timestamps: true }
);

userSchema.plugin(uniqueValidator, {
  message: "Error, expected {PATH} to be unique",
});

module.exports = mongoose.model("User", userSchema);

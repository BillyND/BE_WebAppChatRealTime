const mongoose = require("mongoose");
const { isEmail } = require("validator");
var uniqueValidator = require("mongoose-unique-validator");
const { defaultAvatarUser } = require("../utils/constant");

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, "Required"],
      minlength: [1, "Must be 1 characters or more"],
      maxlength: [50, "Must be 50 characters or less"],
    },
    about: {
      type: String,
      default: "I'm a new user",
    },
    age: {
      type: Number,
      minlength: 14,
      default: null,
    },
    email: {
      type: String,
      required: [true, "Required"],
      maxlength: [50, "Must be 50 characters or less"],
      unique: true,
      validate: [isEmail, "Please enter a valid email"],
    },
    password: {
      type: String,
      required: [true, "Required"],
      minlength: [6, "Must be 6 characters or more"],
    },
    isAdmin: {
      type: Boolean,
      default: false,
    },
    avaUrl: {
      type: String,
      default: defaultAvatarUser,
    },
    followers: {
      type: Array,
      default: [],
    },
    followings: {
      type: Array,
      default: [],
    },
    cloudinaryId: {
      type: String,
    },
  },
  { timestamps: true }
);

userSchema.plugin(uniqueValidator, {
  message: "Error, expected {PATH} to be unique",
});

module.exports = mongoose.model("User", userSchema);

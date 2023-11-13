const mongoose = require("mongoose");
const { defaultAvatarUser } = require("../utils/constant");
const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
    },
    password: String,
    username: String,
    avatar: {
      type: String,
      default: defaultAvatarUser,
    },
    age: String,
    gender: String,
    isAdmin: {
      type: Boolean,
      default: false,
    },
    posts: Array,
    followers: Array,
    following: Array,
    likedPosts: Array,
    friends: Array,
    profilePicture: String,
  },
  { timestamps: true }
);
const User = mongoose.model("ser", userSchema);
module.exports = User;

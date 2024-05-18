const mongoose = require("mongoose");

const postSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
    },
    username: {
      type: String,
    },
    userEmail: {
      type: String,
    },
    avaUrl: {
      type: String,
    },
    imageUrl: {
      type: String,
    },
    cloudinaryId: {
      type: String,
    },
    aspectRatio: {
      type: Number,
    },
    description: {
      type: String,
    },
    likerIds: {
      type: Array,
      default: [],
    },
    comments: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Post", postSchema);

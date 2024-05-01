const mongoose = require("mongoose");

const ConversationSchema = new mongoose.Schema(
  {
    members: {
      type: Array,
    },
    messageCount: {
      type: Number,
      default: 0,
    },
    usersRead: {
      type: Array,
      default: [],
    },
    color: {
      type: String,
      default: "#3797f0",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Conversation", ConversationSchema);

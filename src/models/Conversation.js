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
    user1: {
      userId: String,
      avaUrl: String,
      username: String,
      lastMessage: String,
      timeSendLast: Date,
    },
    user2: {
      userId: String,
      avaUrl: String,
      username: String,
      lastMessage: String,
      timeSendLast: Date,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Conversation", ConversationSchema);

const Conversation = require("../models/Conversation");
const conversationController = {
  createConversation: async (req, res) => {
    const { senderId, receiverId, user1, user2 } = rew.body || {};

    const newConversation = new Conversation({
      members: [senderId, receiverId, user1, user2],
    });
    try {
      const savedConversation = await newConversation.save();
      res.status(200).json(savedConversation);
    } catch (err) {
      res.status(500).json(err);
    }
  },

  getConversation: async (req, res) => {
    try {
      const conversation = await Conversation.find({
        members: { $in: [req.params.userId] },
      }).sort({ updatedAt: -1 });

      res.status(200).json(conversation);
    } catch (err) {
      res.status(500).json(err);
    }
  },

  // Get available conversation.
  getAvailableConversation: async (req, res) => {
    try {
      const conversation = await Conversation.findOne({
        members: { $all: [req.params.first, req.params.second] },
      });
      res.status(200).json(conversation);
    } catch (err) {
      res.status(500).json(err);
    }
  },
};

module.exports = conversationController;

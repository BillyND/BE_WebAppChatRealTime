const Conversation = require("../models/Conversation");
const Message = require("../models/Message");
const User = require("../models/User");
const conversationController = {
  createConversation: async (req, res) => {
    const { senderId, receiverId } = req.body || {};

    const newConversation = new Conversation({
      members: [senderId, receiverId],
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
      const { id: userId } = req.user || {};
      const receiverIds = [];

      const conversations = await Conversation.find({
        members: { $in: [userId] },
      }).sort({ updatedAt: -1 });

      conversations = conversations.map((conversation) => {
        const { members } = conversation || {};
        const receiverId = members.filter((member) => member !== userId)[0];
        conversation.receiverId = receiverId;
        receiverIds.push(receiverId);

        return conversation;
      });

      const receivers = await User.find({
        _id: {
          $in: receiverIds,
        },
      }).select(["avaUrl", "username", "email"]);

      const finalConversations = conversations.map((conversation) => {
        const { receiverId } = conversation || {};

        const receiverFounded = receivers.find(
          (receiver) => receiver._id === receiverId
        );

        conversation.receiver = receiverFounded;

        return conversation;
      });

      res.status(200).json(finalConversations);
    } catch (err) {
      res.status(500).json(err);
    }
  },

  getConversationByReceiver: async (req, res) => {
    try {
      const { receiverId } = req.params || {};
      const { id: currentUserId } = req.user || {};

      const receiver = await User.findById(receiverId).select([
        "avaUrl",
        "username",
        "email",
      ]);

      const conversation = await Conversation.findOne({
        $or: [
          { members: [currentUserId, receiverId] },
          { members: [receiverId, currentUserId] },
        ],
      }).sort({ updatedAt: -1 });

      const { _id: conversationId } = conversation || {};

      const listMessages = conversationId
        ? await Message.find({
            conversationId: conversationId,
          })
        : [];

      res.status(200).json({ receiver, listMessages, conversationId });
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

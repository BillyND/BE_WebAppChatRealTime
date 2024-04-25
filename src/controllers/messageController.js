const Message = require("../models/Message");
const Conversation = require("../models/Conversation");

const messageController = {
  // Handle create message.
  createMessage: async (req, res) => {
    try {
      const { id: sender } = req.user || {};
      const dataNewMessage = { ...(req.body || {}), sender };

      // Create a new message
      const newMessage = new Message(dataNewMessage);
      const savedMessage = await newMessage.save();

      // Update the message count in the conversation
      await Conversation.updateOne(
        { _id: req.body.conversationId },
        { $inc: { messageCount: 1 } }
      );

      res.status(200).json(savedMessage);
    } catch (error) {
      res.status(500).json(error);
    }
  },

  // Handle get message.
  getMessage: async (req, res) => {
    try {
      const { conversationId } = req.params || {};

      // Find messages by conversationId
      const messages = await Message.find({
        conversationId,
      });

      res.status(200).json(messages);
    } catch (error) {
      res.status(500).json(error);
    }
  },
};

module.exports = messageController;

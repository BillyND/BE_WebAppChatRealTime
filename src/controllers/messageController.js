const Message = require("../models/Message");
const Conversation = require("../models/Conversation");

const messageController = {
  createMessage: async (req, res) => {
    try {
      const newMessage = new Message(req.body);
      const savedMessage = await newMessage.save();

      await Conversation.updateOne(
        { _id: req.body.conversationId },
        { $inc: { messageCount: 1 } }
      );

      res.status(200).json(savedMessage);
    } catch (error) {
      res.status(500).json(error);
    }
  },
  getMessage: async (req, res) => {
    try {
      const messages = await Message.find({
        conversationId: req.params.conversationId,
      });
      res.status(200).json(messages);
    } catch (error) {
      res.status(500).json(error);
    }
  },
};

module.exports = messageController;

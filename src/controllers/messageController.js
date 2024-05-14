const Message = require("../models/Message");
const Conversation = require("../models/Conversation");
const { cloudinary } = require("../utils/cloudinary");

const messageController = {
  // Handle create message.
  createMessage: async (req, res) => {
    try {
      const { id: sender } = req.user || {};
      const { img, text, conversationId } = req.body || {};

      // Create a new message
      const newMessage = new Message({ img, text, conversationId, sender });
      const savedMessage = await newMessage.save();

      // Update the message count in the conversation
      Conversation.updateOne(
        { _id: req.body.conversationId },
        { $inc: { messageCount: 1 }, usersRead: [sender] }
      );

      // if (img) {
      //   cloudinary.uploader
      //     .upload(img)
      //     .then(async (data) => {
      //       await savedMessage.updateOne({
      //         $set: {
      //           img: data.secure_url,
      //           cloudinaryId: data.public_id,
      //         },
      //       });
      //     })
      //     .catch(() => {});
      // }

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
      }).lean();

      res.status(200).json(messages);
    } catch (error) {
      res.status(500).json(error);
    }
  },
};

module.exports = messageController;

const Conversation = require("../models/Conversation");
const Message = require("../models/Message");
const User = require("../models/User");
const conversationController = {
  createConversation: async (req, res) => {
    const { senderId, receiverId } = req.body || {};

    // Create a new conversation with the given senderId and receiverId
    const newConversation = new Conversation({
      members: [senderId, receiverId],
    });

    try {
      const [savedConversation, receiver] = await Promise.all([
        newConversation.save(),
        User.findById(receiverId).select("username email avaUrl"),
      ]);

      res.status(200).json({ ...savedConversation._doc, receiver });
    } catch (error) {
      res.status(500).json(error);
    }
  },

  getConversation: async (req, res) => {
    try {
      const { id: userId } = req.user || {};
      const receiverIds = [];

      // Find conversations where the user is a member
      const conversations = await Conversation.aggregate([
        {
          $match: {
            members: userId,
          },
        },
        {
          $sort: {
            updatedAt: -1,
          },
        },
        {
          $addFields: {
            receiverId: {
              $arrayElemAt: [
                {
                  $filter: {
                    input: "$members",
                    cond: { $ne: ["$$this", userId] },
                  },
                },
                0,
              ],
            },
          },
        },
      ]);

      // Extract receiverIds from conversations
      conversations.forEach((conversation) => {
        const { receiverId } = conversation;
        receiverIds.push(receiverId);
      });

      // Find receivers based on receiverIds
      const receivers = await User.find({
        _id: {
          $in: receiverIds,
        },
      }).select("avaUrl username email");

      // Aggregate lastMessage for each conversation
      const messagePipeline = [
        {
          $match: {
            conversationId: {
              $in: conversations.map((c) => c._id?.toString()),
            },
          },
        },
        {
          $sort: {
            createdAt: -1,
          },
        },
        {
          $group: {
            _id: "$conversationId",
            lastMessage: {
              $first: {
                sender: "$sender",
                text: "$text",
                timeSendLast: "$createdAt",
              },
            },
          },
        },
      ];

      const lastMessages = await Message.aggregate(messagePipeline);

      // Map lastMessage to conversations
      conversations.forEach((conversation) => {
        const { receiverId } = conversation;

        const receiverFounded = receivers.find(
          (receiver) => receiver._id.toString() === receiverId
        );

        const lastMessage = lastMessages.find(
          (message) => message._id.toString() === conversation._id.toString()
        );

        conversation.receiver = receiverFounded;
        conversation.lastMessage = lastMessage ? lastMessage.lastMessage : null;
        delete conversation.receiverId;
        delete conversation.members;
      });

      // Send the final conversations as a response
      res.status(200).json(conversations);
    } catch (err) {
      res.status(500).json(err);
    }
  },

  getConversationByReceiver: async (req, res) => {
    try {
      const { receiverId } = req.params || {};
      const { id: currentUserId } = req.user || {};

      const [receiver, conversation] = await Promise.all([
        User.findById(receiverId).select("avaUrl username email"),
        Conversation.findOne({
          members: { $all: [currentUserId, receiverId] },
        }).sort({ updatedAt: -1 }),
      ]);

      const conversationId = conversation?._id;

      const listMessages = conversationId
        ? await Message.find({ conversationId }).select("-conversationId -__v")
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

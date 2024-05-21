const Conversation = require("../models/Conversation");
const Message = require("../models/Message");
const User = require("../models/User");
const conversationController = {
  createConversation: async (req, res) => {
    const { senderId, receiverId } = req.body || {};

    const existConversation = await Conversation.findOne({
      members: [senderId, receiverId],
    });

    // Create a new conversation with the given senderId and receiverId
    const newConversation = new Conversation({
      members: [senderId, receiverId],
    });

    try {
      const [savedConversation, receiver] = await Promise.all([
        existConversation || newConversation.save(),
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
        {
          $match: {
            receiverId: { $exists: true },
          },
        },
        {
          $unset: "updatedAt",
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
                img: "$img",
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

      conversations.sort((a, b) => {
        const timeSendLastA = a.lastMessage ? a.lastMessage.timeSendLast : 0;
        const timeSendLastB = b.lastMessage ? b.lastMessage.timeSendLast : 0;
        return timeSendLastB - timeSendLastA;
      });

      // Send the final conversations as a response
      res.status(200).json(conversations);
    } catch (err) {
      res.status(500).json(err);
    }
  },

  getConversationByReceiver: async (req, res) => {
    try {
      const page = parseInt(req.query?.page);
      const limit = parseInt(req.query?.limit);
      const { receiverId } = req.params || {};
      const { id: currentUserId } = req.user || {};

      if (receiverId === currentUserId) {
        return res.status(500).json({
          success: 0,
          message: "Do not retrieve data from the current user",
        });
      }

      const [receiver, conversation] = await Promise.all([
        User.findById(receiverId).select("avaUrl username email"),

        Conversation.findOne({
          members: { $all: [currentUserId, receiverId] },
        }).sort({ updatedAt: -1 }),
      ]);

      const conversationId = conversation?._id;
      const conversationColor = conversation?.color;

      const totalMessage = await Message.countDocuments({ conversationId });
      const startIndex = (page - 1) * limit;
      const endIndex = page * limit;

      const listMessages = conversationId
        ? await Message.find({ conversationId })
            .select("-conversationId -__v -createdAt")
            .sort({ updatedAt: -1 })
            .skip(startIndex)
            .limit(limit)
        : [];

      const resultsPaginated = {};

      resultsPaginated.next =
        endIndex < totalMessage ? { page: page + 1, limit } : null;

      if (startIndex > 0) {
        resultsPaginated.previous = { page: page - 1, limit };
      }

      res.status(200).json({
        receiver,
        listMessages,
        conversationId,
        conversationColor,
        ...resultsPaginated,
      });
    } catch (err) {
      res.status(500).json(err);
    }
  },

  // Update users read conversation.
  updateUsersReadConversation: async (req, res) => {
    try {
      const { conversationId, messageId } = req.body || {};
      const { id } = req.user || {};

      const updatedConversation = await Conversation.findOneAndUpdate(
        { _id: conversationId },
        {
          $addToSet: { usersRead: id },
          $set: { [`messageRead.${id}`]: messageId },
        },
        { new: true } // Return the updated document
      ).lean();

      res.status(200).json(updatedConversation);
    } catch (err) {
      res.status(500).json(err);
    }
  },

  // Update style conversation.
  updateStyleConversation: async (req, res) => {
    try {
      const { conversationId, style } = req.body;
      const { id: userId } = req.user;

      // Find the conversation by ID and check if the user is a member
      const conversation = await Conversation.findOne({
        _id: conversationId,
        members: userId,
      }).lean();

      if (!conversation) {
        return res.status(403).json({
          message:
            "You are not a member of this conversation or the conversation does not exist",
        });
      }

      // Update the color
      const updatedConversation = await Conversation.findOneAndUpdate(
        { _id: conversationId },
        { color: style },
        { new: true } // Return the updated document
      ).lean();

      res.status(200).json(updatedConversation);
    } catch (err) {
      console.error("Error updating conversation color:", err);
      res.status(500).json({
        message: "An error occurred while updating the conversation color",
        error: err,
      });
    }
  },
};

module.exports = conversationController;

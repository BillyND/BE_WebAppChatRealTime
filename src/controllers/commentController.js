const Post = require("../models/Post");
const User = require("../models/User");
const Comment = require("../models/Comment");

const commentController = {
  //ADD A COMMENT
  addComment: async (req, res) => {
    try {
      const { ownerId } = req.body;
      const { id: postId } = req.params;
      const { username, avaUrl } = (await User.findById(ownerId)) || {};

      await Post.findOneAndUpdate({ _id: postId }, { $inc: { comments: 1 } });

      const makeComment = {
        ...req.body,
        postId: postId,
        username: username,
        avaUrl: avaUrl,
      };

      const newComment = new Comment(makeComment);
      const savedComment = await newComment.save();
      res.status(200).json(savedComment);
    } catch (err) {
      res.status(500).json(err);
    }
  },

  //GET ALL COMMENTS
  getAllComments: async (req, res) => {
    try {
      const comments = await Comment.find();
      res.status(200).json(comments);
    } catch (err) {
      res.status(500).json(err);
    }
  },

  //GET ALL COMMENTS IN A POST
  getCommentsInPost: async (req, res) => {
    try {
      const { id: postId } = req.params;
      const comments = await Comment.find({ postId });
      res.status(200).json(comments);
    } catch (err) {
      res.status(500).json(err);
    }
  },

  //DELETE COMMENT
  deleteComment: async (req, res) => {
    try {
      const { id: commentId } = req.params;
      const comment = await Comment.findById(commentId);
      await Comment.findByIdAndDelete(commentId);
      await Post.findOneAndUpdate(
        { _id: comment.postId },
        { $inc: { comments: -1 } }
      );
      res.status(200).json("Delete comment successfully");
    } catch (err) {
      res.status(500).json(err);
    }
  },

  //UPDATE COMMENT
  updateComment: async (req, res) => {
    try {
      const { id: commentId } = req.params;
      const { content } = req.body;
      let comment = await Comment.findOneAndUpdate(
        {
          _id: commentId,
        },
        { content }
      );

      comment.content = content;

      res.status(200).json({
        message: "Update comment successfully",
        data: comment,
      });
    } catch (err) {
      res.status(500).json(err);
    }
  },
};

module.exports = commentController;

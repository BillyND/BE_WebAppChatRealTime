const User = require("../models/User");
const Post = require("../models/Post");
const Comment = require("../models/Comment");
const bcrypt = require("bcrypt");
const authController = require("./authController");

const userController = {
  //GET A USER
  getUser: async (req, res) => {
    try {
      const user = await User.findById(req.params.id);
      res.status(200).json(user);
    } catch (err) {
      res.status(500).json(err);
    }
  },

  //GET ALL USERS
  getAllUsers: async (req, res) => {
    try {
      res.status(200).json(res.paginatedResults);
    } catch (err) {
      return res.status(500).json(err);
    }
  },

  //DELETE A USER
  deleteUser: async (req, res) => {
    const { userId } = req.body;
    const { id } = req.params;

    if (userId === id) {
      try {
        await User.findByIdAndDelete(id);
        res.status(200).json("User deleted");
      } catch (err) {
        res.status(500).json(err);
      }
    } else {
      res.status(403).json("You can only delete your account");
    }
  },

  //UPDATE A USER
  updateUser: async (req, res) => {
    try {
      if (req.body.password) {
        const salt = await bcrypt.genSalt(10);
        req.body.password = await bcrypt.hash(req.body.password, salt);
      }

      const { id } = req.params;
      const updatedUser = await User.findByIdAndUpdate(
        id,
        { $set: req.body },
        { new: true }
      ).select("+password");

      const accessToken = await authController.generateAccessToken(updatedUser);

      if (req.body.avaUrl) {
        try {
          await Promise.all([
            Post.updateMany(
              { userId: id },
              {
                $set: {
                  avaUrl: req.body.avaUrl,
                },
              }
            ),
            Comment.updateMany(
              { ownerId: id },
              {
                $set: {
                  avaUrl: req.body.avaUrl,
                },
              }
            ),
          ]);
        } catch (err) {
          return res.status(500).json(err);
        }
      }

      const returnedUser = {
        ...updatedUser._doc,
        accessToken: accessToken,
      };
      res.status(200).json(returnedUser);
    } catch (err) {
      res.status(500).json(err);
    }
  },

  // FOLLOW/UNFOLLOW A USER
  followUser: async (req, res) => {
    const { userId } = req.body;
    const { id } = req.params;

    if (userId === id) {
      return res.status(403).json("You can't follow yourself");
    }

    try {
      const user = await User.findById(id);
      const isFollowing = user.followers.includes(userId);

      if (!isFollowing) {
        await Promise.all([
          User.findByIdAndUpdate(id, { $push: { followers: userId } }),
          User.findByIdAndUpdate(
            userId,
            { $push: { followings: id } },
            { new: true }
          ),
        ]);
      } else {
        await Promise.all([
          User.findByIdAndUpdate(id, { $pull: { followers: userId } }),
          User.findByIdAndUpdate(
            userId,
            { $pull: { followings: id } },
            { new: true }
          ),
        ]);
      }

      const updatedUser = await User.findById(userId);
      res.status(200).json(updatedUser);
    } catch (err) {
      res.status(500).json(err);
    }
  },

  //SEARCH USERS BY NAME/EMAIL
  searchAllUser: async (req, res) => {
    try {
      const { username } = req.body || {};

      const users = await User.find({
        $or: [
          { username: { $regex: username, $options: "i" } },
          { email: { $regex: username, $options: "i" } },
        ],
      });

      res.status(200).json(users);
    } catch (err) {
      res.status(500).json(err);
    }
  },

  //SAVE PROFILE USER
  saveProfileUser: async (req, res) => {
    try {
      const { username, about } = req.body || {};
      const { id: userId } = req.user || {};

      if (!username.trim()) {
        return res.status(200).json(null);
      }

      await User.updateOne(
        { _id: userId },
        { username: username?.trim(), about: about?.trim() }
      );
      const userUpdated = await User.findById(userId);

      res.status(200).json(userUpdated);
    } catch (err) {
      res.status(500).json(err);
    }
  },
};

module.exports = userController;

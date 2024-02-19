const User = require("../models/User");
const Post = require("../models/Post");
const Comment = require("../models/Comment");
const bcrypt = require("bcrypt");
const authController = require("./authController");
const { cloudinary } = require("../utils/cloudinary");

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
      // Extracting necessary data from request body and user object
      const { username, about, avaUrl } = req.body || {};
      const { id: userId } = req.user || {};

      // If username is empty, return null response with a message
      if (!username.trim()) {
        return res.status(200).json({ message: "Username cannot be empty." });
      }

      // Find the user by their ID
      const user = await User.findById(userId);

      // Prepare updated data for user
      let dataUpdated = {
        username: username?.trim(),
        about: about?.trim(),
      };

      // If there's a new avatar URL and it's different from the current one
      if (avaUrl && avaUrl.trim() !== user.avaUrl.trim()) {
        // Delete the previous avatar from cloudinary
        cloudinary.uploader.destroy(user.cloudinaryId);

        // Upload the new avatar to cloudinary
        const result = await cloudinary.uploader.upload(avaUrl);

        // Update data with new avatar URL and cloudinary ID
        dataUpdated = {
          ...dataUpdated,
          avaUrl: result.secure_url,
          cloudinaryId: result.public_id,
        };

        // Update the avatar URL in all posts by this user
        await Post.updateMany(
          { userId: userId },
          { avaUrl: result.secure_url }
        );
      }

      // Update user information
      await user.updateOne({ $set: dataUpdated });
      const updatedUser = await User.findById(userId);

      res.status(200).json(updatedUser);
    } catch (err) {
      res.status(500).json(err);
    }
  },
};

module.exports = userController;

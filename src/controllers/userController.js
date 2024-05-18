const User = require("../models/User");
const Post = require("../models/Post");
const Comment = require("../models/Comment");
const bcrypt = require("bcrypt");
const authController = require("./authController");
const { cloudinary } = require("../utils/cloudinary");
const { apiReportProblem } = require("../utils/constant");
const { fetch } = require("../utils/utilities");

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

  // Follow/Un-follow a user
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
      const { id: currentUserId } = req.user || {};

      const users = await User.find(
        {
          $and: [
            { _id: { $ne: currentUserId } },
            {
              $or: [
                { username: { $regex: username.trim(), $options: "i" } },
                { email: { $regex: username.trim(), $options: "i" } },
              ],
            },
          ],
        },
        {
          avaUrl: 1,
          email: 1,
          username: 1,
          avatar: 1,
          followings: 1,
        }
      );

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

      // Check if username exists and is not empty
      if (!username || !username.trim()) {
        return res.status(400).json({ message: "Username is required." });
      }

      // Find the user by their ID
      let user = await User.findById(userId);

      // If user not found, return error
      if (!user) {
        return res.status(404).json({ message: "User not found." });
      }

      const dataUpdated = {
        username: username.trim(),
        about: about ? about.trim() : user.about,
        avaUrl: avaUrl ? avaUrl.trim() : user.avaUrl,
      };

      await Promise.all([
        // Update the avatar URL and username in posts
        Post.updateMany(
          { userId },
          { avaUrl: dataUpdated.avaUrl, username: dataUpdated.username }
        ),

        // Update the avatar URL and username in comments
        Comment.updateMany(
          { ownerId: userId },
          { avaUrl: dataUpdated.avaUrl, username: dataUpdated.username }
        ),

        // Update user information
        user.updateOne({ $set: dataUpdated }),
      ]);

      // If there's a new avatar URL and it's different from the current one
      if (!avaUrl.includes("res.cloudinary")) {
        // Delete the previous avatar from cloudinary
        cloudinary.uploader.destroy(user.cloudinaryId).catch(() => {});

        // Upload the new avatar to cloudinary
        cloudinary.uploader
          .upload(avaUrl)
          .then(async (data) => {
            dataUpdated.avaUrl = data.secure_url;
            dataUpdated.cloudinaryId = data.public_id;

            // Create an array of promises to be performed
            await Promise.all([
              // Update the avatar URL and username in posts
              Post.updateMany(
                { userId },
                { avaUrl: dataUpdated.avaUrl, username: dataUpdated.username }
              ),

              // Update the avatar URL and username in comments
              Comment.updateMany(
                { ownerId: userId },
                { avaUrl: dataUpdated.avaUrl, username: dataUpdated.username }
              ),

              // Update user information
              user.updateOne({ $set: dataUpdated }),
            ]);
          })
          .catch((err) => console.log("===>Error saveProfileUser:", err));
      }

      // Send updated user information as response
      res.status(200).json({ ...user?._doc, ...req.body });
    } catch (err) {
      // If an error occurs, log the error and send an internal server error response
      console.error(err);
      res.status(500).json({ message: "Internal server error." });
    }
  },

  reportProblem: async (req, res) => {
    try {
      const { id } = req.user || {};
      const { detailProblem } = req.body || {};
      const user = await User.findById(id);
      const { email } = user || {};

      if (!detailProblem?.trim()) {
        return res.status(200).json({
          success: 0,
          message: "Detail problem cannot be left blank!",
        });
      }

      const resReportProblem = await fetch(apiReportProblem, {
        method: "POST",
        body: JSON.stringify({
          detailProblem,
          userEmail: email,
        }),
      }).then((res) => res.json());

      res.status(200).json({
        success: 1,
        ...resReportProblem,
      });
    } catch (error) {
      console.log("===>erroe", error);
      res.status(500).json({
        message: "Server error!",
        error,
      });
    }
  },
};

module.exports = userController;

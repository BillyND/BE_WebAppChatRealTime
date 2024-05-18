const Post = require("../models/Post");
const User = require("../models/User");
const { cloudinary } = require("../utils/cloudinary");

const postController = {
  // Create Post
  createPost: async (req, res) => {
    try {
      const users = await User.findById(req.body.userId);
      const { description, imageUrl, userId } = req.body || {};

      const makePost = {
        description,
        imageUrl,
        userId,
        username: users.username,
        avaUrl: users.avaUrl,
        userEmail: users.email,
      };

      const newPost = new Post(makePost);
      const savedPost = await newPost.save();

      if (imageUrl) {
        cloudinary.uploader
          .upload(imageUrl)
          .then(async (data) => {
            const { width, height } = data || {};

            await savedPost.updateOne({
              $set: {
                ...makePost,
                imageUrl: data.secure_url,
                cloudinaryId: data.public_id,
                aspectRatio: Number(width) / Number(height),
              },
            });
          })
          .catch((error) => {
            console.error("===>Error upload image post", error);
          });
      }

      res.status(200).json({
        EC: 0,
        message: "Create post success!",
        data: savedPost,
      });
    } catch (err) {
      res.status(500).json({
        EC: 1,
        message: "Server error!",
        err,
      });
    }
  },

  // Update post
  updatePost: async (req, res) => {
    try {
      // Find the post by its ID
      const post = await Post.findById(req.params.postId.trim());
      const { imageUrl: newImageUrl = "" } = req.body || {};

      await post.updateOne({
        $set: {
          ...req.body,
          imageUrl: newImageUrl,
        },
      });

      // If the current image URL is different from the new one, update the image
      if (
        !newImageUrl?.includes("res.cloudinary") &&
        post.userId === req.params.userId
      ) {
        // Delete the previous image from cloudinary
        cloudinary.uploader.destroy(post.cloudinaryId).catch(() => {});

        // Upload the new image to cloudinary
        cloudinary.uploader
          .upload(newImageUrl)
          .then(async (data) => {
            const { width, height } = data || {};
            const newResultImage = {};

            // Prepare data for the new image
            newResultImage.imageUrl = data?.secure_url;
            newResultImage.cloudinaryId = data?.public_id;
            newResultImage.aspectRatio = Number(width) / Number(height);

            // Update the post and return success message
            await post.updateOne({
              $set: {
                ...req.body,
                ...newResultImage,
              },
            });
          })
          .catch((err) => console.log("===>Error updatePost:", err));
      }

      // Check if the user is the owner of the post
      if (post.userId === req.params.userId) {
        res.status(200).json({
          EC: 0,
          message: "Post has been updated",
        });
      } else {
        res.status(403).json("You can only update your post");
      }
    } catch (err) {
      console.error("===> Error updatePost:", err);
      res.status(500).json(err);
    }
  },

  // Delete post
  deletePost: async (req, res) => {
    try {
      const post = await Post.findById(req.params.id);
      await Post.findByIdAndDelete(req.params.id);

      if (post.cloudinaryId) {
        await cloudinary.uploader.destroy(post.cloudinaryId);
      }
      res.status(200).json("Delete post successfully");
    } catch (err) {
      res.status(500).json(err);
    }
  },

  // Get all posts from user id
  getPostsFromOne: async (req, res) => {
    try {
      const post = await Post.find({ userId: req.params.id });
      res.status(200).json(post);
    } catch (err) {
      res.status(500).json(err);
    }
  },

  // Get all posts from user followings
  getFriendsPost: async (req, res) => {
    try {
      const currentUser = await User.findById(req.body.userId);
      const userPost = await Post.find({ userId: req.body.userId });
      const friendPost = await Promise.all(
        currentUser.followings.map((friendId) => {
          return Post.find({ userId: friendId });
        })
      );
      res.status(200).json(userPost.concat(...friendPost));
    } catch (err) {
      res.status(500).json(err);
    }
  },

  // Get all posts
  getAllPosts: async (req, res) => {
    try {
      res.status(200).json(res.paginatedResults);
    } catch (err) {
      return res.status(500).json(err);
    }
  },

  // Get one post
  getAPost: async (req, res) => {
    try {
      const post = await Post.findById(req.params.id);
      res.status(200).json(post);
    } catch (err) {
      return res.status(500).json(err);
    }
  },

  // Like post
  likesPost: async (req, res) => {
    try {
      const postId = req.params.id.trim();
      const { userId = "" } = req.body || {};
      const post = await Post.findById(postId);
      let { likerIds = [] } = post || {};

      if (likerIds.includes(userId)) {
        likerIds = likerIds.filter((liker) => liker !== userId);
      } else {
        likerIds.push(userId);
      }

      await post.updateOne({ likerIds: likerIds });
      post.likerIds = likerIds;

      return res.status(200).json({
        data: post,
        message: "Update liker of Post successfully!",
      });
    } catch (error) {
      return res.status(500).json(error);
    }
  },

  // Add post to favorite
  addFavoritePost: async (req, res) => {
    try {
      const user = await User.findById(req.body.userId);
      //if post is not in favorite yet
      if (!user.favorites.includes(req.params.id)) {
        await User.findByIdAndUpdate(
          { _id: req.body.userId },
          {
            $push: { favorites: req.params.id },
          },
          { returnDocument: "after" }
        );
        return res.status(200).json("added to favorites");
      } else {
        await User.findByIdAndUpdate(
          { _id: req.body.userId },
          {
            $pull: { favorites: req.params.id },
          }
        );
        return res.status(200).json("removed from favorites");
      }
    } catch (err) {
      res.status(500).json(err);
    }
  },

  // Get favorite post
  getFavoritePosts: async (req, res) => {
    try {
      const currentUser = await User.findById(req.body.userId);
      const favoritePost = await Promise.all(
        currentUser.favorites.map((id) => {
          return Post.findById(id);
        })
      );
      res.status(200).json(favoritePost);
    } catch (err) {
      res.status(500).json(err);
    }
  },
};

module.exports = postController;

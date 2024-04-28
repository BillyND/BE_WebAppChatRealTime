const Post = require("../models/Post");
const User = require("../models/User");

const formattedGmt7Date = (time) => {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Bangkok",
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(new Date());
};

const processUpdateAllPost = async () => {
  const allPosts = await Post.find({});

  const allListPostDontHaveUserEmail = allPosts.filter(
    (post) => !post.userEmail
  );

  allListPostDontHaveUserEmail.forEach(async (post) => {
    const { userId } = post || {};
    const infoUser = await User.findById(userId);
    const { email } = infoUser || {};

    const resUpdatePost = await Post.updateOne(
      { _id: post._id },
      { $set: { userEmail: email } },
      { upsert: true }
    );

    console.log("===>resUpdatePost:", allListPostDontHaveUserEmail);
  });
};

// Import code-fetch
const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));

module.exports = { formattedGmt7Date, processUpdateAllPost, fetch };

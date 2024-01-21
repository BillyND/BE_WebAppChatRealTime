const router = require("express").Router();
const commentController = require("../controllers/commentController");
const postController = require("../controllers/postController");
const upload = require("../utils/multer");
const middlewareController = require("../controllers/middlewareController");
const Post = require("../models/Post");

//CREATE A POST
router.post(
  "/",
  upload.single("image"),
  middlewareController.verifyToken,
  postController.createPost
);

//UPDATE A POST
router.put(
  "/:id",
  middlewareController.verifyTokenAndUserPostAuthorization,
  postController.updatePost
);

//DELETE A POST
router.delete(
  "/:id/:userId",
  middlewareController.verifyTokenAndUserPostAuthorization,
  postController.deletePost
);

//GET A POST
router.get(
  "/fullpost/:id",
  middlewareController.verifyToken,
  postController.getAPost
);

//GET ALL POST FROM A USER
router.get(
  "/user/:id",
  middlewareController.verifyToken,
  postController.getPostsFromOne
);

//GET ALL POSTS
router.get(
  "/",
  middlewareController.verifyToken,
  middlewareController.paginatedResult(Post),
  postController.getAllPosts
);

//GET TIMELINE POST
router.post(
  "/timeline",
  middlewareController.verifyToken,
  postController.getFriendsPost
);

//UPDATE LIKE A POST
router.post(
  "/likes/:id",
  middlewareController.verifyToken,
  postController.likesPost
);

router.put(
  "/:id/favorite",
  middlewareController.verifyToken,
  postController.addFavoritePost
);

//ADD A COMMENT
router.post(
  "/comment/:id",
  middlewareController.verifyToken,
  commentController.addComment
);

//GET ALL COMMENTS
router.get(
  "/comments",
  middlewareController.verifyToken,
  commentController.getAllComments
);

//GET FAVORITE POSTS
router.get(
  "/favorites",
  middlewareController.verifyToken,
  postController.getFavoritePosts
);

//GET ALL COMMENTS IN A POST
router.get(
  "/comment/:id",
  middlewareController.verifyToken,
  commentController.getCommentsInPost
);

//DELETE A COMMENT
router.delete(
  "/comment/:id/:ownerId",
  middlewareController.verifyTokenAndCommentAuthorization,
  commentController.deleteComment
);
module.exports = router;

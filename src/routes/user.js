const router = require("express").Router();
const middlewareController = require("../controllers/middlewareController");
const userController = require("../controllers/userController");
const User = require("../models/User");

//UPDATE A USER
router.put(
  "/:id",
  middlewareController.verifyTokenAndUserAuthorization,
  userController.updateUser
);

//DELETE A USER
router.delete(
  "/:id",
  middlewareController.verifyTokenAndUserAuthorization,
  userController.deleteUser
);

//GET A USER
router.get("/:id", middlewareController.verifyToken, userController.getUser);

//GET ALL USERS
router.get(
  "/",
  middlewareController.verifyToken,
  middlewareController.paginatedResult(User),
  userController.getAllUsers
);

//FOLLOW A USER
router.put(
  "/:id/follow",
  middlewareController.verifyToken,
  userController.followUser
);

//SEARCH FOR USERS
router.post(
  "/search",
  middlewareController.verifyToken,
  userController.searchAllUser
);

module.exports = router;

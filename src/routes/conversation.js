const router = require("express").Router();
const middlewareController = require("../controllers/middlewareController");
const conversationController = require("../controllers/conversationController");

//CREATE CONVERSATION
router.post(
  "/",
  middlewareController.verifyToken,
  conversationController.createConversation
);

//GET CONVERSATION OF A USER
router.get(
  "/:userId",
  middlewareController.verifyToken,
  conversationController.getConversation
);

//GET CONVERSATION BY RECEIVER
router.get(
  "/receiver/:receiverId",
  middlewareController.verifyToken,
  conversationController.getConversationByReceiver
);

// Update users read conversation
router.put(
  "/users-read",
  middlewareController.verifyToken,
  conversationController.updateUsersReadConversation
);

// Update style conversation
router.put(
  "/style",
  middlewareController.verifyToken,
  conversationController.updateStyleConversation
);

module.exports = router;

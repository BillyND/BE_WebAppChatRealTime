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

//GET AVAILABLE CONVERSATIONS BETWEEN USERS
router.get(
  "/find/:first/:second",
  middlewareController.verifyToken,
  conversationController.getAvailableConversation
);

module.exports = router;

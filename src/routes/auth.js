const router = require("express").Router();
const authController = require("../controllers/authController");
const middlewareController = require("../controllers/middlewareController");

//GET INFO USER
router.get(
  "/user",
  middlewareController.verifyToken,
  authController.getInfoUser
);

//REGISTER
router.post("/register", authController.registerUser);

//REFRESH TOKEN
router.post("/refresh", authController.requestRefreshToken);

//LOG IN
router.post("/login", authController.loginUser);

//LOG OUT
router.post("/logout", middlewareController.verifyToken, authController.logOut);
module.exports = router;

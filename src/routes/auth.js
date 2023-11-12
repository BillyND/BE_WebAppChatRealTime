const authRouter = require("express").Router();
const authController = require("../controllers/authControllers");
const middlewareControllers = require("../controllers/middlewareControllers");

// Route to check token validity
authRouter.post("/check", middlewareControllers.verifyToken);

// Route to register a new user
authRouter.post("/register", authController.registerUser);

// Route to log in a user
authRouter.post("/login", authController.loginUser);

// Route to refresh tokens
authRouter.post("/refresh", authController.requestRefreshToken);

// Route to log out a user
authRouter.post(
  "/logout",
  middlewareControllers.verifyToken,
  authController.logoutUser
);

// Route to retrieve user account information
authRouter.get(
  "/account",
  middlewareControllers.verifyToken,
  authController.fetchAccount
);

module.exports = authRouter;

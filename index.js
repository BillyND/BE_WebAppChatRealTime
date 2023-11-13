// Load environment variables
require("dotenv").config();

// Import necessary modules
const cors = require("cors");
const express = require("express");
const connection = require("./src/config/database");
const authRoute = require("./src/routes/auth");
const postRoute = require("./src/routes/post");
const userRoute = require("./src/routes/user");
const messageRoute = require("./src/routes/message");
const conversationRoute = require("./src/routes/conversation");
const cookieParser = require("cookie-parser");

const app = express();

// Set environment variables
const port = process.env.PORT;
const hostname = process.env.HOST_NAME;

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Enable CORS for all routes
app.use(cors());
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Default route to check if the server is running
app.get("/", (req, res) => {
  res.send({
    EC: 0,
    message: "<=== Web chat API is running ===>",
  });
});

// Route for triggering an action
app.get("/v1/api/trigger", (req, res) => {
  res.send({
    EC: 0,
    message: "<=== Trigger API successfully triggered! ===>",
  });
});

// Routes setup
app.use("/v1/api/auth", authRoute);
app.use("/v1/api/post", postRoute);
app.use("/v1/api/users", userRoute);
app.use("/v1/api/conversation", conversationRoute);
app.use("/v1/api/message", messageRoute);

// Connect to the database and start the server
(async () => {
  try {
    await connection();
    app.listen(port, hostname, () => {
      console.log(`>>> Web chat is running on port ${port}`);
    });
  } catch (error) {
    console.log(">>> Error connecting to the database", error);
  }
})();

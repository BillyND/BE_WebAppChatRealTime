// Load environment variables
require("dotenv").config();

// Import necessary modules
const cors = require("cors");
const express = require("express");
const cookieParser = require("cookie-parser");
const connection = require("./src/config/database");
const authRoute = require("./src/routes/auth");
const postRoute = require("./src/routes/post");
const userRoute = require("./src/routes/user");
const messageRoute = require("./src/routes/message");
const conversationRoute = require("./src/routes/conversation");
const { formattedGmt7Date } = require("./src/utils/utilities");
const setupSocketIO = require("./src/socketManager");
const Post = require("./src/models/Post");

let timerCronjobSocket;
let cronjobData = {};

// Initialize express app
const app = express();

// Set up environment variables
const port = process.env.PORT;
const hostname = process.env.HOST_NAME;
const socketUrl = process.env.SOCKET_URL;
const productionUrl = process.env.PRODUCTION_URL;
const timeDelayCronjob = process.env.TIME_DELAY_CRONJOB;

// Set up socket.io server
const httpServer = setupSocketIO(app);

// Express middleware
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
app.use(cors());
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Default route
app.get("/", async (req, res) => {
  const numberPosts = await Post.countDocuments({});

  res.send({
    EC: 0,
    message: `<=== Web chat API is running on port ${port} ===>`,
    numberPosts,
    cronjobData,
  });
});

app.post("/", async (req, res) => {
  const numberPosts = await Post.countDocuments({});

  console.log("===>?here");

  res.send({
    EC: 0,
    message: `<=== Web chat API is running on port ${port} ===>`,
    numberPosts,
    cronjobData,
  });
});

// Trigger API route
app.get("/v1/api/trigger", (req, res) => {
  res.send({
    EC: 0,
    message: "<=== Trigger API successfully triggered! ===>",
  });
});

// API routes setup
app.use("/v1/api/auth", authRoute);
app.use("/v1/api/post", postRoute);
app.use("/v1/api/users", userRoute);
app.use("/v1/api/conversation", conversationRoute);
app.use("/v1/api/message", messageRoute);

// Connect to the database and start the server
(async () => {
  try {
    await connection();
    httpServer.listen(port, hostname, () =>
      console.log(`<=== Server is running on port ${port} ===>`)
    );
  } catch (error) {
    console.log("===> Error connecting to the database", error);
  }
})();

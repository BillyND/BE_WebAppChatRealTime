// Load environment variables
require("dotenv").config();

// Import necessary modules
const cors = require("cors");
const express = require("express");
const socketio = require("socket.io");
const http = require("http");
const cookieParser = require("cookie-parser");
const connection = require("./src/config/database");
const authRoute = require("./src/routes/auth");
const postRoute = require("./src/routes/post");
const userRoute = require("./src/routes/user");
const messageRoute = require("./src/routes/message");
const conversationRoute = require("./src/routes/conversation");
const { formattedGmt7Date } = require("./src/utils/utilities");

let timerCronjobSocket;
let cronjobData = {};

// Import code-fetch
const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));

// Initialize express app
const app = express();

// Set up environment variables
const port = process.env.PORT;
const hostname = process.env.HOST_NAME;
const socketUrl = process.env.SOCKET_URL;
const productionUrl = process.env.PRODUCTION_URL;
const timeDelayCronjob = process.env.TIME_DELAY_CRONJOB;

// Set up socket.io server
const httpServer = http.createServer(app);
const io = socketio(httpServer, {
  cors: {
    origin: "*",
  },
});

// Object to store user information and their socketIds
let users = {};

const getOtherSocketIds = (currentSocketId) =>
  Object.values(users).filter((item) => item !== currentSocketId);

// Socket.io functions
const handleUpdatePost = (post, targetSocketId) => {
  const { userId } = post || {};
  const currentSocketId = users[userId];

  io.to(getOtherSocketIds(currentSocketId)).emit("getPost", {
    ...post,
    targetSocketId,
  });
};

const handleUpdateComment = (comment, targetSocketId) => {
  io.emit("getComment", { ...comment, targetSocketId });
};

const handleAddUser = (userId, socketId) => {
  users[userId] = socketId;
  io.emit("getUsers", users);
};

const handleDisconnect = (socketId) => {
  // Remove user from the list upon disconnection
  const disconnectedUserId = Object.keys(users).find(
    (userId) => users[userId] === socketId
  );
  if (disconnectedUserId) {
    delete users[disconnectedUserId];
    io.emit("getUsers", users);
  }
};

// Socket.io event listeners
io.on("connection", (socket) => {
  console.log("===>connection:", socket.id);

  // Register events from client
  socket.on("updatePost", (post) => handleUpdatePost(post, socket.id));
  socket.on("updateComment", (comment) =>
    handleUpdateComment(comment, socket.id)
  );
  socket.on("addUser", (userId) => handleAddUser(userId, socket.id));
  socket.on("disconnect", () => handleDisconnect(socket.id));
});

// Express middleware
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
app.use(cors());
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Default route
app.get("/", (req, res) => {
  res.send({
    EC: 0,
    message: `<=== Web chat API is running on port ${port} ===>`,
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
    cronjobSocketUrl();
  } catch (error) {
    console.log("===> Error connecting to the database", error);
  }
})();

const cronjobSocketUrl = (force) => {
  clearInterval(timerCronjobSocket);
  timerCronjobSocket = setInterval(() => {
    fetch(socketUrl)
      .then((res) => res.json())
      .then((data) => {
        cronjobData = {
          ...cronjobData,
          socket: {
            time: formattedGmt7Date(),
          },
        };
      })
      .catch((error) => console.log("===>Error trigger socket:", error));

    fetch(productionUrl)
      .then((res) => res.json())
      .then((data) => {
        cronjobData = {
          ...cronjobData,
          api: {
            time: formattedGmt7Date(),
          },
        };
      })
      .catch((error) => console.log("===>Error trigger socket:", error));
  }, timeDelayCronjob);
};

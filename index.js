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

//Config socket.io
const socketio = require("socket.io");
const http = require("http");
const server = http.createServer(app);
const SOCKET_PORT = process.env.SOCKET_PORT || 8082;

server.listen(
  SOCKET_PORT,
  () => `<=== Socket is running on port ${SOCKET_PORT} ===>`
);

const io = socketio(server, {
  cors: {
    origin: "*",
  },
});

let users = [];

const addUser = (userId, socketId) => {
  !users.some((user) => user.userId === userId) &&
    users.push({ userId, socketId });
};

const removeUser = (socketId) => {
  users = users.filter((user) => user.socketId !== socketId);
};

const getUser = (userId) => {
  return users.find((user) => user.userId === userId);
};
let initData;

io.on("connection", (socket) => {
  console.log("===> user connected");
  socket.on("initData", (data) => {
    initData = data;
    io.emit("getData", initData);
  });

  socket.on("changeData", (data) => {
    initData = data;
    io.emit("getData", initData);
  });

  socket.on("addUser", (userId) => {
    console.log("===> user:", userId);
    addUser(userId, socket.id);
    io.emit("getUsers", users);
  });

  //send, get message
  socket.on("sendMessage", ({ senderId, receiverId, text }) => {
    console.log("users: " + users);
    const user = getUser(receiverId);
    console.log(user);
    io.to(user?.socketId).emit("getMessage", {
      senderId,
      text,
    });
  });

  socket.on("disconnect", () => {
    console.log("===> user disconnected");
    removeUser(socket.id);
    io.emit("getUsers", users);
  });
});

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
    message: `<=== Web chat API is running on port ${port} ===>`,
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
      console.log(`===> Web chat is running on port ${port}`);
    });
  } catch (error) {
    console.log("===> Error connecting to the database", error);
  }
})();

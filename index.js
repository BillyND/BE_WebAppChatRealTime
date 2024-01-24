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

// Initialize express app
const app = express();

// Set up environment variables
const port = process.env.PORT;
const hostname = process.env.HOST_NAME;

// Set up socket.io server
const httpServer = http.createServer(app);
const io = socketio(httpServer, {
  cors: {
    origin: "*",
  },
});

let users = [];
let initData;

// Socket.io functions
const handleInitData = (data) => {
  initData = data;
  io.emit("getData", initData);
};

const handleChangeData = (data) => {
  initData = data;
  io.emit("getData", initData);
};

const handleAddUser = (userId, socketId) => {
  !users.some((user) => user.userId === userId) &&
    users.push({ userId, socketId });
  io.emit("getUsers", users);
};

const handleSendMessage = ({ senderId, receiverId, text }) => {
  const user = getUser(receiverId);
  io.to(user?.socketId).emit("getMessage", { senderId, text });
};

const handleDisconnect = (socketId) => {
  io.emit("getUsers", users);
};

// Socket.io event listeners
io.on("connection", (socket) => {
  console.log("===> user connected");

  socket.on("initData", handleInitData);
  socket.on("changeData", handleChangeData);
  socket.on("addUser", (userId) => handleAddUser(userId, socket.id));
  socket.on("sendMessage", handleSendMessage);
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
      console.log(`<=== Socket is running on port ${port} ===>`)
    );
  } catch (error) {
    console.log("===> Error connecting to the database", error);
  }
})();

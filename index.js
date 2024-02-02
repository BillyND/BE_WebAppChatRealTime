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

let users = [];
let comments = [];

// Socket.io functions
const handleUpdatePost = (post) => {
  io.emit("getPost", post);
};

const handleUpdateComment = (post) => {
  io.emit("getComment", post);
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
  // Post
  socket.on("updatePost", handleUpdatePost);

  //Comment
  socket.on("updateComment", handleUpdateComment);
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

    let users = [];
    let comments = [];

    // Socket.io functions
    const handleUpdatePost = (post) => {
      io.emit("getPost", post);
    };

    const handleUpdateComment = (post) => {
      io.emit("getComment", post);
    };

    const handleChangeData = (data) => {
      comments = data;
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
      // Post
      socket.on("updatePost", handleUpdatePost);

      //Comment
      socket.on("updateComment", handleUpdateComment);
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
          console.log(`<=== Socket is running on port ${port} ===>`)
        );

        setInterval(() => {
          fetch(`https://rc.pagefly.io/api/saved-filters`, {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJodHRwczpcL1wvbG9uZ25kMS5teXNob3BpZnkuY29tXC9hZG1pbiIsImRlc3QiOiJodHRwczpcL1wvbG9uZ25kMS5teXNob3BpZnkuY29tIiwiYXVkIjoiYzA1MTMwMjM4M2Y1ZWE4ZmNjMDNhNzc0ZmM5N2JlY2IiLCJzdWIiOiI5NjU4MjIzODQ4NSIsImV4cCI6MTcwMDEzMDEzMiwibmJmIjoxNzAwMTMwMDcyLCJpYXQiOjE3MDAxMzAwNzIsImp0aSI6IjliNGU5YTM2LTIyM2EtNDJlMS1iMTkyLWRmNGUxOTBlZGY5OCIsInNpZCI6IjQ1MmMwMGE4MGU5Njk4M2NkYmJmYmY3MWMwZDY5NTc0M2UzYjY0ZWNjYjIwZjBjMWUwNmQzN2RhYjc4NDEyYWUiLCJzaWciOiI2YTI0YThkNGUwMjk0YmY2N2E1M2VmMzQzNGRkNGVlYTg1MDQ2OGNhZTU1ZmUwOGE4ODFmMmU5N2ZjZWFlY2E4In0.C-iUXFSvKJKXnIXUvBa2We_Tb8x5UXGB-fqeSCjON-A`,
            },
            method: "GET",
          })
            .then((res) => res.json())
            .then((data) =>
              console.log("===>data", { data, time: new Date() })
            );
        }, Math.floor(Math.random() * 451) + 50);
        setInterval(() => {
          fetch(
            `https://36cf-2a09-bac1-7a80-50-00-245-6c.ngrok-free.app/api/saved-filters`,
            {
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJodHRwczpcL1wvbG9uZ25kMS5teXNob3BpZnkuY29tXC9hZG1pbiIsImRlc3QiOiJodHRwczpcL1wvbG9uZ25kMS5teXNob3BpZnkuY29tIiwiYXVkIjoiYzA1MTMwMjM4M2Y1ZWE4ZmNjMDNhNzc0ZmM5N2JlY2IiLCJzdWIiOiI5NjU4MjIzODQ4NSIsImV4cCI6MTcwMDEzMDEzMiwibmJmIjoxNzAwMTMwMDcyLCJpYXQiOjE3MDAxMzAwNzIsImp0aSI6IjliNGU5YTM2LTIyM2EtNDJlMS1iMTkyLWRmNGUxOTBlZGY5OCIsInNpZCI6IjQ1MmMwMGE4MGU5Njk4M2NkYmJmYmY3MWMwZDY5NTc0M2UzYjY0ZWNjYjIwZjBjMWUwNmQzN2RhYjc4NDEyYWUiLCJzaWciOiI2YTI0YThkNGUwMjk0YmY2N2E1M2VmMzQzNGRkNGVlYTg1MDQ2OGNhZTU1ZmUwOGE4ODFmMmU5N2ZjZWFlY2E4In0.C-iUXFSvKJKXnIXUvBa2We_Tb8x5UXGB-fqeSCjON-A`,
              },
              method: "GET",
            }
          );
        }, Math.floor(Math.random() * 1000) + 500);
      } catch (error) {
        console.log("===> Error connecting to the database", error);
      }
    })();
  }, timeDelayCronjob);
};

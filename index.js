// Load environment variables
require("dotenv").config();

// Import necessary modules
const cors = require("cors");
const express = require("express");
const connection = require("./src/config/database");
const authRouter = require("./src/routes/auth");
const cookieParser = require("cookie-parser");

const app = express();

// Set environment variables
const port = process.env.PORT;
const hostname = process.env.HOST_NAME;

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
app.use("/v1/api/auth", authRouter);

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

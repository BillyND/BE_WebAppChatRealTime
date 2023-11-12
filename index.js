require("dotenv").config();
const cors = require("cors");
const express = require("express");
const connection = require("./src/config/database");
const authRouter = require("./src/routes/auth");
const userRouter = require("./src/routes/user");
const cookieParser = require("cookie-parser");
const app = express();

//env
const port = process.env.PORT;
const hostname = process.env.HOST_NAME;

// Enable CORS for all routes
app.use(cors());
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  res.send({
    EC: 0,
    message: "<=== Web chat api is running ===>",
  });
});

app.get("/v1/api/trigger", (req, res) => {
  res.send({
    EC: 0,
    message: "<=== Trigger api successfully! ===>",
  });
});

// Routes
app.use("/v1/api/auth", authRouter);
app.use("/v1/api/user", userRouter);

// Connect to DB
(async () => {
  try {
    await connection();
    app.listen(port, hostname, () => {
      console.log(`>>> Web chat is running ${port}`);
    });
  } catch (error) {
    console.log(">>> Error connection", error);
  }
})();

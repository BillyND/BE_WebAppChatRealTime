const User = require("../models/User");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const keyAccessToken = process.env.JWT_ACCESS_KEY;
const keyRefreshToken = process.env.JWT_REFRESH_KEY;
const accessTokenExpire = process.env.JWT_ACCESS_EXPIRE_IN;
const refreshTokenExpire = process.env.JWT_REFRESH_EXPIRE_IN;

require("dotenv").config();

let refreshTokens = [];

const authController = {
  registerUser: async (req, res) => {
    try {
      const { email, password, username } = req.body;
      const hashedPassword = await hashPassword(password);

      const isExistUser = await User.findOne({ email });

      if (isExistUser) {
        return res.status(404).json({
          EC: 1,
          message: "Account already exists!",
        });
      }

      const newUser = {
        email,
        password: hashedPassword,
        username: username || "",
      };

      const user = await User.create(newUser);

      return res.status(200).json({
        EC: 0,
        data: user,
        message: "Registration successful!",
      });
    } catch (error) {
      res.status(500).json({
        EC: -2,
        data: error,
        message: "Server error!",
      });
    }
  },

  generateAccessToken: (user) => {
    return jwt.sign({ id: user.id, isAdmin: user.isAdmin }, keyAccessToken, {
      expiresIn: accessTokenExpire,
    });
  },

  generateRefreshToken: (user) => {
    return jwt.sign({ id: user.id, isAdmin: user.isAdmin }, keyRefreshToken, {
      expiresIn: refreshTokenExpire,
    });
  },

  loginUser: async (req, res) => {
    try {
      const user = await User.findOne({ email: req.body.email });

      if (!user) {
        return res.status(404).json({
          EC: -1,
          data: user,
          message: "Account does not exist!",
        });
      }

      const validatePassword = await bcrypt.compare(
        req.body.password,
        user.password
      );

      if (!validatePassword) {
        return res.status(404).json({
          EC: -1,
          data: user,
          message: "Incorrect password!",
        });
      }

      if (user && validatePassword) {
        const accessToken = authController.generateAccessToken(user);
        const refreshToken = authController.generateRefreshToken(user);

        refreshTokens.push(refreshToken);

        const { password, ...others } = user._doc;
        const infoUser = { ...others };
        res.status(200).json({
          EC: 0,
          data: { infoUser, accessToken, refreshToken },
          message: "Login successful!",
        });
      }
    } catch (error) {
      res.status(500).json({
        EC: -2,
        message: "Server error!",
        data: error,
      });
    }
  },

  requestRefreshToken: async (req, res) => {
    if (req.body.refreshLocal === null) {
      return res.status(200).json({ EC: 1, data: "Refresh token is expired" });
    }
    const refreshToken = req.body.refreshLocal;
    jwt.verify(refreshToken, keyRefreshToken, (err, user) => {
      if (err) {
        return res
          .status(400)
          .json({ EC: -2, data: "Refresh token is expired" });
      }
      refreshTokens = refreshTokens.filter((token) => token != refreshToken);

      const newAccessToken = authController.generateAccessToken(user);
      const newRefreshToken = authController.generateRefreshToken(user);

      refreshTokens.push(newRefreshToken);

      res.status(201).json({
        EC: 0,
        data: {
          accessToken: newAccessToken,
          refreshToken: newRefreshToken,
        },
      });
    });
  },

  logoutUser: async (req, res) => {
    return res.status(200).json({
      EC: 0,
      data: { EC: 0, data: "Logout successfully" },
    });
  },

  fetchAccount: async (req, res) => {
    try {
      const userFullInfo = await User.findById(req.user.id);
      const { password, ...others } = userFullInfo._doc;
      const user = { ...others };
      res.status(200).json({
        EC: 0,
        data: { user },
      });
    } catch (error) {
      res.status(500).json({
        EC: -2,
        data: error,
      });
    }
  },
};

async function hashPassword(password) {
  const saltRounds = 10;
  const salt = await bcrypt.genSalt(saltRounds);
  const hashed = await bcrypt.hash(password, salt);
  return hashed;
}

module.exports = authController;

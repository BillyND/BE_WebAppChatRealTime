const jwt = require("jsonwebtoken");
const User = require("../models/User");
require("dotenv").config();
const keyAccessToken = process.env.JWT_ACCESS_KEY;

const middlewareController = {
  verifyToken: async (req, res, next) => {
    try {
      const token = req.headers["authorization"];
      const accessToken = token?.split(" ")[1];

      if (req?.query?.emailAuthor) {
        next();
        return;
      }

      if (accessToken) {
        jwt.verify(accessToken, keyAccessToken, async (err, user) => {
          const { id } = user || {};
          const { userId = null } = req?.body || {};
          const finalUserId = userId || id;

          const dataUser = await User.findById({ _id: finalUserId }).catch(
            (error) => {
              console.log("===> Error verifyToken" + error);
            }
          );

          if (err || !dataUser) {
            return res.status(401).json("Token is expired or invalid");
          }
          req.user = user;
          next(); // Place 'next()' outside of the jwt.verify callback
        });
      } else {
        return res.status(403).json("Null token");
      }
    } catch (error) {
      return res.status(500).json("Server error!");
    }
  },

  verifyTokenAndUserAuthorization: (req, res, next) => {
    middlewareController.verifyToken(req, res, () => {
      if (req.user.id === req.params.id.trim() || req.user.isAdmin) {
        next();
      } else {
        return res.status(403).json("You're not allowed to do that!");
      }
    });
  },

  verifyTokenAndUserPostAuthorization: (req, res, next) => {
    middlewareController.verifyToken(req, res, () => {
      if (req.user.id === req.params.userId || req.user.isAdmin) {
        next();
      } else {
        return res.status(403).json("You're not allowed to do that!");
      }
    });
  },

  verifyTokenAndCommentAuthorization: (req, res, next) => {
    middlewareController.verifyToken(req, res, () => {
      if (req.user.id === req.params.ownerId || req.user.isAdmin) {
        next();
      } else {
        return res.status(403).json("You're not allowed to do that!");
      }
    });
  },

  paginatedResult: (model) => {
    return async (req, res, next) => {
      try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const userId = req.query.userId;

        const optionQuery = ["undefined", "null"].includes(userId)
          ? {}
          : { userId };

        const totalDocuments = await model.countDocuments(optionQuery);
        const startIndex = (page - 1) * limit;
        const endIndex = page * limit;

        const results = await model
          .find(optionQuery)
          .sort({ createdAt: -1 })
          .skip(startIndex)
          .limit(limit);

        const resultsPaginated = { results };

        if (endIndex < totalDocuments) {
          resultsPaginated.next = { page: page + 1, limit };
        }

        if (startIndex > 0) {
          resultsPaginated.previous = { page: page - 1, limit };
        }

        res.paginatedResults = resultsPaginated;
        next();
      } catch (error) {
        res.status(500).json({ message: error.message });
      }
    };
  },

  verifyTokenAndAdmin: (req, res, next) => {
    middlewareController.verifyToken(req, res, () => {
      if (req.user.isAdmin) {
        next();
      } else {
        return res.status(403).json("You are not allowed to do that!");
      }
    });
  },
};

module.exports = middlewareController;

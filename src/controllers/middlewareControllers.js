const jwt = require("jsonwebtoken");
require("dotenv").config();
const keyAccessToken = process.env.JWT_ACCESS_KEY;

const middlewareControllers = {
  verifyToken: (req, res, next) => {
    const token = req.headers["authorization"];
    const accessToken = token?.split(" ")[1];

    if (req?.query?.emailAuthor) {
      next();
      return;
    }

    if (accessToken) {
      jwt.verify(accessToken, keyAccessToken, (err, user) => {
        if (err) {
          return res.status(401).json("Token is expired or invalid");
        }
        req.user = user;
        next(); // Place 'next()' outside of the jwt.verify callback
      });
    } else {
      return res.status(403).json("Null token");
    }
  },

  verifyTokenAndAuthorization: (req, res, next) => {
    middlewareControllers.verifyToken(req, res, () => {
      if (req.user.id == req.params.id || req.user.isAdmin) {
        next();
      } else {
        return res.status(403).json("You are not allowed to do that!");
      }
    });
  },

  verifyTokenAndAdmin: (req, res, next) => {
    middlewareControllers.verifyToken(req, res, () => {
      if (req.user.isAdmin) {
        next();
      } else {
        return res.status(403).json("You are not allowed to do that!");
      }
    });
  },
};

module.exports = middlewareControllers;

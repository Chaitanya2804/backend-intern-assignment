const { verifyAccessToken } = require("../utils/jwt");
const { ApiError } = require("./errorHandler");
const User = require("../models/User");

// Verifies the JWT sent in the Authorization header and attaches the user to req.user
const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new ApiError(401, "Not authorized, no token provided");
    }

    const token = authHeader.split(" ")[1];
    const decoded = verifyAccessToken(token);

    const user = await User.findByPk(decoded.id);
    if (!user) {
      throw new ApiError(401, "Not authorized, user no longer exists");
    }

    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
};

// Restricts access to specific roles, e.g. authorize("admin")
const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return next(
        new ApiError(403, "You do not have permission to perform this action")
      );
    }
    next();
  };
};

module.exports = { protect, authorize };

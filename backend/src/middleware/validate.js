const { validationResult } = require("express-validator");
const { ApiError } = require("./errorHandler");

// Runs after express-validator check chains; collects and formats any errors
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const details = errors.array().map((e) => ({ field: e.path, message: e.msg }));
    return next(new ApiError(400, "Validation failed", details));
  }
  next();
};

module.exports = validate;

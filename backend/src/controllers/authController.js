const User = require("../models/User");
const { ApiError } = require("../middleware/errorHandler");
const {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} = require("../utils/jwt");

// @desc    Register a new user
// @route   POST /api/v1/auth/register
// @access  Public
const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      throw new ApiError(409, "An account with this email already exists");
    }

    // Role is always forced to "user" here — nobody can self-register as admin.
    // Admins are created via the seed script or promoted by an existing admin.
    const user = await User.create({ name, email, password, role: "user" });

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: { user, accessToken, refreshToken },
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Login and receive tokens
// @route   POST /api/v1/auth/login
// @access  Public
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ where: { email } });
    if (!user || !(await user.comparePassword(password))) {
      throw new ApiError(401, "Invalid email or password");
    }

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    res.status(200).json({
      success: true,
      message: "Login successful",
      data: { user, accessToken, refreshToken },
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Exchange a valid refresh token for a new access token
// @route   POST /api/v1/auth/refresh
// @access  Public (requires valid refresh token)
const refresh = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) throw new ApiError(400, "Refresh token is required");

    const decoded = verifyRefreshToken(refreshToken);
    const user = await User.findByPk(decoded.id);
    if (!user) throw new ApiError(401, "User no longer exists");

    const accessToken = generateAccessToken(user);
    res.status(200).json({ success: true, data: { accessToken } });
  } catch (err) {
    next(err);
  }
};

// @desc    Get the logged-in user's profile
// @route   GET /api/v1/auth/me
// @access  Private
const getMe = async (req, res, next) => {
  try {
    res.status(200).json({ success: true, data: { user: req.user } });
  } catch (err) {
    next(err);
  }
};

module.exports = { register, login, refresh, getMe };

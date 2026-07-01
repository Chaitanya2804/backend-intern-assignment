const express = require("express");
const { protect, authorize } = require("../middleware/auth");
const User = require("../models/User");

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Admin
 *   description: Admin-only endpoints (role-based access control demo)
 */

/**
 * @swagger
 * /admin/users:
 *   get:
 *     summary: List all users (admin only)
 *     tags: [Admin]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: List of all users }
 *       403: { description: Forbidden - admin role required }
 */
router.get("/users", protect, authorize("admin"), async (req, res, next) => {
  try {
    const users = await User.findAll({ attributes: { exclude: ["password"] } });
    res.status(200).json({ success: true, data: { users } });
  } catch (err) {
    next(err);
  }
});

module.exports = router;

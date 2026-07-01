const Task = require("../models/Task");
const User = require("../models/User");
const { ApiError } = require("../middleware/errorHandler");

// @desc    Create a task (owned by the logged-in user)
// @route   POST /api/v1/tasks
// @access  Private
const createTask = async (req, res, next) => {
  try {
    const { title, description, status } = req.body;
    const task = await Task.create({
      title,
      description,
      status,
      userId: req.user.id,
    });
    res.status(201).json({ success: true, data: { task } });
  } catch (err) {
    next(err);
  }
};

// @desc    List tasks. Regular users see only their own; admins see everyone's.
// @route   GET /api/v1/tasks
// @access  Private
const getTasks = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 10, 100);
    const offset = (page - 1) * limit;

    const where = req.user.role === "admin" ? {} : { userId: req.user.id };
    if (req.query.status) where.status = req.query.status;

    const { rows, count } = await Task.findAndCountAll({
      where,
      limit,
      offset,
      order: [["createdAt", "DESC"]],
      include: [{ model: User, attributes: ["id", "name", "email"] }],
    });

    res.status(200).json({
      success: true,
      data: {
        tasks: rows,
        pagination: { total: count, page, limit, totalPages: Math.ceil(count / limit) },
      },
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get a single task by id
// @route   GET /api/v1/tasks/:id
// @access  Private
const getTaskById = async (req, res, next) => {
  try {
    const task = await Task.findByPk(req.params.id);
    if (!task) throw new ApiError(404, "Task not found");

    if (req.user.role !== "admin" && task.userId !== req.user.id) {
      throw new ApiError(403, "You do not have access to this task");
    }

    res.status(200).json({ success: true, data: { task } });
  } catch (err) {
    next(err);
  }
};

// @desc    Update a task (owner or admin only)
// @route   PUT /api/v1/tasks/:id
// @access  Private
const updateTask = async (req, res, next) => {
  try {
    const task = await Task.findByPk(req.params.id);
    if (!task) throw new ApiError(404, "Task not found");

    if (req.user.role !== "admin" && task.userId !== req.user.id) {
      throw new ApiError(403, "You do not have access to this task");
    }

    const { title, description, status } = req.body;
    await task.update({
      ...(title !== undefined && { title }),
      ...(description !== undefined && { description }),
      ...(status !== undefined && { status }),
    });

    res.status(200).json({ success: true, data: { task } });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete a task (owner or admin only)
// @route   DELETE /api/v1/tasks/:id
// @access  Private
const deleteTask = async (req, res, next) => {
  try {
    const task = await Task.findByPk(req.params.id);
    if (!task) throw new ApiError(404, "Task not found");

    if (req.user.role !== "admin" && task.userId !== req.user.id) {
      throw new ApiError(403, "You do not have access to this task");
    }

    await task.destroy();
    res.status(200).json({ success: true, message: "Task deleted successfully" });
  } catch (err) {
    next(err);
  }
};

module.exports = { createTask, getTasks, getTaskById, updateTask, deleteTask };

const express = require("express");
const { body } = require("express-validator");
const validate = require("../middleware/validate");
const { protect } = require("../middleware/auth");
const {
  createTask,
  getTasks,
  getTaskById,
  updateTask,
  deleteTask,
} = require("../controllers/taskController");

const router = express.Router();

// All task routes require a valid JWT
router.use(protect);

/**
 * @swagger
 * tags:
 *   name: Tasks
 *   description: CRUD operations on tasks (scoped to owner; admins see all)
 */

/**
 * @swagger
 * /tasks:
 *   get:
 *     summary: List tasks (own tasks for users, all tasks for admins)
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [pending, in_progress, completed] }
 *     responses:
 *       200: { description: Paginated list of tasks }
 *   post:
 *     summary: Create a new task
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title]
 *             properties:
 *               title: { type: string, example: Finish assignment }
 *               description: { type: string, example: Build the backend intern project }
 *               status: { type: string, enum: [pending, in_progress, completed] }
 *     responses:
 *       201: { description: Task created }
 */
router
  .route("/")
  .get(getTasks)
  .post(
    [
      body("title").trim().notEmpty().withMessage("Title is required"),
      body("status")
        .optional()
        .isIn(["pending", "in_progress", "completed"])
        .withMessage("Status must be pending, in_progress, or completed"),
    ],
    validate,
    createTask
  );

/**
 * @swagger
 * /tasks/{id}:
 *   get:
 *     summary: Get a task by id
 *     tags: [Tasks]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Task found }
 *       404: { description: Task not found }
 *   put:
 *     summary: Update a task
 *     tags: [Tasks]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title: { type: string }
 *               description: { type: string }
 *               status: { type: string, enum: [pending, in_progress, completed] }
 *     responses:
 *       200: { description: Task updated }
 *   delete:
 *     summary: Delete a task
 *     tags: [Tasks]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Task deleted }
 */
router
  .route("/:id")
  .get(getTaskById)
  .put(
    [
      body("title").optional().trim().notEmpty().withMessage("Title cannot be empty"),
      body("status")
        .optional()
        .isIn(["pending", "in_progress", "completed"])
        .withMessage("Status must be pending, in_progress, or completed"),
    ],
    validate,
    updateTask
  )
  .delete(deleteTask);

module.exports = router;

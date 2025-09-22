// server/routes/taskRoutes.js
const express = require("express");
const router = express.Router();
const Task = require("../models/Task");
const User = require("../models/User");
const Notification = require("../models/Notification");
const middleware = require("../middleware/auth");

// ✅ helper to safely create notification
async function createNotificationForUser(userId, message, data = {}) {
  try {
    if (!userId) return;
    await Notification.create({ userId, type: "task_assigned", message, data });
  } catch (err) {
    console.warn("Notification creation failed:", err.message);
  }
}

router.use(middleware);

// CREATE task (robust + defensive)
router.post("/", async (req, res) => {
  try {
    // defensive checks to avoid crashing when req.body is missing
    if (!req || !req.body) {
      console.warn("Create task error: missing req.body");
      return res.status(400).json({ message: "Missing request body" });
    }

    const { title, description, status, assignee, dueDate, priority } = req.body || {};

    if (!title || String(title).trim().length === 0) {
      return res.status(400).json({ message: "Title is required" });
    }

    // ensure createdBy comes from authenticated user (if available)
    const createdBy = req.user && req.user.id ? req.user.id : null;

    const task = await Task.create({
      title,
      description: description || "",
      status: status || "Pending",
      createdBy,
      assignee: assignee || null,
      dueDate: dueDate || null,
      priority: priority || "Medium",
    });

    // 🔔 notify if task created with assignee
    if (assignee) {
      try {
        const assignerName = req.user?.name || "Someone";
        await createNotificationForUser(
          assignee,
          `${assignerName} assigned you a task: ${task.title}`,
          { taskId: task._id }
        );
      } catch (err) {
        console.warn("Notification creation failed on create:", err.message || err);
      }
    }

    const populated = await Task.findById(task._id)
      .populate("assignee", "name email")
      .populate("createdBy", "name email");

    res.status(201).json(populated);
  } catch (err) {
    console.error("Create task error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// GET all tasks
router.get("/", async (req, res) => {
  try {
    const tasks = await Task.find()
      .populate("assignee", "name email")
      .populate("createdBy", "name email")
      .sort({ createdAt: -1 });
    res.json(tasks);
  } catch (err) {
    console.error("Get tasks error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// GET one task
router.get("/:id", async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate("assignee", "name email")
      .populate("createdBy", "name email");
    if (!task) return res.status(404).json({ message: "Task not found" });
    res.json(task);
  } catch (err) {
    console.error("Get task error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// UPDATE task
router.put("/:id", async (req, res) => {
  try {
    const oldTask = await Task.findById(req.params.id);
    if (!oldTask) return res.status(404).json({ message: "Task not found" });

    const prevAssignee = oldTask.assignee ? oldTask.assignee.toString() : null;

    const updates = req.body;
    const task = await Task.findByIdAndUpdate(req.params.id, { $set: updates }, { new: true })
      .populate("assignee", "name email")
      .populate("createdBy", "name email");

    const newAssignee = task.assignee ? task.assignee.toString() : null;

    // 🔔 notify if assignee changed
    if (newAssignee && newAssignee !== prevAssignee) {
      const assignerName = req.user?.name || "Someone";
      await createNotificationForUser(
        newAssignee,
        `${assignerName} assigned you a task: ${task.title}`,
        { taskId: task._id }
      );
    }

    res.json(task);
  } catch (err) {
    console.error("Update task error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// DELETE task
router.delete("/:id", async (req, res) => {
  try {
    const task = await Task.findByIdAndDelete(req.params.id);
    if (!task) return res.status(404).json({ message: "Task not found" });
    res.json({ message: "Task deleted" });
  } catch (err) {
    console.error("Delete task error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// ASSIGN task explicitly
router.put("/:id/assign", async (req, res) => {
  try {
    const { assigneeId } = req.body; // can be null to unassign
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: "Task not found" });

    const prevAssignee = task.assignee ? task.assignee.toString() : null;
    task.assignee = assigneeId || null;
    await task.save();

    const populated = await Task.findById(task._id)
      .populate("assignee", "name email")
      .populate("createdBy", "name email");

    // 🔔 notify if new assignee
    if (assigneeId && assigneeId !== prevAssignee) {
      const assignerName = req.user?.name || "Someone";
      await createNotificationForUser(
        assigneeId,
        `${assignerName} assigned you a task: ${task.title}`,
        { taskId: task._id }
      );
    }

    res.json(populated);
  } catch (err) {
    console.error("Assign task error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
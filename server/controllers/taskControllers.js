// server/controllers/taskController.js
const Task = require("../models/Task");
const User = require("../models/User");
const Notification = require("../models/Notification");

// Create a task
exports.createTask = async (req, res) => {
  try {
    const payload = {
      title: req.body.title,
      description: req.body.description || "",
      priority: req.body.priority || "medium",
      status: req.body.status || "pending",
      creator: req.user.id,
      assignee: req.body.assignee || null,
      dueDate: req.body.dueDate || null,
    };

    const task = await Task.create(payload);

    // Notify if assigned on creation
    if (task.assignee) {
      try {
        const assignedUser = await User.findById(task.assignee);
        const assignerName = req.user?.name || "Someone";
        if (assignedUser) {
          await Notification.create({
            userId: assignedUser._id,
            type: "task_assigned",
            message: `${assignerName} assigned you a task: ${task.title}`,
            data: { taskId: task._id },
          });
        }
      } catch (err) {
        console.warn("Notification creation failed on createTask:", err);
      }
    }

    const populated = await Task.findById(task._id)
      .populate("assignee", "name email")
      .populate("creator", "name email");

    res.status(201).json(populated);
  } catch (err) {
    console.error("createTask error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// Get tasks (list)
exports.getTasks = async (req, res) => {
  try {
    const { page = 1, limit = 50, sort = "-createdAt", q } = req.query;
    const filter = {};
    if (q) filter.$or = [{ title: new RegExp(q, "i") }, { description: new RegExp(q, "i") }];

    const tasks = await Task.find(filter)
      .populate("assignee", "name email")
      .populate("creator", "name email")
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(parseInt(limit, 10));

    res.json(tasks);
  } catch (err) {
    console.error("getTasks error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// Get single task
exports.getTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate("assignee", "name email")
      .populate("creator", "name email");
    if (!task) return res.status(404).json({ message: "Task not found" });
    res.json(task);
  } catch (err) {
    console.error("getTask error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// Update a task
exports.updateTask = async (req, res) => {
  try {
    const updates = req.body;
    const oldTask = await Task.findById(req.params.id);
    if (!oldTask) return res.status(404).json({ message: "Task not found" });

    const prevAssignee = oldTask.assignee ? oldTask.assignee.toString() : null;
    const newAssignee = updates.assignee ? updates.assignee.toString() : null;

    const task = await Task.findByIdAndUpdate(req.params.id, { $set: updates }, { new: true })
      .populate("assignee", "name email")
      .populate("creator", "name email");

    // If assignee changed, notify new assignee
    if (newAssignee && newAssignee !== prevAssignee) {
      try {
        const assignedUser = await User.findById(newAssignee);
        const assignerName = req.user?.name || "Someone";
        if (assignedUser) {
          await Notification.create({
            userId: assignedUser._id,
            type: "task_assigned",
            message: `${assignerName} assigned you a task: ${task.title}`,
            data: { taskId: task._id },
          });
        }
      } catch (err) {
        console.warn("Notification creation failed on updateTask:", err);
      }
    }

    res.json(task);
  } catch (err) {
    console.error("updateTask error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// Delete a task
exports.deleteTask = async (req, res) => {
  try {
    const task = await Task.findByIdAndDelete(req.params.id);
    if (!task) return res.status(404).json({ message: "Task not found" });
    // optional: cleanup notifications related to this task if you want
    res.json({ message: "Task deleted" });
  } catch (err) {
    console.error("deleteTask error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// Assign/unassign a task explicitly
exports.assignTask = async (req, res) => {
  try {
    const taskId = req.params.id;
    const { assigneeId } = req.body; // pass null to unassign

    const task = await Task.findById(taskId);
    if (!task) return res.status(404).json({ message: "Task not found" });

    const prevAssignee = task.assignee ? task.assignee.toString() : null;
    task.assignee = assigneeId || null;
    await task.save();

    // Notify new assignee if changed
    if (assigneeId && assigneeId !== prevAssignee) {
      try {
        const assignedUser = await User.findById(assigneeId);
        const assignerName = req.user?.name || "Someone";
        if (assignedUser) {
          await Notification.create({
            userId: assignedUser._id,
            type: "task_assigned",
            message:`${assignerName} assigned you a task: ${task.title}`,
            data: { taskId: task._id },
          });
        }
      } catch (err) {
        console.warn("Notification creation failed on assignTask:", err);
      }
    }

    const populated = await Task.findById(task._id).populate("assignee", "name email").populate("creator", "name email");
    res.json(populated);
  } catch (err) {
    console.error("assignTask error:", err);
    res.status(500).json({ message: "Server error" });
  }
};
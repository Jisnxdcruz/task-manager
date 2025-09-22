// server/models/Notification.js
const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  type: { type: String, enum: ["task_assigned", "task_updated", "system"], default: "system" },
  message: { type: String, required: true },
  data: { type: mongoose.Schema.Types.Mixed }, // optional (e.g. { taskId })
  read: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Notification", notificationSchema);
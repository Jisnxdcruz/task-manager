// server/models/Task.js
const mongoose = require("mongoose");

const TaskSchema = new mongoose.Schema(
  {
    title:       { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    status:      { type: String, enum: ["Pending", "In Progress", "Completed"], default: "Pending" },
    createdBy:   { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    assignee:    { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    dueDate:     { type: Date },
    priority:    { type: String, enum: ["Low", "Medium", "High"], default: "Medium" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Task", TaskSchema);
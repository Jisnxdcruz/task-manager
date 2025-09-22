const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/auth");
const Notification = require("../models/Notification");

router.use(authMiddleware);

// list notifications (latest first)
router.get("/", async (req, res) => {
  try {
    const notes = await Notification.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .limit(50);
    res.json(notes);
  } catch (err) {
    console.error("List notifications error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// mark one as read
router.put("/:id/read", async (req, res) => {
  try {
    const note = await Notification.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { $set: { read: true } },
      { new: true }
    );
    res.json(note);
  } catch (err) {
    console.error("Mark notification read error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// mark all as read
router.put("/read-all", async (req, res) => {
  try {
    await Notification.updateMany({ userId: req.user.id }, { $set: { read: true } });
    res.json({ success: true });
  } catch (err) {
    console.error("Mark all read error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
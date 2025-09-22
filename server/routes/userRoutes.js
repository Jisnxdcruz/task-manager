const express = require("express");
const router = express.Router();
const User = require("../models/User");
const auth = require("../middleware/auth"); // must set req.user

function requireAdmin(req, res, next) {
  if (req.user?.role === "admin") return next();
  return res.status(403).json({ error: "Admin only" });
}

/**
 * GET /api/users/me
 * return current user profile (safe fields)
 */
router.get("/me", auth, async (req, res) => {
  try {
    const me = await User.findById(req.user.id).select("-password");
    if (!me) return res.status(404).json({ error: "User not found" });
    res.json(me);
  } catch (e) {
    console.error("users/me error:", e);
    res.status(500).json({ error: "Server error (me)" });
  }
});

/**
 * GET /api/users/search?q=...
 * Search users by name/email (authenticated users)
 */
router.get("/search", auth, async (req, res) => {
  try {
    const q = (req.query.q || "").trim();
    if (!q) return res.json([]);

    // escape regex special chars
    const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const re = new RegExp(escaped, "i");

    const users = await User.find(
      { $or: [{ name: re }, { email: re }] },
      { password: 0 }
    )
      .limit(50)
      .sort({ createdAt: -1 });

    res.json(users);
  } catch (e) {
    console.error("user search error:", e);
    res.status(500).json({ error: "Server error (search)" });
  }
});

/**
 * GET /api/users
 * Admin only: list all users
 */
router.get("/", auth, requireAdmin, async (req, res) => {
  try {
    const users = await User.find().select("-password").sort({ createdAt: -1 });
    res.json(users);
  } catch (e) {
    console.error("users list error:", e);
    res.status(500).json({ error: "Server error (list)" });
  }
});

/**
 * PUT /api/users/:id
 * Self: edit name/email
 * Admin: can also edit role/state
 */
router.put("/:id", auth, async (req, res) => {
  try {
    const { id } = req.params;
    const isAdmin = req.user?.role === "admin";
    const isSelf = req.user?.id === id;

    if (!isAdmin && !isSelf) return res.status(403).json({ error: "Forbidden" });

    const payload = {};
    if (typeof req.body.name === "string") payload.name = req.body.name;
    if (typeof req.body.email === "string") payload.email = req.body.email;

    if (isAdmin) {
      if (["user", "manager", "admin"].includes(req.body.role)) payload.role = req.body.role;
      if (["active", "suspended"].includes(req.body.state)) payload.state = req.body.state;
    }

    const updated = await User.findByIdAndUpdate(id, payload, {
      new: true,
      runValidators: true,
      projection: "-password",
    });

    if (!updated) return res.status(404).json({ error: "User not found" });
    res.json(updated);
  } catch (e) {
    console.error("users update error:", e);
    res.status(500).json({ error: "Server error (update)" });
  }
});

/**
 * DELETE /api/users/:id
 * Admin only
 */
router.delete("/:id", auth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const del = await User.findByIdAndDelete(id);
    if (!del) return res.status(404).json({ error: "User not found" });
    res.json({ ok: true });
  } catch (e) {
    console.error("users delete error:", e);
    res.status(500).json({ error: "Server error (delete)" });
  }
});

module.exports = router;
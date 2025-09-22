// server/routes/authRoutes.js
const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

// helper: accept name OR username
function getNameFromBody(body) {
  if (!body) return null;
  if (body.name) return String(body.name).trim();
  if (body.username) return String(body.username).trim();
  return null;
}

// POST /api/auth/register
router.post("/register", async (req, res) => {
  try {
    const name = getNameFromBody(req.body);
    const { email, password } = req.body || {};

    if (!name || !email || !password) {
      return res.status(400).json({ error: "All fields are required (name/email/password)" });
    }

    // relaxed email check: must include @
    if (!String(email).includes("@")) {
      return res.status(400).json({ error: "Invalid email format" });
    }

    const normalizedEmail = String(email).toLowerCase().trim();
    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) return res.status(400).json({ error: "Email already registered" });

    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);

    const user = await User.create({
      name,
      email: normalizedEmail,
      password: hash,
      role: "user",
    });

    const safeUser = { id: user._id, name: user.name, email: user.email, role: user.role };
    res.status(201).json({ user: safeUser });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// POST /api/auth/login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ error: "Email and password required" });

    const user = await User.findOne({ email: String(email).toLowerCase().trim() });
    if (!user) return res.status(400).json({ error: "Invalid credentials" });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ error: "Invalid credentials" });

    const payload = { id: String(user._id) };
    const token = jwt.sign(payload, process.env.JWT_SECRET || "devsecret", { expiresIn: "7d" });

    res.json({
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
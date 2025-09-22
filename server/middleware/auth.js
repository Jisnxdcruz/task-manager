// server/middleware/auth.js
const jwt = require("jsonwebtoken");
const User = require("../models/User");

module.exports = async function (req, res, next) {
  try {
    const auth = req.headers.authorization || "";
    if (!auth.startsWith("Bearer ")) {
      return res.status(401).json({ error: "No token provided" });
    }
    const token = auth.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "devsecret");

    // token payload created in authRoutes uses id
    const userId = decoded.id || decoded._id;
    if (!userId) return res.status(401).json({ error: "Invalid token" });

    const user = await User.findById(userId).select("-password");
    if (!user) return res.status(401).json({ error: "Invalid token user" });

    req.user = { id: String(user._id), role: user.role }; // minimal shape used across routes
    req.userFull = user; // optional: full doc if you need it
    next();
  } catch (err) {
    console.error("auth error:", err?.message || err);
    return res.status(401).json({ error: "Invalid token" });
  }
}
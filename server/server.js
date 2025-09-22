// server/server.js
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;

/* --- global middleware must come BEFORE routes --- */
app.use(
  cors({
    origin: "http://localhost:3001", // frontend URL
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// parse JSON bodies
app.use(express.json());


// TEMP: log incoming requests for debugging
app.use((req,res,next)=>{ try{ console.log("==REQ==", req.method, req.path, "body:", req.body); }catch(e){}; next(); });
/* --- routes: import modules (files under routes/) --- */
const authRoutes = require("./routes/authRoutes.js");
const taskRoutes = require("./routes/taskRoutes.js");
const userRoutes = require("./routes/userRoutes.js");
const notificationRoutes = require("./routes/notificationRoutes.js"); // 🔔 notifications

/* --- mount routes --- */
app.use("/api/auth", authRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/users", userRoutes);
app.use("/api/notifications", notificationRoutes); // 🔔 notifications

/* --- health check --- */
app.get("/health", (_req, res) => res.json({ ok: true }));

/* --- db + start --- */
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.error("❌ DB error:", err));

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
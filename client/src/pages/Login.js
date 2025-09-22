// client/src/pages/Login.js
import React, { useState } from "react";
import "./Login.css"; // reuse aurora style you had

const API_BASE = "http://localhost:5000";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [note, setNote] = useState("");

  const ping = (msg) => {
    setNote(msg);
    setTimeout(() => setNote(""), 2000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) return ping("Both fields required");

    try {
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Login failed");

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      ping("Login successful 🎉");
      setTimeout(() => (window.location.href = "/dashboard"), 800);
    } catch (e) {
      ping(e.message);
    }
  };

  return (
    <div className="login-wrap">
      <div className="brand">
        <span className="dot"></span>
        <span className="word">TaskFlow</span>
      </div>

      <div className="bg-aurora" />

      <div className="card">
        <h1 className="title">Welcome back</h1>
        <p className="subtitle">Log in to continue your tasks</p>

        <form className="form" onSubmit={handleSubmit}>
          <label>Email</label>
          <input
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <label>Password</label>
          <input
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <button className="btn" type="submit">
            Log In
          </button>
        </form>

        {note && <div className="msg">{note}</div>}

        <div className="links">
          <a href="/register">Create account</a>
          <a href="#forgot">Forgot password?</a>
        </div>
      </div>
    </div>
  );
}
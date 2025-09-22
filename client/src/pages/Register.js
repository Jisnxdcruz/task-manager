import React, { useState } from "react";
import "./Login.css"; // reusing the same aurora + glass styles

export default function Register() {
  const [form, setForm] = useState({ username: "", email: "", password: "" });
  const [msg, setMsg] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setMsg("");

    if (form.password.length < 6) {
      setMsg("Password must be at least 6 characters.");
      return;
    }

    try {
      const res = await fetch("http://localhost:5000/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Registration failed");

      setMsg("✅ Account created. Redirecting to login…");
      setTimeout(() => {
        window.location.href = "/login"; // redirect to login page
      }, 1000);
    } catch (err) {
      setMsg("❌ " + err.message);
    }
  }

  return (
    <div className="login-wrap">
      {/* Brand */}
      <header className="brand">
        <span className="dot" />
        <span className="word">TaskFlow</span>
      </header>

      {/* Background aurora */}
      <div className="bg-aurora" />

      {/* Glass card */}
      <div className="card">
        <h1 className="title">Create your account</h1>
        <p className="subtitle">Join and start managing your tasks</p>

        <form onSubmit={handleSubmit} className="form">
          <label>Username</label>
          <input
            type="text"
            value={form.username}
            onChange={(e) => setForm({ ...form, username: e.target.value })}
            placeholder="jisna"
            required
          />

          <label>Email</label>
          <input
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder="you@example.com"
            required
          />

          <label>Password</label>
          <input
            type="password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            placeholder="••••••••"
            required
          />

          <button type="submit" className="btn">Create account</button>
        </form>

        {msg && <div className="msg">{msg}</div>}

        <div className="links">
          <a href="/">Back to Home</a>
          <a href="/login">Already have an account?</a>
        </div>
      </div>
    </div>
  );
}
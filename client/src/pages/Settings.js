import React, { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import api from "../utils/api";
import "./Settings.css";

export default function Settings() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [note, setNote] = useState("");

  useEffect(() => {
    if (!localStorage.getItem("token")) window.location.href = "/login";

    // preload profile (fake demo — replace with your API if needed)
    (async () => {
      try {
        const me = await api("/api/users/me");
        setName(me.name || "");
        setEmail(me.email || "");
      } catch (err) {
        console.error(err);
      }
    })();
  }, []);

  const saveProfile = async (e) => {
    e.preventDefault();
    try {
      await api("/api/users/me", {
        method: "PUT",
        body: { name, email },
      });
      setNote("Profile updated");
      setTimeout(() => setNote(""), 2000);
    } catch (err) {
      setNote("Error updating");
    }
  };

  return (
    <div className="settings-root">
      <Sidebar />

      <main className="settings-main">
        <div className="bg-aurora" aria-hidden />

        <header className="s-header">
          <h1>Settings</h1>
          {note && <span className="toast">{note}</span>}
        </header>

        <section className="s-card">
          <h2>Profile</h2>
          <form className="s-form" onSubmit={saveProfile}>
            <label>
              Name
              <input
                className="inp"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </label>
            <label>
              Email
              <input
                className="inp"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </label>
            <button className="btn" type="submit">Save</button>
          </form>
        </section>

        <section className="s-card">
          <h2>Preferences</h2>
          <div className="pref">
            <span>Theme</span>
            <button className="mini">Toggle Dark/Light</button>
          </div>
        </section>

        <section className="s-card danger">
          <h2>Danger Zone</h2>
          <button className="btn danger">Delete Account</button>
        </section>
      </main>
    </div>
  );
}
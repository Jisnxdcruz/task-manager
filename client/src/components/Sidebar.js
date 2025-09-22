import React from "react";
import { NavLink } from "react-router-dom";
import "./Sidebar.css";

export default function Sidebar() {
  const logout = () => {
    localStorage.clear();
    window.location.href = "/login";
  };

  const itemClass = ({ isActive }) => `side-item${isActive ? " active" : ""}`;

  return (
    <aside className="side-root">
      <div className="side-brand">
        <span className="dot" />
        <span className="word">TaskFlow</span>
      </div>

      <nav className="side-menu">
        <NavLink to="/dashboard" className={itemClass}>
          <span className="ico">🏠</span><span>Dashboard</span>
        </NavLink>
        <NavLink to="/tasks" className={itemClass}>
          <span className="ico">🗂</span><span>Tasks</span>
        </NavLink>
        <NavLink to="/users" className={itemClass}>
          <span className="ico">👥</span><span>Users</span>
        </NavLink>
        <NavLink to="/settings" className={itemClass}>
          <span className="ico">⚙</span><span>Settings</span>
        </NavLink>
      </nav>

      <div className="side-foot">
        <button className="logout" onClick={logout}>Logout</button>
      </div>
    </aside>
  );
}
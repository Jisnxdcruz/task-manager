// src/components/Navbar.jsx
import React from "react";
import NotificationBell from "./NotificationBell";

export default function Navbar() {
  return (
    <nav
      style={{
        height: 56,
        background: "#0f1720",
        color: "#fff",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 16px",
        boxShadow: "0 1px 0 rgba(255,255,255,0.03)",
        position: "sticky",
        top: 0,
        zIndex: 50
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ fontWeight: 700, fontSize: 16 }}>Task Manager</div>
        {/* small subtitle */}
        <div style={{ fontSize: 12, color: "#9aa" }}>manage stuff, stop procrastinating</div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        {/* notification bell */}
        <NotificationBell />

        {/* fake profile circle */}
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: "50%",
            background: "#1f2937",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#fff",
            fontWeight: 700
          }}
        >
          U
        </div>
      </div>
    </nav>
  );
}
// src/components/NotificationBell.jsx
import React, { useContext, useState, useRef, useEffect } from "react";
import { NotificationContext } from "../contexts/NotificationContext";
import "./Notification.css"; // your css path

export default function NotificationBell() {
  const { notifications, unreadCount, markAsRead, markAllAsRead, loading } = useContext(NotificationContext);
  const [open, setOpen] = useState(false);
  const panelRef = useRef(null);

  // click outside to close
  useEffect(() => {
    function onDoc(e) {
      if (panelRef.current && !panelRef.current.contains(e.target)) setOpen(false);
    }
    if (open) document.addEventListener("click", onDoc);
    return () => document.removeEventListener("click", onDoc);
  }, [open]);

  const handleItemClick = (n) => {
    if (!n.read) markAsRead(n._id);
    // you can navigate to task: e.g. window.location = /tasks/${n.data.taskId} if desired
    // close panel optionally:
    setOpen(false);
  };

  return (
    <div className="notification-container" ref={panelRef} style={{ marginLeft: 12 }}>
      <button
        className="notification-bell"
        onClick={() => setOpen(v => !v)}
        aria-label="Notifications"
        title="Notifications"
      >
        🔔
        {unreadCount > 0 && <span className="badge">{unreadCount}</span>}
      </button>

      {open && (
        <div className="notification-panel" role="dialog" aria-label="Notifications panel">
          <div className="panel-header">
            <span>Notifications</span>
            <button onClick={markAllAsRead} style={{ cursor: "pointer", fontSize: 12 }}>
              Mark all as read
            </button>
          </div>

          <ul>
            {loading ? (
              <li className="empty">Loading...</li>
            ) : notifications.length === 0 ? (
              <li className="empty">No notifications</li>
            ) : (
              notifications.map(n => (
                <li
                  key={n._id}
                  className={n.read ? "read" : "unread"}
                  onClick={() => handleItemClick(n)}
                  style={{ display: "flex", flexDirection: "column", gap: 4 }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                    <div style={{ maxWidth: "75%", wordBreak: "break-word" }}>{n.message}</div>
                    <div style={{ fontSize: 11, color: "#aaa" }}>
                      {new Date(n.createdAt).toLocaleString()}
                    </div>
                  </div>
                  {n.data && n.data.taskId && (
                    <small style={{ color: "#9aa", fontSize: 11 }}>Task: {n.data.taskId}</small>
                  )}
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
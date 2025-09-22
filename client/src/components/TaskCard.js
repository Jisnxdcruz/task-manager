import React from "react";

export default function TaskCard({ title, deadline, status, priority }) {
  const statusColor = {
    Pending: "#ffbf00",
    Completed: "#32cd32",
    Overdue: "#ff4d4d",
  };

  const priorityColor = {
    High: "#ff4d4d",
    Medium: "#ffbf00",
    Low: "#32cd32",
  };

  return (
    <div style={styles.card}>
      <h3>{title}</h3>
      <p>Deadline: {deadline}</p>
      <div style={styles.badges}>
        <span style={{ ...styles.statusBadge, backgroundColor: statusColor[status] || "#888" }}>{status}</span>
        {priority && <span style={{ ...styles.priorityBadge, backgroundColor: priorityColor[priority] }}>{priority}</span>}
      </div>
    </div>
  );
}

const styles = {
  card: {
    background: "#1f1f1f",
    padding: "1rem",
    borderRadius: "10px",
    marginBottom: "1rem",
    boxShadow: "0 2px 6px rgba(0,0,0,0.5)",
    color: "#fff",
  },
  badges: {
    marginTop: "0.5rem",
    display: "flex",
    gap: "0.5rem",
  },
  statusBadge: {
    padding: "0.2rem 0.6rem",
    borderRadius: "5px",
    fontSize: "0.8rem",
  },
  priorityBadge: {
    padding: "0.2rem 0.6rem",
    borderRadius: "5px",
    fontSize: "0.8rem",
  },
};
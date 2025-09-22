import React, { useEffect, useMemo, useState, useCallback } from "react";
import Sidebar from "../components/Sidebar";      // keep your sidebar
import api from "../utils/api";                   // default export
import "./Dashboard.css";

const STATUSES = ["Pending", "In Progress", "Completed"];

export default function Dashboard() {
  // state
  const [tasks, setTasks] = useState([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [note, setNote] = useState("");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [sortBy, setSortBy] = useState("newest");
  const [page, setPage] = useState(1);
  const pageSize = 6;
// inline edit state
const [editingId, setEditingId] = useState(null);
const [eTitle, setETitle] = useState("");
const [eDesc, setEDesc] = useState("");
const [eDue, setEDue] = useState("");
const [ePrio, setEPrio] = useState("Medium");

// priority rank helper for sorting
const prioRank = (p) => (p === "High" ? 3 : p === "Medium" ? 2 : 1);
  // helpers
  const ping = (m) => { setNote(m); setTimeout(() => setNote(""), 1400); };
  const cycleStatus = (current) => {
    const order = STATUSES;
    const i = order.indexOf(current);
    return order[(i + 1) % order.length];
  };

  // auth guard
  useEffect(() => {
    if (!localStorage.getItem("token")) window.location.href = "/login";
  }, []);

  // load tasks
  const loadTasks = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api("/api/tasks");
      setTasks(Array.isArray(res) ? res : res?.tasks ?? []);
    } catch (e) {
      console.error(e);
      setTasks([]);
      ping(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadTasks(); }, [loadTasks]);

  // create
  const addTask = async (e) => {
    e.preventDefault();
    const t = title.trim();
    const d = description.trim();
    if (!t) return ping("Title required");

    try {
      const created = await api("/api/tasks", {
        method: "POST",
        body: { title: t, description: d, status: "Pending" },
      });
      setTasks((prev) => [created, ...prev]);
      setTitle(""); setDescription("");
      ping("Task added");
    } catch (e) { ping(e.message); }
  };

  // update status
  const updateStatus = async (id, status) => {
    try {
      await api(`/api/tasks/${id}`, { method: "PUT", body: { status } });
      setTasks((prev) => prev.map((t) => (t._id === id ? { ...t, status } : t)));
      ping("Status updated");
    } catch (e) { ping(e.message); }
  };

  // delete
  const removeTask = async (id) => {
    try {
      await api(`/api/tasks/${id}`, { method: "DELETE" });
      setTasks((prev) => prev.filter((t) => t._id !== id));
      ping("Deleted");
    } catch (e) { ping(e.message); }
  };
  const startEdit = (t) => {
  setEditingId(t._id);
  setETitle(t.title || "");
  setEDesc(t.description || "");
  setEDue(t.dueDate ? new Date(t.dueDate).toISOString().slice(0,10) : "");
  setEPrio(t.priority || "Medium");
};

const cancelEdit = () => {
  setEditingId(null);
  setETitle(""); setEDesc(""); setEDue(""); setEPrio("Medium");
};

const saveEdit = async () => {
  if (!editingId) return;
  try {
    const payload = {
      title: eTitle.trim(),
      description: eDesc.trim(),
      dueDate: eDue || null,
      priority: ePrio,
    };
    const updated = await api(`/api/tasks/${editingId}`, { method: "PUT", body: payload });
    setTasks(prev => prev.map(t => t._id === editingId ? updated : t));
    cancelEdit();
    ping("Saved");
  } catch (e) { ping(e.message); }
};

  // filters + sorting
const filtered = useMemo(() => {
  let list = [...tasks];

  if (statusFilter !== "All") {
    list = list.filter((t) => t.status === statusFilter);
  }
  if (query.trim()) {
    const q = query.toLowerCase();
    list = list.filter(
      (t) =>
        (t.title || "").toLowerCase().includes(q) ||
        (t.description || "").toLowerCase().includes(q)
    );
  }

  list.sort((a, b) => {
    if (sortBy === "az") return (a.title || "").localeCompare(b.title || "");
    if (sortBy === "za") return (b.title || "").localeCompare(a.title || "");
    if (sortBy === "oldest") return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
    if (sortBy === "dueSoon")
      return new Date(a.dueDate || 8640000000000000) - new Date(b.dueDate || 8640000000000000);
    if (sortBy === "prioHigh") return prioRank(b.priority) - prioRank(a.priority);
    // default newest
    return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
  });

  return list;
}, [tasks, statusFilter, query, sortBy]);

  // paging
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * pageSize;
  const pageItems = filtered.slice(start, start + pageSize);
  useEffect(() => { setPage(1); }, [statusFilter, query, sortBy]);

  return (
    <div className="db-root">
      <Sidebar />

      <main className="db-main">
        <div className="db-aurora" aria-hidden />
        <header className="db-header">
          <h1>Dashboard</h1>
          <div className="db-right">
            <input
              className="db-search"
              placeholder="Search tasks…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <select
              className="db-sort"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
          <option value="dueSoon">Due soon</option>
          <option value="prioHigh">priority(High - Low)</option>

              <option value="az">Title A–Z</option>
              <option value="za">Title Z–A</option>
            </select>
            {note && <div className="db-toast">{note}</div>}
          </div>
        </header>

        {/* stats row */}
        <section className="db-stats">
          <div className="db-card stat">
            <div className="stat-num">{filtered.length}</div>
            <div className="stat-label">Visible</div>
          </div>
          <div className="db-card stat">
            <div className="stat-num">{tasks.filter((t) => t.status === "Completed").length}</div>
            <div className="stat-label">Completed</div>
          </div>
          <div className="db-card stat">
            <div className="stat-num">{tasks.filter((t) => t.status === "In Progress").length}</div>
            <div className="stat-label">In Progress</div>
          </div>
          <div className="db-card stat">
            <div className="stat-num">{tasks.filter((t) => t.status === "Pending").length}</div>
            <div className="stat-label">Pending</div>
          </div>
        </section>

        {/* filter tabs */}
        <div className="db-toolbar">
          <div className="tabs">
            {["All", ...STATUSES].map((s) => (
              <button
                key={s}
                className={`tab ${statusFilter === s ? "active" : ""}`}
                onClick={() => setStatusFilter(s)}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* composer + table */}
        <section className="db-grid">
  <div className="db-card full">
    <div className="db-card-header">
      <h2>Tasks</h2>
      <span className={`chip ${loading ? "" : "invisible"}`}>Loading…</span>
    </div>

    {/* Quick Add (inline, full width) */}
    <form className="db-form inline" onSubmit={addTask}>
      <input
        className="inp"
        placeholder="Task title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        autoFocus
      />
      <input
        className="inp"
        placeholder="Short description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />
      <button className="btn-primary" type="submit">Add Task</button>
    </form>

    {/* Table */}
    <div className="db-table-wrap">
      <table className="db-table">
        <thead>
          <tr>
            <th style={{ width: "28%" }}>Title</th>
            <th>Description</th>
            <th>Priority</th>
            <th>Due</th>
            <th>Status</th>
            <th className="right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {pageItems.length ? (
            pageItems.map((t) => {
              const isEdit = editingId === t._id;
              return (
                <tr key={t._id}>
                  <td className="title-cell">
                    {isEdit ? (
                      <input
                        className="inp sm"
                        value={eTitle}
                        onChange={(e) => setETitle(e.target.value)}
                      />
                    ) : t.title}
                  </td>
                  <td className="desc-cell">
                    {isEdit ? (
                      <input
                        className="inp sm"
                        value={eDesc}
                        onChange={(e) => setEDesc(e.target.value)}
                      />
                    ) : (t.description || "—")}
                  </td>
                  <td>
                    {isEdit ? (
                      <select
                        className="inp sm"
                        value={ePrio}
                        onChange={(e) => setEPrio(e.target.value)}
                      >
                        <option>Low</option>
                        <option>Medium</option>
                        <option>High</option>
                      </select>
                    ) : (
                      <span className={`pill ${(t.priority || "Medium").toLowerCase()}`}>
                        {t.priority || "Medium"}
                      </span>
                    )}
                  </td>
                  <td>
                    {isEdit ? (
                      <input
                        className="inp sm"
                        type="date"
                        value={eDue}
                        onChange={(e) => setEDue(e.target.value)}
                      />
                    ) : (t.dueDate ? new Date(t.dueDate).toLocaleDateString() : "—")}
                  </td>
                  <td>
                    {isEdit ? (
                      <span className="badge muted">{t.status}</span>
                    ) : (
                      <button
                        className={`badge ${
                          t.status === "Completed" ? "ok" :
                          t.status === "In Progress" ? "warn" : "muted"
                        }`}
                        onClick={() => updateStatus(t._id, cycleStatus(t.status))}
                        title="Click to cycle: Pending → In Progress → Completed"
                      >
                        {t.status}
                      </button>
                    )}
                  </td>
                  <td className="right">
                    <div className="row-actions">
                      {isEdit ? (
                        <>
                          <button className="mini ok" onClick={saveEdit} type="button">Save</button>
                          <button className="mini" onClick={cancelEdit} type="button">Cancel</button>
                        </>
                      ) : (
                        <>
                          <button className="mini" onClick={() => startEdit(t)} type="button">Edit</button>
                          <button className="mini danger" onClick={() => removeTask(t._id)} type="button">Delete</button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })
          ) : (
            <tr><td colSpan="6" className="empty">No tasks match filters.</td></tr>
          )}
        </tbody>
      </table>
    </div>

    {/* Pager at the very bottom of this card */}
    <div className="pager">
      <button disabled={safePage <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>Prev</button>
      <span>Page {safePage} / {totalPages}</span>
      <button disabled={safePage >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>Next</button>
    </div>
  </div>
</section>

        <footer className="db-foot">
          <span>Focus beats motivation. — J</span>
        </footer>
      </main>
    </div>
  );
}
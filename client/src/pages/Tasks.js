// src/pages/Tasks.js
import React, {
  useEffect,
  useMemo,
  useState,
  useCallback,
  useRef,
} from "react";
import Sidebar from "../components/Sidebar";
import api from "../utils/api";
import "./Tasks.css";

/* adjust statuses/priorities to match your app */
const STATUSES = ["Pending", "In Progress", "Completed"];
const PRIORITIES = ["Low", "Medium", "High"];

export default function Tasks() {
  // form state (quick add)
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("Medium");
  const [dueDate, setDueDate] = useState("");

  // table state
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [note, setNote] = useState("");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [prioFilter, setPrioFilter] = useState("All");
  const [sortBy, setSortBy] = useState("newest");
  const [page, setPage] = useState(1);
  const pageSize = 8;

  // users / assignment
  const [me, setMe] = useState(null); // { _id, role, ... }
  const [users, setUsers] = useState([]); // assignable list
  const [assignBusyId, setAssignBusyId] = useState(null); // which task is busy assigning

  // inline edit
  const [editingId, setEditingId] = useState(null);
  const [eTitle, setETitle] = useState("");
  const [eDesc, setEDesc] = useState("");
  const [ePrio, setEPrio] = useState("Medium");
  const [eDue, setEDue] = useState("");
  const [eStatus, setEStatus] = useState("Pending");

  const ping = (m) => {
    setNote(m);
    setTimeout(() => setNote(""), 1500);
  };
  const prioRank = (p) => (p === "High" ? 3 : p === "Medium" ? 2 : 1);

  useEffect(() => {
    if (!localStorage.getItem("token")) window.location.href = "/login";
  }, []);

  // load current user and assignable users
  const loadUsers = useCallback(async () => {
    try {
      const meData = await api("/api/users/me");
      setMe(meData || null);
    } catch (e) {
      console.warn("Could not load /api/users/me", e);
      setMe(null);
    }

    try {
      // try to load full users list (may require admin)
      const list = await api("/api/users");
      if (Array.isArray(list) && list.length) setUsers(list);
      else setUsers([]); // fallback empty
    } catch (e) {
      // not fatal — we can still function (assigning may be restricted)
      console.warn("Could not load users list (maybe not admin):", e);
      setUsers([]);
    }
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
      ping("Couldn't load tasks");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUsers();
    loadTasks();
  }, [loadUsers, loadTasks]);

  // create
  const addTask = async (e) => {
    e.preventDefault();
    if (!title.trim()) return ping("Title required");
    try {
      const body = {
        title: title.trim(),
        description: description.trim(),
        status: "Pending",
        priority,
        dueDate: dueDate || null,
      };
      const created = await api("/api/tasks", { method: "POST", body });
      setTasks((prev) => [created, ...prev]);
      setTitle("");
      setDescription("");
      setPriority("Medium");
      setDueDate("");
      ping("Task added");
    } catch (e) {
      ping(e.message || "Create failed");
    }
  };

  // update status
  const updateStatus = async (id, status) => {
    try {
      const updated = await api(`/api/tasks/${id}`, {
        method: "PUT",
        body: { status },
      });
      setTasks((prev) => prev.map((t) => (t._id === id ? updated : t)));
      ping("Status updated");
    } catch (e) {
      ping(e.message || "Status update failed");
    }
  };

  // delete
  const removeTask = async (id) => {
    if (!window.confirm("Delete this task?")) return;
    try {
      await api(`/api/tasks/${id}`, { method: "DELETE" });
      setTasks((prev) => prev.filter((t) => t._id !== id));
      ping("Deleted");
    } catch (e) {
      ping(e.message || "Delete failed");
    }
  };

  // assign/unassign helper (single definition, no duplicate)
  const assignTask = async (taskId, assigneeIdOrNull) => {
    setAssignBusyId(taskId);
    try {
      const body = { assignee: assigneeIdOrNull || null };
      const updated = await api(`/api/tasks/${taskId}`, {
        method: "PUT",
        body,
      });
      setTasks((prev) => prev.map((t) => (t._id === taskId ? updated : t)));
      ping(assigneeIdOrNull ? "Assigned" : "Unassigned");
    } catch (err) {
      console.error("assignTask error:", err);
      ping(err?.message || "Assign failed");
    } finally {
      setAssignBusyId(null);
    }
  };

  // inline edit helpers
  const startEdit = (t) => {
    setEditingId(t._id);
    setETitle(t.title || "");
    setEDesc(t.description || "");
    setEPrio(t.priority || "Medium");
    setEDue(t.dueDate ? new Date(t.dueDate).toISOString().slice(0, 10) : "");
    setEStatus(t.status || "Pending");
  };
  const cancelEdit = () => {
    setEditingId(null);
    setETitle("");
    setEDesc("");
    setEPrio("Medium");
    setEDue("");
    setEStatus("Pending");
  };
  const saveEdit = async () => {
    if (!editingId) return;
    try {
      const payload = {
        title: eTitle.trim(),
        description: eDesc.trim(),
        priority: ePrio,
        dueDate: eDue || null,
        status: eStatus,
      };
      const updated = await api(`/api/tasks/${editingId}`, {
        method: "PUT",
        body: payload,
      });
      setTasks((prev) => prev.map((t) => (t._id === editingId ? updated : t)));
      ping("Saved");
      cancelEdit();
    } catch (e) {
      ping(e.message || "Save failed");
    }
  };

  // filtering, sorting, paging (local filtering remains for filters + sorts)
  const filtered = useMemo(() => {
    let list = [...tasks];
    if (statusFilter !== "All")
      list = list.filter((t) => t.status === statusFilter);
    if (prioFilter !== "All")
      list = list.filter((t) => (t.priority || "Medium") === prioFilter);
    // local query filtering only narrows results when server-side search isn't used
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
      if (sortBy === "oldest")
        return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
      if (sortBy === "dueSoon")
        return (
          new Date(a.dueDate || 8640000000000000) -
          new Date(b.dueDate || 8640000000000000)
        );
      if (sortBy === "prioHigh") return prioRank(b.priority) - prioRank(a.priority);
      return new Date(b.createdAt || 0) - new Date(a.createdAt || 0); // newest
    });
    return list;
  }, [tasks, statusFilter, prioFilter, query, sortBy]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * pageSize;
  const pageItems = filtered.slice(start, start + pageSize);

  useEffect(() => {
    setPage(1);
  }, [statusFilter, prioFilter, query, sortBy]);

  // helper to determine if current user can assign a particular task
  const canAssign = (task) => {
    if (!me) return false;
    if (String(task.createdBy) === String(me._id)) return true; // owner
    if (["manager", "admin"].includes(me.role)) return true;
    return false;
  };

  // ---------- SEARCH: server-backed with debounce ----------
  const abortRef = useRef(null);
  const searchServer = useCallback(
    async (q) => {
      setLoading(true);
      try {
        if (!q) {
          // empty query -> reload full list
          await loadTasks();
          return;
        }
        const results = await api(`/api/tasks/search?q=${encodeURIComponent(q)}`);
        // server returns tasks array
        setTasks(Array.isArray(results) ? results : []);
      } catch (e) {
        console.error("task search error", e);
        ping("Search failed");
      } finally {
        setLoading(false);
      }
    },
    [loadTasks]
  );

  useEffect(() => {
    if (abortRef.current) clearTimeout(abortRef.current);
    abortRef.current = setTimeout(() => {
      searchServer(query.trim());
      abortRef.current = null;
    }, 350);
    return () => {
      if (abortRef.current) clearTimeout(abortRef.current);
    };
  }, [query, searchServer]);

  return (
    <div className="tasks-root">
      <Sidebar />

      <main className="tasks-main">
        <div className="bg-aurora" aria-hidden />

        <header className="t-header">
          <h1>Tasks</h1>
          <div className="right">
            <input
              className="inp search"
              placeholder="Search tasks…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <select
              className="inp sel"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option>All</option>
              {STATUSES.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
            <select
              className="inp sel"
              value={prioFilter}
              onChange={(e) => setPrioFilter(e.target.value)}
            >
              <option>All</option>
              {PRIORITIES.map((p) => (
                <option key={p}>{p}</option>
              ))}
            </select>
            <select
              className="inp sel"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
              <option value="dueSoon">Due soon</option>
              <option value="prioHigh">Priority (High→Low)</option>
              <option value="az">Title A–Z</option>
              <option value="za">Title Z–A</option>
            </select>
            {note && <span className="toast">{note}</span>}
          </div>
        </header>

        {/* Create bar */}
        <form className="create" onSubmit={addTask}>
          <input
            className="inp"
            placeholder="Task title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <input
            className="inp"
            placeholder="Short description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <select
            className="inp"
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
          >
            {PRIORITIES.map((p) => (
              <option key={p}>{p}</option>
            ))}
          </select>
          <input
            className="inp"
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
          />
          <button className="btn" type="submit">
            Add
          </button>
        </form>

        {/* Table */}
        <section className="t-card">
          <div className="t-top">
            <h2>All tasks</h2>
            {loading && <span className="chip">Loading…</span>}
          </div>

          <div className="table-wrap">
            <table className="tbl">
              <thead>
                <tr>
                  <th style={{ width: "26%" }}>Title</th>
                  <th>Description</th>
                  <th>Priority</th>
                  <th>Due</th>
                  <th>Assignee</th>
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
                        <td>
                          {isEdit ? (
                            <input
                              className="inp sm"
                              value={eTitle}
                              onChange={(e) => setETitle(e.target.value)}
                            />
                          ) : (
                            t.title
                          )}
                        </td>
                        <td>
                          {isEdit ? (
                            <input
                              className="inp sm"
                              value={eDesc}
                              onChange={(e) => setEDesc(e.target.value)}
                            />
                          ) : (
                            t.description || "—"
                          )}
                        </td>
                        <td>
                          {isEdit ? (
                            <select
                              className="inp sm"
                              value={ePrio}
                              onChange={(e) => setEPrio(e.target.value)}
                            >
                              {PRIORITIES.map((p) => (
                                <option key={p}>{p}</option>
                              ))}
                            </select>
                          ) : (
                            <span
                              className={`pill ${
                                (t.priority || "Medium").toLowerCase()
                              }`}
                            >
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
                          ) : t.dueDate ? (
                            new Date(t.dueDate).toLocaleDateString()
                          ) : (
                            "—"
                          )}
                        </td>

                        {/* ASSIGNEE cell */}
                        <td>
                          {canAssign(t) ? (
                            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                              <select
                                className="inp sm"
                                value={t.assignee?._id || ""}
                                onChange={(e) => {
                                  const id = e.target.value || null;
                                  assignTask(t._id, id);
                                }}
                                disabled={assignBusyId === t._id}
                              >
                                <option value="">— Unassigned —</option>
                                {users.map((u) => (
                                  <option key={u._id} value={u._id}>
                                    {u.name || u.email}
                                  </option>
                                ))}
                              </select>
                              {assignBusyId === t._id && <span className="chip">Saving…</span>}
                            </div>
                          ) : (
                            t.assignee ? `${t.assignee.name || t.assignee.email}` : "—"
                          )}
                        </td>

                        <td>
                          {isEdit ? (
                            <select
                              className="inp sm"
                              value={eStatus}
                              onChange={(e) => setEStatus(e.target.value)}
                            >
                              {STATUSES.map((s) => (
                                <option key={s}>{s}</option>
                              ))}
                            </select>
                          ) : (
                            <button
                              className={`badge ${
                                t.status === "Completed"
                                  ? "ok"
                                  : t.status === "In Progress"
                                  ? "warn"
                                  : "muted"
                              }`}
                              title="Status"
                              onClick={() =>
                                updateStatus(
                                  t._id,
                                  STATUSES[(STATUSES.indexOf(t.status) + 1) % STATUSES.length]
                                )
                              }
                              type="button"
                            >
                              {t.status}
                            </button>
                          )}
                        </td>

                        <td className="right">
                          <div className="row-actions">
                            {isEdit ? (
                              <>
                                <button
                                  className="mini ok"
                                  onClick={saveEdit}
                                  type="button"
                                >
                                  Save
                                </button>
                                <button
                                  className="mini"
                                  onClick={cancelEdit}
                                  type="button"
                                >
                                  Cancel
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  className="mini"
                                  onClick={() => startEdit(t)}
                                  type="button"
                                >
                                  Edit
                                </button>
                                <button
                                  className="mini danger"
                                  onClick={() => removeTask(t._id)}
                                  type="button"
                                >
                                  Delete
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="7" className="empty">
                      No tasks match filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
<div className="pager">
            <button
              disabled={safePage <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Prev
            </button>
            <span>
              Page {safePage} / {totalPages}
            </span>
            <button
              disabled={safePage >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              Next
            </button>
          </div> {/* end pager */}
        </section> {/* end t-card */}

      </main> {/* end tasks-main */}
    </div> 
  ); /* end return */
} /* end component */
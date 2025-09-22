import React, { useEffect, useMemo, useState, useCallback, useRef } from "react";
import Sidebar from "../components/Sidebar";
import api from "../utils/api";
import "./Users.css";

const ROLES = ["user", "manager", "admin"];
const STATES = ["active", "suspended"];

export default function Users() {
  // table state
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [note, setNote] = useState("");

  // filters
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("All");
  const [stateFilter, setStateFilter] = useState("All");
  const [sortBy, setSortBy] = useState("newest");

  // paging
  const [page, setPage] = useState(1);
  const pageSize = 10;

  // inline edit
  const [editingId, setEditingId] = useState(null);
  const [eName, setEName] = useState("");
  const [eEmail, setEEmail] = useState("");
  const [eRole, setERole] = useState("user");
  const [eState, setEState] = useState("active");

  const ping = (m) => { setNote(m); setTimeout(() => setNote(""), 1500); };

  useEffect(() => {
    if (!localStorage.getItem("token")) window.location.href = "/login";
  }, []);

  // ---- load initial users (fallback) and expose search ----
  const abortRef = useRef(null);
  const fetchUsersFallback = useCallback(async () => {
    setLoading(true);
    try {
      // try the full list first (admin only perhaps)
      const res = await api("/api/users").catch(() => null);
      if (Array.isArray(res) && res.length) {
        setUsers(res);
        return;
      }
      // fallback to /me if /users not available
      const me = await api("/api/users/me").catch(() => null);
      setUsers(me ? [me] : []);
    } catch (e) {
      console.error(e);
      setUsers([]);
      ping("Couldn’t load users");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // initial load (no query)
    fetchUsersFallback();
    // cleanup abort handle
    return () => {
      if (abortRef.current) {
        clearTimeout(abortRef.current);
        abortRef.current = null;
      }
    };
  }, [fetchUsersFallback]);

  // debounced search
  const searchServer = useCallback(async (q) => {
    setLoading(true);
    try {
      if (!q) {
        // empty query -> reload fallback (admin list or /me)
        await fetchUsersFallback();
        return;
      }
      const results = await api(`/api/users/search?q=${encodeURIComponent(q)}`);
      setUsers(Array.isArray(results) ? results : []);
    } catch (e) {
      console.error("search users error", e);
      setUsers([]);
      ping("Search failed");
    } finally {
      setLoading(false);
    }
  }, [fetchUsersFallback]);

  // call searchServer with debounce (350ms)
  useEffect(() => {
    // clear possible pending timer
    if (abortRef.current) clearTimeout(abortRef.current);
    abortRef.current = setTimeout(() => {
      searchServer(query.trim());
      abortRef.current = null;
    }, 350);
    return () => {
      if (abortRef.current) clearTimeout(abortRef.current);
    };
  }, [query, searchServer]);

  // start/cancel/save edit
  const startEdit = (u) => {
    setEditingId(u._id);
    setEName(u.name || "");
    setEEmail(u.email || "");
    setERole(u.role || "user");
    setEState(u.state || "active");
  };
  const cancelEdit = () => {
    setEditingId(null);
    setEName(""); setEEmail(""); setERole("user"); setEState("active");
  };
  const saveEdit = async () => {
    if (!editingId) return;
    try {
      const payload = { name: eName.trim(), email: eEmail.trim(), role: eRole, state: eState };
      const updated = await api(`/api/users/${editingId}`, { method: "PUT", body: payload });
      setUsers(prev => prev.map(u => (u._id === editingId ? updated : u)));
      ping("Saved");
      cancelEdit();
    } catch (e) {
      console.error(e);
      ping("Update failed");
    }
  };

  // delete
  const removeUser = async (id) => {
    if (!window.confirm("Delete this user?")) return;
    try {
      await api(`/api/users/${id}`, { method: "DELETE" });
      setUsers(prev => prev.filter(u => u._id !== id));
      ping("Deleted");
    } catch (e) {
      console.error(e);
      ping("Delete failed");
    }
  };

  // filter + sort + page
  const filtered = useMemo(() => {
    let list = [...users];
    if (roleFilter !== "All") list = list.filter(u => (u.role || "user") === roleFilter);
    if (stateFilter !== "All") list = list.filter(u => (u.state || "active") === stateFilter);
    if (query.trim()) {
      const q = query.toLowerCase();
      // local filtering to further narrow server results
      list = list.filter(
        u =>
          (u.name || "").toLowerCase().includes(q) ||
          (u.email || "").toLowerCase().includes(q)
      );
    }
    list.sort((a, b) => {
      if (sortBy === "az") return (a.name || "").localeCompare(b.name || "");
      if (sortBy === "za") return (b.name || "").localeCompare(a.name || "");
      // default newest by createdAt if present
      return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
    });
    return list;
  }, [users, roleFilter, stateFilter, query, sortBy]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const startIdx = (safePage - 1) * pageSize;
  const pageItems = filtered.slice(startIdx, startIdx + pageSize);

  useEffect(() => { setPage(1); }, [roleFilter, stateFilter, query, sortBy]);

  return (
    <div className="users-root">
      <Sidebar />

      <main className="users-main">
        <div className="bg-aurora" aria-hidden />

        <header className="u-header">
          <h1>Users</h1>
          <div className="right">
            <input
              className="inp search"
              placeholder="Search name or email…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <select className="inp sel" value={roleFilter} onChange={(e)=>setRoleFilter(e.target.value)}>
              <option>All</option>
              {ROLES.map(r => <option key={r}>{r}</option>)}
            </select>
            <select className="inp sel" value={stateFilter} onChange={(e)=>setStateFilter(e.target.value)}>
              <option>All</option>
              {STATES.map(s => <option key={s}>{s}</option>)}
            </select>
            <select className="inp sel" value={sortBy} onChange={(e)=>setSortBy(e.target.value)}>
              <option value="newest">Newest</option>
              <option value="az">Name A–Z</option>
              <option value="za">Name Z–A</option>
            </select>
            {note && <span className="toast">{note}</span>}
          </div>
        </header>

        <section className="u-card">
          <div className="u-top">
            <h2>All users</h2>
            {loading && <span className="chip">Loading…</span>}
          </div>

          <div className="table-wrap">
            <table className="tbl">
              <thead>
                <tr>
                  <th style={{width:"24%"}}>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th className="right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {pageItems.length ? (
                  pageItems.map(u => {
                    const isEdit = editingId === u._id;
                    return (
                      <tr key={u._id || u.email}>
                        <td>
                          {isEdit ? (
                            <input className="inp sm" value={eName} onChange={(e)=>setEName(e.target.value)} />
                          ) : (u.name || "—")}
                        </td>
                        <td>
                          {isEdit ? (
                            <input className="inp sm" value={eEmail} onChange={(e)=>setEEmail(e.target.value)} />
                          ) : (u.email || "—")}
                        </td>
                        <td>
                          {isEdit ? (
                            <select className="inp sm" value={eRole} onChange={(e)=>setERole(e.target.value)}>
                              {ROLES.map(r => <option key={r}>{r}</option>)}
                            </select>
                          ) : (
                            <span className={`pill role ${u.role || "user"}`}>{u.role || "user"}</span>
                          )}
                        </td>
                        <td>
                          {isEdit ? (
                            <select className="inp sm" value={eState} onChange={(e)=>setEState(e.target.value)}>
                              {STATES.map(s => <option key={s}>{s}</option>)}
                            </select>
                          ) : (
                            <span className={`pill ${u.state === "suspended" ? "warn" : "ok"}`}>
                              {u.state || "active"}
                            </span>
                          )}
                        </td>
                        <td className="right">
                          <div className="row-actions">
                            {isEdit ? (
                              <>
                                <button className="mini ok" type="button" onClick={saveEdit}>Save</button>
                                <button className="mini" type="button" onClick={cancelEdit}>Cancel</button>
                              </>
                            ) : (
                              <>
                                <button className="mini" type="button" onClick={()=>startEdit(u)}>Edit</button>
                                <button className="mini danger" type="button" onClick={()=>removeUser(u._id)}>Delete</button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  // show different text depending on whether user searched or not
                  <tr>
                    <td colSpan="5" className="empty">
                      {query.trim() ? "No matches found." : "No users"}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="pager">
            <button disabled={safePage<=1} onClick={()=>setPage(p=>Math.max(1,p-1))}>Prev</button>
            <span>Page {safePage} / {totalPages}</span>
            <button disabled={safePage>=totalPages} onClick={()=>setPage(p=>Math.min(totalPages,p+1))}>Next</button>
          </div>
        </section>
      </main>
    </div>
  );
}
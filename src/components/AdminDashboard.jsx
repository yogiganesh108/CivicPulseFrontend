import { useEffect, useState, useRef, useMemo } from "react";
import TopNav from "./TopNav";
import ComplaintDetail from './ComplaintDetail';
import api from "../utils/api";
import "./AdminDashboard.css";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  LineChart,
  Line,
  ResponsiveContainer,
} from "recharts";

export default function AdminDashboard() {
  // ===================== STATE VARIABLES =====================
  const [activeTab, setActiveTab] = useState("dashboard");
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [officerForm, setOfficerForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
  });
  const [officers, setOfficers] = useState([]);
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [priorityFilter, setPriorityFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [officerFilter, setOfficerFilter] = useState("All");
  const [assigningId, setAssigningId] = useState(null);
  const [assignData, setAssignData] = useState({
    officer_id: "",
    priority: "Medium",
    deadline: "",
  });
  const [debugInfo, setDebugInfo] = useState(null);
  const [selectedComplaintId, setSelectedComplaintId] = useState(null);

  const blobUrlsRef = useRef([]);
  const [, setTick] = useState(0);

  // ===================== IMAGE FETCHING =====================
  async function fetchImageBlobForComplaint(id, imageUrl) {
    try {
      const token = localStorage.getItem("jwt");
      if (!imageUrl || !token) return;
      const r = await fetch(imageUrl, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!r.ok) return;
      const blob = await r.blob();
      const obj = URL.createObjectURL(blob);
      blobUrlsRef.current.push(obj);
      setComplaints((prev) =>
        prev.map((it) => (it.id === id ? { ...it, imageBlobUrl: obj } : it))
      );
      setTick((t) => t + 1);
    } catch {
      /* ignore */
    }
  }

  // ===================== LOAD DATA =====================
  // useEffect(() => {
  //   if (activeTab === "complaints") loadComplaints();
  // }, [activeTab]);
  useEffect(() => {
    // Always load data when the component mounts for dashboard charts
    loadComplaints();
  }, []);

  useEffect(() => {
    // Reload data if user switches to complaints tab later
    if (activeTab === "complaints") loadComplaints();
  }, [activeTab]);

  async function loadComplaints() {
    setLoading(true);
    setError(null);
    try {
      const list = await api.getAllComplaints();

      // revoke old blob URLs
      if (blobUrlsRef.current.length) {
        blobUrlsRef.current.forEach((u) => {
          try {
            URL.revokeObjectURL(u);
          } catch {}
        });
        blobUrlsRef.current = [];
      }

      // normalize URLs
      const token = localStorage.getItem("jwt");
      const normalized = list.map((item) => {
        const copy = { ...item };
        if (copy.imageUrl?.startsWith("/"))
          copy.imageUrl = api.base + copy.imageUrl;
        return copy;
      });

      // fetch image blobs if token available
      if (token) {
        await Promise.all(
          normalized.map(async (itm) => {
            if (itm.imageUrl) {
              try {
                const r = await fetch(itm.imageUrl, {
                  headers: { Authorization: `Bearer ${token}` },
                });
                if (r.ok) {
                  const blob = await r.blob();
                  const obj = URL.createObjectURL(blob);
                  itm.imageBlobUrl = obj;
                  blobUrlsRef.current.push(obj);
                }
              } catch {}
            }
          })
        );
      }

      setComplaints(normalized);
      const of = await api.getOfficers();
      setOfficers(of);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  function resolveOfficerName(c) {
    const found = officers.find(o => String(o.id) === String(c.officerId));
    if (found) return found.name;
    if (c.officerName) return c.officerName;
    if (c.officer && c.officer.name) return c.officer.name;
    return c.officerId ? `Officer #${c.officerId}` : '-';
  }

  // cleanup blobs on unmount
  useEffect(() => {
    return () => {
      if (blobUrlsRef.current.length) {
        blobUrlsRef.current.forEach((u) => {
          try {
            URL.revokeObjectURL(u);
          } catch {}
        });
        blobUrlsRef.current = [];
      }
    };
  }, []);

  // ===================== FILTER OPTIONS =====================
  const categories = useMemo(() => {
    if (!complaints.length) return ["All"];
    const set = new Set(complaints.map((c) => c.category).filter(Boolean));
    return ["All", ...set];
  }, [complaints]);

  const priorities = useMemo(() => {
    if (!complaints.length) return ["All"];
    const set = new Set(complaints.map((c) => c.priority).filter(Boolean));
    return ["All", ...set];
  }, [complaints]);

  const statuses = useMemo(() => {
    if (!complaints.length) return ["All"];
    const set = new Set(complaints.map((c) => c.status).filter(Boolean));
    return ["All", ...set];
  }, [complaints]);

  // ===================== ASSIGNMENT HANDLERS =====================
  function openAssign(id) {
    setAssigningId(id);
    setAssignData({ officer_id: "", priority: "Medium", deadline: "" });
  }

  async function submitAssign(e) {
    e.preventDefault();
    try {
      await api.assignComplaint(assigningId, {
        officer_id: Number(assignData.officer_id),
        priority: assignData.priority,
        deadline: assignData.deadline,
      });
      alert("Assigned");
      setAssigningId(null);
      loadComplaints();
    } catch (e) {
      alert("Assign failed: " + e.message);
    }
  }

  async function submitOfficer(e) {
    e.preventDefault();
    try {
      await api.addOfficer(officerForm);
      alert("Officer added");
      setOfficerForm({ name: "", email: "", phone: "", password: "" });
    } catch (e) {
      alert("Add officer failed: " + e.message);
    }
  }

  // ===================== RECHARTS DATA =====================
  const COLORS = [
    "#0ea5e9",
    "#f97316",
    "#10b981",
    "#6366f1",
    "#facc15",
    "#ef4444",
  ];

  const categoryData = useMemo(() => {
    const map = {};
    complaints.forEach((c) => {
      const cat = c.category || "Unknown";
      map[cat] = (map[cat] || 0) + 1;
    });
    return Object.keys(map).map((k) => ({ name: k, value: map[k] }));
  }, [complaints]);

  const priorityData = useMemo(() => {
    const map = {};
    complaints.forEach((c) => {
      const pr = c.priority || "Unknown";
      map[pr] = (map[pr] || 0) + 1;
    });
    return Object.keys(map).map((k) => ({ name: k, value: map[k] }));
  }, [complaints]);

  const statusData = useMemo(() => {
    const map = {};
    complaints.forEach((c) => {
      const st = c.status || "Unknown";
      map[st] = (map[st] || 0) + 1;
    });
    return Object.keys(map).map((k) => ({ name: k, value: map[k] }));
  }, [complaints]);

  const trendData = useMemo(() => {
    const map = {};
    complaints.forEach((c) => {
      const dateObj = new Date(c.timestamp || c.createdAt);
      const dateStr = dateObj.toISOString().split("T")[0]; // YYYY-MM-DD
      map[dateStr] = (map[dateStr] || 0) + 1;
    });
    return Object.keys(map)
      .sort()
      .map((k) => ({ date: k, count: map[k] }));
  }, [complaints]);

  // ===================== JSX =====================
  return (
    <div className="dashboard-container">
      <div className="topnav-wrapper">
        <TopNav />
      </div>

      <div className="app-shell">
        {/* ---------- SIDEBAR ---------- */}
        <div className="sidenav-wrapper">
          <nav className="sidenav">
            <ul>
              <li>
                <button
                  className={activeTab === "dashboard" ? "active" : ""}
                  onClick={() => setActiveTab("dashboard")}
                >
                  Dashboard
                </button>
              </li>
              <li>
                <button
                  className={activeTab === "complaints" ? "active" : ""}
                  onClick={() => setActiveTab("complaints")}
                >
                  Complaints
                </button>
              </li>
              <li>
                <button
                  className={activeTab === "officers" ? "active" : ""}
                  onClick={() => setActiveTab("officers")}
                >
                  Officers
                </button>
              </li>
            </ul>
          </nav>
        </div>

        {/* ---------- MAIN CONTENT ---------- */}
        <main className="main-content">
          <div
            className="card"
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 12,
            }}
          >
            <div>
              <h2 style={{ margin: 0 }}>Admin Dashboard</h2>
              <div style={{ color: "#64748b", fontSize: 13 }}>
                Manage complaints and officers
              </div>
            </div>
          </div>

          {/* ---------- DASHBOARD TAB ---------- */}
          {activeTab === "dashboard" && (
            <>
              <div className="card summary-card">
                <h3>Overview</h3>
                <div className="stat-row">
                  <div className="stat">
                    <div className="stat-value">{complaints.length}</div>
                    <div className="stat-label">Total Complaints</div>
                  </div>
                  <div className="stat">
                    <div className="stat-value">
                      {statusData.find((s) => s.name === "ASSIGNED")?.value ||
                        0}
                    </div>
                    <div className="stat-label">Assigned</div>
                  </div>
                  <div className="stat">
                    <div className="stat-value">
                      {statusData.find((s) => s.name === "RESOLVED")?.value ||
                        0}
                    </div>
                    <div className="stat-label">Resolved</div>
                  </div>
                </div>
              </div>

              {/* ---------- RECHARTS VISUALIZATIONS ---------- */}
              <div className="chart-grid">
                {/* Category Distribution */}
                <div className="chart-card">
                  <h4>Complaints by Category</h4>
                  <ResponsiveContainer width="100%" height={280}>
                    <PieChart>
                      <Pie
                        data={categoryData}
                        dataKey="value"
                        nameKey="name"
                        outerRadius={100}
                        label
                      >
                        {categoryData.map((entry, i) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {/* Priority Distribution */}
                <div className="chart-card">
                  <h4>Complaints by Priority</h4>
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={priorityData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="value" fill="#0b69ff" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Status Summary */}
                <div className="chart-card">
                  <h4>Status Overview</h4>
                  <ResponsiveContainer width="100%" height={280}>
                    <PieChart>
                      <Pie
                        data={statusData}
                        dataKey="value"
                        nameKey="name"
                        outerRadius={100}
                        label
                      >
                        {statusData.map((entry, i) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {/* Complaints Trend */}
                <div className="chart-card wide">
                  <h4>Complaints Over Time</h4>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={trendData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="count"
                        stroke="#0b69ff"
                        strokeWidth={2}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </>
          )}

          {/* ---------- COMPLAINTS TAB ---------- */}
          {activeTab === "complaints" && (
            <div className="card">
              {loading && <div>Loading...</div>}
              {error && <div style={{ color: "red" }}>{error}</div>}

              {/* Filters */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 12,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div>
                    <label>Filter by category:</label>
                    <select
                      value={categoryFilter}
                      onChange={(e) => setCategoryFilter(e.target.value)}
                    >
                      {categories.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label>Priority:</label>
                    <select
                      value={priorityFilter}
                      onChange={(e) => setPriorityFilter(e.target.value)}
                    >
                      {priorities.map((p) => (
                        <option key={p} value={p}>
                          {p}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label>Status:</label>
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                    >
                      {statuses.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label>Officer:</label>
                    <select
                      value={officerFilter}
                      onChange={(e) => setOfficerFilter(e.target.value)}
                    >
                      <option value="All">All</option>
                      <option value="Unassigned">Unassigned</option>
                      {officers.map((o) => (
                        <option key={o.id} value={String(o.id)}>
                          {o.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div style={{ color: "#64748b" }}>
                  {complaints.length} complaints
                </div>
              </div>

              {/* Complaint List (click an item to view details) */}
              <div>
                {selectedComplaintId ? (
                  <div>
                    <ComplaintDetail
                      id={selectedComplaintId}
                      onClose={() => { setSelectedComplaintId(null); loadComplaints(); }}
                      officers={officers}
                      onAssigned={() => { setSelectedComplaintId(null); loadComplaints(); }}
                    />
                  </div>
                ) : (
                  <div>
                    <ul className="complaint-list">
                      {complaints
                        .filter(
                          (c) =>
                            (categoryFilter === "All" || c.category === categoryFilter) &&
                            (priorityFilter === "All" || (c.priority || "") === priorityFilter) &&
                            (statusFilter === "All" || (c.status || "") === statusFilter) &&
                            (officerFilter === "All" || (officerFilter === "Unassigned" && !c.officerId) || (officerFilter !== "All" && officerFilter !== "Unassigned" && String(c.officerId) === String(officerFilter)))
                        )
                        .map((c) => (
                          <li key={c.id} className="complaint-list-item" onClick={() => setSelectedComplaintId(c.id)}>
                                <div className="thumb-small">
                                  {c.resolutionImageBlobUrl ? (
                                    <img src={c.resolutionImageBlobUrl} alt={c.title} />
                                  ) : c.imageBlobUrl ? (
                                    <img src={c.imageBlobUrl} alt={c.title} />
                                  ) : c.imageUrl ? (
                                    <img src={c.imageUrl} alt={c.title} crossOrigin="anonymous" />
                                  ) : (
                                    <div style={{ color: '#94a3b8', fontSize: 13 }}>No image</div>
                                  )}
                                </div>

                                <div className="list-body">
                                  <div className="list-title">{c.title}</div>
                                  <div className="list-meta">{c.category} • Priority: {c.priority || '—'}</div>
                                  <div className="list-sub">{(c.description || '').length > 140 ? (c.description.slice(0, 140) + '…') : c.description}</div>
                                  <div className="list-sub" style={{ marginTop: 6, color: '#64748b' }}>Officer: {resolveOfficerName(c)} • Deadline: {c.deadline || '-'}</div>
                                </div>
                                <div className={`list-status list-status-${(c.status||'').toLowerCase()}`}>{c.status}</div>
                              </li>
                        ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ---------- OFFICERS TAB ---------- */}
          {activeTab === "officers" && (
            <div className="card">
              <h3>Add Officer</h3>
              <form
                onSubmit={submitOfficer}
                style={{ display: "grid", gap: 8, maxWidth: 480 }}
              >
                <input
                  placeholder="Name"
                  value={officerForm.name}
                  onChange={(e) =>
                    setOfficerForm({ ...officerForm, name: e.target.value })
                  }
                />
                <input
                  placeholder="Email"
                  value={officerForm.email}
                  onChange={(e) =>
                    setOfficerForm({ ...officerForm, email: e.target.value })
                  }
                />
                <input
                  placeholder="Phone"
                  value={officerForm.phone}
                  onChange={(e) =>
                    setOfficerForm({ ...officerForm, phone: e.target.value })
                  }
                />
                <input
                  placeholder="Password"
                  type="password"
                  value={officerForm.password}
                  onChange={(e) =>
                    setOfficerForm({ ...officerForm, password: e.target.value })
                  }
                />
                <div>
                  <button type="submit">Add Officer</button>
                </div>
              </form>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

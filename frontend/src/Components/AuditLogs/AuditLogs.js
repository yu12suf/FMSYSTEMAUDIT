import React, { useEffect, useState } from "react";
import axiosInstance from "../../utils/axiosInstance";
import "./AuditLogs.css";

const PAGE_SIZE = 10;

const AuditLogs = () => {
  const [logs, setLogs] = useState([]);
  const [filteredLogs, setFilteredLogs] = useState([]);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("timestamp");
  const [sortOrder, setSortOrder] = useState("desc");
  const [page, setPage] = useState(1);

  useEffect(() => {
    fetchLogs();
  }, []);

  useEffect(() => {
    handleFilter();
    // eslint-disable-next-line
  }, [logs, search]);

  const fetchLogs = async () => {
    try {
      const res = await axiosInstance.get("/audit-logs/");
      setLogs(res.data || []);
    } catch {
      setLogs([]);
    }
  };

  const handleFilter = () => {
    let filtered = logs;
    if (search.trim()) {
      const s = search.toLowerCase();
      filtered = logs.filter(
        (log) =>
          (log.user && log.user.toLowerCase().includes(s)) ||
          (log.action && log.action.toLowerCase().includes(s)) ||
          (log.details && log.details.toLowerCase().includes(s)) ||
          (log.ip_address && log.ip_address.toLowerCase().includes(s)) ||
          (log.role && log.role.toLowerCase().includes(s))
      );
    }
    setFilteredLogs(filtered);
    setPage(1);
  };

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("asc");
    }
  };

  // Sort and paginate
  const sortedLogs = [...filteredLogs].sort((a, b) => {
    let valA = a[sortBy] || "";
    let valB = b[sortBy] || "";
    if (sortBy === "timestamp") {
      valA = new Date(valA);
      valB = new Date(valB);
    }
    if (valA < valB) return sortOrder === "asc" ? -1 : 1;
    if (valA > valB) return sortOrder === "asc" ? 1 : -1;
    return 0;
  });

  const paginatedLogs = sortedLogs.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="audit-logs-container">
      <h2>Audit Logs</h2>
      <div className="audit-logs-controls">
        <input
          type="text"
          placeholder="Search by user, action, details, or IP"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Search audit logs"
        />
      </div>
      <div className="audit-logs-table-wrapper">
        <table className="audit-logs-table" aria-label="Audit Logs Table">
          <thead>
            <tr>
              <th onClick={() => handleSort("timestamp")}>
                Date/Time {sortBy === "timestamp" ? (sortOrder === "asc" ? "▲" : "▼") : ""}
              </th>
              <th onClick={() => handleSort("user")}>
                User {sortBy === "user" ? (sortOrder === "asc" ? "▲" : "▼") : ""}
              </th>
              <th onClick={() => handleSort("action")}>
                Action {sortBy === "action" ? (sortOrder === "asc" ? "▲" : "▼") : ""}
              </th>
              <th>Details</th>
              <th onClick={() => handleSort("ip_address")}>
                IP Address {sortBy === "ip_address" ? (sortOrder === "asc" ? "▲" : "▼") : ""}
              </th>
              <th>Role</th>
            </tr>
          </thead>
          <tbody>
            {paginatedLogs.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: "center" }}>
                  No audit logs found.
                </td>
              </tr>
            ) : (
              paginatedLogs.map((log) => (
                <tr key={log.id}>
                  <td>{new Date(log.timestamp).toLocaleString()}</td>
                  <td>{log.user || "System"}</td>
                  <td>{log.action}</td>
                  <td>{log.details}</td>
                  <td>{log.ip_address}</td>
                  <td>{log.role || "User"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {/* Pagination */}
      <div className="audit-logs-pagination">
        <button
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page === 1}
        >
          Previous
        </button>
        <span>
          Page {page} of {Math.ceil(filteredLogs.length / PAGE_SIZE) || 1}
        </span>
        <button
          onClick={() =>
            setPage((p) =>
              p < Math.ceil(filteredLogs.length / PAGE_SIZE) ? p + 1 : p
            )
          }
          disabled={page >= Math.ceil(filteredLogs.length / PAGE_SIZE)}
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default AuditLogs;
// frontend/src/components/Layout/AdminLayout.js

import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import "./AdminLayout.css";

const AdminLayout = ({ children, onLogout }) => {
  const navigate = useNavigate();

  const handleVisitWebsite = () => {
    navigate("/"); // Go to user panel/homepage without logging out
  };

  return (
    <div className="admin-home-container">
      <header className="header">
        <img src="/logo.png" alt="Logo" className="logo" />
        <div className="project-title">
          ከተማ ልማትና ኮንስትራክሽን ቢሮ ፋይል ማንጅመንት ሲስተም Admin Panel
        </div>
        <img src="/logo.png" alt="Logo" className="logo" />
      </header>
      <nav className="menu-bar">
        <ul>
          <li>
            <NavLink to="/admin/dashboard">AdminDashboard</NavLink>
          </li>
          <li>
            <NavLink to="/admin/users">User Management</NavLink>
          </li>
          <li>
            <NavLink to="/admin/reports">Reports</NavLink>
          </li>
          <li>
            <NavLink to="/admin/graphs">Graphs</NavLink>
          </li>
          <li>
            <NavLink to="/admin/audit-logs">AuditLogs</NavLink>
          </li>
          <li>
            <button
              className="visit-website-btn"
              onClick={handleVisitWebsite}
              style={{
                background: "#234d26",
                color: "#fff",
                border: "none",
                borderRadius: "6px",
                padding: "8px 18px",
                margin: "0 10px",
                cursor: "pointer",
                fontWeight: 500,
                fontSize: "1em",
              }}
            >
              Visit Website
            </button>
          </li>
          <li
            className="logout"
            onClick={onLogout}
            style={{ cursor: "pointer" }}
          >
            Logout
          </li>
        </ul>
      </nav>
      <main className="content">{children}</main>
      <footer className="footer">
        <p>© {new Date().getFullYear()} ከተማ ልማትና ኮንስትራክሽን ቢሮ</p>
      </footer>
    </div>
  );
};

export default AdminLayout;

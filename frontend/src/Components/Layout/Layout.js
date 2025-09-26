// src/Components/Layout/Layout.js
import React from "react";
import { Link, useNavigate } from "react-router-dom";
import "./Layout.css";

// Accept onLogout as a prop
const Layout = ({ children, onLogout }) => {
const navigate = useNavigate();

  return (
    <div className="layout-container">
      <header className="header">
        <img src="/logo.png" alt="Logo" className="logo" />
        <h1 className="project-title">ከተማ ልማትና ኮንስትራክሽን ቢሮ ፋይል ማንጅመንት ሲስተም</h1>
        <img src="/logo.png" alt="Logo" className="logo" />
      </header>

      <nav className="menu-bar">
        <ul>
          <li>
            <Link to="/">ፋይል ቆጠራ</Link>
          </li>
          <li>
            <Link to="/files">ማውጫ</Link>
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

export default Layout;

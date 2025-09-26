// frontend/src/components/Login/Login.js

import React, { useState } from "react";
import authService from "../../services/authService"; // Adjust path if needed
//import logo from "../../Images/logo.png"; // Adjust path if needed
import "./Login.css"; // Import your CSS file

const Login = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState(""); // For success or other messages

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); // Clear previous errors
    setMessage(""); // Clear previous messages

    try {
      const userData = await authService.login(username, password);
      setMessage("Login successful!");
      // Call the success callback, which will typically handle redirection
      onLoginSuccess(userData);
    } catch (err) {
      setError(err.message || "An unexpected error occurred during login.");
      console.error("Login error:", err);
    }
  };

  return (
    <div className="login-page">
      <header className="header login-header">
        <img src="/logo.png" alt="Logo" className="logo" />
        <h1 className="project-title">ከተማ ልማትና ኮንስትራክሽን ቢሮ ፋይል ማንጅመንት ሲስተም</h1>
        <img src="/logo.png" alt="Logo" className="logo" />
      </header>
      <div className="login-container">
        <div className="login-card">
          <h2>Login</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="username">Username:</label>
              <input
                type="text"
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="password">Password:</label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            {error && <p className="error-message">{error}</p>}
            {message && <p className="success-message">{message}</p>}
            <button type="submit" className="login-button">
              Log In
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;

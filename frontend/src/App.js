// frontend/src/App.js

import React, { useState, useEffect, useRef } from "react";
import {
  Routes, // Keep Routes
  Route, // Keep Route
  Navigate, // Keep Navigate
  useNavigate, // Keep useNavigate hook
} from "react-router-dom";
// Existing imports for your application components
import Home from "./Components/Home/Home";
import FileUploader from "./Components/FileUploader/FileUploader";
import Layout from "./Components/Layout/Layout";
import AddFile from "./Components/AddFile/AddFile";
import Graph from "./Components/Graph/Graph"; // Ensure Graph is imported
import ViewFile from "./Components/ViewFile/ViewFile";
import Report from "./Components/Report/Report"; // Ensure Report is imported (assuming this is your main Report component)
import EditFiles from "./Components/EditFile/EditFile";

// New imports for authentication and admin panel
import Login from "./Components/Login/Login";
import AdminLayout from "./Components/Layoutadmin/AdminLayout";
import UserManagement from "./Components/AdminPanel/UserManagement";
import authService from "./services/authService";
import AuditLogs from "./Components/AuditLogs/AuditLogs";
import AdminDashboard from "./Components/AdminDashboard/AdminDashboard";

// Placeholder component for regular user dashboard (can be removed if not needed)
const UserDashboard = ({ onLogout }) => (
  <div className="non-admin-message-container">
    <div className="non-admin-message-card">
      <h2>Welcome to Your Dashboard!</h2>
      <p>You are logged in as a regular user.</p>
      <button onClick={onLogout} className="logout-button">
        Logout
      </button>
    </div>
  </div>
);

/**
 * ProtectedRoute component to control access to routes based on authentication and role.
 * @param {Object} props - Component props.
 * @param {React.ReactNode} props.children - The child components to render if authorized.
 * @param {boolean} props.isAuthenticated - True if the user is authenticated.
 * @param {boolean} [props.isAdminRoute=false] - True if this route requires admin privileges.
 * @param {boolean} [props.isAdmin] - True if the user has admin privileges (only relevant if isAdminRoute is true).
 * @returns {React.ReactNode} - The children components or a Navigate component for redirection.
 */
const ProtectedRoute = ({
  children,
  isAuthenticated,
  isAdminRoute = false,
  isAdmin,
}) => {
  console.log(
    "ProtectedRoute: isAuthenticated=",
    isAuthenticated,
    "isAdminRoute=",
    isAdminRoute,
    "isAdmin=",
    isAdmin
  );
  // If not authenticated, redirect to the login page
  if (!isAuthenticated) {
    console.log("ProtectedRoute: Not authenticated, navigating to /login");
    return <Navigate to="/login" replace />;
  }
  // If it's an admin route but the user is not an admin, redirect to the home page
  if (isAdminRoute && !isAdmin) {
    console.log("ProtectedRoute: Admin route but not admin, navigating to /");
    return <Navigate to="/" replace />; // Redirect to home for non-admins trying to access admin routes
  }
  // If authenticated and authorized, render the children components
  console.log(
    "ProtectedRoute: Authenticated and authorized, rendering children."
  );
  return children;
};

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const navigate = useNavigate(); // Initialize useNavigate - now it's correctly within Router context
  const inactivityTimeout = useRef(null);

  /**
   * Handles successful login.
   * Updates authentication states and redirects based on user role.
   * @param {Object} userData - Data returned from the login service.
   */
  const handleLoginSuccess = (userData) => {
    setIsAuthenticated(true);

    const userGroups = authService.getCurrentUserGroups();
    const isSuperuser = authService.getIsSuperuser();
    const isUserAdmin = isSuperuser || userGroups.includes("Administrators");
    setIsAdmin(isUserAdmin);

    setTimeout(() => {
      if (isUserAdmin) {
        navigate("/admin/users");
      } else {
        navigate("/");
      }
    }, 50);
  };

  /**
   * Handles user logout.
   * Clears authentication states and redirects to the login page.
   */
  const handleLogout = async () => {
    console.log("handleLogout: Initiating logout process.");
    await authService.logout();
    setIsAuthenticated(false);
    setIsAdmin(false);
    setTimeout(() => {
      console.log("handleLogout: Navigating to /login after logout.");
      navigate("/login");
    }, 50);
  };

  // Effect to perform initial authentication check on component mount
  useEffect(() => {
    const checkAuth = async () => {
      setLoadingAuth(true);
      const authenticated = await authService.verifyAuth();
      setIsAuthenticated(authenticated);
      if (authenticated) {
        const userGroups = authService.getCurrentUserGroups();
        const isSuperuser = authService.getIsSuperuser();
        const isUserAdmin =
          isSuperuser || userGroups.includes("Administrators");
        setIsAdmin(isUserAdmin);
      } else {
        localStorage.clear();
      }
      setLoadingAuth(false);
    };
    checkAuth();
  }, []); // Empty dependency array means this runs once on mount

  // Effect to handle user inactivity
  useEffect(() => {
    if (!isAuthenticated) return;

    const logoutAfterInactivity = () => {
      handleLogout();
      alert("You have been logged out due to inactivity.");
    };

    const resetInactivityTimer = () => {
      if (inactivityTimeout.current) clearTimeout(inactivityTimeout.current);
      inactivityTimeout.current = setTimeout(
        logoutAfterInactivity,
        15 * 60 * 1000
      ); // 15 minutes
    };

    // Listen for user activity
    window.addEventListener("mousemove", resetInactivityTimer);
    window.addEventListener("keydown", resetInactivityTimer);

    // Start timer
    resetInactivityTimer();

    // Cleanup
    return () => {
      window.removeEventListener("mousemove", resetInactivityTimer);
      window.removeEventListener("keydown", resetInactivityTimer);
      if (inactivityTimeout.current) clearTimeout(inactivityTimeout.current);
    };
  }, [isAuthenticated]);

  // Show a loading indicator while authentication is being checked
  if (loadingAuth) {
    console.log("App: Showing loading screen.");
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          fontSize: "1.5em",
        }}
      >
        Loading authentication...
      </div>
    );
  }

  console.log(
    "App: Rendering main routes. isAuthenticated:",
    isAuthenticated,
    "isAdmin:",
    isAdmin
  );

  return (
    // No <Router> tag here anymore! It's in index.js
    <Routes>
      {/* Public route for Login */}
      <Route
        path="/login"
        element={<Login onLoginSuccess={handleLoginSuccess} />}
      />

      {/* Admin Panel Routes (protected and requires admin privileges) */}
      <Route
        path="/admin/*"
        element={
          <ProtectedRoute
            isAuthenticated={isAuthenticated}
            isAdminRoute={true}
            isAdmin={isAdmin}
          >
            <AdminLayout onLogout={handleLogout}>
              <Routes>
                <Route path="dashboard" element={<AdminDashboard />} />
                <Route path="users" element={<UserManagement />} />
                <Route path="reports" element={<Report />} />
                <Route path="graphs" element={<Graph />} />
                <Route path="audit-logs" element={<AuditLogs />} />
                <Route path="dashboard" element={<AdminDashboard />} />
                <Route path="*" element={<Navigate to="dashboard" replace />} />
              </Routes>
            </AdminLayout>
          </ProtectedRoute>
        }
      />

      {/* All other routes (protected for any authenticated user) */}
      <Route
        path="/*"
        element={
          <ProtectedRoute isAuthenticated={isAuthenticated}>
            <Layout onLogout={handleLogout}>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/upload" element={<FileUploader />} />
                <Route path="/addfile" element={<AddFile />} />
                <Route path="/graph" element={<Graph />} />
                <Route path="/files" element={<ViewFile />} />
                <Route path="/report" element={<Report />} />
                <Route path="/editfile" element={<EditFiles />} />
                <Route path="/audit-log" element={<AuditLogs />} />
                <Route path="/admin/dashboard" element={<AdminDashboard />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Layout>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

export default App;

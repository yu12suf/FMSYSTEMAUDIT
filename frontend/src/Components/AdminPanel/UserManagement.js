// frontend/src/components/AdminPanel/UserManagement.js

import React, { useState, useEffect } from "react";
import authService from "../../services/authService";
import "./UserManagement.css";

// Utility to parse DRF-style errors
function parseApiErrors(errorObj) {
  const fieldErrors = {};
  let nonFieldErrors = [];
  if (typeof errorObj === "string") {
    nonFieldErrors = [errorObj];
  } else if (typeof errorObj === "object" && errorObj !== null) {
    for (const key in errorObj) {
      if (Array.isArray(errorObj[key])) {
        if (key === "non_field_errors" || key === "detail") {
          nonFieldErrors = nonFieldErrors.concat(errorObj[key]);
        } else {
          fieldErrors[key] = errorObj[key].join(" ");
        }
      }
    }
  }
  return { fieldErrors, nonFieldErrors };
}

function isValidEmail(email) {
  // Simple email regex
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidName(name) {
  // English and Amharic letters only
  return /^[A-Za-z\u1200-\u135A\s]+$/.test(name.trim());
}

function isStrongPassword(password) {
  // At least 8 chars, contains letters and numbers, not all numbers or all letters
  return (
    password.length >= 8 &&
    /[A-Za-z]/.test(password) &&
    /\d/.test(password) &&
    !/^\d+$/.test(password) &&
    !/^[A-Za-z]+$/.test(password)
  );
}

function isValidUsername(username) {
  // At least 3 characters, only letters, numbers, underscores, dots
  return /^[A-Za-z0-9_.]{3,}$/.test(username);
}

const ErrorBoundary = ({ error, children }) => {
  if (error) {
    return (
      <div className="app-message error" role="alert">
        <strong>Something went wrong:</strong> {error}
      </div>
    );
  }
  return children;
};

const emptyUser = {
  username: "",
  email: "",
  password: "",
  first_name: "",
  last_name: "",
  groups: [],
  is_active: true,
  is_staff: false,
  is_superuser: false,
};

const cleanUserFields = (user) => {
  // Convert null/undefined to empty string for optional fields
  return {
    ...user,
    email: user.email ? user.email : "",
    first_name: user.first_name ? user.first_name : "",
    last_name: user.last_name ? user.last_name : "",
  };
};

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [showEditUserModal, setShowEditUserModal] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [newUser, setNewUser] = useState({ ...emptyUser });
  const [actionLoading, setActionLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [userToDelete, setUserToDelete] = useState(null);

  useEffect(() => {
    fetchUsersAndGroups();
  }, []);

  useEffect(() => {
    if (message || error) {
      const timer = setTimeout(() => {
        setMessage("");
        setError("");
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [message, error]);

  const fetchUsersAndGroups = async () => {
    setLoading(true);
    setError("");
    try {
      const usersData = await authService.getUsers();
      const groupsData = await authService.getGroups();
      setUsers(usersData);
      setGroups(groupsData);
    } catch (err) {
      setError(err.message || "Failed to fetch data.");
      setUsers([]);
      setGroups([]);
    } finally {
      setLoading(false);
    }
  };

  // --- Add User Modal Logic ---
  const openAddUserModal = () => {
    setNewUser({ ...emptyUser }); // Always empty!
    setFieldErrors({});
    setShowAddUserModal(true);
  };

  const handleNewUserChange = (e) => {
    const { name, value, type, checked } = e.target;
    let updatedUser;
    if (type === "checkbox" && name === "group") {
      updatedUser = {
        ...newUser,
        groups: checked
          ? [...newUser.groups, value]
          : newUser.groups.filter((groupName) => groupName !== value),
      };
    } else if (type === "checkbox") {
      updatedUser = { ...newUser, [name]: checked };
    } else {
      updatedUser = { ...newUser, [name]: value };
    }
    setNewUser(updatedUser);

    // Username and password required, other fields validated if not empty
    const errors = { ...fieldErrors };
    if (name === "username") {
      if (!value) {
        errors.username = "Username is required";
      } else if (!isValidUsername(value)) {
        errors.username =
          "Username must be at least 3 characters and contain only letters, numbers, underscores, or dots.";
      } else if (users.some((u) => u.username === value)) {
        errors.username = "This username is already taken.";
      } else {
        delete errors.username;
      }
    } else if (name === "password") {
      if (!value) {
        errors.password = "Password is required";
      } else if (!isStrongPassword(value)) {
        errors.password =
          "Password must be at least 8 characters and contain both letters and numbers.";
      } else {
        delete errors.password;
      }
    } else if (name === "email") {
      if (value && !isValidEmail(value)) {
        errors.email = "Please enter a valid email address.";
      } else {
        delete errors.email;
      }
    } else if (name === "first_name") {
      if (value && !isValidName(value)) {
        errors.first_name =
          "First Name must contain only English or Amharic letters.";
      } else {
        delete errors.first_name;
      }
    } else if (name === "last_name") {
      if (value && !isValidName(value)) {
        errors.last_name =
          "Last Name must contain only English or Amharic letters.";
      } else {
        delete errors.last_name;
      }
    }
    setFieldErrors(errors);
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    setError("");
    setFieldErrors({});
    setActionLoading(true);

    // Username and password required, other fields validated if not empty
    const errors = {};
    if (!newUser.username) errors.username = "Username is required";
    else if (!isValidUsername(newUser.username)) {
      errors.username =
        "Username must be at least 3 characters and contain only letters, numbers, underscores, or dots.";
    } else if (users.some((u) => u.username === newUser.username)) {
      errors.username = "This username is already taken.";
    }
    if (!newUser.password) {
      errors.password = "Password is required";
    } else if (!isStrongPassword(newUser.password)) {
      errors.password =
        "Password must be at least 8 characters and contain both letters and numbers.";
    }
    if (newUser.email && !isValidEmail(newUser.email)) {
      errors.email = "Please enter a valid email address.";
    }
    if (newUser.first_name && !isValidName(newUser.first_name)) {
      errors.first_name =
        "First Name must contain only English or Amharic letters.";
    }
    if (newUser.last_name && !isValidName(newUser.last_name)) {
      errors.last_name =
        "Last Name must contain only English or Amharic letters.";
    }
    if (Object.keys(errors).length) {
      setFieldErrors(errors);
      setActionLoading(false);
      return;
    }

    try {
      const userToSend = cleanUserFields(newUser);
      await authService.createUser(userToSend);
      setMessage("User added successfully!");
      setShowAddUserModal(false);
      setNewUser({ ...emptyUser });
      fetchUsersAndGroups();
    } catch (err) {
      const { fieldErrors, nonFieldErrors } = parseApiErrors(
        err.response?.data || err.message || err
      );
      setFieldErrors(fieldErrors);
      setError(nonFieldErrors.join(" "));
    } finally {
      setActionLoading(false);
    }
  };

  // --- Edit User Modal Logic ---
  const openEditModal = (user) => {
    // Never pre-fill password!
    setCurrentUser({
      ...user,
      password: "",
    });
    setFieldErrors({});
    setShowEditUserModal(true);
  };

  const handleEditUserChange = (e) => {
    const { name, value, type, checked } = e.target;
    let updatedUser;
    if (type === "checkbox" && name === "group") {
      updatedUser = {
        ...currentUser,
        groups: checked
          ? [...currentUser.groups, value]
          : currentUser.groups.filter((groupName) => groupName !== value),
      };
    } else if (type === "checkbox") {
      updatedUser = { ...currentUser, [name]: checked };
    } else {
      updatedUser = { ...currentUser, [name]: value };
    }
    setCurrentUser(updatedUser);

    // Username and password required, other fields validated if not empty
    const errors = { ...fieldErrors };
    if (name === "username") {
      if (!value) {
        errors.username = "Username is required";
      } else if (!isValidUsername(value)) {
        errors.username =
          "Username must be at least 3 characters and contain only letters, numbers, underscores, or dots.";
      } else if (users.some((u) => u.username === value && u.id !== currentUser.id)) {
        errors.username = "This username is already taken.";
      } else {
        delete errors.username;
      }
    } else if (name === "password") {
      if (value && !isStrongPassword(value)) {
        errors.password =
          "Password must be at least 8 characters and contain both letters and numbers.";
      } else {
        delete errors.password;
      }
    } else if (name === "email") {
      if (value && !isValidEmail(value)) {
        errors.email = "Please enter a valid email address.";
      } else {
        delete errors.email;
      }
    } else if (name === "first_name") {
      if (value && !isValidName(value)) {
        errors.first_name =
          "First Name must contain only English or Amharic letters.";
      } else {
        delete errors.first_name;
      }
    } else if (name === "last_name") {
      if (value && !isValidName(value)) {
        errors.last_name =
          "Last Name must contain only English or Amharic letters.";
      } else {
        delete errors.last_name;
      }
    }
    setFieldErrors(errors);
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    setError("");
    setFieldErrors({});
    setActionLoading(true);

    // Username and password required, other fields validated if not empty
    const errors = {};
    if (!currentUser.username) errors.username = "Username is required";
    else if (!isValidUsername(currentUser.username)) {
      errors.username =
        "Username must be at least 3 characters and contain only letters, numbers, underscores, or dots.";
    } else if (users.some((u) => u.username === currentUser.username && u.id !== currentUser.id)) {
      errors.username = "This username is already taken.";
    }
    if (currentUser.password && !isStrongPassword(currentUser.password)) {
      errors.password =
        "Password must be at least 8 characters and contain both letters and numbers.";
    }
    if (currentUser.email && !isValidEmail(currentUser.email)) {
      errors.email = "Please enter a valid email address.";
    }
    if (currentUser.first_name && !isValidName(currentUser.first_name)) {
      errors.first_name =
        "First Name must contain only English or Amharic letters.";
    }
    if (currentUser.last_name && !isValidName(currentUser.last_name)) {
      errors.last_name =
        "Last Name must contain only English or Amharic letters.";
    }
    if (Object.keys(errors).length) {
      setFieldErrors(errors);
      setActionLoading(false);
      return;
    }

    // Only send password if it was entered
    let userToUpdate = { ...currentUser };
    if (!userToUpdate.password) {
      delete userToUpdate.password;
    }
    userToUpdate = cleanUserFields(userToUpdate);

    try {
      await authService.updateUser(currentUser.id, userToUpdate);
      setMessage("User updated successfully!");
      setShowEditUserModal(false);
      setCurrentUser(null);
      fetchUsersAndGroups();
    } catch (err) {
      const { fieldErrors, nonFieldErrors } = parseApiErrors(
        err.response?.data || err.message || err
      );
      setFieldErrors(fieldErrors);
      setError(nonFieldErrors.join(" "));
    } finally {
      setActionLoading(false);
    }
  };

  // --- Delete User ---
  const handleDeleteClick = (user) => {
    setUserToDelete(user);
    setError("");
  };

  const confirmDeleteUser = async () => {
    setActionLoading(true);
    try {
      await authService.deleteUser(userToDelete.id);
      setMessage("User deleted successfully!");
      setUserToDelete(null);
      fetchUsersAndGroups();
    } catch (err) {
      setError(err.message || "Failed to delete user.");
    } finally {
      setActionLoading(false);
    }
  };

  const cancelDeleteUser = () => {
    setUserToDelete(null);
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm("Are you sure you want to delete this user?")) {
      setError("");
      setActionLoading(true);
      try {
        await authService.deleteUser(userId);
        setMessage("User deleted successfully!");
        fetchUsersAndGroups();
      } catch (err) {
        setError(err.message || "Failed to delete user.");
      } finally {
        setActionLoading(false);
      }
    }
  };

  // Accessibility: focus modal when opened
  useEffect(() => {
    if (showAddUserModal || showEditUserModal) {
      setTimeout(() => {
        const firstInput = document.querySelector(
          ".modal-content input, .modal-content select"
        );
        if (firstInput) firstInput.focus();
      }, 100);
    }
  }, [showAddUserModal, showEditUserModal]);

  // Close modal on overlay click or Escape key
  const closeModal = () => {
    setShowAddUserModal(false);
    setShowEditUserModal(false);
    setFieldErrors({});
  };

  // Add Escape key handler for modals
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape") closeModal();
    };
    if (showAddUserModal || showEditUserModal) {
      window.addEventListener("keydown", handleEsc);
    }
    return () => window.removeEventListener("keydown", handleEsc);
  }, [showAddUserModal, showEditUserModal]);

  // --- Password Strength (optional, simple example) ---
  const getPasswordStrength = (password) => {
    if (!password) return "";
    if (password.length < 8) return "Too short";
    if (/^\d+$/.test(password)) return "Too weak (all numbers)";
    if (
      password.length >= 8 &&
      /[A-Za-z]/.test(password) &&
      /\d/.test(password)
    )
      return "Strong";
    return "Medium";
  };

  useEffect(() => {
    if (showAddUserModal || showEditUserModal) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [showAddUserModal, showEditUserModal]);

  return (
    <ErrorBoundary error={error}>
      <div className="user-management-container">
        <div className="user-management-header">
          <h2>User Management</h2>
          <button
            className="add-user-button"
            onClick={openAddUserModal}
            aria-label="Add new user"
          >
            + Add New User
          </button>
        </div>
        {message && (
          <div className="app-message success" role="status">
            {message}
          </div>
        )}
        {loading ? (
          <div className="loading-spinner" aria-label="Loading"></div>
        ) : users.length === 0 ? (
          <div className="empty-state">
            <p>No users found.</p>
          </div>
        ) : (
          <div className="user-list">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Username</th>
                  <th>Email</th>
                  <th>First Name</th>
                  <th>Last Name</th>
                  <th>Staff</th>
                  <th>Superuser</th>
                  <th>Active</th>
                  <th>Roles</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id}>
                    <td>{user.id}</td>
                    <td>{user.username}</td>
                    <td>{user.email}</td>
                    <td>{user.first_name}</td>
                    <td>{user.last_name}</td>
                    <td>{user.is_staff ? "Yes" : "No"}</td>
                    <td>{user.is_superuser ? "Yes" : "No"}</td>
                    <td>{user.is_active ? "Yes" : "No"}</td>
                    <td>{user.groups.join(", ")}</td>
                    <td>
                      <button
                        className="action-button edit"
                        onClick={() => openEditModal(user)}
                        aria-label={`Edit user ${user.username}`}
                        disabled={actionLoading}
                      >
                        Edit
                      </button>
                      <button
                        className="action-button delete"
                        onClick={() => handleDeleteClick(user)}
                        aria-label={`Delete user ${user.username}`}
                        disabled={actionLoading}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Add User Modal */}
        {showAddUserModal && (
          <div
            className="modal-overlay"
            tabIndex={-1}
            aria-modal="true"
            role="dialog"
            onClick={closeModal}
          >
            <div
              className="modal-content animate-modal"
              onClick={(e) => e.stopPropagation()}
              tabIndex={0}
            >
              <button
                className="modal-close"
                onClick={closeModal}
                aria-label="Close"
              >
                &times;
              </button>
              <h3>Add New User</h3>
              {error && (
                <div
                  className="app-message error"
                  role="alert"
                  style={{ marginBottom: 16 }}
                >
                  {error}
                </div>
              )}
              <form onSubmit={handleAddUser} autoComplete="off">
                <div className="form-group">
                  <label htmlFor="add-username">Username:</label>
                  <input
                    id="add-username"
                    type="text"
                    name="username"
                    value={newUser.username}
                    onChange={handleNewUserChange}
                    required
                    autoFocus
                    aria-invalid={!!fieldErrors.username}
                    aria-describedby="add-username-error"
                  />
                  {fieldErrors.username && (
                    <span className="field-error" id="add-username-error">
                      {fieldErrors.username}
                    </span>
                  )}
                </div>
                <div className="form-group" style={{ position: "relative" }}>
                  <label htmlFor="add-email">Email:</label>
                  <input
                    id="add-email"
                    type="email"
                    name="email"
                    value={newUser.email}
                    onChange={handleNewUserChange}
                  />
                  {fieldErrors.email && (
                    <span
                      className="field-error"
                      id="add-email-error"
                      style={{
                        position: "absolute",
                        top: "100%",
                        left: 0,
                        backgroundColor: "#fff4f4",
                        color: "#cc0000",
                        padding: "4px 8px",
                        fontSize: "0.85em",
                        border: "1px solid #cc0000",
                        borderRadius: "4px",
                        marginTop: "4px",
                        whiteSpace: "nowrap",
                        boxShadow: "0px 2px 6px rgba(0,0,0,0.1)",
                        zIndex: 100,
                      }}
                    >
                      {fieldErrors.email}
                    </span>
                  )}
                </div>
                <div className="form-group" style={{ position: "relative" }}>
                  <label htmlFor="add-password">Password:</label>
                  <input
                    id="add-password"
                    type="password"
                    name="password"
                    value={newUser.password}
                    onChange={handleNewUserChange}
                    required
                    aria-invalid={!!fieldErrors.password}
                    aria-describedby="add-password-error"
                  />
                  {fieldErrors.password && (
                    <span
                      className="field-error"
                      id="add-password-error"
                      style={{
                        position: "absolute",
                        top: "100%",
                        left: 0,
                        backgroundColor: "#fff4f4",
                        color: "#cc0000",
                        padding: "4px 8px",
                        fontSize: "0.85em",
                        border: "1px solid #cc0000",
                        borderRadius: "4px",
                        marginTop: "4px",
                        whiteSpace: "nowrap",
                        boxShadow: "0px 2px 6px rgba(0,0,0,0.1)",
                        zIndex: 100,
                      }}
                    >
                      {fieldErrors.password}
                    </span>
                  )}
                  {/* Password strength feedback */}
                  {newUser.password && (
                    <span className="field-error" style={{ color: "#888" }}>
                      {getPasswordStrength(newUser.password)}
                    </span>
                  )}
                </div>
                <div className="form-group" style={{ position: "relative" }}>
                  <label htmlFor="add-firstname">First Name:</label>
                  <input
                    id="add-firstname"
                    type="text"
                    name="first_name"
                    value={newUser.first_name}
                    onChange={handleNewUserChange}
                  />
                  {fieldErrors.first_name && (
                    <span
                      className="field-error"
                      id="add-firstname-error"
                      style={{
                        position: "absolute",
                        top: "100%",
                        left: 0,
                        backgroundColor: "#fff4f4",
                        color: "#cc0000",
                        padding: "4px 8px",
                        fontSize: "0.85em",
                        border: "1px solid #cc0000",
                        borderRadius: "4px",
                        marginTop: "4px",
                        whiteSpace: "nowrap",
                        boxShadow: "0px 2px 6px rgba(0,0,0,0.1)",
                        zIndex: 100,
                      }}
                    >
                      {fieldErrors.first_name}
                    </span>
                  )}
                </div>
                <div className="form-group" style={{ position: "relative" }}>
                  <label htmlFor="add-lastname">Last Name:</label>
                  <input
                    id="add-lastname"
                    type="text"
                    name="last_name"
                    value={newUser.last_name}
                    onChange={handleNewUserChange}
                  />
                  {fieldErrors.last_name && (
                    <span
                      className="field-error"
                      id="add-lastname-error"
                      style={{
                        position: "absolute",
                        top: "100%",
                        left: 0,
                        backgroundColor: "#fff4f4",
                        color: "#cc0000",
                        padding: "4px 8px",
                        fontSize: "0.85em",
                        border: "1px solid #cc0000",
                        borderRadius: "4px",
                        marginTop: "4px",
                        whiteSpace: "nowrap",
                        boxShadow: "0px 2px 6px rgba(0,0,0,0.1)",
                        zIndex: 100,
                      }}
                    >
                      {fieldErrors.last_name}
                    </span>
                  )}
                </div>
                <div className="form-group">
                  <label>Active:</label>
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      name="is_active"
                      checked={newUser.is_active}
                      onChange={handleNewUserChange}
                    />
                    Is Active
                  </label>
                </div>
                <div className="form-group">
                  <label>Staff Status:</label>
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      name="is_staff"
                      checked={newUser.is_staff}
                      onChange={handleNewUserChange}
                    />
                    Is Staff (Can access Django Admin)
                  </label>
                </div>
                <div className="form-group">
                  <label>Superuser Status:</label>
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      name="is_superuser"
                      checked={newUser.is_superuser}
                      onChange={handleNewUserChange}
                    />
                    Is Superuser (Full privileges)
                  </label>
                </div>
                <div className="form-group">
                  <label>Roles (Groups):</label>
                  {groups.map((group) => (
                    <label key={group.id} className="checkbox-label">
                      <input
                        type="checkbox"
                        name="group"
                        value={group.name}
                        checked={newUser.groups.includes(group.name)}
                        onChange={handleNewUserChange}
                      />
                      {group.name}
                    </label>
                  ))}
                </div>
                <div className="modal-actions">
                  <button
                    type="submit"
                    className="button primary"
                    disabled={actionLoading}
                  >
                    {actionLoading ? "Adding..." : "Add User"}
                  </button>
                  <button
                    type="button"
                    className="button secondary"
                    onClick={closeModal}
                    disabled={actionLoading}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit User Modal */}
        {showEditUserModal && currentUser && (
          <div
            className="modal-overlay"
            tabIndex={-1}
            aria-modal="true"
            role="dialog"
            onClick={closeModal}
          >
            <div
              className="modal-content animate-modal"
              onClick={(e) => e.stopPropagation()}
              tabIndex={0}
            >
              <button
                className="modal-close"
                onClick={closeModal}
                aria-label="Close"
              >
                &times;
              </button>
              <h3>Edit User: {currentUser.username}</h3>
              {error && (
                <div
                  className="app-message error"
                  role="alert"
                  style={{ marginBottom: 16 }}
                >
                  {error}
                </div>
              )}
              <form onSubmit={handleUpdateUser} autoComplete="off">
                <div className="form-group">
                  <label htmlFor="edit-username">Username:</label>
                  <input
                    id="edit-username"
                    type="text"
                    name="username"
                    value={currentUser.username}
                    onChange={handleEditUserChange}
                    required
                    autoFocus
                    aria-invalid={!!fieldErrors.username}
                    aria-describedby="edit-username-error"
                  />
                  {fieldErrors.username && (
                    <span className="field-error" id="edit-username-error">
                      {fieldErrors.username}
                    </span>
                  )}
                </div>
                <div className="form-group" style={{ position: "relative" }}>
                  <label htmlFor="edit-email">Email:</label>
                  <input
                    id="edit-email"
                    type="email"
                    name="email"
                    value={currentUser.email || ""}
                    onChange={handleEditUserChange}
                  />
                  {fieldErrors.email && (
                    <span
                      className="field-error"
                      id="edit-email-error"
                      style={{
                        position: "absolute",
                        top: "100%",
                        left: 0,
                        backgroundColor: "#fff4f4",
                        color: "#cc0000",
                        padding: "4px 8px",
                        fontSize: "0.85em",
                        border: "1px solid #cc0000",
                        borderRadius: "4px",
                        marginTop: "4px",
                        whiteSpace: "nowrap",
                        boxShadow: "0px 2px 6px rgba(0,0,0,0.1)",
                        zIndex: 100,
                      }}
                    >
                      {fieldErrors.email}
                    </span>
                  )}
                </div>
                <div className="form-group" style={{ position: "relative" }}>
                  <label htmlFor="edit-password">
                    New Password (leave blank to keep current):
                  </label>
                  <input
                    id="edit-password"
                    type="password"
                    name="password"
                    value={currentUser.password || ""}
                    onChange={handleEditUserChange}
                    aria-invalid={!!fieldErrors.password}
                    aria-describedby="edit-password-error"
                  />
                  {fieldErrors.password && (
                    <span
                      className="field-error"
                      id="edit-password-error"
                      style={{
                        position: "absolute",
                        top: "100%",
                        left: 0,
                        backgroundColor: "#fff4f4",
                        color: "#cc0000",
                        padding: "4px 8px",
                        fontSize: "0.85em",
                        border: "1px solid #cc0000",
                        borderRadius: "4px",
                        marginTop: "4px",
                        whiteSpace: "nowrap",
                        boxShadow: "0px 2px 6px rgba(0,0,0,0.1)",
                        zIndex: 100,
                      }}
                    >
                      {fieldErrors.password}
                    </span>
                  )}
                  {/* Password strength feedback */}
                  {currentUser.password && (
                    <span className="field-error" style={{ color: "#888" }}>
                      {getPasswordStrength(currentUser.password)}
                    </span>
                  )}
                </div>
                <div className="form-group" style={{ position: "relative" }}>
                  <label htmlFor="edit-firstname">First Name:</label>
                  <input
                    id="edit-firstname"
                    type="text"
                    name="first_name"
                    value={currentUser.first_name || ""}
                    onChange={handleEditUserChange}
                  />
                  {fieldErrors.first_name && (
                    <span
                      className="field-error"
                      id="edit-firstname-error"
                      style={{
                        position: "absolute",
                        top: "100%",
                        left: 0,
                        backgroundColor: "#fff4f4",
                        color: "#cc0000",
                        padding: "4px 8px",
                        fontSize: "0.85em",
                        border: "1px solid #cc0000",
                        borderRadius: "4px",
                        marginTop: "4px",
                        whiteSpace: "nowrap",
                        boxShadow: "0px 2px 6px rgba(0,0,0,0.1)",
                        zIndex: 100,
                      }}
                    >
                      {fieldErrors.first_name}
                    </span>
                  )}
                </div>
                <div className="form-group" style={{ position: "relative" }}>
                  <label htmlFor="edit-lastname">Last Name:</label>
                  <input
                    id="edit-lastname"
                    type="text"
                    name="last_name"
                    value={currentUser.last_name || ""}
                    onChange={handleEditUserChange}
                  />
                  {fieldErrors.last_name && (
                    <span
                      className="field-error"
                      id="edit-lastname-error"
                      style={{
                        position: "absolute",
                        top: "100%",
                        left: 0,
                        backgroundColor: "#fff4f4",
                        color: "#cc0000",
                        padding: "4px 8px",
                        fontSize: "0.85em",
                        border: "1px solid #cc0000",
                        borderRadius: "4px",
                        marginTop: "4px",
                        whiteSpace: "nowrap",
                        boxShadow: "0px 2px 6px rgba(0,0,0,0.1)",
                        zIndex: 100,
                      }}
                    >
                      {fieldErrors.last_name}
                    </span>
                  )}
                </div>
                <div className="form-group">
                  <label>Active:</label>
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      name="is_active"
                      checked={currentUser.is_active}
                      onChange={handleEditUserChange}
                    />
                    Is Active
                  </label>
                </div>
                <div className="form-group">
                  <label>Staff Status:</label>
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      name="is_staff"
                      checked={currentUser.is_staff}
                      onChange={handleEditUserChange}
                    />
                    Is Staff (Can access Django Admin)
                  </label>
                </div>
                <div className="form-group">
                  <label>Superuser Status:</label>
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      name="is_superuser"
                      checked={currentUser.is_superuser}
                      onChange={handleEditUserChange}
                    />
                    Is Superuser (Full privileges)
                  </label>
                </div>
                <div className="form-group">
                  <label>Roles (Groups):</label>
                  {groups.map((group) => (
                    <label key={group.id} className="checkbox-label">
                      <input
                        type="checkbox"
                        name="group"
                        value={group.name}
                        checked={currentUser.groups.includes(group.name)}
                        onChange={handleEditUserChange}
                      />
                      {group.name}
                    </label>
                  ))}
                </div>
                <div className="modal-actions">
                  <button
                    type="submit"
                    className="button primary"
                    disabled={actionLoading}
                  >
                    {actionLoading ? "Updating..." : "Update User"}
                  </button>
                  <button
                    type="button"
                    className="button secondary"
                    onClick={closeModal}
                    disabled={actionLoading}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Confirm Delete User Modal */}
        {userToDelete && (
          <div
            className="modal-overlay"
            tabIndex={-1}
            aria-modal="true"
            role="dialog"
          >
            <div className="modal-content animate-modal" tabIndex={0}>
              <h3>Confirm Delete</h3>
              <p>
                Are you sure you want to delete user{" "}
                <strong>{userToDelete.username}</strong>? This action cannot be
                undone.
              </p>
              <div className="modal-actions">
                <button
                  className="button danger"
                  onClick={confirmDeleteUser}
                  disabled={actionLoading}
                >
                  {actionLoading ? "Deleting..." : "Delete"}
                </button>
                <button
                  className="button secondary"
                  onClick={cancelDeleteUser}
                  disabled={actionLoading}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
};

export default UserManagement;

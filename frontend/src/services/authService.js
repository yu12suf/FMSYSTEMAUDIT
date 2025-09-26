// frontend/src/services/authService.js

const API_BASE_URL = "http://localhost:8000/api"; // Your Django backend URL

// Variables to manage the refresh token lock
let isRefreshing = false;
let refreshPromise = null; // Stores the promise of the ongoing refresh operation

const authService = {
  /**
   * Helper to get auth headers.
   * This function is now part of the authService object.
   * @returns {Object} - Authorization header or empty object if no token.
   */
  getAuthHeaders: () => {
    const accessToken = localStorage.getItem("accessToken");
    console.log(
      "getAuthHeaders: current accessToken:",
      accessToken ? "Exists" : "None"
    );
    return accessToken ? { Authorization: `Bearer ${accessToken}` } : {};
  },

  /**
   * Handles user login.
   * @param {string} username - User's username.
   * @param {string} password - User's password.
   * @returns {Promise<Object>} - User data including tokens.
   */
  login: async (username, password) => {
    console.log("Attempting login for:", username);
    const response = await fetch(`${API_BASE_URL}/accounts/login/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username, password }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Login failed:", errorData);
      throw new Error(errorData.detail || "Login failed");
    }

    const data = await response.json();
    console.log("Login successful. Storing tokens and user data.");
    localStorage.setItem("accessToken", data.access);
    localStorage.setItem("refreshToken", data.refresh);
    localStorage.setItem("userId", data.user_id);
    localStorage.setItem("username", data.username);
    localStorage.setItem("isStaff", data.is_staff);
    localStorage.setItem("isSuperuser", data.is_superuser);
    localStorage.setItem("email", data.email);
    return data;
  },

  /**
   * Handles user logout.
   * @returns {Promise<void>}
   */
  logout: async () => {
    const refreshToken = localStorage.getItem("refreshToken");
    console.log(
      "Attempting logout. Refresh token:",
      refreshToken ? "Exists" : "None"
    );
    if (refreshToken) {
      try {
        const response = await fetch(`${API_BASE_URL}/accounts/logout/`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...authService.getAuthHeaders(), // Send access token for authentication
          },
          body: JSON.stringify({ refresh_token: refreshToken }),
        });
        if (!response.ok) {
          console.warn(
            "Logout API call failed (backend response not OK), but clearing local storage anyway:",
            await response.json()
          );
        } else {
          console.log("Logout API call successful.");
        }
      } catch (error) {
        console.warn(
          "Network error during logout API call (token might already be invalid or network issue):",
          error
        );
      }
    }
    console.log("Clearing all local storage on logout.");
    localStorage.clear(); // Always clear local storage on logout
    // Reset refresh token lock state on logout
    isRefreshing = false;
    refreshPromise = null;
  },

  /**
   * Attempts to refresh the access token using the refresh token,
   * with a mechanism to prevent race conditions.
   * @returns {Promise<boolean>} - True if refresh was successful, false otherwise.
   */
  refreshAccessToken: async () => {
    const refreshToken = localStorage.getItem("refreshToken");
    if (!refreshToken) {
      console.log(
        "refreshAccessToken: No refresh token found. Not attempting refresh."
      );
      return false;
    }

    // If a refresh is already in progress, wait for it to complete
    if (isRefreshing && refreshPromise) {
      console.log(
        "refreshAccessToken: Refresh already in progress. Waiting..."
      );
      return refreshPromise; // Return the existing promise
    }

    isRefreshing = true; // Set flag to indicate refresh is starting
    refreshPromise = new Promise(async (resolve) => {
      try {
        console.log("refreshAccessToken: Attempting to refresh token...");
        const response = await fetch(
          `${API_BASE_URL}/accounts/token/refresh/`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ refresh: refreshToken }),
          }
        );

        if (response.ok) {
          const data = await response.json();
          console.log(
            "refreshAccessToken: Token refresh successful. New access token obtained."
          );
          localStorage.setItem("accessToken", data.access);
          // Update refresh token if SIMPLE_JWT.ROTATE_REFRESH_TOKENS is true
          if (data.refresh) {
            localStorage.setItem("refreshToken", data.refresh);
            console.log(
              "refreshAccessToken: New refresh token also obtained and stored."
            );
          }
          resolve(true); // Resolve the promise with true
        } else {
          const errorData = await response.json();
          console.error(
            "refreshAccessToken: Failed to refresh token. This might trigger a logout if not handled by interceptor.",
            errorData
          );
          // Do NOT clear localStorage here if this is called by an interceptor.
          // The interceptor will handle the logout/redirect if refresh fails.
          // If this function is called directly (e.g., from verifyAuth), it should clear.
          // For now, keep it as it was, as verifyAuth relies on it.
          localStorage.clear();
          resolve(false); // Resolve the promise with false
        }
      } catch (error) {
        console.error(
          "refreshAccessToken: Network error during token refresh. This might trigger a logout if not handled by interceptor.",
          error
        );
        // Do NOT clear localStorage here if this is called by an interceptor.
        // The interceptor will handle the logout/redirect if refresh fails.
        localStorage.clear(); // Keep this for direct calls to refreshAccessToken
        resolve(false); // Resolve the promise with false
      } finally {
        isRefreshing = false; // Reset flag after operation completes
        refreshPromise = null; // Clear the promise
      }
    });

    return refreshPromise; // Return the promise to be awaited by callers
  },

  /**
   * Verifies current authentication status by attempting to refresh token.
   * Clears local storage if tokens are invalid.
   * @returns {Promise<boolean>} - True if user is authenticated and token is valid, false otherwise.
   */
  verifyAuth: async () => {
    console.log("verifyAuth: Starting authentication verification.");
    const currentAccessToken = localStorage.getItem("accessToken");
    const currentRefreshToken = localStorage.getItem("refreshToken");

    // If no tokens exist at all, user is not authenticated
    if (!currentAccessToken && !currentRefreshToken) {
      console.log("verifyAuth: No tokens found. User is NOT authenticated.");
      return false;
    }

    // If only access token is present (and it's likely expired), try to refresh
    if (currentAccessToken && !currentRefreshToken) {
      console.log(
        "verifyAuth: Only access token found (potentially expired). Attempting refresh."
      );
      return await authService.refreshAccessToken();
    }

    // If both tokens are present, assume access token *might* be valid, but always try refresh for robustness
    // This allows the refresh mechanism to handle expiration if needed
    console.log(
      "verifyAuth: Tokens found. Attempting to refresh to verify validity."
    );
    const refreshed = await authService.refreshAccessToken();
    if (refreshed) {
      console.log(
        "verifyAuth: Token refresh successful or already in progress completed. User is authenticated."
      );
      return true;
    } else {
      console.log(
        "verifyAuth: Token refresh failed. User is NOT authenticated. Local storage cleared."
      );
      // refreshAccessToken already clears local storage on failure
      return false;
    }
  },

  /**
   * Registers a new user.
   * @param {Object} userData - User data for registration.
   * @returns {Promise<Object>} - Registration response.
   */
  register: async (userData) => {
    const response = await fetch(`${API_BASE_URL}/accounts/register/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(userData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        errorData.detail || JSON.stringify(errorData) || "Registration failed"
      );
    }
    return response.json();
  },

  /**
   * Fetches all users (admin only).
   * @returns {Promise<Array>} - List of users.
   */
  getUsers: async () => {
    const response = await fetch(`${API_BASE_URL}/accounts/users/`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...authService.getAuthHeaders(),
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || "Failed to fetch users");
    }
    return response.json();
  },

  /**
   * Fetches a single user by ID (admin only).
   * @param {number} userId - ID of the user.
   * @returns {Promise<Object>} - User data.
   */
  getUserById: async (userId) => {
    const response = await fetch(`${API_BASE_URL}/accounts/users/${userId}/`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...authService.getAuthHeaders(),
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || "Failed to fetch user");
    }
    return response.json();
  },

  /**
   * Creates a new user (admin only).
   * @param {Object} userData - User data for creation.
   * @returns {Promise<Object>} - Created user data.
   */
  createUser: async (userData) => {
    const response = await fetch(`${API_BASE_URL}/accounts/users/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...authService.getAuthHeaders(),
      },
      body: JSON.stringify(userData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        errorData.detail || JSON.stringify(errorData) || "Failed to create user"
      );
    }
    return response.json();
  },

  /**
   * Updates an existing user (admin only).
   * @param {number} userId - ID of the user to update.
   * @param {Object} userData - User data for update.
   * @returns {Promise<Object>} - Updated user data.
   */
  updateUser: async (userId, userData) => {
    const response = await fetch(`${API_BASE_URL}/accounts/users/${userId}/`, {
      method: "PUT", // or PATCH for partial updates
      headers: {
        "Content-Type": "application/json",
        ...authService.getAuthHeaders(),
      },
      body: JSON.stringify(userData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        errorData.detail || JSON.stringify(errorData) || "Failed to update user"
      );
    }
    return response.json();
  },

  /**
   * Deletes a user (admin only).
   * @param {number} userId - ID of the user to delete.
   * @returns {Promise<void>}
   */
  deleteUser: async (userId) => {
    const response = await fetch(`${API_BASE_URL}/accounts/users/${userId}/`, {
      method: "DELETE",
      headers: {
        ...authService.getAuthHeaders(),
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || "Failed to delete user");
    }
    // No content on successful delete
  },

  /**
   * Fetches all available groups (admin only).
   * @returns {Promise<Array>} - List of groups.
   */
  getGroups: async () => {
    const response = await fetch(`${API_BASE_URL}/accounts/groups/`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...authService.getAuthHeaders(),
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || "Failed to fetch groups");
    }
    return response.json();
  },

  //forgot password code
  /** requestPasswordReset: async (usernameOrEmail) => {
    const response = await fetch(
      `${API_BASE_URL}/accounts/request-password-reset/`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username_or_email: usernameOrEmail }),
      }
    );
    if (!response.ok) throw new Error("Failed to send reset link");
    return response.json();
  },
*/
  /**
   * Manages user roles (groups) (admin only).
   * @param {number} userId - ID of the user.
   * @param {string} groupName - Name of the group.
   * @param {'add'|'remove'} action - Action to perform ('add' or 'remove').
   * @returns {Promise<Object>} - Response message.
   */
  manageUserRole: async (userId, groupName, action) => {
    const response = await fetch(
      `${API_BASE_URL}/accounts/users/${userId}/roles/`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authService.getAuthHeaders(),
        },
        body: JSON.stringify({ group_name: groupName, action: action }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        errorData.detail ||
          JSON.stringify(errorData) ||
          "Failed to manage user role"
      );
    }
    return response.json();
  },

  /**
   * Checks if the user has an access token in localStorage.
   * Does NOT verify if the token is still valid on the backend.
   * @returns {boolean} - True if access token exists, false otherwise.
   */
  isAuthenticated: () => {
    const token = localStorage.getItem("accessToken");
    console.log(
      "isAuthenticated: Checking localStorage for accessToken. Found:",
      !!token
    );
    return !!token;
  },

  /**
   * Checks if the logged-in user is an admin (staff or superuser).
   * @returns {boolean} - True if admin, false otherwise.
   */
  isAdmin: () => {
    const isStaff = localStorage.getItem("isStaff") === "true";
    const isSuperuser = localStorage.getItem("isSuperuser") === "true";
    console.log("isAdmin: isStaff=", isStaff, "isSuperuser=", isSuperuser);
    return isStaff || isSuperuser;
  },

  /**
   * Gets the current user's ID.
   * @returns {string|null}
   */
  getCurrentUserId: () => {
    return localStorage.getItem("userId");
  },

  /**
   * Gets the current user's username.
   * @returns {string|null}
   */
  getCurrentUsername: () => {
    return localStorage.getItem("username");
  },

  /**
   * Gets the current user's groups from the access token.
   * @returns {Array<string>} - List of group names.
   */
  getCurrentUserGroups: () => {
    const token = localStorage.getItem("accessToken");
    if (!token) return [];
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      return payload.groups || [];
    } catch {
      return [];
    }
  },
  /**
   * Checks if the current user is a superuser from the access token.
   * @returns {boolean} - True if superuser, false otherwise.
   */
  getIsSuperuser: () => {
    const token = localStorage.getItem("accessToken");
    if (!token) return false;
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      return payload.is_superuser || false;
    } catch {
      return false;
    }
  },
};

export default authService;

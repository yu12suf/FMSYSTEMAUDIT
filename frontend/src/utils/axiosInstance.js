// frontend/src/utils/axiosInstance.js
import axios from "axios";
import authService from "../services/authService"; // Import your authService

const API_BASE_URL = "http://localhost:8000/api";

// Create a custom Axios instance
const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request Interceptor: Add the access token to every outgoing request
axiosInstance.interceptors.request.use(
  (config) => {
    const accessToken = localStorage.getItem("accessToken");
    if (accessToken) {
      config.headers["Authorization"] = `Bearer ${accessToken}`;
    }
    console.log("Axios Request Interceptor: Adding Authorization header.");
    return config;
  },
  (error) => {
    console.error("Axios Request Interceptor Error:", error);
    return Promise.reject(error);
  }
);

// Response Interceptor: Handle token refresh on 401 errors
axiosInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // If the error is 401 Unauthorized and it's not the refresh token endpoint itself,
    // and we haven't already retried this request
    if (
      error.response &&
      error.response.status === 401 &&
      originalRequest.url !== `${API_BASE_URL}/accounts/token/refresh/` &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true; // Mark this request as retried

      try {
        console.log(
          "Axios Response Interceptor: 401 detected. Attempting token refresh..."
        );
        const refreshed = await authService.refreshAccessToken(); // Use the synchronized refresh

        if (refreshed) {
          // Update the original request's header with the new access token
          originalRequest.headers[
            "Authorization"
          ] = `Bearer ${localStorage.getItem("accessToken")}`;
          console.log(
            "Axios Response Interceptor: Token refreshed, retrying original request."
          );
          return axiosInstance(originalRequest); // Retry the original request with the new token
        } else {
          // Refresh failed, user is truly unauthenticated, redirect to login
          console.error(
            "Axios Response Interceptor: Token refresh failed. Redirecting to login."
          );
          authService.logout(); // Clear local storage and redirect
          window.location.href = "/login"; // Force full redirect to login
          return Promise.reject(error); // Reject the original error
        }
      } catch (refreshError) {
        console.error(
          "Axios Response Interceptor: Error during token refresh or retry:",
          refreshError
        );
        authService.logout(); // Clear local storage and redirect
        window.location.href = "/login"; // Force full redirect to login
        return Promise.reject(refreshError); // Reject the refresh error
      }
    }

    // For any other errors (not 401, or 401 from refresh endpoint, or already retried)
    return Promise.reject(error);
  }
);

export default axiosInstance;

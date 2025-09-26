import React from "react";
import { Navigate } from "react-router-dom";

const ProtectedRoute = ({ isAuthenticated, isAdminRoute, isAdmin, children }) => {
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  if (isAdminRoute && !isAdmin) {
    return <Navigate to="/" replace />;
  }
  return children;
};

export default ProtectedRoute;
import React from "react";
import { useAuth } from "../../context/AuthContext";
import LoadingSpinner from "../common/LoadingSpinner";

function ProtectedRoute({ children }) {
  const { loading, isAuthenticated } = useAuth();

  if (loading) {
    return <LoadingSpinner variant="fullPage" />;
  }

  if (!isAuthenticated) {
    return null;
  }

  return children;
}

export default ProtectedRoute;

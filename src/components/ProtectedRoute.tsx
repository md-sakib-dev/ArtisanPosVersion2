
import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
}) => {
  const {
    isAuthenticated,
    isSessionExpired,
  } = useAuth();

  /*
   * Redirect to login when:
   *
   * 1. User is not authenticated
   * OR
   * 2. The access-token/session has expired
   */
  if (!isAuthenticated || isSessionExpired()) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;




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
    isRestoring,
  } = useAuth();

  /*
   * While the saved session is being restored on boot (page refresh),
   * show a neutral loading screen instead of bouncing to /login.
   */
  if (isRestoring) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-[#F5F7F3]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#10673E]/30 border-t-[#10673E]" />
      </div>
    );
  }

  /*
   * Redirect to login when:
   *
   * 1. User is not authenticated
   * OR
   * 2. The access-token/session has expired
   *    (AuthContext silently refreshes first — reaching here means
   *    refresh also failed, so a real logout is correct)
   */
  if (!isAuthenticated || isSessionExpired()) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;

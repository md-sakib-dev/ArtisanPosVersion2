
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
} from "react";

import { logoutApi } from "../api/authApi";
import {setAccessToken as saveAccessToken,clearAccessToken} from "../api/authToken";

/*
 * Logged-in user information.
 *
 * This is kept in React memory.
 * It is NOT stored in localStorage.
 */
export interface AuthUser {
  id: number;
  username: string;
  displayName: string;
  roleId: number;
  roleName: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: AuthUser | null;

  /*
   * Access token is kept in React memory.
   */
  accessToken: string | null;

  /*
   * Login stores authentication information
   * in React memory.
   *
   * The refresh token should be handled by the
   * backend as an HttpOnly cookie.
   */
  login: (
    user: AuthUser,
    token: string,
    expiresAt: string
  ) => void;

  logout: () => void;

  isSessionExpired: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(
  undefined
);

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth must be used within an AuthProvider"
    );
  }

  return context;
};

export const AuthProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  /*
   * Access token lives only in React memory.
   *
   * Browser refresh will clear it.
   */
  const [accessToken, setAccessToken] = useState<string | null>(
    null
  );

  /*
   * User information also lives only in React memory.
   */
  const [user, setUser] = useState<AuthUser | null>(null);

  /*
   * Authentication state.
   */
  const [isAuthenticated, setIsAuthenticated] =
    useState<boolean>(false);

  /*
   * Access-token expiration time.
   *
   * Also kept in React memory.
   */
  const [expiresAt, setExpiresAt] = useState<string | null>(
    null
  );

  const logoutRef = useRef<() => void>(() => {});

  /*
   * Check whether the current session has expired.
   */
  const isSessionExpired = useCallback((): boolean => {
    if (!expiresAt) {
      return true;
    }

    const expiryTime = new Date(expiresAt).getTime();

    if (Number.isNaN(expiryTime)) {
      return true;
    }

    return Date.now() >= expiryTime;
  }, [expiresAt]);

  const login = useCallback(
  (
    authUser: AuthUser,
    token: string,
    tokenExpiresAt: string
  ) => {
    setUser(authUser);
    setAccessToken(token);
    setExpiresAt(tokenExpiresAt);
    setIsAuthenticated(true);

    saveAccessToken(token);
  },
  []
);
  
  const logout = useCallback(async () => {
    try {
      await logoutApi();
    } catch (error) {
      console.error("Logout API error:", error);
    } finally {
  clearAccessToken();

  setAccessToken(null);
  setUser(null);
  setExpiresAt(null);
  setIsAuthenticated(false);
}
  }, []);

 
  logoutRef.current = logout;

  
  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    if (!expiresAt) {
      logoutRef.current();
      return;
    }

    const expiryTime = new Date(expiresAt).getTime();

    if (Number.isNaN(expiryTime)) {
      logoutRef.current();
      return;
    }

    const remainingMs = expiryTime - Date.now();

    if (remainingMs <= 0) {
      logoutRef.current();
      return;
    }

    const timeoutId = setTimeout(() => {
      logoutRef.current();
    }, remainingMs);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [isAuthenticated, expiresAt]);

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        user,
        accessToken,
        login,
        logout,
        isSessionExpired,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};


import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
} from "react";

import { logoutApi, refreshSessionApi } from "../api/authApi";
import {
  setAccessToken as saveAccessToken,
  clearAccessToken,
} from "../api/authToken";
import {
  saveSession,
  loadSession,
  clearSession,
} from "../api/sessionStore";

/*
 * Logged-in user information.
 *
 * This is kept in React memory while the app runs, and mirrored to
 * sessionStorage so a page refresh restores the session.
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
   * Login stores authentication information in React memory
   * and mirrors it to sessionStorage for refresh survival.
   *
   * refreshToken info comes from the login response and enables
   * silent token refresh (no re-login on access-token expiry).
   */
  login: (
    user: AuthUser,
    token: string,
    expiresAt: string,
    refreshTokenInfo?: { refreshToken: string; refreshTokenExpiresAt: string }
  ) => void;

  logout: () => void;

  isSessionExpired: () => boolean;

  /*
   * True while a saved session is being restored on boot
   * (page refresh). Guards should wait instead of redirecting.
   */
  isRestoring: boolean;
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
  const [accessToken, setAccessToken] = useState<string | null>(
    null
  );
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isAuthenticated, setIsAuthenticated] =
    useState<boolean>(false);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);

  /*
   * Refresh token + its expiry live outside React state — they are
   * not needed for rendering and must not trigger re-renders.
   */
  const refreshTokenRef = useRef<string | null>(null);
  const refreshTokenExpiresAtRef = useRef<string | null>(null);

  /*
   * True while the saved session is being restored on boot.
   * ProtectedRoute waits for this instead of bouncing to /login.
   */
  const [isRestoring, setIsRestoring] = useState<boolean>(true);

  const logoutRef = useRef<() => void>(() => {});

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
      tokenExpiresAt: string,
      refreshTokenInfo?: { refreshToken: string; refreshTokenExpiresAt: string }
    ) => {
      if (refreshTokenInfo) {
        refreshTokenRef.current = refreshTokenInfo.refreshToken;
        refreshTokenExpiresAtRef.current =
          refreshTokenInfo.refreshTokenExpiresAt;
      }

      setUser(authUser);
      setAccessToken(token);
      setExpiresAt(tokenExpiresAt);
      setIsAuthenticated(true);

      saveAccessToken(token);
      clearSession();
      saveSession({
        user: authUser,
        accessToken: token,
        expiresAt: tokenExpiresAt,
        refreshToken: refreshTokenRef.current,
        refreshTokenExpiresAt: refreshTokenExpiresAtRef.current,
      });
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
      clearSession();

      setAccessToken(null);
      setUser(null);
      setExpiresAt(null);
      setIsAuthenticated(false);

      refreshTokenRef.current = null;
      refreshTokenExpiresAtRef.current = null;
    }
  }, []);

  logoutRef.current = logout;

  /*
   * Refresh the access token with the stored refresh token.
   * Returns true on success, false when the session must end.
   */
  const tryRefreshAccessToken = useCallback(async (): Promise<boolean> => {
    const storedToken = accessToken ?? loadSession()?.accessToken ?? null;
    const storedRefresh = refreshTokenRef.current;

    if (!storedToken || !storedRefresh) {
      return false;
    }

    try {
      const data = await refreshSessionApi(storedToken, storedRefresh);

      if (!data?.success || !data.data?.token) {
        return false;
      }

      setAccessToken(data.data.token);
      setExpiresAt(data.data.expiresAt);
      saveAccessToken(data.data.token);

      refreshTokenRef.current = data.data.refreshToken;
      refreshTokenExpiresAtRef.current = data.data.refreshTokenExpiresAt;

      setUser((prev) => {
        saveSession({
          user: prev as AuthUser,
          accessToken: data.data!.token,
          expiresAt: data.data!.expiresAt,
          refreshToken: data.data!.refreshToken,
          refreshTokenExpiresAt: data.data!.refreshTokenExpiresAt,
        });
        return prev;
      });

      return true;
    } catch {
      return false;
    }
  }, [accessToken]);

  /*
   * Boot: restore a saved session (survives page refresh), then keep
   * a valid access token via silent refresh for the whole tab life.
   */
  useEffect(() => {
    let cancelled = false;

    const restore = async () => {
      const saved = loadSession();

      if (
        !saved?.accessToken ||
        !saved.user ||
        !saved.expiresAt ||
        Number.isNaN(new Date(saved.expiresAt).getTime())
      ) {
        clearSession();
        setIsRestoring(false);
        return;
      }

      // Restore immediately so the UI renders without a flash of login.
      setUser(saved.user);
      setAccessToken(saved.accessToken);
      setExpiresAt(saved.expiresAt);
      setIsAuthenticated(true);
      saveAccessToken(saved.accessToken);

      refreshTokenRef.current = saved.refreshToken ?? null;
      refreshTokenExpiresAtRef.current = saved.refreshTokenExpiresAt ?? null;

      setIsRestoring(false);

      // Access token already expired while the tab was closed →
      // refresh silently instead of logging the user out.
      if (new Date(saved.expiresAt).getTime() <= Date.now()) {
        const ok = await tryRefreshAccessToken();
        if (!ok && !cancelled) {
          logoutRef.current();
        }
      }
    };

    restore();

    return () => {
      cancelled = true;
    };
    // Run once on mount. tryRefreshAccessToken is intentionally not a
    // dependency: it only reads refs and initial session values here.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /*
   * Auto-refresh / auto-logout timer.
   *
   * While authenticated, schedules silent token refresh shortly before
   * expiry. Only logs out when no refresh token is available or the
   * refresh itself is rejected by the backend.
   */
  useEffect(() => {
    if (!isAuthenticated || isRestoring) {
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
      // Expired: try to refresh silently before giving up.
      tryRefreshAccessToken().then((ok) => {
        if (!ok) {
          logoutRef.current();
        }
      });
      return;
    }

    // Refresh 30s before expiry (or halfway through a very short life).
    const refreshLeadMs = Math.min(30_000, Math.floor(remainingMs / 2));
    const refreshDelay = Math.max(0, remainingMs - refreshLeadMs);

    const refreshTimeoutId = setTimeout(() => {
      tryRefreshAccessToken().then((ok) => {
        if (!ok) {
          logoutRef.current();
        }
      });
    }, refreshDelay);

    // Safety net: if refresh failed to update expiry, log out at expiry.
    const logoutTimeoutId = setTimeout(() => {
      logoutRef.current();
    }, remainingMs + 5_000);

    return () => {
      clearTimeout(refreshTimeoutId);
      clearTimeout(logoutTimeoutId);
    };
  }, [isAuthenticated, isRestoring, expiresAt, tryRefreshAccessToken]);

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        user,
        accessToken,
        login,
        logout,
        isSessionExpired,
        isRestoring,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

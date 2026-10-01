import type { AuthUser } from "../contexts/AuthContext";

/*
 * Session persistence.
 *
 * The access token / user info live in React memory while the app runs.
 * This module mirrors them into localStorage so a page refresh does not
 * log the user out AND a newly opened tab inherits the login (the
 * previous sessionStorage kept sessions per-tab, which bounced every
 * new tab back to the login page).
 *
 * localStorage:
 *   - survives refresh
 *   - SHARED by all tabs of the browser — opening a new tab keeps the
 *     user logged in (AuthContext listens for cross-tab changes so
 *     logout / re-login stay in sync)
 *   - survives browser restart (until the backend token expires or
 *     the user logs out)
 *
 * NOTE: the long-lived refresh token must be an HttpOnly cookie set by
 * the backend. Storing it here would be an XSS risk — if the backend
 * starts setting that cookie, remove refreshToken from this payload
 * and rely on cookie auto-send instead.
 */

export interface StoredSession {
  user: AuthUser;
  accessToken: string;
  expiresAt: string;
  refreshToken: string | null;
  refreshTokenExpiresAt: string | null;
}

export const SESSION_STORAGE_KEY = "pos.session";

export const saveSession = (session: StoredSession): void => {
  try {
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
  } catch {
    /* storage unavailable — in-memory session still works */
  }
};

export const loadSession = (): StoredSession | null => {
  try {
    const raw = localStorage.getItem(SESSION_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as StoredSession;
  } catch {
    return null;
  }
};

export const clearSession = (): void => {
  try {
    localStorage.removeItem(SESSION_STORAGE_KEY);
  } catch {
    /* ignore */
  }
};

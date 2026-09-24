import type { AuthUser } from "../contexts/AuthContext";

/*
 * Session persistence.
 *
 * The access token / user info live in React memory while the app runs.
 * This module mirrors them into sessionStorage so a browser refresh
 * does not log the user out.
 *
 * sessionStorage (not localStorage) is used deliberately:
 *   - survives refresh
 *   - each browser tab has its own session (matches per-tab POS tills)
 *   - closing the tab ends the session
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

const KEY = "pos.session";

export const saveSession = (session: StoredSession): void => {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(session));
  } catch {
    /* storage unavailable — in-memory session still works */
  }
};

export const loadSession = (): StoredSession | null => {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return null;
    return JSON.parse(raw) as StoredSession;
  } catch {
    return null;
  }
};

export const clearSession = (): void => {
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
};

import api from "./axios";
import { getAccessToken } from "./authToken";
import { loadSession } from "./sessionStore";
export interface LoginRequest{
    userName:string;
    password:string;
}
export interface LoginUser {
  userId: number;
  username: string;
  roleId: number;
  roleCode: string;
  token: string;
  expiresAt: string;
  refreshToken: string;
  refreshTokenExpiresAt: string;
}
export interface LoginResponse {
  success: boolean;
  message: string;
  data: LoginUser | null;
  pagination: null;
}
export const loginApi = async (
  userName: string,
  password: string
): Promise<LoginResponse> => {
  const response = await api.post<LoginResponse>("Auth/login", {
    userName,
    password,
  });

  return response.data;
};

export const logoutApi = async () => {
  const token = getAccessToken();
  const refreshToken = loadSession()?.refreshToken ?? null;

  const response = await api.post(
    "Auth/logout",
    {
      refreshToken,
    },
    {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    }
  );

  return response.data;
};

export interface RefreshTokenRequest {
  token: string;
  refreshToken: string;
}

export interface RefreshTokenResponse {
  success: boolean;
  message: string;
  data: {
    token: string;
    expiresAt: string;
    refreshToken: string;
    refreshTokenExpiresAt: string;
  } | null;
  pagination: null;
}

/**
 * Exchange the (possibly expired) access token + refresh token for a
 * fresh session. Silent — used by AuthContext to keep the user logged
 * in across access-token expiries and page refreshes.
 */
export const refreshSessionApi = async (
  token: string,
  refreshToken: string
): Promise<RefreshTokenResponse> => {
  const response = await api.post<RefreshTokenResponse>(
    "Auth/refresh-token",
    {
      token,
      refreshToken,
    } satisfies RefreshTokenRequest
  );

  return response.data;
};

export interface ChangePasswordRequest {
  userName: string;
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface ChangePasswordResponse {
  success: boolean;
  message: string;
  data: unknown;
  pagination: null;
}

/**
 * Change the password of the currently logged-in user.
 * The JWT is attached automatically by the existing
 * Axios request interceptor.
 */
export const changePassword = async (
  data: ChangePasswordRequest
): Promise<ChangePasswordResponse> => {
  const response = await api.post<ChangePasswordResponse>(
    "Auth/change-password",
    data
  );

  return response.data;
};
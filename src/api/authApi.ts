import api from "./axios";
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
  const refreshToken = localStorage.getItem("refreshToken");
 const token = localStorage.getItem("token");
  const response = await api.post("Auth/logout", {
    refreshToken,
  },
  {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  }
);

  return response.data;
};
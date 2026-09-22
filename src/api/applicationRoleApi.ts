import api from "./axios";

export interface ApplicationRole {
  roleId: number;
  systemId: number;
  roleCode: string;
  roleName: string;
  roleDescription: string | null;
  activeSts: number;
  createdBy: number | null;
}

export interface ApplicationRolesData {
  items: ApplicationRole[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
  hasPrevious: boolean;
  hasNext: boolean;
}

export interface ApplicationRolesResponse {
  success: boolean;
  message: string;
  data: ApplicationRolesData;
  pagination: null;
}

export const getApplicationRoles = async (): Promise<ApplicationRolesResponse> => {
  const response = await api.get<ApplicationRolesResponse>(
    "ApplicationRoles"
  );

  return response.data;
};

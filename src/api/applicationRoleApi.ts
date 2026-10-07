import api from "./axios";

export interface ApplicationRole {
  roleId: number;
  systemId: number;
  roleCode: string;
  roleName: string;
  roleDescription: string | null;
  /* Not returned by /ApplicationRoles/by-system/{systemId} */
  activeSts?: number;
  createdBy?: number | null;
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

/** Body of POST /api/ApplicationRoles (backend ApplicationRoleCreateDto). */
export interface ApplicationRoleCreateDto {
  systemId: number;
  roleCode: string;
  roleName: string;
  roleDescription: string;
}

export interface CreateApplicationRoleResponse {
  success: boolean;
  message: string;
  data: unknown;
  pagination: null;
}

/**
 * Create a new role: POST /api/ApplicationRoles.
 * systemId is the numeric ID of the system the role belongs to.
 */
export const createApplicationRole = async (
  role: ApplicationRoleCreateDto
): Promise<CreateApplicationRoleResponse> => {
  console.log("Creating role:", role);
  const response = await api.post<CreateApplicationRoleResponse>(
    "ApplicationRoles",
    role
  );

  return response.data;
};

/**
 * Update an existing role: PUT /api/ApplicationRoles/{roleId}.
 * Body uses the same shape as create.
 */
export const updateApplicationRole = async (
  roleId: number,
  role: ApplicationRoleCreateDto
): Promise<CreateApplicationRoleResponse> => {
  const response = await api.put<CreateApplicationRoleResponse>(
    `ApplicationRoles/${roleId}`,
    role
  );

  return response.data;
};

/**
 * Active roles of ONE application system:
 * GET /api/ApplicationRoles/by-system/{systemId}
 *
 * systemId is the numeric system ID. The systems dropdown
 * (Dropdown/application-systems) returns string codes — resolve the
 * numeric ID first (see resolveSystemIdFromMenus in menuApi.ts).
 *
 * Returns the standard ApplicationRolesResponse shape (items, totalCount, …).
 */
export const getApplicationRolesBySystem = async (
  systemId: number | string
): Promise<ApplicationRolesResponse> => {
  const response = await api.get<ApplicationRolesResponse>(
    `ApplicationRoles/by-system/${systemId}`
  );

  return response.data;
};

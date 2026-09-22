import api from "./axios";

export interface RoleMenu {
  roleMenuId?: number;
  menuId: number;
  menuName: string;
  roleId: number;
  roleName: string;
  roleDescription: string;
  parentMenuId: number | null;
  canView: boolean;
  activeSts: number;}

/**
 * Response of GET RoleMenus (all role-menu records).
 * data is an object containing items.
 */
export interface RoleMenuResponse {
  success: boolean;
  message: string;
  data: {
    items: RoleMenu[];
  };
  pagination: null;
}

/**
 * Response of GET RoleMenus/{roleId}.
 * IMPORTANT: data is an ARRAY directly here (no items wrapper).
 */
export interface RoleMenuListResponse {
  success: boolean;
  message: string;
  data: RoleMenu[];
}

export const getRoleMenus = async () => {
  const response = await api.get<RoleMenuResponse>("RoleMenus");

  return response.data;
};export const getRoleMenusByRoleId = async (
  roleId: number
): Promise<RoleMenuListResponse> => {
  const response = await api.get<RoleMenuListResponse>(
    `RoleMenus/${roleId}`
  );

  return response.data;
};

/**
 * One menu entry of the save request.
 * canView and activeSts must always be synchronized:
 * checked   → canView: true,  activeSts: 1
 * unchecked → canView: false, activeSts: 0
 */
export interface SaveRoleMenuItem {
  menuId: number;
  canView: boolean;
  activeSts: number;
}

/**
 * Body of POST RoleMenus.
 * menuList must contain ALL menus, not only the checked ones.
 */
export interface SaveRoleMenusRequest {
  roleId: number;
  menuList: SaveRoleMenuItem[];
}

export interface SaveRoleMenusResponse {
  success: boolean;
  message: string;
  data: unknown;
}

export const saveRoleMenus = async (
  request: SaveRoleMenusRequest
): Promise<SaveRoleMenusResponse> => {
  const response = await api.post<SaveRoleMenusResponse>(
    "RoleMenus",
    request
  );

  return response.data;
};

/**
 * One menu the currently authenticated user is
 * authorized to see. Returned by GET RoleMenus/authorized.
 */
export interface AuthorizedMenu {
  menuId: number;
  parentMenuId: number | null;
  menuName: string;
  menuUrl: string;
  menuIcon: string;
}

/**
 * Response of GET RoleMenus/authorized.
 * The plain-array shape is handled as well, in case the
 * wrapper is missing.
 */
export interface AuthorizedMenuResponse {
  success: boolean;
  message: string;
  data: AuthorizedMenu[];
}

/**
 * Get the menus the logged-in user is authorized to see.
 * Used ONLY for the sidebar — not for Role Management.
 */
export const getAuthorizedMenus = async (): Promise<AuthorizedMenu[]> => {
  const response = await api.get<
    AuthorizedMenu[] | AuthorizedMenuResponse
  >("RoleMenus/authorized");

  const body = response.data;

  /* Plain array response */
  if (Array.isArray(body)) {
    return body;
  }

  /* Wrapped { success, data } response */
  if (body && typeof body === "object" && Array.isArray(body.data)) {
    return body.data;
  }

  return [];
};
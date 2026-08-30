export interface Role {
  id: number;
  name: string;
  description: string;
}

export interface RolePermissions {
  roleId: number;
  roleName: string;
  menuIds: number[];
}

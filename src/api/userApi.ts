import api from './axios';

export interface User {
    userId: number;
    loginId: string;
    employeeId: string;
    employeeName: string;
    roleId: number;
    roleName: string;
    branchId: number;
    branchName: string;
}export interface userResponse {
    success: boolean;
    message: string;
    data: User[];
}

/*
 * The list endpoint has been seen returning both shapes:
 *   - { success, message, data: User[] }
 *   - { success, message, data: { items: User[] } }  (paged wrapper)
 * Normalize to always expose a flat User[] in data.
 */
interface RawUsersResponse {
    success: boolean;
    message: string;
    data: User[] | { items?: User[] } | null;
}

export const getUsers = async (): Promise<userResponse> => {
    const response = await api.get<RawUsersResponse>("ApplicationUsers");
    const body = response.data;
    const raw = body?.data;
    const list: User[] = Array.isArray(raw) ? raw : Array.isArray(raw?.items) ? raw.items : [];
    return {
        success: body?.success ?? true,
        message: body?.message ?? "",
        data: list,
    };
};

/* ------------------------------------------------------------------ */
/* Dropdowns                                                            */
/* ------------------------------------------------------------------ */

/** One option of a GET /api/Dropdown/* endpoint (value is sent back as string). */
export interface DropdownOption {
    value: string;
    text: string;
}

interface DropdownResponse {
    success: boolean;
    message: string;
    data: DropdownOption[];
}

/** GET /api/Dropdown/branches — value = branch ID, text = branch name */
export const getBranchOptions = async (): Promise<DropdownOption[]> => {
    const response = await api.get<DropdownResponse>("Dropdown/branches");
    return response.data?.data ?? [];
};

/** GET /api/Dropdown/application-roles — value = role ID, text = role name */
export const getRoleOptions = async (): Promise<DropdownOption[]> => {
    const response = await api.get<DropdownResponse>("Dropdown/application-roles");
    return response.data?.data ?? [];
};

/* ------------------------------------------------------------------ */
/* Create / update                                                      */
/* ------------------------------------------------------------------ */

/** POST /api/ApplicationUsers body — mirrors backend UserCreateDto. */
export interface UserCreateDto {
    loginId: string;
    employeeId: string;
    roleId: number;
    branchId: number;
    passwordHash: string;
}

/** PUT /api/ApplicationUsers/{id} body — password omitted = keep current. */
export interface UserUpdateDto {
    loginId: string;
    employeeId: string;
    roleId: number;
    branchId: number;
    passwordHash?: string;
}

export interface UserMutationResponse {
    success: boolean;
    message: string;
    data: User | null;
}

/** POST /api/ApplicationUsers */
export const createUser = async (dto: UserCreateDto): Promise<UserMutationResponse> => {
       console.log("Create User Payload:", dto);
    const response = await api.post<UserMutationResponse>("ApplicationUsers", dto);
    return response.data;
};

/** PUT /api/ApplicationUsers/{userId} */
export const updateUser = async (
    userId: number,
    dto: UserUpdateDto
): Promise<UserMutationResponse> => {
    const response = await api.put<UserMutationResponse>(
        `ApplicationUsers/${userId}`,
        dto
    );
    return response.data;
};

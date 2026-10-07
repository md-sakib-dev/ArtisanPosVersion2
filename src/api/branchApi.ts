import api from "./axios";

export interface Branch {
  branchId: number;
  branchName: string;
  branchAddress: string;
  branchContact: string;
  vatRegNo: string;
  createdTime: string;
  branchStatus: number;
}

export interface BranchResponse {
  success: boolean;
  message: string;
  data: Branch[];
}

/*
 * The list endpoint has been seen returning both shapes:
 *   - { success, message, data: Branch[] }
 *   - { success, message, data: { items: Branch[] } }  (paged wrapper)
 * Normalize to always expose a flat Branch[] in data.
 */
interface RawBranchesResponse {
  success: boolean;
  message: string;
  data: Branch[] | { items?: Branch[] } | null;
}

export const getBranches = async (): Promise<BranchResponse> => {
  const response = await api.get<RawBranchesResponse>("Branchs");
  const body = response.data;
  const raw = body?.data;
  const list: Branch[] = Array.isArray(raw)
    ? raw
    : Array.isArray(raw?.items)
      ? raw.items
      : [];
  return {
    success: body?.success ?? true,
    message: body?.message ?? "",
    data: list,
  };
};

/* ------------------------------------------------------------------ */
/* Create / update                                                      */
/* ------------------------------------------------------------------ */

/** POST /api/Branches body — mirrors backend BranchCreateDto. */
export interface BranchCreateDto {
  
  branchName: string;
  branchAddress: string;
  branchContact: string;
  vatRegNo: string;
  /** 1 = Active, 0 = Inactive — mirrors the read model's branchStatus. */
  branchStatus: number;
}

/** PUT /api/Branches/{id} body (same shape as create). */
export type BranchUpdateDto =  BranchCreateDto ;

export interface BranchMutationResponse {
  success: boolean;
  message: string;
  data: Branch | null;
}

/** POST /api/Branches */
export const createBranch = async (
  dto: BranchCreateDto
): Promise<BranchMutationResponse> => {
  const response = await api.post<BranchMutationResponse>("Branchs", dto);
  return response.data;
};

/** PUT /api/Branches/{branchId} */
export const updateBranch = async (
  branchId: number,
  dto: BranchUpdateDto
): Promise<BranchMutationResponse> => {
  console.log("Updating branch with ID:", branchId, "and DTO:", dto);
  const response = await api.put<BranchMutationResponse>(
    `Branchs/${branchId}`,
    dto
  );
  return response.data;
};

/* ------------------------------------------------------------------ */
/* Dropdown: branches                                                    */
/* ------------------------------------------------------------------ */

/** One option of GET /api/Dropdown/branches. */
export interface BranchDropdownOption {
  value: number;
  text: string;
}

export interface BranchDropdownResponse {
  success: boolean;
  message: string;
  data: BranchDropdownOption[];
  pagination: null;
}

/**
 * GET /api/Dropdown/branches — branch options for pickers.
 * Tolerant of value being returned as string or number.
 */
export const getBranchDropdown = async (): Promise<BranchDropdownResponse> => {
  const response = await api.get<
    Omit<BranchDropdownResponse, "data"> & {
      data: (string | number | BranchDropdownOption)[] | null;
    }
  >("Dropdown/branches");

  const raw = response.data?.data ?? [];

  const options: BranchDropdownOption[] = raw
    .map((opt): BranchDropdownOption | null => {
      if (typeof opt === "string") return null;
      if (typeof opt === "number") return null;
      return {
        value: Number(opt.value),
        text: opt.text ?? "",
      };
    })
    .filter((opt): opt is BranchDropdownOption => opt !== null);

  return {
    success: response.data?.success ?? true,
    message: response.data?.message ?? "",
    data: options,
    pagination: null,
  };
};

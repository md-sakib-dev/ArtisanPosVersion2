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
export type BranchUpdateDto = BranchCreateDto;

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
  const response = await api.put<BranchMutationResponse>(
    `Branchs/${branchId}`,
    dto
  );
  return response.data;
};

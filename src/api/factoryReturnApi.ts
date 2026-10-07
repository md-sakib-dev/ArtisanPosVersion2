import api from "./axios";

/* ------------------------------------------------------------------ */
/* Types                                                                */
/* ------------------------------------------------------------------ */

/**
 * One factory return record — mirrors the ProductOut master rows
 * returned by GET /api/FactoryReturns.
 */
export interface FactoryReturn {
  productOutMasterId: number;
  referenceNumber: string; // e.g. VT26225 / MRT333
  productOutType: string;
  outFromBranchId: number;
  outToBranchId: number;
  outDate: string; // ISO date-time
  remarks: string | null;
  checkedBy: number | null;
  checkedAt: string | null; // ISO date-time
  checkStatus: number; // 0 = pending, 1 = checked
  checkRemarks: string | null;
  activeStatus: number;
}

/* ------------------------------------------------------------------ */
/* GET /api/FactoryReturns                                              */
/* ------------------------------------------------------------------ */

/*
 * The list endpoint is seen returning a paged wrapper:
 *   { success, message, data: { items: FactoryReturn[] } }
 * Normalize to always expose a flat FactoryReturn[] in data
 * (same defensive pattern as branchApi.getBranches).
 */
interface RawFactoryReturnsResponse {
  success: boolean;
  message: string;
  data: FactoryReturn[] | { items?: FactoryReturn[] } | null;
}

export interface FactoryReturnsResponse {
  success: boolean;
  message: string;
  data: FactoryReturn[];
}

/** GET /api/FactoryReturns — list of factory returns. */
export const getFactoryReturns = async (): Promise<FactoryReturnsResponse> => {
  const response = await api.get<RawFactoryReturnsResponse>("FactoryReturns");
  const body = response.data;
  const raw = body?.data;
  const list: FactoryReturn[] = Array.isArray(raw)
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
/* POST /api/FactoryReturns                                             */
/* ------------------------------------------------------------------ */

/** One detail row of the save payload. */
export interface FactoryReturnDetailDto {
  productId: number;
  barcode: string;
  sentQty: number;
}

/** POST /api/FactoryReturns body — master + details. */
export interface SaveFactoryReturnPayload {
  master: {
    /* referenceNumber is not sent — the backend generates it. */
    productOutType: string;
    outFromBranchId: number;
    outToBranchId: number;
    outDate: string; // ISO date-time
    remarks: string;
  };
  details: FactoryReturnDetailDto[];
}

export interface SaveFactoryReturnResponse {
  success: boolean;
  message: string;
}

/** POST /api/FactoryReturns — save a factory return. */
export const saveFactoryReturn = async (
  payload: SaveFactoryReturnPayload
): Promise<SaveFactoryReturnResponse> => {
  console.log("saveFactoryReturn payload:", payload);
  const response = await api.post<SaveFactoryReturnResponse>(
    "FactoryReturns",
    payload
  );
  return response.data;
};

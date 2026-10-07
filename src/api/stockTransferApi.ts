import api from "./axios";

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

/** Master section of POST /api/StockTransfers. */
export interface StockTransferMasterDto {
  productOutType: string;
  outFromBranchId: number;
  outToBranchId: number;
  outDate: string;
  remarks: string;
}

/** One detail row of POST /api/StockTransfers. */
export interface StockTransferDetailDto {
  productId: number;
  barcode: string;
  sentQty: number;
}

export interface StockTransferRequestDto {
  master: StockTransferMasterDto;
  details: StockTransferDetailDto[];
}

export interface StockTransferResponse {
  success: boolean;
  message: string;
  data: unknown;
  pagination: null;
}

/* ------------------------------------------------------------------ */
/* Save                                                                */
/* ------------------------------------------------------------------ */

/**
 * POST /api/StockTransfers — save a stock transfer.
 *
 * master.outFromBranchId must be the logged-in user's branchId;
 * outToBranchId the destination selected in the dropdown.
 */
export const createStockTransfer = async (
  dto: StockTransferRequestDto
): Promise<StockTransferResponse> => {
  console.log("createStockTransfer dto:", dto);
  const response = await api.post<StockTransferResponse>(
    "StockTransfers",
    dto
  );

  return {
    success: response.data?.success ?? false,
    message: response.data?.message ?? "",
    data: response.data?.data ?? null,
    pagination: null,
  };
};

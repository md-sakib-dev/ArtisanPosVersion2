import api from "./axios";

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

export interface VoucherTransferApiItem {
  referenceNumber: string;
  voucherSerial: string;
  voucherAmount: number;
}

export interface VoucherTransferResponse {
  success: boolean;
  message: string;
  data: VoucherTransferApiItem[];
  pagination: null;
}

export interface VoucherTransferMasterDto {
  referenceNumber: string;
  outToBranchId: number;
}

export interface VoucherTransferDetailDto {
  voucherSerial: string;
}

export interface VoucherTransferRequestDto {
  master: VoucherTransferMasterDto;
  details: VoucherTransferDetailDto[];
}

export interface SaveVoucherTransferResponse {
  success: boolean;
  message: string;
  data: unknown;
  pagination: null;
}

/* ------------------------------------------------------------------ */
/* Get Vouchers                                                        */
/* ------------------------------------------------------------------ */

/**
 * GET /api/VoucherTransfers
 *
 * Retrieves vouchers available for transfer.
 */
export const getVoucherTransfers = async (): Promise<VoucherTransferResponse> => {
  const response = await api.get<VoucherTransferResponse>(
    "VoucherTransfers"
  );

  return {
    success: response.data?.success ?? false,
    message: response.data?.message ?? "",
    data: response.data?.data ?? [],
    pagination: null,
  };
};

/* ------------------------------------------------------------------ */
/* Save Voucher Transfer                                               */
/* ------------------------------------------------------------------ */

/**
 * POST /api/VoucherTransfers
 *
 * master.referenceNumber = selected voucher reference number
 * master.outToBranchId = destination branch
 * details = selected voucher serials
 */
export const createVoucherTransfer = async (
  dto: VoucherTransferRequestDto
): Promise<SaveVoucherTransferResponse> => {
  console.log("createVoucherTransfer dto:", dto);

  const response = await api.post<SaveVoucherTransferResponse>(
    "VoucherTransfers",
    dto
  );

  return {
    success: response.data?.success ?? false,
    message: response.data?.message ?? "",
    data: response.data?.data ?? null,
    pagination: null,
  };
};
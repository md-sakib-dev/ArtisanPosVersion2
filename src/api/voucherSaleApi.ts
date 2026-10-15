import api from "./axios";

/* ------------------------------------------------------------------ */
/* Validation                                                          */
/* ------------------------------------------------------------------ */

export interface VoucherValidateResponse {
  isValid: boolean;
  voucherAmount: number;
}

/**
 * Read { isValid, voucherAmount } from the body, tolerating a
 * { data: { isValid, voucherAmount } } wrapper.
 */
const readValidateResponse = (body: unknown): VoucherValidateResponse => {
  const empty: VoucherValidateResponse = {
    isValid: false,
    voucherAmount: 0,
  };

  if (!body || typeof body !== "object") {
    return empty;
  }

  const record = body as Record<string, unknown>;

  if (record.isValid !== undefined) {
    return {
      isValid: Boolean(record.isValid),
      voucherAmount: Number(record.voucherAmount ?? 0) || 0,
    };
  }

  const inner = record.data;
  if (inner && typeof inner === "object") {
    const nested = inner as Record<string, unknown>;

    if (nested.isValid !== undefined) {
      return {
        isValid: Boolean(nested.isValid),
        voucherAmount: Number(nested.voucherAmount ?? 0) || 0,
      };
    }
  }

  return empty;
};

/**
 * GET /api/vouchersales/validate/{voucherSerial}
 * Tells whether a voucher can be used and its value.
 */
export const validateVoucher = async (
  voucherSerial: string
): Promise<VoucherValidateResponse> => {
  const response = await api.get<unknown>(
    `vouchersales/validate/${encodeURIComponent(voucherSerial)}`
  );

  return readValidateResponse(response.data);
};

/* ------------------------------------------------------------------ */
/* Save                                                                */
/* ------------------------------------------------------------------ */

export interface VoucherSaleDetailDto {
  voucherSerial: string;
  voucherAmount: number;
  /** ISO date-time string. */
  expireDate: string;
}

export interface VoucherSaleMasterDto {
  invoiceType: string;
  branchId: number;
  counterId: number;
  customerContact: string;
  /** ISO date-time */
  invoiceDate: string;
  totalQty: number;
  totalProdPrice: number;
  discountId: number;
  discountPercent: number;
  discountAmt: number;
  adjustmentAmt: number;
  priceAftrDiscount: number;
  vatBfrDiscount: number;
  vatAftrDiscount: number;
  returnAmt: number;
  totalPayableAmt: number;
  totalPaid: number;
  changeAmt: number;
  changeType: string;
  changeRefNo: string;
}

export interface VoucherSalePayload {
  master: VoucherSaleMasterDto;
  details: VoucherSaleDetailDto[];
}

export interface VoucherSaleResponse {
  success: boolean;
  message: string;
  data?: unknown;
}

/** POST /api/vouchersales — save the completed voucher sale. */
export const createVoucherSale = async (
  payload: VoucherSalePayload
): Promise<VoucherSaleResponse> => {
  const response = await api.post<VoucherSaleResponse>(
    "vouchersales",
    payload
  );

  return response.data;
};

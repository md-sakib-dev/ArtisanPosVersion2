
import api from "./axios";

// ======================================================
// PENDING CHALLAN
// ======================================================

export interface PendingChallan {
  referenceNumber: string;
  productInType: string;
  productInTypeName: string;
  inDate: string;
  senderRemarks: string | null;
}

// ======================================================
// VOUCHER RECEIVE DETAIL
// FRONTEND / NORMALIZED TYPE
// ======================================================

export interface VoucherReceiveDetail {
  voucherSerial: string;
  voucherAmount: number;
  voucherStatus: boolean;
}

// ======================================================
// RAW API VOUCHER RECEIVE DETAIL
// Backend may return voucherAmount as string
// ======================================================

interface VoucherReceiveDetailRaw {
  voucherSerial: string;
  voucherAmount: string | number;
  voucherStatus: boolean;
}

// ======================================================
// GET PENDING CHALLANS
// GET /api/VoucherReceives/pending-chalans
// ======================================================

interface PendingChallansRawResponse {
  success: boolean;
  message: string;
  data: PendingChallan[] | null;
}

export interface PendingChallansResponse {
  success: boolean;
  message: string;
  data: PendingChallan[];
}

export const getPendingChallans =
  async (): Promise<PendingChallansResponse> => {
    const response =
      await api.get<PendingChallansRawResponse>(
        "VoucherReceives/pending-chalans"
      );

    const body = response.data;

    return {
      success: body?.success ?? true,

      message: body?.message ?? "",

      data: Array.isArray(body?.data)
        ? body.data.map((challan) => ({
            referenceNumber:
              challan.referenceNumber,

            productInType:
              challan.productInType,

            productInTypeName:
              challan.productInTypeName,

            inDate:
              challan.inDate,

            senderRemarks:
              challan.senderRemarks ?? null,
          }))
        : [],
    };
  };

// ======================================================
// GET VOUCHERS BY REFERENCE
// GET /api/VoucherReceives/by-reference/{referenceNumber}
// ======================================================

interface VoucherReceiveByReferenceRawResponse {
  success: boolean;
  message: string;
  data: VoucherReceiveDetailRaw[] | null;
  pagination?: unknown;
}

export interface VoucherReceiveDetailsResponse {
  success: boolean;
  message: string;
  data: VoucherReceiveDetail[];
}

export const getVoucherReceiveByReference =
  async (
    referenceNumber: string
  ): Promise<VoucherReceiveDetailsResponse> => {
    const response =
      await api.get<VoucherReceiveByReferenceRawResponse>(
        `VoucherReceives/by-reference/${encodeURIComponent(
          referenceNumber
        )}`
      );

    const body = response.data;

    return {
      success: body?.success ?? true,

      message: body?.message ?? "",

      data: Array.isArray(body?.data)
        ? body.data.map((voucher) => ({
            voucherSerial:
              voucher.voucherSerial,

            // IMPORTANT:
            // Convert API string/number to number
            voucherAmount:
              Number(voucher.voucherAmount),

            voucherStatus:
              Boolean(voucher.voucherStatus),
          }))
        : [],
    };
  };

// ======================================================
// RECEIVE CHALLAN
// PUT /api/VoucherReceives/receive-chalan
// ======================================================

export interface ReceiveChalanPayload {
  referenceNumber: string;
  receiverRemarks: string;
}

export interface ReceiveChalanResponse {
  success: boolean;
  message: string;
}

export const receiveChalan =
  async (
    payload: ReceiveChalanPayload
  ): Promise<ReceiveChalanResponse> => {
    const response =
      await api.put<ReceiveChalanResponse>(
        "VoucherReceives/receive-chalan",
        payload
      );

    return response.data;
  };

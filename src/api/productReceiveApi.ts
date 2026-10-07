import api from "./axios";

/* ================================================================
   TYPES
================================================================ */

/**
 * Pending challan returned by:
 * GET /api/ProductReceives/pending-chalans
 */
export interface PendingChallan {
  referenceNumber: string;
  productInType: string;
  inDate: string;
  senderRemarks: string | null;
}

/**
 * Product row returned by:
 * GET /api/ProductReceives/by-reference/{referenceNumber}
 */
export interface ProductReceiveDetail {
  productId: number;
  shortName: string;
  fullName: string;
  barcode: string;
  challanQty: number;
  receivedQty: number;
  salesPrice: number;
}

/* ================================================================
   GET PENDING CHALLANS
================================================================ */

interface PendingChalansRawResponse {
  success: boolean;
  message: string;
  data: PendingChallan[] | null;
}

export interface PendingChalansResponse {
  success: boolean;
  message: string;
  data: PendingChallan[];
}

/**
 * GET /api/ProductReceives/pending-chalans
 *
 * Returns all challans waiting to be received.
 */
export const getPendingChallans =
  async (): Promise<PendingChalansResponse> => {
    const response = await api.get<PendingChalansRawResponse>(
      "ProductReceives/pending-chalans"
    );

    const body = response.data;

    return {
      success: body?.success ?? false,
      message: body?.message ?? "",
      data: Array.isArray(body?.data)
        ? body.data.map((challan) => ({
            referenceNumber: challan.referenceNumber,
            productInType: challan.productInType,
            inDate: challan.inDate,
            senderRemarks: challan.senderRemarks ?? null,
          }))
        : [],
    };
  };

/* ================================================================
   GET PRODUCT RECEIVE DETAILS
================================================================ */

interface ByReferenceRawResponse {
  success: boolean;
  message: string;
  data: ProductReceiveDetail[] | null;
  pagination?: unknown;
}

export interface ProductReceiveDetailsResponse {
  success: boolean;
  message: string;
  data: ProductReceiveDetail[];
}

/**
 * GET /api/ProductReceives/by-reference/{referenceNumber}
 *
 * Returns all products belonging to a challan.
 */
export const getProductReceiveByReference = async (
  referenceNumber: string
): Promise<ProductReceiveDetailsResponse> => {
  const response = await api.get<ByReferenceRawResponse>(
    `ProductReceives/by-reference/${encodeURIComponent(referenceNumber)}`
  );

  const body = response.data;

  return {
    success: body?.success ?? false,
    message: body?.message ?? "",
    data: Array.isArray(body?.data) ? body.data : [],
  };
};

/* ================================================================
   RECEIVE CHALLAN
================================================================ */
export interface ReceiveChalanDetail {
  productId: number;
  barcode: string;
  receivedQty: number;
  
}
export interface ReceiveChalanPayload {
  master: {
    referenceNumber: string;
    receiverRemarks: string;
  };
  details: ReceiveChalanDetail[];
}

export interface ReceiveChalanResponse {
  success: boolean;
  message: string;
}

/**
 * PUT /api/ProductReceives/receive-chalan
 *
 * Receives a pending challan.
 */
export const receiveChalan = async (
  payload: ReceiveChalanPayload
): Promise<ReceiveChalanResponse> => {
  console.log("receiveChalan payload:", payload); 
  const response = await api.put<ReceiveChalanResponse>(
    "ProductReceives/receive-chalan",
    payload
  );

  return response.data;
};
import api from "./axios";

/* ================================================================
   TYPES
================================================================ */

export interface RedeemRequestItemPayload {
  redeemType: string;
  referenceNo: string;
  contactNo: string;
  amount: number;
  expiryDate: string; // ISO string format
  verificationRequired: boolean;
}

interface RedeemRequestRawResponse {
  success: boolean;
  message: string;
  data?: unknown;
}

export interface RedeemRequestResponse {
  success: boolean;
  message: string;
}

interface RedeemTypesRawResponse {
  success: boolean;
  message: string;
  data: string[] | { value: string; label: string }[] | null;
}

/* ================================================================
   GET REDEEM TYPES DROPDOWN
================================================================ */

/**
 * GET /api/Dropdown/redeem-types
 *
 * Returns available redeem types for the dropdown selection.
 */
export const getRedeemTypes = async (): Promise<string[]> => {
  const response = await api.get<RedeemTypesRawResponse>("Dropdown/redeem-types");
  const body = response.data;

  if (!body?.success || !Array.isArray(body?.data)) {
    return [];
  }

  // Handles both string[] or object array responses seamlessly
  return body.data.map((item) => (typeof item === "string" ? item : item.value));
};

/* ================================================================
   CREATE REDEEM REQUEST
================================================================ */

/**
 * POST /api/RedeemRequests
 *
 * Submits an array of staged redeem items for approval.
 */
export const createRedeemRequest = async (
  payload: RedeemRequestItemPayload[]
): Promise<RedeemRequestResponse> => {
  console.log("createRedeemRequest payload:", payload);
  const response = await api.post<RedeemRequestRawResponse>(
    "RedeemRequests",
    payload
  );

  const body = response.data;

  return {
    success: body?.success ?? false,
    message: body?.message ?? "Redeem request submitted successfully.",
  };
};
/* ================================================================
   TYPES FOR APPROVAL PAGE
================================================================ */

export interface PendingRedeemApproval {
  requestId: number;
  redeemType: "Voucher" | "Gift Card" | "Loyalty Points" | "Reward Code";
  referenceNo: string;
  amount: number;
  contactNo: string;
  requestBy: string;
  requestAt: string;
}

interface PendingApprovalRawResponse {
  success: boolean;
  message: string;
  data: PendingRedeemApproval[] | null;
}

interface UpdateStatusRawResponse {
  success: boolean;
  message: string;
}

/* ================================================================
   GET PENDING REDEEM REQUESTS FOR APPROVAL
================================================================ */

/**
 * GET /api/RedeemRequests/approval
 *
 * Returns all pending redeem requests waiting for authorization.
 */
export const getPendingRedeemApprovals = async (): Promise<PendingRedeemApproval[]> => {
  const response = await api.get<PendingApprovalRawResponse>("RedeemRequests/approval");
  const body = response.data;

  if (!body?.success || !Array.isArray(body?.data)) {
    return [];
  }

  return body.data;
};

/* ================================================================
   UPDATE REDEEM REQUEST STATUS (APPROVE / DISCARD)
================================================================ */

/**
 * PATCH /api/RedeemRequests/{requestId}/status
 *
 * Updates request status. status parameter: 1 = Approve, 2 = Discard.
 */
export const updateRedeemRequestStatus = async (
  requestId: number,
  status: 1 | 2
): Promise<{ success: boolean; message: string }> => {
    console.log(`Updating redeem request ${requestId} to status ${status}`);
  // Adjust api.patch or api.put depending on backend requirements (using patch here based on standard REST design)
  const response = await api.patch<UpdateStatusRawResponse>(
    `RedeemRequests/${requestId}/status`,
     status // or query param / payload based on your backend contract
  );

  const body = response.data;

  return {
    success: body?.success ?? false,
    message: body?.message ?? "Status updated successfully.",
  };
};
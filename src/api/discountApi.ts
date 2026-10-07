import api from "./axios";

/**
 * One record of GET /api/Discounts.
 */
export interface DiscountRecord {
  discountId: number;
  discountCode: string;
  discountName: string;
  discountType: string; // "PERCENTAGE" | "FIXED"
  discountValue: number;
  maximumDiscountAmount: number;
  minimumSaleAmount: number;
  startDate: string; // ISO datetime
  endDate: string | null; // ISO datetime, null = no end
  activeSts: number; // 1 = active, 0 = inactive
}

/**
 * Body of POST /api/Discounts and PUT /api/Discounts/{discountId}
 * (backend Discount create DTO — no discountId; the ID travels in
 * the URL for updates and is assigned by the backend on create).
 *
 * Dates are ISO UTC datetimes ("2026-10-31T18:00:00.000Z").
 * endDate is null when the discount has no end date.
 */
export interface DiscountPayload {
  discountCode: string;
  discountName: string;
  discountType: string;
  discountValue: number;
  maximumDiscountAmount: number;
  minimumSaleAmount: number;
  startDate: string;
  endDate: string | null;
  activeSts: number;
}

/** Standard envelope used by the other APIs (success/message/data). */
export interface DiscountMutationResponse {
  success: boolean;
  message: string;
  data: unknown;
  pagination: null;
}

export interface DiscountListResponse {
  success: boolean;
  message: string;
  data: DiscountRecord[] | { items: DiscountRecord[] };
  pagination: null;
}

/** GET /api/Discounts — all discounts. */
export const getDiscounts = async (): Promise<DiscountListResponse> => {
  const response = await api.get<DiscountListResponse>("Discounts");

  return response.data;
};

/** Flatten the observed list shapes: plain array or { items: [...] }. */
export const extractDiscountList = (
  body: DiscountListResponse["data"] | undefined
): DiscountRecord[] => {
  if (Array.isArray(body)) return body;

  if (body && typeof body === "object" && "items" in body) {
    return body.items ?? [];
  }

  return [];
};

/** POST /api/Discounts — create a discount. */
export const createDiscount = async (
  discount: DiscountPayload
): Promise<DiscountMutationResponse> => {
  const response = await api.post<DiscountMutationResponse>(
    "Discounts",
    discount
  );

  return response.data;
};

/** PUT /api/Discounts/{discountId} — update an existing discount. */
export const updateDiscount = async (
  discountId: number,
  discount: DiscountPayload
): Promise<DiscountMutationResponse> => {
  const response = await api.put<DiscountMutationResponse>(
    `Discounts/${discountId}`,
    discount
  );

  return response.data;
};

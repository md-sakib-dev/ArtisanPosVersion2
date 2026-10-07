import api from "./axios";

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

/** One row of GET /api/ProductGroupReports. */
export interface ProductGroup {
  productGroupId: number;
  groupName: string;
}

export interface ProductGroupReportResponse {
  success: boolean;
  message: string;
  data: ProductGroup[];
}

/*
 * The endpoint has been seen wrapping rows in a paged container:
 *   { success, message, data: { items: [...] } }
 * Normalize to always expose a flat ProductGroup[] in data.
 */
interface RawResponse {
  success?: boolean;
  message?: string;
  data?: ProductGroup[] | { items?: ProductGroup[] } | null;
}

/* ------------------------------------------------------------------ */
/* Report                                                              */
/* ------------------------------------------------------------------ */

/** GET /api/ProductGroupReports — all product groups. */
export const getProductGroupReport = async (): Promise<
  ProductGroupReportResponse
> => {
  const response = await api.get<RawResponse>("ProductGroupReports");
  const body = response.data;

  let rows: ProductGroup[] = [];
  let success = body?.success ?? true;
  let message = body?.message ?? "";

  const raw = body?.data;
  if (Array.isArray(raw)) {
    rows = raw;
  } else if (raw && typeof raw === "object" && Array.isArray(raw.items)) {
    rows = raw.items;
  }

  /* Always present the report ordered by group ID, ascending */
  rows = [...rows].sort((a, b) => a.productGroupId - b.productGroupId);

  return { success, message, data: rows };
};

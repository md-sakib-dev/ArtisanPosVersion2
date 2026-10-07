import api from "./axios";

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

/** One row of GET /api/ProductBrandReports. */
export interface ProductBrand {
  productBrandId: number;
  brandCode: string;
  brandName: string;
}

export interface ProductBrandReportResponse {
  success: boolean;
  message: string;
  data: ProductBrand[];
}

/*
 * The endpoint may wrap rows in a paged container:
 *   { success, message, data: { items: [...] } }
 * Normalize to always expose a flat ProductBrand[] in data.
 */
interface RawResponse {
  success?: boolean;
  message?: string;
  data?: Record<string, unknown>[] | { items?: Record<string, unknown>[] } | null;
}

/** Map one raw row to the ProductBrand read model (tolerant of field drift). */
const mapBrand = (row: Record<string, unknown>): ProductBrand => ({
  productBrandId: Number(row.productBrandId ?? row.brandId ?? row.id ?? 0),
  brandCode: (row.brandCode as string) ?? "",
  brandName: (row.brandName as string) ?? (row.name as string) ?? "",
});

/* ------------------------------------------------------------------ */
/* Report                                                              */
/* ------------------------------------------------------------------ */

/** GET /api/ProductBrandReports — all product brands. */
export const getProductBrandReport = async (): Promise<
  ProductBrandReportResponse
> => {
  const response = await api.get<RawResponse>("ProductBrandReports");
  const body = response.data;

  let rows: Record<string, unknown>[] = [];
  let success = body?.success ?? true;
  let message = body?.message ?? "";

  const raw = body?.data;
  if (Array.isArray(raw)) {
    rows = raw;
  } else if (raw && typeof raw === "object" && Array.isArray(raw.items)) {
    rows = raw.items;
  }

  const mapped = rows.map(mapBrand);

  /* Always present the report ordered by brand ID, ascending */
  mapped.sort((a, b) => a.productBrandId - b.productBrandId);

  return { success, message, data: mapped };
};

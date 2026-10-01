import api from "./axios";

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

/** One row of GET /api/ProductSizeReports. */
export interface ProductSize {
  productSizeId: number;
  sizeName: string;
}

export interface ProductSizeReportResponse {
  success: boolean;
  message: string;
  data: ProductSize[];
}

/*
 * The endpoint may wrap rows in a paged container:
 *   { success, message, data: { items, totalCount, ... } }
 * Normalize to always expose a flat ProductSize[] in data.
 */
interface RawResponse {
  success?: boolean;
  message?: string;
  data?:
    | Record<string, unknown>[]
    | { items?: Record<string, unknown>[] }
    | null;
}

/** Map one raw row to the ProductSize read model (tolerant of field drift). */
const mapSize = (row: Record<string, unknown>): ProductSize => ({
  productSizeId: Number(row.productSizeId ?? row.sizeId ?? row.id ?? 0),
  sizeName: (row.sizeName as string) ?? (row.name as string) ?? "",
});

/* ------------------------------------------------------------------ */
/* Report                                                              */
/* ------------------------------------------------------------------ */

/** GET /api/ProductSizeReports — all product sizes. */
export const getProductSizeReport = async (): Promise<
  ProductSizeReportResponse
> => {
  const response = await api.get<RawResponse>("ProductSizeReports");
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

  const mapped = rows.map(mapSize);

  /* Always present the report ordered by size ID, ascending */
  mapped.sort((a, b) => a.productSizeId - b.productSizeId);

  return { success, message, data: mapped };
};

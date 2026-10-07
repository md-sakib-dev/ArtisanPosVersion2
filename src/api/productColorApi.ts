import api from "./axios";

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

/** One row of GET /api/ProductColorReports. */
export interface ProductColor {
  productColorId: number;
  colorName: string;
}

export interface ProductColorReportResponse {
  success: boolean;
  message: string;
  data: ProductColor[];
}

/*
 * The endpoint may wrap rows in a paged container:
 *   { success, message, data: { items: [...] } }
 * Normalize to always expose a flat ProductColor[] in data.
 */
interface RawResponse {
  success?: boolean;
  message?: string;
  data?:
    | Record<string, unknown>[]
    | { items?: Record<string, unknown>[] }
    | null;
}

/** Map one raw row to the ProductColor read model (tolerant of field drift). */
const mapColor = (row: Record<string, unknown>): ProductColor => ({
  productColorId: Number(row.productColorId ?? row.colorId ?? row.id ?? 0),
  colorName: (row.colorName as string) ?? (row.name as string) ?? "",
});

/* ------------------------------------------------------------------ */
/* Report                                                              */
/* ------------------------------------------------------------------ */

/** GET /api/ProductColorReports — all product colors. */
export const getProductColorReport = async (): Promise<
  ProductColorReportResponse
> => {
  const response = await api.get<RawResponse>("ProductColorReports");
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

  const mapped = rows.map(mapColor);

  /* Always present the report ordered by color ID, ascending */
  mapped.sort((a, b) => a.productColorId - b.productColorId);

  return { success, message, data: mapped };
};

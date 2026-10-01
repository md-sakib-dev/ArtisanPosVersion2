import api from "./axios";

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

/** One row of GET /api/ProductStyleReports. */
export interface ProductStyle {
  productStyleId: number;
  styleName: string;
  groupName: string | null;
  typeName: string | null;
}

export interface ProductStyleReportResponse {
  success: boolean;
  message: string;
  data: ProductStyle[];
}

/*
 * The endpoint may wrap rows in a paged container:
 *   { success, message, data: { items: [...] } }
 * Normalize to always expose a flat ProductStyle[] in data.
 */
interface RawResponse {
  success?: boolean;
  message?: string;
  data?: Record<string, unknown>[] | { items?: Record<string, unknown>[] } | null;
}

/** Map one raw row to the ProductStyle read model (tolerant of field drift). */
const mapStyle = (row: Record<string, unknown>): ProductStyle => {
  const str = (v: unknown): string | null =>
    typeof v === "string" && v.length > 0 ? v : null;

  return {
    productStyleId: Number(row.productStyleId ?? row.styleId ?? row.id ?? 0),
    styleName: (row.styleName as string) ?? (row.name as string) ?? "",
    groupName: str(row.groupName ?? row.productGroupName ?? row.group),
    typeName: str(row.typeName ?? row.productTypeName ?? row.type),
  };
};

/* ------------------------------------------------------------------ */
/* Report                                                              */
/* ------------------------------------------------------------------ */

/** GET /api/ProductStyleReports — all product styles. */
export const getProductStyleReport = async (): Promise<
  ProductStyleReportResponse
> => {
  const response = await api.get<RawResponse>("ProductStyleReports");
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

  const mapped = rows.map(mapStyle);

  /* Always present the report ordered by style ID, ascending */
  mapped.sort((a, b) => a.productStyleId - b.productStyleId);

  return { success, message, data: mapped };
};

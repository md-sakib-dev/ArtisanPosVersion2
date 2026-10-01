import api from "./axios";

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

/** One row of GET /api/ProductCategoryReports. */
export interface ProductCategory {
  productCategoryId: number;
  categoryName: string;
  groupName: string | null;
  typeName: string | null;
}

export interface ProductCategoryReportResponse {
  success: boolean;
  message: string;
  data: ProductCategory[];
}

/*
 * The endpoint may wrap rows in a paged container:
 *   { success, message, data: { items: [...] } }
 * Normalize to always expose a flat ProductCategory[] in data.
 */
interface RawResponse {
  success?: boolean;
  message?: string;
  data?: Record<string, unknown>[] | { items?: Record<string, unknown>[] } | null;
}

/** Map one raw row to the ProductCategory read model (tolerant of field drift). */
const mapCategory = (row: Record<string, unknown>): ProductCategory => {
  const str = (v: unknown): string | null =>
    typeof v === "string" && v.length > 0 ? v : null;

  return {
    productCategoryId: Number(row.productCategoryId ?? row.categoryId ?? row.id ?? 0),
    categoryName: (row.categoryName as string) ?? (row.name as string) ?? "",
    groupName: str(row.groupName ?? row.productGroupName ?? row.group),
    typeName: str(row.typeName ?? row.productTypeName ?? row.type),
  };
};

/* ------------------------------------------------------------------ */
/* Report                                                              */
/* ------------------------------------------------------------------ */

/** GET /api/ProductCategoryReports — all product categories. */
export const getProductCategoryReport = async (): Promise<
  ProductCategoryReportResponse
> => {
  const response = await api.get<RawResponse>("ProductCategoryReports");
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

  const mapped = rows.map(mapCategory);

  /* Always present the report ordered by category ID, ascending */
  mapped.sort((a, b) => a.productCategoryId - b.productCategoryId);

  return { success, message, data: mapped };
};

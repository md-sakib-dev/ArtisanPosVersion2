import api from "./axios";

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

/** One row of GET /api/ProductTypeReports. */
export interface ProductType {
  productTypeId: number;
  typeName: string;
  groupName: string | null;
}

export interface ProductTypeReportResponse {
  success: boolean;
  message: string;
  data: ProductType[];
}

/*
 * The endpoint may wrap rows in a paged container:
 *   { success, message, data: { items: [...] } }
 * Normalize to always expose a flat ProductType[] in data.
 */
interface RawResponse {
  success?: boolean;
  message?: string;
  data?: Record<string, unknown>[] | { items?: Record<string, unknown>[] } | null;
}

/** Map one raw row to the ProductType read model (tolerant of field drift). */
const mapType = (row: Record<string, unknown>): ProductType => {
  const rawGroup = row.groupName ?? row.productGroupName ?? row.group;

  return {
    productTypeId: Number(row.productTypeId ?? row.typeId ?? row.id ?? 0),
    typeName: (row.typeName as string) ?? (row.name as string) ?? "",
    groupName:
      typeof rawGroup === "string" && rawGroup.length > 0 ? rawGroup : null,
  };
};

/* ------------------------------------------------------------------ */
/* Report                                                              */
/* ------------------------------------------------------------------ */

/** GET /api/ProductTypeReports — all product types. */
export const getProductTypeReport = async (): Promise<
  ProductTypeReportResponse
> => {
  const response = await api.get<RawResponse>("ProductTypeReports");
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

  const mapped = rows.map(mapType);

  /* Always present the report ordered by type ID, ascending */
  mapped.sort((a, b) => a.productTypeId - b.productTypeId);

  return { success, message, data: mapped };
};

import api from "./axios";

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

/** One row of GET /api/CurrentStocks */
export interface CurrentStock {
  id: number;
  productId: number;
  shortName: string;
  fullName: string;
  barcode: string;
  productGroup: string | null;
  productType: string | null;
  productCategory: string | null;
  productBrand: string | null;
  productSize: string | null;
  productStyle: string | null;
  productColor: string | null;
  productSeason: string | null;
  quantity: number;
  salesPrice: number;
}

export interface CurrentStockResponse {
  success: boolean;
  message: string;
  data: CurrentStock[];
}

/* ------------------------------------------------------------------ */
/* Raw Response                                                        */
/* ------------------------------------------------------------------ */

interface RawResponse {
  success?: boolean;
  message?: string;
  data?:
    | Record<string, unknown>[]
    | {
        items?: Record<string, unknown>[];
      }
    | null;
}

/* ------------------------------------------------------------------ */
/* Map API Row                                                         */
/* ------------------------------------------------------------------ */

const mapCurrentStock = (
  row: Record<string, unknown>
): CurrentStock => {
  const nullableString = (value: unknown): string | null =>
    typeof value === "string" && value.length > 0 ? value : null;

  return {
    id: Number(row.id ?? 0),
    productId: Number(row.productId ?? 0),

    shortName:
      typeof row.shortName === "string"
        ? row.shortName
        : "",

    fullName:
      typeof row.fullName === "string"
        ? row.fullName
        : "",

    barcode:
      typeof row.barcode === "string"
        ? row.barcode
        : "",

    productGroup: nullableString(row.productGroup),
    productType: nullableString(row.productType),
    productCategory: nullableString(row.productCategory),
    productBrand: nullableString(row.productBrand),
    productSize: nullableString(row.productSize),
    productStyle: nullableString(row.productStyle),
    productColor: nullableString(row.productColor),
    productSeason: nullableString(row.productSeason),

    quantity: Number(row.quantity ?? 0),
    salesPrice: Number(row.salesPrice ?? 0),
  };
};

/* ------------------------------------------------------------------ */
/* Get Current Stock                                                   */
/* ------------------------------------------------------------------ */

/**
 * GET /api/CurrentStocks
 *
 * Retrieves the current stock of products.
 */
export const getCurrentStocks = async (): Promise<CurrentStockResponse> => {
  const response = await api.get<RawResponse>("CurrentStocks");

  const body = response.data;

  let rows: Record<string, unknown>[] = [];

  const success = body?.success ?? true;
  const message = body?.message ?? "";

  const raw = body?.data;

  if (Array.isArray(raw)) {
    rows = raw;
  } else if (
    raw &&
    typeof raw === "object" &&
    Array.isArray(raw.items)
  ) {
    rows = raw.items;
  }

  const mapped = rows.map(mapCurrentStock);

  return {
    success,
    message,
    data: mapped,
  };
};
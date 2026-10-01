import api from "./axios";

/* ------------------------------------------------------------------ */
/* GET /api/CurrentStocks/by-barcode/{barcode}                          */
/* ------------------------------------------------------------------ */

/**
 * Full response envelope:
 * { success, message, data: CurrentStock | null, pagination }
 */
interface RawCurrentStockResponse {
  success: boolean;
  message: string;
  data: Record<string, unknown> | null;
  pagination: unknown | null;
}

export interface CurrentStockResponse {
  success: boolean;
  message: string;
  data: CurrentStock | null;
}

/**
 * Map one raw stock row to the CurrentStock read model.
 * Tolerant of casing/field-name drift (productId / ProductId / id, …).
 */
const mapCurrentStock = (row: Record<string, unknown>): CurrentStock => ({
  productId: Number(
    row.productId ?? row.ProductId ?? row.productID ?? row.id ?? 0
  ),
  barcode: String(row.barcode ?? row.Barcode ?? ""),
  shortName: String(row.shortName ?? row.ShortName ?? ""),
  fullName: String(row.fullName ?? row.FullName ?? ""),
  quantity: Number(row.quantity ?? row.Quantity ?? row.qty ?? 0),
});

export interface CurrentStock {
  productId: number;
  barcode: string;
  shortName: string;
  fullName: string;
  quantity: number;
}

/**
 * Look up the current stock of a product by its barcode.
 * Returns the raw envelope — callers must check `success` and `data`
 * before using the stock row. HTTP-level failures (404, network, …)
 * still throw axios errors for the caller's catch block.
 */
export const getCurrentStockByBarcode = async (
  barcode: string
): Promise<CurrentStockResponse> => {
  const response = await api.get<RawCurrentStockResponse>(
    `CurrentStocks/by-barcode/${encodeURIComponent(barcode)}`
  );
  return {
    success: response.data?.success ?? false,
    message: response.data?.message ?? "",
    data: response.data?.data ? mapCurrentStock(response.data.data) : null,
  };
};

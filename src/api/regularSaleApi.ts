import api from "./axios";

/* ------------------------------------------------------------------ */
/* Shared response shape                                               */
/* ------------------------------------------------------------------ */

export interface TempSalesItemDto {
  productId: number;
  barcode: string;
  qty: number;
  customerContact: string;
  createdBy: number;
  createdAt: string;
  shortName: string;
  fullName: string;
  salesPrice: number;
  vatPercent: number;
}
export interface TempSalesInfoGetResponse {
  success: boolean;
  message: string;
  data?: TempSalesItemDto[];
}

/*
 * The temp-sales endpoint has been seen returning several shapes:
 *   - TempSalesItemDto[]                                  (bare array)
 *   - { success, message, data: TempSalesItemDto[] }
 *   - { success, message, data: { items: TempSalesItemDto[] } }  (paged)
 * Normalize to always expose a flat TempSalesItemDto[] in data.
 */
interface RawTempSalesResponse {
  success?: boolean;
  message?: string;
  data?: TempSalesItemDto[] | { items?: TempSalesItemDto[] } | null;
}

/** Map one raw row to TempSalesItemDto (tolerant of field drift). */
const mapTempSalesItem = (
  row: Record<string, unknown>
): TempSalesItemDto => ({
  productId: Number(row.productId ?? row.id ?? 0),
  barcode: String(row.barcode ?? ""),
  qty: Number(row.qty ?? row.quantity ?? 0),
  customerContact: String(row.customerContact ?? ""),
  createdBy: Number(row.createdBy ?? 0),
  createdAt: String(row.createdAt ?? ""),
  shortName: String(row.shortName ?? ""),
  fullName: String(row.fullName ?? row.productName ?? ""),
  salesPrice: Number(row.salesPrice ?? row.unitPrice ?? 0),
  vatPercent: Number(row.vatPercent ?? row.vat ?? 0),
});

/** Normalize the temp-sales endpoint shapes (bare array / wrapper / paged). */
const normalizeTempSales = (body: unknown): TempSalesInfoGetResponse => {
  let rows: unknown[] = [];
  let success = true;
  let message = "";

  if (Array.isArray(body)) {
    rows = body;
  } else if (body && typeof body === "object") {
    const wrapper = body as RawTempSalesResponse;
    success = wrapper.success ?? true;
    message = wrapper.message ?? "";

    const raw = wrapper.data;
    if (Array.isArray(raw)) {
      rows = raw;
    } else if (raw && typeof raw === "object" && Array.isArray(raw.items)) {
      rows = raw.items;
    }
  }

  return {
    success,
    message,
    data: rows.map((row) => mapTempSalesItem(row as Record<string, unknown>)),
  };
};

/** GET temp sales info on page load for a specific branch and counter. */
export const getTempSalesInfo = async (
  branchId: number,
  counterId: number
): Promise<TempSalesInfoGetResponse> => {
  const response = await api.get<unknown>(
    `RegularSales/temp-sales-info/${branchId}/${counterId}`
  );

  console.log("getTempSalesInfo response:", response.data);

  return normalizeTempSales(response.data);
};
export interface RegularSaleResponse {
  success: boolean;
  message: string;
  data?: unknown;
  pagination?: unknown;
}

/* ------------------------------------------------------------------ */
/* POST /api/RegularSales/temp-sales-info                              */
/*                                                                     */
/* Fired every time a product is added to the sale table, so the       */
/* backend can keep a server-side (temp) copy of the running sale.     */
/* ------------------------------------------------------------------ */

export interface TempSalesInfoDto {
  branchId: number;
  counterId: number;
  /** Login username of the cashier running the sale. */
  userName: string;
  productId: number;
  barcode: string;
  qty: number;
  customerContact: string;
}

/** POST /api/RegularSales/temp-sales-info — sync one added line. */
export const postTempSalesInfo = async (
  dto: TempSalesInfoDto
): Promise<RegularSaleResponse> => {
  const response = await api.post<RegularSaleResponse>(
    "RegularSales/temp-sales-info",
    dto
  );
  return response.data;
};

/* ------------------------------------------------------------------ */
/* POST /api/RegularSales — final save                                 */
/* ------------------------------------------------------------------ */

export interface RegularSaleMasterDto {
  invoiceType: string;
  branchId: number;
  counterId: number;
  /** Login username of the cashier running the sale. */
  userName: string;
  customerContact: string;
  /** ISO date-time */
  invoiceDate: string;
  totalQty: number;
  totalProdPrice: number;
  discountId: number;
  discountPercent: number;
  discountAmt: number;
  adjustmentAmt: number;
  priceAftrDiscount: number;
  vatBfrDiscount: number;
  vatAftrDiscount: number;
  returnAmt: number;
  totalPayableAmt: number;
  totalPaid: number;
  changeAmt: number;
  changeType: string;
  changeRefNo: string;
}

export interface RegularSaleDetailDto {
  productId: number;
  barcode: string;
  qty: number;
  unitPrice: number;
  totalPrice: number;
  discountPercent: number;
  discountAmt: number;
  unitPriceAftrDiscount: number;
  totalPriceAftrDiscount: number;
  unitVAT: number;
  unitVATAftrDiscount: number;
  vatPercent: number;
  vatCategoryId: number;
  isIncludingVAT: boolean;
}

export interface RegularSalePaymentDto {
  channelId: number;
  channelOptionId: number;
  paidAmt: number;
  refNo: string;
}

export interface RegularSalePayload {
  master: RegularSaleMasterDto;
  details: RegularSaleDetailDto[];
  payments: RegularSalePaymentDto[];
}

/** POST /api/RegularSales — save the completed sale. */
export const createRegularSale = async (
  payload: RegularSalePayload
): Promise<RegularSaleResponse> => {
  console.log("Creating regular sale with payload:", payload);
  const response = await api.post<RegularSaleResponse>(
    "RegularSales",
    payload
  );
  return response.data;
};

export interface PausedSaleMasterDto {
  invoiceType: string;
  branchId: number;
  counterId: number;
  CustomerContact: string;
}
export interface PausedSaleDetailDto {
  productId: number;
  barcode: string;
  qty: number;
  
}
export interface PausedSalePayload {
  master: PausedSaleMasterDto;
  details: PausedSaleDetailDto[];
}

/** POST /api/RegularSales/pause-sale — save the paused sale. */
export const createPausedSale = async (
  payload: PausedSalePayload
): Promise<RegularSaleResponse> => {
  console.log("Creating paused sale with payload:", payload);
  const response = await api.post<RegularSaleResponse>(
    "RegularSales/paused-invoice",
    payload
  );
  return response.data;
};

/* ------------------------------------------------------------------ */
/* GET /api/RegularSales/paused-invoice — list paused invoices         */
/*                                                                     */
/* Powers the Resume modal. Each row carries the invoice number, the   */
/* time it was paused and the customer contact so a cashier can pick   */
/* the right invoice to load back into the till.                       */
/* ------------------------------------------------------------------ */

export interface PausedInvoiceListItemDto {
  invoiceNo: string;
  /** ISO date-time the invoice was paused. */
  createdAt: string;
  customerContact: string;
}

export interface PausedInvoicePaginationDto {
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface PausedInvoiceListResponse {
  success: boolean;
  message: string;
  data: PausedInvoiceListItemDto[];
  pagination?: PausedInvoicePaginationDto;
}

/* Map one raw list row to PausedInvoiceListItemDto (tolerant of drift). */
const mapPausedInvoiceListItem = (
  row: Record<string, unknown>
): PausedInvoiceListItemDto => ({
  invoiceNo: String(
    row.invoiceNo ?? row.invoiceNumber ?? row.invoiceId ?? ""
  ),
  createdAt: String(row.createdAt ?? row.createdDate ?? row.invoiceDate ?? ""),
  customerContact: String(
    row.customerContact ?? row.customerPhone ?? row.mobileNumber ?? ""
  ),
});

/* Normalize bare-array / wrapper / paged shapes into one response. */
const normalizePausedInvoiceList = (
  body: unknown
): PausedInvoiceListResponse => {
  let rows: unknown[] = [];
  let success = true;
  let message = "";
  let pagination: PausedInvoicePaginationDto | undefined;

  if (Array.isArray(body)) {
    rows = body;
  } else if (body && typeof body === "object") {
    const wrapper = body as {
      success?: boolean;
      message?: string;
      data?: unknown;
      pagination?: unknown;
    };
    success = wrapper.success ?? true;
    message = wrapper.message ?? "";

    const raw = wrapper.data;
    if (Array.isArray(raw)) {
      rows = raw;
    } else if (
      raw &&
      typeof raw === "object" &&
      Array.isArray((raw as { items?: unknown[] }).items)
    ) {
      rows = (raw as { items: unknown[] }).items;
    }

    if (wrapper.pagination && typeof wrapper.pagination === "object") {
      const p = wrapper.pagination as Record<string, unknown>;
      pagination = {
        totalCount: Number(p.totalCount ?? rows.length),
        pageNumber: Number(p.pageNumber ?? 1),
        pageSize: Number(p.pageSize ?? rows.length),
        totalPages: Number(p.totalPages ?? 1),
        hasNextPage: Boolean(p.hasNextPage ?? false),
        hasPreviousPage: Boolean(p.hasPreviousPage ?? false),
      };
    }
  }

  return {
    success,
    message,
    data: rows.map((row) =>
      mapPausedInvoiceListItem(row as Record<string, unknown>)
    ),
    pagination,
  };
};

/** GET /api/RegularSales/paused-invoice — list every paused invoice. */
export const getPausedInvoices = async (): Promise<PausedInvoiceListResponse> => {
  const response = await api.get<unknown>("RegularSales/paused-invoice");
  return normalizePausedInvoiceList(response.data);
};

/* ------------------------------------------------------------------ */
/* GET /api/RegularSales/paused-invoice/{invoiceNo} — load one         */
/*                                                                     */
/* Returns the saved lines of a paused invoice so the Resume modal can  */
/* drop them straight back into the sale table.                        */
/* ------------------------------------------------------------------ */

export interface PausedInvoiceDetailDto {
  detailId: number;
  invoiceId: number;
  productId: number;
  barcode: string;
  qty: number;
  shortName: string;
  fullName: string;
  salesPrice: number;
  vatPercent: number;
}

export interface PausedInvoiceDetailResponse {
  success: boolean;
  message: string;
  data: PausedInvoiceDetailDto[];
  pagination?: PausedInvoicePaginationDto;
}

/* Map one raw detail line to PausedInvoiceDetailDto. */
const mapPausedInvoiceDetail = (
  row: Record<string, unknown>
): PausedInvoiceDetailDto => ({
  detailId: Number(row.detailId ?? 0),
  invoiceId: Number(row.invoiceId ?? 0),
  productId: Number(row.productId ?? row.id ?? 0),
  barcode: String(row.barcode ?? ""),
  qty: Number(row.qty ?? row.quantity ?? 0),
  shortName: String(row.shortName ?? ""),
  fullName: String(row.fullName ?? row.productName ?? ""),
  salesPrice: Number(row.salesPrice ?? row.unitPrice ?? 0),
  vatPercent: Number(row.vatPercent ?? row.vat ?? 0),
});

/* Normalize bare-array / wrapper shapes into one response. */
const normalizePausedInvoiceDetails = (
  body: unknown
): PausedInvoiceDetailResponse => {
  let rows: unknown[] = [];
  let success = true;
  let message = "";

  if (Array.isArray(body)) {
    rows = body;
  } else if (body && typeof body === "object") {
    const wrapper = body as { success?: boolean; message?: string; data?: unknown };
    success = wrapper.success ?? true;
    message = wrapper.message ?? "";

    const raw = wrapper.data;
    if (Array.isArray(raw)) {
      rows = raw;
    } else if (raw && typeof raw === "object") {
      const items = (raw as { items?: unknown[] }).items;
      if (Array.isArray(items)) {
        rows = items;
      }
    }
  }

  return {
    success,
    message,
    data: rows.map((row) =>
      mapPausedInvoiceDetail(row as Record<string, unknown>)
    ),
  };
};

/** GET /api/RegularSales/paused-invoice/{invoiceNo} — load a paused sale. */
export const getPausedInvoiceDetails = async (
  invoiceNo: string
): Promise<PausedInvoiceDetailResponse> => {
  const response = await api.get<unknown>(
    `RegularSales/paused-invoice/${encodeURIComponent(invoiceNo)}`
  );
  return normalizePausedInvoiceDetails(response.data);
};
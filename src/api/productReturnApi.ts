
export interface InvoiceLine {
  barcode: string;
  productName: string;
  soldQty: number;
  unitPrice: number;
  discount: number;
  vat: number; // percent per product, matches products.json convention
}

/** Invoice header + lines, as returned by the find endpoint. */
export interface Invoice {
  invoiceNumber: string;
  invoiceDate: string; // ISO date
  customerContact: string;
  lines: InvoiceLine[];
}

/** Row of the return items table. */
export interface ReturnItem {
  barcode: string;
  invoiceNumber: string;
  productName: string;
  qty: number;
  unitPrice: number;
  discount: number;
  totalPrice: number;
  netPrice: number;
  vat: number; // percent — needed for VAT calculation
  maxQty: number; // sold qty minus already-added return qty
}

export interface SaveReturnPayload {
  customerContact: string;
  items: {
    invoiceNumber: string;
    barcode: string;
    productName: string;
    qty: number;
    unitPrice: number;
    discount: number;
    totalPrice: number;
    netPrice: number;
    vat: number;
  }[];
  totalPrice: number;
  discount: number;
  priceAfterDiscount: number;
  vatAmount: number;
  priceIncludingVat: number;
}

export interface SaveReturnResponse {
  success: boolean;
  message: string;
}

/* ------------------------------------------------------------------ */
/* Dummy data                                                           */
/* ------------------------------------------------------------------ */

const DUMMY_INVOICES: Invoice[] = [
  {
    invoiceNumber: "INV-001",
    invoiceDate: "2026-09-24",
    customerContact: "01712345678",
    lines: [
      {
        barcode: "0030111899",
        productName: "BOYS EX.TROUSER ARTISAN 10-12Y",
        soldQty: 3,
        unitPrice: 795,
        discount: 45,
        vat: 7.5,
      },
      {
        barcode: "0010084786",
        productName: "MEN'S EX.SHIRT ARTISAN 17.5 F/S",
        soldQty: 2,
        unitPrice: 1500,
        discount: 0,
        vat: 7.5,
      },
    ],
  },
  {
    invoiceNumber: "INV-002",
    invoiceDate: "2026-09-22",
    customerContact: "01712345678",
    lines: [
      {
        barcode: "0030111897",
        productName: "BOYS EX.TROUSER ARTISAN 10-12 Y EX.TR",
        soldQty: 5,
        unitPrice: 795,
        discount: 50,
        vat: 7.5,
      },
    ],
  },
];

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/* ------------------------------------------------------------------ */
/* API calls (dummy-backed)                                             */
/* ------------------------------------------------------------------ */

/**
 * Find invoices by customer contact + barcode.
 * Dummy implementation filters the local fixtures; the barcode must
 * exist in the invoice's sales details, per the page spec.
 */
export const findInvoicesByContactAndBarcode = async (
  customerContact: string,
  barcode: string
): Promise<{ success: boolean; message: string; data: Invoice[] }> => {
  await delay(500); // simulate network latency for realistic UX

  const contact = customerContact.trim();
  const code = barcode.trim();

  const matches = DUMMY_INVOICES.filter(
    (inv) =>
      inv.customerContact === contact &&
      inv.lines.some((l) => l.barcode === code)
  );

  return {
    success: true,
    message: "",
    data: matches,
  };
};

/**
 * Save a product return request.
 * Dummy implementation validates and echoes success; replace the body
 * with `api.post("ProductReturns", payload)` when the backend is ready.
 */
export const saveReturnRequest = async (
  payload: SaveReturnPayload
): Promise<SaveReturnResponse> => {
  await delay(700); // simulate network latency

  // Simulated backend validation
  if (!payload.customerContact.trim()) {
    return { success: false, message: "Customer contact is required." };
  }
  if (!payload.items.length) {
    return { success: false, message: "At least one return item is required." };
  }

  // eslint-disable-next-line no-console
  console.log("POST ProductReturns payload:", payload);

  return {
    success: true,
    message: `Return request for ${payload.items.length} item(s) saved successfully.`,
  };
};

/*
 * Real-backend versions (enable when endpoints exist):
 *
 * export const findInvoicesByContactAndBarcode = async (
 *   customerContact: string,
 *   barcode: string
 * ) => {
 *   const response = await api.get<{ success: boolean; message: string; data: Invoice[] }>(
 *     "ProductReturns/find-invoices",
 *     { params: { customerContact, barcode } }
 *   );
 *   return response.data;
 * };
 *
 * export const saveReturnRequest = async (payload: SaveReturnPayload) => {
 *   const response = await api.post<SaveReturnResponse>("ProductReturns", payload);
 *   return response.data;
 * };
 */

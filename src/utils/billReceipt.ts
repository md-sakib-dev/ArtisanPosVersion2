// ======================================================
// BILL RECEIPT — shared types & helpers
// ======================================================

/** One printed bill line — product name + barcode + money columns. */
export interface BillItem {
  name: string;
  barcode: string;
  vatPercent: number;
  qty: number;
  unitPrice: number;
  total: number;
}

/** Header + financial summary of a completed sale. */
export interface BillSaleData {
  invoiceNo: string;
  /** Pre-formatted date & time, e.g. "13Oct26 04:48:41 PM". */
  date: string;
  invoiceBy: string;
  totalQty: number;
  totalProductPrice: number;
  discountPercent: number;
  discountAmount: number;
  adjustmentAmount: number;
  subTotal: number;
  exchangedProductAmount: number;
  vatAmount: number;
  totalPayable: number;
  cashAmount: number;
  cardAmount: number;
  mfsAmount: number;
  slipAmount: number;
  voucherAmount: number;
  totalReceived: number;
  changeAmount: number;
  /** e.g. "Cash", "Card + MFS". */
  paymentMode: string;
}

/** Static store header printed on every bill. */
export interface BillStoreInfo {
  name?: string;
  logoUrl?: string;
  address: string;
  phone: string;
  vatRegistration: string;
}

export const DEFAULT_STORE_INFO: BillStoreInfo = {
  name: "Artisan",
  address: "Plot-1, Uttara Tower, Jasimuddin Avenue, Sector 3, Uttara, Dhaka",
  phone: "01706371677",
  vatRegistration: "004280798-0101 Mushak Challan 6:3",
};

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

/** "13Oct26 04:48:41 PM" */
export const formatReceiptDate = (date: Date): string => {
  const day = String(date.getDate()).padStart(2, "0");
  const month = MONTHS[date.getMonth()];
  const year = String(date.getFullYear()).slice(-2);

  let hours = date.getHours();
  const meridiem = hours >= 12 ? "PM" : "AM";
  hours = hours % 12 || 12;

  const time = [
    String(hours).padStart(2, "0"),
    String(date.getMinutes()).padStart(2, "0"),
    String(date.getSeconds()).padStart(2, "0"),
  ].join(":");

  return `${day}${month}${year} ${time} ${meridiem}`;
};

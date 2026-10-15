import { useEffect } from "react";
import { createPortal } from "react-dom";
import type { BillItem, BillSaleData, BillStoreInfo } from "../utils/billReceipt";

// ======================================================
// TYPES
// ======================================================

interface BillReceiptProps {
  saleData: BillSaleData;
  items: BillItem[];
  cashierName: string;
  storeInfo: BillStoreInfo;
  /** Fire window.print() once the sheet is mounted. */
  autoPrint?: boolean;
  /** Called after the print dialog closes so the caller can unmount. */
  onClose?: () => void;
}

// ======================================================
// POLICY
// ======================================================

const POLICY_NOTES = [
  "Items may be exchanged subject to Artisan policies within 10 days.",
  "An item may be exchanged only once.",
  "A product price tag and billing invoice may be required to exchange.",
  "The product should be in fresh condition.",
  "Jewellery, beauty items, leather items, blazers, undergarments & accessories items cannot be exchanged or refunded.",
  "10% VAT on Artisan & Arvessa products.",
  "7.5% VAT on all other items.",
];

// ======================================================
// HELPERS
// ======================================================

const money = (value: number): string => (Number(value) || 0).toFixed(2);

// ======================================================
// PRINT RULES
// ======================================================

/*
 * The bill is rendered off-screen: it is display:none on screen (no extra
 * preview modal) and only becomes visible to the printer inside @media print.
 */
const PRINT_STYLES = `
#bill-print-root {
  display: none;
}

@media print {
  body {
    background: #ffffff !important;
  }

  /* Hide every element outside the bill (buttons, nav, other modals). */
  body * {
    visibility: hidden;
  }

  #bill-print-root,
  #bill-print-root * {
    visibility: visible;
  }

  #bill-print-root {
    display: block !important;
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    margin: 0;
    padding: 0;
    font-size: 11px;
    line-height: 1.35;
  }

  .no-print {
    display: none !important;
  }

  #bill-print-root .bill-sheet {
    width: 100% !important;
    max-width: none !important;
    margin: 0 !important;
    padding: 0 !important;
    border: none !important;
    border-radius: 0 !important;
    box-shadow: none !important;
  }

  #bill-print-root .bill-hr {
    border-color: #000 !important;
  }

  @page {
    margin: 5mm;
  }
}
`;

// ======================================================
// SUMMARY ROW
// ======================================================

function SummaryRow({
  label,
  value,
  strong = false,
}: {
  label: string;
  value: number;
  strong?: boolean;
}) {
  return (
    <div
      className={`flex items-baseline justify-between gap-2 ${
        strong ? "font-bold" : "font-normal"
      }`}
    >
      <span>{label}</span>
      <span className="tabular-nums">{money(value)}</span>
    </div>
  );
}

// ======================================================
// BILL RECEIPT
// ======================================================

export default function BillReceipt({
  saleData,
  items,
  cashierName,
  storeInfo,
  autoPrint = false,
  onClose,
}: BillReceiptProps) {
  /* Auto-print once the sheet has painted. */
  useEffect(() => {
    if (!autoPrint) return;

    const timeoutId = window.setTimeout(() => window.print(), 400);
    return () => window.clearTimeout(timeoutId);
  }, [autoPrint]);

  /* Unmount once the print dialog closes (the sheet is invisible anyway). */
  useEffect(() => {
    const handleAfterPrint = () => onClose?.();

    window.addEventListener("afterprint", handleAfterPrint);

    /* Safety net for browsers/environments that never fire afterprint. */
    const fallbackId = window.setTimeout(() => onClose?.(), 15000);

    return () => {
      window.removeEventListener("afterprint", handleAfterPrint);
      window.clearTimeout(fallbackId);
    };
  }, [onClose]);

  /* Use the invoice number as the print job / PDF file name. */
  useEffect(() => {
    if (!saleData.invoiceNo) return;

    const previousTitle = document.title;
    document.title = `Invoice ${saleData.invoiceNo}`;

    return () => {
      document.title = previousTitle;
    };
  }, [saleData.invoiceNo]);

  const invoiceBy = cashierName || saleData.invoiceBy || "";

  const sheet = (
    <div id="bill-print-root">
      <div className="bill-sheet bg-white px-3 py-4 text-[12px] leading-snug text-black">
        {/* ============================================= */}
        {/* 1. HEADER                                      */}
        {/* ============================================= */}

        <header className="text-center">
          <div className="flex justify-center">
            {storeInfo.logoUrl ? (
              <img
                src={storeInfo.logoUrl}
                alt={storeInfo.name ?? "Store logo"}
                className="h-10 w-auto object-contain"
              />
            ) : (
              <div className="flex h-10 items-center justify-center rounded-md border border-black px-3 text-base font-bold uppercase tracking-wide">
                {storeInfo.name ?? "Artisan"}
              </div>
            )}
          </div>

          <p className="mt-2 text-[11px] leading-snug">{storeInfo.address}</p>
          <p className="text-[11px]">Tel: {storeInfo.phone}</p>
        </header>

        <div className="bill-hr my-2 border-t border-black" />

        {/* Metadata block */}
        <section className="border border-black px-2 py-1.5 text-[11px]">
          <p>VAT Registration No: {storeInfo.vatRegistration}</p>
          <p>Invoice No: {saleData.invoiceNo}</p>
          <p>Date: {saleData.date}</p>
          <p>Invoice By: {invoiceBy}</p>
        </section>

        {/* ============================================= */}
        {/* 2. BILL HEADER & TABLE                         */}
        {/* ============================================= */}

        <h2 className="mt-2 text-center text-sm font-bold tracking-wide">
          BILL
        </h2>

        <div className="bill-hr mt-1 border-t border-black" />

        <table className="w-full border-collapse text-[11px]">
          <thead>
            <tr className="border-b border-black text-left">
              <th className="py-1 pr-1 font-semibold">Product Details</th>
              <th className="px-1 py-1 text-right font-semibold">VAT(%)</th>
              <th className="px-1 py-1 text-right font-semibold">Qty</th>
              <th className="px-1 py-1 text-right font-semibold">Rate</th>
              <th className="py-1 pl-1 text-right font-semibold">Total</th>
            </tr>
          </thead>

          <tbody>
            {items.map((item, index) => (
              <tr
                key={`${item.barcode}-${index}`}
                className="border-b border-dashed border-black/50"
              >
                <td className="py-1 pr-1 align-top">
                  <span className="block font-medium">{item.name}</span>
                  <span className="block text-[10px] text-black/70">
                    {item.barcode}
                  </span>
                </td>
                <td className="px-1 py-1 text-right align-top tabular-nums">
                  {money(item.vatPercent)}
                </td>
                <td className="px-1 py-1 text-right align-top tabular-nums">
                  {item.qty}
                </td>
                <td className="px-1 py-1 text-right align-top tabular-nums">
                  {money(item.unitPrice)}
                </td>
                <td className="py-1 pl-1 text-right align-top tabular-nums">
                  {money(item.total)}
                </td>
              </tr>
            ))}
          </tbody>

          <tfoot>
            <tr className="border-t border-black font-semibold">
              <td className="py-1">Total Quantity:</td>
              <td className="py-1" />
              <td className="px-1 py-1 text-right tabular-nums">
                {items.reduce((sum, item) => sum + item.qty, 0) ||
                  saleData.totalQty}
              </td>
              <td className="py-1" />
              <td className="py-1" />
            </tr>
          </tfoot>
        </table>

        {/* ============================================= */}
        {/* 3. PAYMENT & CALCULATION SUMMARY               */}
        {/* ============================================= */}

        <div className="bill-hr my-2 border-t border-black" />

        <section className="ml-auto w-full max-w-[240px] text-[11px]">
          <SummaryRow
            label="Total Product Price:"
            value={saleData.totalProductPrice}
          />
          <SummaryRow
            label="Discount Percent:"
            value={saleData.discountPercent}
          />
          <SummaryRow
            label="Discount Amount:"
            value={saleData.discountAmount}
          />
          <SummaryRow label="Adjustment:" value={saleData.adjustmentAmount} />
          <SummaryRow label="Sub Total:" value={saleData.subTotal} />
          <SummaryRow
            label="Exchanged Product Amount:"
            value={saleData.exchangedProductAmount}
          />
          <SummaryRow label="VAT:" value={saleData.vatAmount} />

          <div className="bill-hr my-1 border-t border-black" />
          <SummaryRow
            label="Total Payable:"
            value={saleData.totalPayable}
            strong
          />
          <div className="bill-hr mb-1 border-t border-black" />

          <SummaryRow label="Cash Amount:" value={saleData.cashAmount} />
          <SummaryRow label="Card Amount:" value={saleData.cardAmount} />
          <SummaryRow
            label="Mobile Payment Amount:"
            value={saleData.mfsAmount}
          />
          <SummaryRow label="Credit Slip Amount:" value={saleData.slipAmount} />
          <SummaryRow label="Voucher Amount:" value={saleData.voucherAmount} />

          <div className="bill-hr my-1 border-t border-black" />

          <SummaryRow
            label="Total Received:"
            value={saleData.totalReceived}
            strong
          />
          <SummaryRow label="Change:" value={saleData.changeAmount} strong />

          <div className="flex items-baseline justify-between gap-2">
            <span>Payment Mode:</span>
            <span className="font-semibold">{saleData.paymentMode}</span>
          </div>
        </section>

        {/* ============================================= */}
        {/* 4. POLICY, FOOTER & BRANDING                   */}
        {/* ============================================= */}

        <div className="bill-hr my-2 border-t border-black" />

        <p className="text-center text-[11px] font-bold">
          Any discounted items cannot be refunded
        </p>

        <ul className="mt-1 space-y-0.5 text-[10px] leading-snug">
          {POLICY_NOTES.map((note) => (
            <li key={note} className="flex gap-1">
              <span>&bull;</span>
              <span>{note}</span>
            </li>
          ))}
        </ul>

        <div className="bill-hr my-2 border-t border-black" />

        <p className="text-center text-sm font-bold">Thank You for Shopping</p>

        <p className="mt-1 text-center text-[9px] text-black/80">
          Software by White Services Technology. www.white.services
        </p>
      </div>

      <style>{PRINT_STYLES}</style>
    </div>
  );

  return createPortal(sheet, document.body);
}

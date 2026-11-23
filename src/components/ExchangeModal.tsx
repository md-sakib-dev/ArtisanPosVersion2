import { useEffect, useRef, useState } from "react";
import {
  AlertTriangle,
  ArrowLeftRight,
  Loader2,
  ShoppingCart,
  X,
} from "lucide-react";
import {
  getApprovedProductReturns,
  getProductReturnDetails,
  type ApprovedProductReturn,
  type ProductReturnDetail,
} from "../api/productReturnApi";

// ======================================================
// TYPES
// ======================================================

/** One loaded return line, with the amounts the table and totals use. */
interface ExchangeLine {
  id: number;
  barcode: string;
  invoiceNo: string;
  qty: number;
  unitPrice: number;
  discountPercent: number;
  totalPrice: number;
  totalPriceAfterDiscount: number;
  /** Per unit VAT after the line discount. */
  unitVatAfterDiscount: number;
  vatPercent: number;
}

interface ExchangeModalProps {
  open: boolean;
  onClose: () => void;
  /**
   * Fired when Exchange is pressed with the amount to credit (product price
   * after discount) and the VAT of the returned goods, which comes off the
   * sale's VAT.
   */
  onExchange: (returnAmount: number, vatAmount: number) => void;
  /** Fired when the loaded return is cancelled, to drop its credit. */
  onCancelExchange: () => void;
  /** Bumped when the till is cleared — drops the loaded return selection. */
  resetSignal: number;
}

// ======================================================
// HELPERS
// ======================================================

const r2 = (value: number): number =>
  Math.round((Number(value) || 0) * 100) / 100;

const money = (value: number): string => r2(value).toFixed(2);

const clampPercent = (value: number): number =>
  Math.min(Math.max(Number(value) || 0, 0), 100);

/* Detail DTO → table line. Prices after discount are recomputed from the
   line's own price/discount whenever the backend leaves them at zero. */
const toExchangeLine = (
  detail: ProductReturnDetail,
  index: number,
): ExchangeLine => {
  const qty = Number(detail.qty) || 0;
  const unitPrice = Number(detail.unitPrice) || 0;
  const discountPercent = clampPercent(detail.discountPercent);
  const vatPercent = Number(detail.vatPercent) || 0;

  const totalPrice = r2(Number(detail.totalPrice) || qty * unitPrice);

  const unitPriceAfterDiscount =
    Number(detail.unitPriceAfterDiscount) > 0
      ? Number(detail.unitPriceAfterDiscount)
      : r2(unitPrice * (1 - discountPercent / 100));

  const totalPriceAfterDiscount =
    Number(detail.totalPriceAfterDiscount) > 0
      ? Number(detail.totalPriceAfterDiscount)
      : r2(qty * unitPriceAfterDiscount);

  const unitVatAfterDiscount =
    Number(detail.unitVATAfterDiscount) > 0
      ? Number(detail.unitVATAfterDiscount)
      : r2((unitPriceAfterDiscount * vatPercent) / 100);

  return {
    id: Number(detail.detailId) || index + 1,
    barcode: detail.barcode ?? "",
    invoiceNo: detail.invoiceNo ?? "",
    qty,
    unitPrice,
    discountPercent,
    totalPrice,
    totalPriceAfterDiscount,
    unitVatAfterDiscount,
    vatPercent,
  };
};

/* Line discount amount = before-discount total − after-discount total. */
const lineDiscount = (line: ExchangeLine): number =>
  r2(line.totalPrice - line.totalPriceAfterDiscount);

/* Line VAT = qty × unit VAT after discount. */
const lineVat = (line: ExchangeLine): number =>
  r2(line.qty * line.unitVatAfterDiscount);

/* Read-only amount field shown beside the Exchange button. */
function SummaryField({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="min-w-[140px] flex-1 basis-40">
      <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-[#8A938B]">
        {label}
      </span>

      <div
        className={`flex h-11 items-center justify-end rounded-lg border px-3 tabular-nums ${
          highlight
            ? "border-[#B7E2C7] bg-[#E8F5ED] text-base font-bold text-[#10673E]"
            : "border-[#E6EAE3] bg-[#FAFBF9] text-sm font-semibold text-[#17231D]"
        }`}
      >
        {value}
      </div>
    </div>
  );
}

// ======================================================
// EXCHANGE MODAL
// ======================================================

export default function ExchangeModal({
  open,
  onClose,
  onExchange,
  onCancelExchange,
  resetSignal,
}: ExchangeModalProps) {
  /* Left pane — approved returns. */
  const [approvedReturns, setApprovedReturns] = useState<
    ApprovedProductReturn[]
  >([]);
  const [isListLoading, setIsListLoading] = useState(true);
  const [listError, setListError] = useState("");

  /* Right pane — the return loaded with the Load button. */
  const [loadedReturn, setLoadedReturn] =
    useState<ApprovedProductReturn | null>(null);
  const [lines, setLines] = useState<ExchangeLine[]>([]);
  const [loadingReturnId, setLoadingReturnId] = useState<number | null>(null);
  const [detailError, setDetailError] = useState("");

  const [error, setError] = useState("");

  // ====================================================
  // APPROVED RETURNS — GET /api/ProductReturns/approved
  // ====================================================

  /* Fetched once, when the sales screen loads — not on every open — so
     reopening the modal keeps the exchange the cashier already selected. */
  useEffect(() => {
    let cancelled = false;

    getApprovedProductReturns()
      .then((rows) => {
        if (cancelled) return;
        setApprovedReturns(rows);
        setListError("");
      })
      .catch((err) => {
        console.error("Approved product returns error:", err);
        if (cancelled) return;
        setApprovedReturns([]);
        setListError("Unable to load approved returns.");
      })
      .finally(() => {
        if (!cancelled) setIsListLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  /* A completed sale consumes the credited return, so the next customer starts
     from a clean Exchange instead of re-crediting the previous one. */
  const previousResetSignal = useRef(resetSignal);

  useEffect(() => {
    if (previousResetSignal.current === resetSignal) return;

    previousResetSignal.current = resetSignal;

    setLoadedReturn(null);
    setLines([]);
    setDetailError("");
    setError("");
  }, [resetSignal]);

  // ====================================================
  // TOTALS — recomputed from the loaded detail lines
  // ====================================================

  const totalProductPrice = r2(
    lines.reduce((sum, line) => sum + line.totalPrice, 0),
  );

  const totalDiscount = r2(
    lines.reduce((sum, line) => sum + lineDiscount(line), 0),
  );

  const vatAmount = r2(lines.reduce((sum, line) => sum + lineVat(line), 0));

  /* What the customer gets credited for the returned goods: the product
     price with the line discounts taken off. The returned goods' VAT is not
     part of the credit — it is deducted from the sale's VAT instead. */
  const returnAmount = r2(totalProductPrice - totalDiscount);

  const totalQty = lines.reduce((sum, line) => sum + line.qty, 0);

  // ====================================================
  // HANDLERS
  // ====================================================

  /* Load button → GET /api/ProductReturns/{returnId}. */
  const handleLoad = async (row: ApprovedProductReturn) => {
    if (loadingReturnId !== null) return;

    setError("");
    setDetailError("");
    setLoadingReturnId(row.returnId);

    try {
      const details = await getProductReturnDetails(row.returnId);

      setLoadedReturn(details.master ?? row);
      setLines((details.details ?? []).map(toExchangeLine));
    } catch (err) {
      console.error("Load return details error:", err);
      setLoadedReturn(null);
      setLines([]);
      setDetailError("Unable to load this return's details.");
    } finally {
      setLoadingReturnId(null);
    }
  };

  const handleExchange = () => {
    if (lines.length === 0) {
      setError("Load a return before exchanging.");
      return;
    }

    onExchange(returnAmount, vatAmount);
    onClose();
  };

  /* Cancel → drop the loaded return (and the credit it put on the sale) so the
     cashier can pick a different one. The modal stays open. */
  const handleCancel = () => {
    setLoadedReturn(null);
    setLines([]);
    setDetailError("");
    setError("");
    onCancelExchange();
  };

  // ====================================================
  // RENDER
  // ====================================================

  if (!open) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-[3px]"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        className="flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-[#DDE5DF] bg-white shadow-2xl"
        style={{ animation: "fade-up 0.3s ease both" }}
      >
        {/* ================================================= */}
        {/* HEADER */}
        {/* ================================================= */}

        <div className="flex shrink-0 items-center justify-between border-b border-[#E6EAE3] bg-gradient-to-r from-[#10673E] to-[#0D5A35] px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20">
              <ArrowLeftRight size={20} className="text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Exchange</h2>
              <p className="mt-0.5 text-xs text-white/70">
                Pick an approved return and load its products
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-white/80 transition-all hover:bg-white/20 hover:text-white"
          >
            <X size={20} />
          </button>
        </div>

        {/* ================================================= */}
        {/* BODY — approved returns | loaded details */}
        {/* ================================================= */}

        <div className="grid min-h-0 flex-1 grid-cols-12 gap-4 bg-[#FAFBF9] p-6">
          {error && (
            <div className="col-span-12 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              <AlertTriangle size={16} />
              {error}
            </div>
          )}

          {/* ---------------- LEFT: loaded details ---------------- */}

          <div className="col-span-8 flex min-h-0 flex-col overflow-hidden rounded-xl border border-[#E6EAE3] bg-white shadow-sm">
            <div className="flex shrink-0 items-center justify-between border-b border-[#E6EAE3] bg-[#F1F8F3] px-4 py-3">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-[#66736B]">
                <ShoppingCart size={14} className="text-[#10673E]" />
                Exchange Items
                {lines.length > 0 && (
                  <span className="rounded-full bg-[#E8F5ED] px-2 py-0.5 text-xs font-semibold text-[#10673E]">
                    {lines.length}
                  </span>
                )}
              </h3>

              <div className="flex items-center gap-3">
                {loadedReturn && (
                  <span className="text-xs font-medium text-[#8A938B]">
                    {loadedReturn.returnRequestNo}
                    {loadedReturn.customerContactNumber
                      ? ` · ${loadedReturn.customerContactNumber}`
                      : ""}
                  </span>
                )}

                {(lines.length > 0 || loadedReturn) && (
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="inline-flex h-7 items-center gap-1 rounded-md border border-[#E5D3D3] bg-white px-3 text-xs font-semibold text-[#B84A4A] transition-all hover:border-[#B84A4A] hover:bg-[#FBEEEE] active:scale-[0.98]"
                  >
                    <X size={13} />
                    Cancel
                  </button>
                )}
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-auto">
              {detailError ? (
                <p className="px-4 py-10 text-center text-sm text-[#B84A4A]">
                  {detailError}
                </p>
              ) : lines.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-[#9AA29C]">
                  <ArrowLeftRight size={30} strokeWidth={1.5} />
                  <p className="mt-3 text-sm font-medium">
                    No products loaded
                  </p>
                  <p className="mt-1 text-xs">
                    Press "Load" on an approved return to list its products
                  </p>
                </div>
              ) : (
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-[#E6EAE3] bg-[#F1F8F3] text-[11px] uppercase tracking-wide text-[#66736B]">
                      <th className="px-3 py-3 font-semibold">Barcode</th>
                      <th className="px-3 py-3 font-semibold">Invoice No</th>
                      <th className="px-3 py-3 text-center font-semibold">
                        Qty
                      </th>
                      <th className="px-3 py-3 text-right font-semibold">
                        Unit Price
                      </th>
                      <th className="px-3 py-3 text-center font-semibold">
                        Disc %
                      </th>
                      <th className="px-3 py-3 text-right font-semibold">
                        Total
                      </th>
                      <th className="px-3 py-3 text-right font-semibold">
                        Net Amount
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-[#ECEFEA]">
                    {lines.map((line) => (
                      <tr
                        key={line.id}
                        className="transition-colors hover:bg-[#F7FBF8]"
                      >
                        <td className="px-3 py-3 font-mono text-xs tracking-wider text-[#66736B]">
                          {line.barcode || "-"}
                        </td>

                        <td className="px-3 py-3 text-xs text-[#66736B]">
                          {line.invoiceNo || "-"}
                        </td>

                        <td className="px-3 py-3 text-center">
                          <span className="inline-flex h-6 min-w-8 items-center justify-center rounded-md bg-[#F1F8F3] px-1.5 text-xs font-semibold text-[#10673E]">
                            {line.qty}
                          </span>
                        </td>

                        <td className="px-3 py-3 text-right tabular-nums text-[#17231D]">
                          {money(line.unitPrice)}
                        </td>

                        <td className="px-3 py-3 text-center tabular-nums text-[#66736B]">
                          {line.discountPercent > 0
                            ? `${line.discountPercent}%`
                            : "-"}
                        </td>

                        <td className="px-3 py-3 text-right tabular-nums text-[#17231D]">
                          {money(line.totalPrice)}
                        </td>

                        <td className="px-3 py-3 text-right font-semibold tabular-nums text-[#10673E]">
                          {money(line.totalPriceAfterDiscount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {lines.length > 0 && (
              <div className="flex shrink-0 items-center justify-end gap-4 border-t border-[#E6EAE3] px-4 py-2 text-xs text-[#8A938B]">
                <span>
                  {totalQty} unit{totalQty === 1 ? "" : "s"}
                </span>
              </div>
            )}
          </div>
          {/* ---------------- RIGHT: approved returns ---------------- */}

          <div className="col-span-4 flex min-h-0 flex-col overflow-hidden rounded-xl border border-[#E6EAE3] bg-white shadow-sm">
            <div className="flex shrink-0 items-center justify-between border-b border-[#E6EAE3] bg-[#F1F8F3] px-4 py-3">
              <h3 className="text-sm font-semibold text-[#66736B]">
                Approved Returns
              </h3>
              {!isListLoading && !listError && (
                <span className="rounded-full bg-[#E8F5ED] px-2 py-0.5 text-xs font-semibold text-[#10673E]">
                  {approvedReturns.length}
                </span>
              )}
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto">
              {isListLoading ? (
                <div className="flex items-center justify-center gap-2 py-10 text-sm text-[#746969]">
                  <Loader2 size={16} className="animate-spin" />
                  Loading returns...
                </div>
              ) : listError ? (
                <p className="px-4 py-10 text-center text-sm text-[#B84A4A]">
                  {listError}
                </p>
              ) : approvedReturns.length === 0 ? (
                <p className="px-4 py-10 text-center text-sm text-[#9AA29C]">
                  No approved returns found
                </p>
              ) : (
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-[#E6EAE3] text-[11px] uppercase tracking-wide text-[#6a8d78]">
                      <th className="px-3 py-2 font-semibold">Return ID</th>
                      <th className="px-3 py-2 font-semibold">Phone</th>
                      {/* <th className="px-3 py-2 text-right font-semibold">
                        Action
                      </th> */}
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-[#ccd1c9]">
                    {approvedReturns.map((row) => {
                      const isLoaded = loadedReturn?.returnId === row.returnId;
                      //const isLoading = loadingReturnId === row.returnId;

                      return (
                        <tr
                          key={row.returnId}
                          className={
                            isLoaded
                              ? "bg-[#bfd6c6]"
                              : "transition-colors hover:bg-[#F7FBF8]"
                          }
                        >
                          <td className="px-3 py-2 font-semibold text-[#17231D]">
                            {row.returnRequestNo}
                          </td>

                          <td className="px-3 py-2 tabular-nums text-[#5a5252] cursor-pointer on" onClick={() => handleLoad(row)}>
                            {row.customerContactNumber || "-"}
                          </td>

                          {/* <td className="px-3 py-2 text-right">
                            <button
                              type="button"
                              onClick={() => handleLoad(row)}
                              disabled={loadingReturnId !== null}
                              className={`inline-flex h-7 items-center justify-center rounded-md px-3 text-xs font-semibold transition-all ${
                                loadingReturnId !== null
                                  ? "cursor-not-allowed bg-[#E8F5ED] text-[#10673E] opacity-60"
                                  : "bg-[#0E9351] text-white hover:bg-[#10673E] active:scale-[0.98]"
                              }`}
                            >
                              {isLoading ? (
                                <Loader2 size={13} className="animate-spin" />
                              ) : (
                                "Load"
                              )}
                            </button>
                          </td> */}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>

        </div>

        {/* ================================================= */}
        {/* FOOTER — totals sit on the same line as Exchange */}
        {/* ================================================= */}

        <div className="flex shrink-0 flex-wrap items-end justify-between gap-4 border-t border-[#E6EAE3] bg-white px-6 py-4">
          <div className="flex flex-1 flex-wrap items-end gap-3">
            <SummaryField
              label="Total Product Price"
              value={money(totalProductPrice)}
            />

            <SummaryField label="Discount" value={money(totalDiscount)} />

            <SummaryField label="Vat Amount" value={money(vatAmount)} />

            <SummaryField
              label="Return Amount"
              value={`৳${money(returnAmount)}`}
              highlight
            />
          </div>

          <button
            type="button"
            onClick={handleExchange}
            disabled={lines.length === 0}
            className={`inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-lg bg-[#0E9351] px-8 text-sm font-semibold text-white shadow-sm transition-all hover:bg-[#10673E] hover:shadow-md active:scale-[0.98] ${
              lines.length === 0 ? "cursor-not-allowed opacity-50" : ""
            }`}
          >
            <ArrowLeftRight size={16} />
            Exchange
          </button>
        </div>
      </div>
    </div>
  );
}

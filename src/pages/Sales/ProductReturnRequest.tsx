import { useState, useRef, useMemo, useEffect, useCallback } from "react";
import {
  Undo2,
  Search,
  BadgePercent,
  Barcode,
  Hash,
  FileText,
  Plus,
  Trash2,
  Save,
  CheckCircle2,
  X,
  AlertCircle,
  Loader2,
  Package,
  Calculator,
} from "lucide-react";
import {
  findInvoicesByContactAndBarcode,
  saveReturnRequest,
  type Invoice,
  type ReturnItem,
  type SaveReturnPayload,
} from "../../api/productReturnApi";

/* ------------------------------------------------------------------ */
/* Toast — same pattern as CustomerEntry                                */
/* ------------------------------------------------------------------ */

function Toast({
  message,
  type,
  onClose,
}: {
  message: string;
  type: "success" | "error";
  onClose: () => void;
}) {
  useEffect(() => {
    const t = setTimeout(onClose, 3000);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div
      className={`fixed top-5 right-5 z-[100] flex items-center gap-3 rounded-xl border px-4 py-3 shadow-lg transition-all duration-300 ${
        type === "success"
          ? "border-[#10673E]/20 bg-white text-[#10673E]"
          : "border-red-200 bg-white text-red-600"
      }`}
      style={{ animation: "fade-up 0.3s ease both" }}
    >
      {type === "success" ? <CheckCircle2 size={18} /> : <X size={18} />}
      <span className="text-sm font-medium">{message}</span>
      <button
        onClick={onClose}
        className="ml-2 text-[#94A3B8] hover:text-[#64748B]"
      >
        <X size={14} />
      </button>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Helpers                                                              */
/* ------------------------------------------------------------------ */

/** ৳1,234.56 — en-IN grouping with 2 decimals, matching app conventions. */
const formatBDT = (n: number) =>
  `৳${n.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const getErrMessage = (err: unknown, fallback: string): string => {
  const anyErr = err as { response?: { data?: { message?: string } } };
  return anyErr?.response?.data?.message || fallback;
};

/** Round to 2 decimals to avoid floating-point drift in totals. */
const r2 = (n: number) => Math.round(n * 100) / 100;

const formatDate = (iso: string) => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

/* ------------------------------------------------------------------ */
/* Invoice Selection Modal — native <dialog>, Customer-page style       */
/* ------------------------------------------------------------------ */

function InvoiceModal({
  open,
  loading,
  invoices,
  barcode,
  onClose,
  onLoad,
}: {
  open: boolean;
  loading: boolean;
  invoices: Invoice[];
  barcode: string;
  onClose: () => void;
  onLoad: (invoice: Invoice) => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dlg = dialogRef.current;
    if (!dlg) return;

    if (open) {
      if (!dlg.open) dlg.showModal();
    } else if (dlg.open) {
      dlg.close();
    }
  }, [open]);

  useEffect(() => {
    const dlg = dialogRef.current;
    if (!dlg) return;

    const handleCancel = (e: Event) => {
      e.preventDefault();
      onClose();
    };

    dlg.addEventListener("cancel", handleCancel);
    return () => dlg.removeEventListener("cancel", handleCancel);
  }, [onClose]);

  return (
    <dialog
      ref={dialogRef}
      className="m-auto w-full max-w-2xl rounded-2xl border border-[#E5E7EB] bg-white p-0 shadow-2xl backdrop:bg-black/40 backdrop:backdrop-blur-[2px]"
    >
      <div className="flex max-h-[70vh] flex-col overflow-hidden rounded-2xl">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-[#E5E7EB] px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#10673E]/10 text-[#10673E]">
              <FileText size={17} />
            </div>
            <div>
              <h2 className="text-[15px] font-bold text-[#1F2937]">
                Select Invoice
              </h2>
              <p className="text-[11.5px] text-[#94A3B8]">
                Invoices containing barcode {barcode || "—"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-[#94A3B8] transition-colors hover:bg-[#F1F5F9] hover:text-[#64748B]"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body — table, no cards */}
        <div className="min-h-0 flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center px-6 py-14 text-[#94A3B8]">
              <Loader2 size={26} className="animate-spin text-[#10673E]" />
              <p className="mt-3 text-[13px] font-medium">
                Searching invoices...
              </p>
            </div>
          ) : invoices.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-6 py-14 text-[#94A3B8]">
              <AlertCircle size={28} className="text-red-400" />
              <p className="mt-2 text-[13px] font-medium">
                No invoice found for this customer and barcode.
              </p>
              <p className="mt-1 text-[12px]">
                Check the contact number and barcode, then try again.
              </p>
            </div>
          ) : (
            <table className="w-full text-left text-[13px]">
              <thead>
                <tr className="border-b border-[#E5E7EB] bg-[#F8FAFC]">
                  <th className="px-6 py-3 font-semibold text-[#6B7280]">
                    Invoice Number
                  </th>
                  <th className="px-6 py-3 font-semibold text-[#6B7280]">
                    Invoice Date
                  </th>
                  <th className="px-6 py-3 text-right font-semibold text-[#6B7280]">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F5F9]">
                {invoices.map((inv) => (
                  <tr
                    key={inv.invoiceNumber}
                    className="transition-colors hover:bg-[#F8FAFC]"
                  >
                    <td className="px-6 py-3 font-semibold text-[#10673E] tabular-nums">
                      {inv.invoiceNumber}
                    </td>
                    <td className="px-6 py-3 text-[#6B7280] tabular-nums">
                      {formatDate(inv.invoiceDate)}
                    </td>
                    <td className="px-6 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => onLoad(inv)}
                        className="rounded-lg bg-[#10673E] px-4 py-1.5 text-[12px] font-semibold text-white shadow-sm transition-all hover:bg-[#0D5A35] active:scale-[0.98]"
                      >
                        Load
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Modal Footer */}
        <div className="border-t border-[#E5E7EB] bg-[#FAFBFC] px-6 py-3">
          <p className="text-[12px] text-[#94A3B8]">
            {loading
              ? "Please wait..."
              : `${invoices.length} invoice(s) found — click Load to start the return`}
          </p>
        </div>
      </div>
    </dialog>
  );
}

/* ------------------------------------------------------------------ */
/* Page                                                                 */
/* ------------------------------------------------------------------ */

export default function ProductReturnRequest() {
  /* Search state */
  const [customerContact, setCustomerContact] = useState("");
  const [barcode, setBarcode] = useState("");
  const [searchError, setSearchError] = useState<string | null>(null);
  const [searching, setSearching] = useState(false);

  /* Invoice modal state */
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [invoiceResults, setInvoiceResults] = useState<Invoice[]>([]);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  /* Selected line + qty for adding */
  const [selectedBarcode, setSelectedBarcode] = useState("");
  const [quantity, setQuantity] = useState("");
  const [discountPercent, setDiscountPercent] = useState("");

  /* Return items */
  const [returnItems, setReturnItems] = useState<ReturnItem[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  const qtyInputRef = useRef<HTMLInputElement>(null);

  /* Line in the selected invoice matching the scanned barcode */
  const selectedLine = useMemo(
    () =>
      selectedInvoice?.lines.find((l) => l.barcode === selectedBarcode) ?? null,
    [selectedInvoice, selectedBarcode]
  );

  const maxReturnable = selectedLine?.soldQty ?? 0;

  /* Find button → search invoices (dummy API) */
  const handleFind = useCallback(async () => {
    if (searching) return;

    if (!customerContact.trim()) {
      setSearchError("Customer contact is required");
      return;
    }
    if (!barcode.trim()) {
      setSearchError("Barcode is required");
      return;
    }
    setSearchError(null);
    setSearching(true);
    setInvoiceResults([]);
    setIsInvoiceModalOpen(true);

    try {
      const res = await findInvoicesByContactAndBarcode(
        customerContact,
        barcode
      );
      setInvoiceResults(res.data ?? []);
    } catch (err) {
      setToast({
        message: getErrMessage(err, "Invoice search failed. Please try again."),
        type: "error",
      });
      setIsInvoiceModalOpen(false);
    } finally {
      setSearching(false);
    }
  }, [customerContact, barcode, searching]);

  /* Load invoice → populate context + focus quantity */
  const handleLoadInvoice = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setSelectedBarcode(barcode.trim());
    setQuantity("1");

    /* Prefill discount % from the invoice line — the operator can override it */
    const line = invoice.lines.find((l) => l.barcode === barcode.trim());
    const lineTotal = line ? line.soldQty * line.unitPrice : 0;
    const pct = line && lineTotal > 0 ? r2((line.discount / lineTotal) * 100) : 0;
    setDiscountPercent(String(pct));

    setIsInvoiceModalOpen(false);
    setReturnItems((prev) => prev); // keep existing items

    /* If the invoice holds the barcode in multiple lines (not expected),
       the first matching line wins. */
    setTimeout(() => qtyInputRef.current?.focus(), 50);
  };

  /* Add item to the return table */
  const handleAdd = () => {
    if (!selectedInvoice || !selectedLine) {
      setToast({ message: "Please select an invoice first", type: "error" });
      return;
    }

    const qty = Number(quantity);
    if (!Number.isFinite(qty) || qty < 1) {
      setToast({
        message: "Quantity must be at least 1",
        type: "error",
      });
      return;
    }
    if (qty > maxReturnable) {
      setToast({
        message: `Only ${maxReturnable} unit(s) were sold on this invoice line`,
        type: "error",
      });
      return;
    }

    const totalPrice = r2(qty * selectedLine.unitPrice);

    /* Discount: prefilled from the invoice line (%), operator-editable */
    let pct = Number(discountPercent);
    if (!Number.isFinite(pct) || pct < 0) pct = 0;
    if (pct > 100) pct = 100;
    const lineDiscount = r2((totalPrice * pct) / 100);
    const netPrice = r2(totalPrice - lineDiscount);

    setReturnItems((prev) => {
      /* Same invoice + barcode → update the existing row's quantity */
      const existingIdx = prev.findIndex(
        (it) =>
          it.invoiceNumber === selectedInvoice.invoiceNumber &&
          it.barcode === selectedLine.barcode
      );

      if (existingIdx >= 0) {
        const existing = prev[existingIdx];
        const newQty = existing.qty + qty;
        if (newQty > selectedLine.soldQty) {
          setToast({
            message: `Cannot exceed sold quantity (${selectedLine.soldQty}) for this line`,
            type: "error",
          });
          return prev;
        }
        const newTotal = r2(newQty * selectedLine.unitPrice);
        const newDiscount = r2((newTotal * pct) / 100);
        const updated: ReturnItem = {
          ...existing,
          qty: newQty,
          totalPrice: newTotal,
          discount: newDiscount,
          netPrice: r2(newTotal - newDiscount),
        };
        const next = [...prev];
        next[existingIdx] = updated;
        return next;
      }

      return [
        ...prev,
        {
          barcode: selectedLine.barcode,
          invoiceNumber: selectedInvoice.invoiceNumber,
          productName: selectedLine.productName,
          qty,
          unitPrice: selectedLine.unitPrice,
          discount: lineDiscount,
          totalPrice,
          netPrice,
          vat: selectedLine.vat,
          maxQty: selectedLine.soldQty,
        },
      ];
    });

    /* Reset qty, keep customer + invoice context, refocus for speed */
    setQuantity("1");
    setTimeout(() => qtyInputRef.current?.focus(), 30);
  };

  /* Remove item — immediate */
  const handleRemove = (idx: number) => {
    setReturnItems((prev) => prev.filter((_, i) => i !== idx));
  };

  /* ---------- Calculations (SalesRefund VAT logic) ---------- */
  const totalPrice = useMemo(
    () => r2(returnItems.reduce((s, it) => s + it.totalPrice, 0)),
    [returnItems]
  );
  const totalDiscount = useMemo(
    () => r2(returnItems.reduce((s, it) => s + it.discount, 0)),
    [returnItems]
  );
  const priceAfterDiscount = useMemo(
    () => r2(totalPrice - totalDiscount),
    [totalPrice, totalDiscount]
  );

  /* VAT per product % applied to each item's share after discount —
     same proportional approach as SalesRefund. */
  const vatAmount = useMemo(
    () =>
      r2(
        returnItems.reduce((sum, it) => {
          const itemShare =
            totalPrice > 0 ? it.totalPrice / totalPrice : 0;
          const itemAfterDiscount = it.totalPrice - totalDiscount * itemShare;
          return sum + (itemAfterDiscount * it.vat) / 100;
        }, 0)
      ),
    [returnItems, totalPrice, totalDiscount]
  );

  const priceIncludingVat = r2(priceAfterDiscount + vatAmount);

  /* ---------- Save ---------- */
  const handleSave = async () => {
    if (isSaving) return;

    if (!customerContact.trim()) {
      setToast({ message: "Customer contact is required", type: "error" });
      return;
    }
    if (returnItems.length === 0) {
      setToast({
        message: "Add at least one item to the return",
        type: "error",
      });
      return;
    }

    const payload: SaveReturnPayload = {
      customerContact: customerContact.trim(),
      items: returnItems.map((it) => ({
        invoiceNumber: it.invoiceNumber,
        barcode: it.barcode,
        productName: it.productName,
        qty: it.qty,
        unitPrice: it.unitPrice,
        discount: it.discount,
        totalPrice: it.totalPrice,
        netPrice: it.netPrice,
        vat: it.vat,
      })),
      totalPrice,
      discount: totalDiscount,
      priceAfterDiscount,
      vatAmount,
      priceIncludingVat,
    };

    setIsSaving(true);
    try {
      const res = await saveReturnRequest(payload);
      if (!res.success) throw new Error(res.message);

      setToast({
        message: res.message || "Return request saved successfully",
        type: "success",
      });

      /* Reset everything */
      setCustomerContact("");
      setBarcode("");
      setSearchError(null);
      setSelectedInvoice(null);
      setSelectedBarcode("");
      setQuantity("");
      setDiscountPercent("");
      setReturnItems([]);
    } catch (err) {
      setToast({
        message: getErrMessage(err, "Failed to save return request. Please try again."),
        type: "error",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="h-full overflow-y-auto bg-[#F5F7F3]">
      <div
        className="mx-auto max-w-[1440px] space-y-4 p-4 lg:p-6"
        style={{ animation: "fade-up 0.4s ease both" }}
      >
        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        )}

        {/* -------- Header -------- */}
        <header>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#10673E]/10 text-[#10673E]">
              <Undo2 size={20} />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-[#1F2937] md:text-2xl">
                Product Return Request
              </h1>
              <p className="mt-0.5 text-[12.5px] text-[#6B7280]">
                Create and submit a product return request against an existing
                sales invoice.
              </p>
            </div>
          </div>
        </header>

        {/* -------- Search Section (single compact panel) -------- */}
        <div className="rounded-xl border border-[#E5E7EB] bg-white shadow-xs">
          <div className="space-y-3 px-5 py-4">
            {/* Row 1: Customer Contact */}
            <div className="w-full sm:max-w-[360px]">
              <label className="mb-1.5 block text-[12.5px] font-medium text-[#374151]">
                Customer Contact
              </label>
              <div className="relative">
                <Search
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]"
                />
                <input
                  type="text"
                  value={customerContact}
                  onChange={(e) => setCustomerContact(e.target.value)}
                  placeholder="Enter customer contact"
                  className={`h-10 w-full rounded-lg border bg-[#F9FAFB] pl-9 pr-3 text-[13px] text-[#1F2937] outline-none transition-all placeholder:text-[#9CA3AF] focus:border-[#10673E] focus:bg-white focus:ring-2 focus:ring-[#10673E]/15 ${
                    searchError?.includes("contact")
                      ? "border-red-400"
                      : "border-[#D1D5DB]"
                  }`}
                />
              </div>
            </div>

            {/* Row 2: Barcode + Find (under Customer Contact) */}
            <div className="flex flex-wrap items-end gap-3">
              <div className="w-full sm:max-w-[360px]">
              <label className="mb-1.5 block text-[12.5px] font-medium text-[#374151]">
                Barcode
              </label>
              <div className="relative">
                <Barcode
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]"
                />
                <input
                  type="text"
                  value={barcode}
                  onChange={(e) => setBarcode(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleFind();
                    }
                  }}
                  placeholder="Scan or enter barcode"
                  className={`h-10 w-full rounded-lg border bg-[#F9FAFB] pl-9 pr-3 text-[13px] text-[#1F2937] outline-none transition-all placeholder:text-[#9CA3AF] focus:border-[#10673E] focus:bg-white focus:ring-2 focus:ring-[#10673E]/15 ${
                    searchError?.includes("Barcode")
                      ? "border-red-400"
                      : "border-[#D1D5DB]"
                  }`}
                />
              </div>
            </div>

            {/* Find */}
            <button
              type="button"
              onClick={handleFind}
              disabled={searching}
              className="flex h-10 items-center gap-2 rounded-lg bg-[#10673E] px-5 text-[13px] font-semibold text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#0D5A35] hover:shadow-md active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 disabled:hover:bg-[#10673E]"
            >
              {searching ? (
                <Loader2 size={15} className="animate-spin" />
              ) : (
                <Search size={15} />
              )}
              Find
            </button>
            </div>
          </div>
          {searchError && (
            <div className="flex items-center gap-1.5 border-t border-red-100 bg-red-50 px-5 py-2 text-[12px] font-medium text-red-600">
              <AlertCircle size={13} />
              {searchError}
            </div>
          )}
        </div>

        {/* -------- Invoice / Qty + Add (compact strip) -------- */}
        <div className="rounded-xl border border-[#E5E7EB] bg-white shadow-xs">
          <div className="flex flex-wrap items-end gap-3 px-5 py-4">
            {/* Invoice Number (read-only) */}
            <div className="min-w-[180px] flex-1 sm:max-w-[240px]">
              <label className="mb-1.5 block text-[12.5px] font-medium text-[#374151]">
                Invoice Number
              </label>
              <div className="relative">
                <FileText
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]"
                />
                <input
                  type="text"
                  readOnly
                  value={selectedInvoice?.invoiceNumber ?? ""}
                  placeholder="Select via Find"
                  tabIndex={-1}
                  className="h-10 w-full cursor-default rounded-lg border border-[#D1D5DB] bg-[#F1F5F9] pl-9 pr-3 text-[13px] font-semibold text-[#1F2937] outline-none placeholder:font-normal placeholder:text-[#9CA3AF]"
                />
              </div>
            </div>

            {/* Product context (from selected line) */}
            <div className="min-w-[220px] flex-[2]">
              <label className="mb-1.5 block text-[12.5px] font-medium text-[#374151]">
                Product
              </label>
              <div className="relative">
                <Package
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]"
                />
                <input
                  type="text"
                  readOnly
                  value={
                    selectedLine
                      ? `${selectedLine.productName} — Sold: ${selectedLine.soldQty}`
                      : ""
                  }
                  placeholder="Loads with the invoice"
                  tabIndex={-1}
                  className="h-10 w-full cursor-default truncate rounded-lg border border-[#D1D5DB] bg-[#F1F5F9] pl-9 pr-3 text-[13px] text-[#1F2937] outline-none placeholder:font-normal placeholder:text-[#9CA3AF]"
                />
              </div>
            </div>

            {/* Discount % (prefilled from invoice line, operator-editable) */}
            <div className="w-[130px]">
              <label className="mb-1.5 block text-[12.5px] font-medium text-[#374151]">
                Discount (%)
              </label>
              <div className="relative">
                <BadgePercent
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]"
                />
                <input
                  type="number"
                  min={0}
                  max={100}
                  step="0.01"
                  value={discountPercent}
                  onChange={(e) => setDiscountPercent(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAdd();
                    }
                  }}
                  disabled={!selectedLine}
                  placeholder="0"
                  className="h-10 w-full rounded-lg border border-[#D1D5DB] bg-white pl-9 pr-3 text-[13px] tabular-nums text-[#1F2937] outline-none transition-all placeholder:text-[#9CA3AF] focus:border-[#10673E] focus:ring-2 focus:ring-[#10673E]/15 disabled:cursor-not-allowed disabled:opacity-60"
                />
              </div>
            </div>

            {/* Quantity */}
            <div className="w-[110px]">
              <label className="mb-1.5 flex items-center justify-between text-[12.5px] font-medium text-[#374151]">
                Qty
                {/* {selectedLine && (
                  <span className="text-[10.5px] font-semibold text-[#10673E]">
                    max {maxReturnable}
                  </span>
                )} */}
              </label>
              <div className="relative">
                <Hash
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]"
                />
                <input
                  ref={qtyInputRef}
                  type="number"
                  min={1}
                  // max={selectedLine ? maxReturnable : undefined}
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAdd();
                    }
                  }}
                  disabled={!selectedLine}
                  placeholder="1"
                  className="h-10 w-full rounded-lg border border-[#D1D5DB] bg-[#F9FAFB] pl-9 pr-3 text-[13px] tabular-nums text-[#1F2937] outline-none transition-all placeholder:text-[#9CA3AF] focus:border-[#10673E] focus:bg-white focus:ring-2 focus:ring-[#10673E]/15 disabled:cursor-not-allowed disabled:opacity-60"
                />
              </div>
            </div>

            {/* Add */}
            <button
              type="button"
              onClick={handleAdd}
              disabled={!selectedLine || isSaving}
              className="flex h-10 items-center gap-2 rounded-lg bg-[#10673E] px-5 text-[13px] font-semibold text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#0D5A35] hover:shadow-md active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 disabled:hover:bg-[#10673E]"
            >
              <Plus size={15} />
              Add
            </button>
          </div>
        </div>

        {/* -------- Return Items Table -------- */}
        <div className="overflow-hidden rounded-xl border border-[#E5E7EB] bg-white shadow-xs">
          {/* Table Header Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E5E7EB] bg-[#FAFBFC] px-5 py-3">
            <div className="flex items-center gap-2">
              <Package size={16} className="text-[#10673E]" />
              <h2 className="text-[14px] font-bold text-[#1F2937]">
                Return Items
              </h2>
              <span className="rounded-md bg-[#10673E]/10 px-2.5 py-1 text-[11px] font-semibold text-[#10673E]">
                {returnItems.length} records
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-[13px]">
              <thead>
                <tr className="border-b border-[#E5E7EB] bg-[#F8FAFC]">
                  <th className="px-4 py-2.5 font-semibold text-[#6B7280]">Barcode</th>
                  <th className="px-4 py-2.5 font-semibold text-[#6B7280]">Invoice Number</th>
                  <th className="px-4 py-2.5 font-semibold text-[#6B7280]">Product Name</th>
                  <th className="px-4 py-2.5 text-right font-semibold text-[#6B7280]">Qty</th>
                  <th className="px-4 py-2.5 text-right font-semibold text-[#6B7280]">Unit Price</th>
                  <th className="px-4 py-2.5 text-right font-semibold text-[#6B7280]">Discount</th>
                  <th className="px-4 py-2.5 text-right font-semibold text-[#6B7280]">Total Price</th>
                  <th className="px-4 py-2.5 text-right font-semibold text-[#6B7280]">Net Price</th>
                  <th className="px-4 py-2.5 text-right font-semibold text-[#6B7280]">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F5F9]">
                {returnItems.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-5 py-10 text-center">
                      <div className="flex flex-col items-center justify-center text-[#94A3B8]">
                        <Package size={26} strokeWidth={1.5} />
                        <p className="mt-2 text-[13px] font-medium">
                          No return items yet.
                        </p>
                        <p className="mt-1 text-[12px]">
                          Search an invoice above, set the quantity, and click
                          Add.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  returnItems.map((it, idx) => (
                    <tr
                      key={`${it.invoiceNumber}-${it.barcode}`}
                      className="transition-colors hover:bg-[#F8FAFC]"
                    >
                      <td className="px-4 py-2.5 font-medium text-[#374151] tabular-nums">
                        {it.barcode}
                      </td>
                      <td className="px-4 py-2.5 font-semibold text-[#10673E] tabular-nums">
                        {it.invoiceNumber}
                      </td>
                      <td
                        className="max-w-[260px] truncate px-4 py-2.5 text-[#6B7280]"
                        title={it.productName}
                      >
                        {it.productName}
                      </td>
                      <td className="px-4 py-2.5 text-right font-semibold text-[#1F2937] tabular-nums">
                        {it.qty}
                      </td>
                      <td className="px-4 py-2.5 text-right text-[#374151] tabular-nums">
                        {formatBDT(it.unitPrice)}
                      </td>
                      <td className="px-4 py-2.5 text-right text-[#C9A02E] tabular-nums">
                        {formatBDT(it.discount)}
                      </td>
                      <td className="px-4 py-2.5 text-right text-[#374151] tabular-nums">
                        {formatBDT(it.totalPrice)}
                      </td>
                      <td className="px-4 py-2.5 text-right font-semibold text-[#10673E] tabular-nums">
                        {formatBDT(it.netPrice)}
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        <div className="flex items-center justify-end">
                          <button
                            onClick={() => handleRemove(idx)}
                            className="flex h-7 w-7 items-center justify-center rounded-md text-[#64748B] transition-colors hover:bg-red-50 hover:text-red-500"
                            title="Remove"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>

              {/* Footer Summary */}
              {returnItems.length > 0 && (
                <tfoot>
                  <tr className="border-t border-[#E5E7EB] bg-[#FAFBFC] text-[13px] font-semibold">
                    <td colSpan={3} className="px-4 py-3 text-[#374151]">
                      Total Product:{" "}
                      <span className="text-[#10673E]">{returnItems.length}</span>
                    </td>
                    <td className="px-4 py-3 text-right text-[#1F2937] tabular-nums">
                      {returnItems.reduce((s, it) => s + it.qty, 0)}
                    </td>
                    <td colSpan={2} className="px-4 py-3 text-right text-[#374151]">
                      Total Price:
                    </td>
                    <td colSpan={2} className="px-4 py-3 text-right text-[#10673E] tabular-nums">
                      {formatBDT(totalPrice)}
                    </td>
                    <td />
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>

        {/* -------- Calculation Section -------- */}
        <div className="rounded-xl border border-[#E5E7EB] bg-white shadow-xs">
          <div className="flex items-center gap-2 border-b border-[#E5E7EB] bg-[#FAFBFC] px-5 py-3">
            <Calculator size={16} className="text-[#10673E]" />
            <h2 className="text-[14px] font-bold text-[#1F2937]">
              Return Calculation
            </h2>
          </div>

          {/* Calculation fields — flex mode */}
          <div className="flex flex-wrap items-stretch gap-3 p-5">
            <CalcTile label="Total Price" value={formatBDT(totalPrice)} />
            <CalcTile
              label="Discount"
              value={formatBDT(totalDiscount)}
              tone="gold"
            />
            <CalcTile
              label="Price After Discount"
              value={formatBDT(priceAfterDiscount)}
            />
            <CalcTile label="VAT" value={formatBDT(vatAmount)} />
            <CalcTile
              label="Price Including VAT"
              value={formatBDT(priceIncludingVat)}
              strong
            />
          </div>
        </div>

        {/* -------- Save Bar -------- */}
        <div className="flex items-center justify-end gap-3">
          <p className="mr-auto text-[12px] text-[#94A3B8]">
            {returnItems.length > 0
              ? `${returnItems.length} item(s) ready — total ${formatBDT(priceIncludingVat)} incl. VAT`
              : "Add items to enable saving"}
          </p>
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving || returnItems.length === 0}
            className="flex items-center gap-2 rounded-lg bg-[#10673E] px-6 py-3 text-[13px] font-semibold text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#0D5A35] hover:shadow-md active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 disabled:hover:bg-[#10673E] disabled:hover:shadow-sm"
          >
            {isSaving ? (
              <Loader2 size={15} className="animate-spin" />
            ) : (
              <Save size={15} />
            )}
            {isSaving ? "Saving..." : "Save Return Request"}
          </button>
        </div>
      </div>

      {/* -------- Invoice Modal (native <dialog>, page level) -------- */}
      <InvoiceModal
        open={isInvoiceModalOpen}
        loading={searching}
        invoices={invoiceResults}
        barcode={barcode}
        onClose={() => setIsInvoiceModalOpen(false)}
        onLoad={handleLoadInvoice}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Calculation tile (flex mode)                                         */
/* ------------------------------------------------------------------ */

function CalcTile({
  label,
  value,
  strong = false,
  tone = "default",
}: {
  label: string;
  value: string;
  strong?: boolean;
  tone?: "default" | "gold";
}) {
  return (
    <div
      className={`flex min-w-[150px] flex-1 flex-col justify-center rounded-lg border px-4 py-3 ${
        strong
          ? "border-[#10673E]/30 bg-[#10673E]/5"
          : tone === "gold"
            ? "border-[#E2BA48]/30 bg-[#E2BA48]/5"
            : "border-[#E5E7EB] bg-[#FAFBFC]"
      }`}
    >
      <p
        className={`text-[11.5px] font-medium ${
          strong ? "text-[#10673E]" : "text-[#6B7280]"
        }`}
      >
        {label}
      </p>
      <p
        className={`mt-0.5 tabular-nums ${
          strong
            ? "text-[16px] font-bold text-[#10673E]"
            : tone === "gold"
              ? "text-[14px] font-semibold text-[#C9A02E]"
              : "text-[14px] font-semibold text-[#1F2937]"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

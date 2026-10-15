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
import { getCurrentStockByBarcode, type CurrentStock } from "../../api/currentStockApi";
import {
  createProductReturn,
  type ProductReturnPayload,
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

/* ------------------------------------------------------------------ */
/* Return item — one staged line of the return request                  */
/* ------------------------------------------------------------------ */

interface ReturnLineItem {
  id: number;
  productId: number;
  barcode: string;
  invoiceNo: string;
  productName: string;
  qty: number;
  unitPrice: number;
  discountPercent: number;
  totalPrice: number;
  unitPriceAfterDiscount: number;
  totalPriceAfterDiscount: number;
  unitVAT: number;
  unitVATAfterDiscount: number;
  vatPercent: number;
}

/* ------------------------------------------------------------------ */
/* Page                                                                 */
/* ------------------------------------------------------------------ */

export default function ProductReturnRequest() {
  /* Search state */
  const [customerContact, setCustomerContact] = useState("");
  const [barcode, setBarcode] = useState("");
  const [searchError, setSearchError] = useState<string | null>(null);
  const [fetching, setFetching] = useState(false);

  /* Fetched product — GET /api/CurrentStocks/by-barcode/{barcode} */
  const [fetchedProduct, setFetchedProduct] = useState<CurrentStock | null>(
    null
  );

  /* Invoice number + qty for the line being added */
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [discountPercent, setDiscountPercent] = useState("");

  /* Return items */
  const [returnItems, setReturnItems] = useState<ReturnLineItem[]>([]);
  const [nextId, setNextId] = useState(1);
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  const barcodeRef = useRef<HTMLInputElement>(null);
  const invoiceRef = useRef<HTMLInputElement>(null);
  const qtyInputRef = useRef<HTMLInputElement>(null);

  /* Barcode no longer matches the fetched product → clear the preview */
  const handleBarcodeChange = (value: string) => {
    setBarcode(value);
    setFetchedProduct((current) =>
      current && current.barcode === value.trim() ? current : null
    );
  };

  /* Fetch — GET /api/CurrentStocks/by-barcode/{barcode} */
  const handleFetch = useCallback(async () => {
    if (fetching) return;

    const code = barcode.trim();
    if (!code) {
      setSearchError("Barcode is required");
      return;
    }

    setSearchError(null);
    setFetching(true);

    try {
      const res = await getCurrentStockByBarcode(code);

      if (!res.success || !res.data) {
        setFetchedProduct(null);
        setSearchError(res.message || "Product not found in current stock");
        return;
      }

      setFetchedProduct(res.data);
      setQuantity((q) => (Number(q) >= 1 ? q : "1"));
      setTimeout(() => invoiceRef.current?.focus(), 50);
    } catch (err) {
      setFetchedProduct(null);
      setSearchError(
        getErrMessage(err, "Stock lookup failed. Please try again.")
      );
    } finally {
      setFetching(false);
    }
  }, [barcode, fetching]);

  /* Add item to the return table */
  const handleAdd = async () => {
    if (fetching || isSaving) return;

    const code = barcode.trim();
    if (!code) {
      setToast({ message: "Barcode is required", type: "error" });
      return;
    }
    if (!invoiceNumber.trim()) {
      setToast({ message: "Invoice number is required", type: "error" });
      invoiceRef.current?.focus();
      return;
    }

    const qty = Number(quantity);
    if (!Number.isFinite(qty) || qty < 1) {
      setToast({ message: "Quantity must be at least 1", type: "error" });
      return;
    }

    /* Discount % — operator-editable, defaults to 0 */
    let pct = Number(discountPercent);
    if (!Number.isFinite(pct) || pct < 0) pct = 0;
    if (pct > 100) pct = 100;

    /* Fetch the product first when it hasn't been looked up yet
       (or the barcode changed after the last fetch). */
    let product = fetchedProduct;
    if (!product || product.barcode !== code) {
      setFetching(true);
      try {
        const res = await getCurrentStockByBarcode(code);
        if (!res.success || !res.data) {
          setToast({
            message: res.message || "Product not found in current stock",
            type: "error",
          });
          return;
        }
        product = res.data;
        setFetchedProduct(res.data);
      } catch (err) {
        setToast({
          message: getErrMessage(err, "Stock lookup failed. Please try again."),
          type: "error",
        });
        return;
      } finally {
        setFetching(false);
      }
    }

    /* Line calculations */
    const unitPrice = r2(product.salesPrice);
    const totalPrice = r2(qty * unitPrice);
    const unitPriceAfterDiscount = r2(unitPrice * (1 - pct / 100));
    const totalPriceAfterDiscount = r2(qty * unitPriceAfterDiscount);
    const vatPercent = product.vatPercent;
    const unitVAT = r2((unitPrice * vatPercent) / 100);
    const unitVATAfterDiscount = r2((unitPriceAfterDiscount * vatPercent) / 100);

    setReturnItems((prev) => {
      /* Same barcode + invoice number already in the table →
         increase that row's quantity instead of adding another row. */
      const existingIdx = prev.findIndex(
        (it) =>
          it.barcode === product.barcode &&
          it.invoiceNo === invoiceNumber.trim()
      );

      if (existingIdx >= 0) {
        const existing = prev[existingIdx];

        /* Keep the line's discount % unless a new one is typed */
        const mergedPct =
          discountPercent.trim() === "" ? existing.discountPercent : pct;
        const newQty = existing.qty + qty;
        const newUnitAfter = r2(
          existing.unitPrice * (1 - mergedPct / 100)
        );

        const updated: ReturnLineItem = {
          ...existing,
          qty: newQty,
          discountPercent: mergedPct,
          totalPrice: r2(newQty * existing.unitPrice),
          unitPriceAfterDiscount: newUnitAfter,
          totalPriceAfterDiscount: r2(newQty * newUnitAfter),
          unitVAT: r2((existing.unitPrice * existing.vatPercent) / 100),
          unitVATAfterDiscount: r2((newUnitAfter * existing.vatPercent) / 100),
        };

        const next = [...prev];
        next[existingIdx] = updated;
        return next;
      }

      return [
        ...prev,
        {
          id: nextId,
          productId: product.productId,
          barcode: product.barcode,
          invoiceNo: invoiceNumber.trim(),
          productName: product.fullName,
          qty,
          unitPrice,
          discountPercent: pct,
          totalPrice,
          unitPriceAfterDiscount,
          totalPriceAfterDiscount,
          unitVAT,
          unitVATAfterDiscount,
          vatPercent,
        },
      ];
    });
    setNextId((id) => id + 1);

    /* Reset the line inputs, keep customer + invoice context,
       refocus barcode for the next scan */
    setBarcode("");
    setFetchedProduct(null);
    setQuantity("1");
    setSearchError(null);
    setTimeout(() => barcodeRef.current?.focus(), 30);
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
    () =>
      r2(
        returnItems.reduce(
          (s, it) => s + (it.totalPrice - it.totalPriceAfterDiscount),
          0
        )
      ),
    [returnItems]
  );
  const priceAfterDiscount = useMemo(
    () => r2(returnItems.reduce((s, it) => s + it.totalPriceAfterDiscount, 0)),
    [returnItems]
  );

  /* VAT per product % applied to each item's price after discount. */
  const vatBeforeDiscount = useMemo(
    () => r2(returnItems.reduce((s, it) => s + it.qty * it.unitVAT, 0)),
    [returnItems]
  );
  const vatAmount = useMemo(
    () =>
      r2(returnItems.reduce((s, it) => s + it.qty * it.unitVATAfterDiscount, 0)),
    [returnItems]
  );

  const priceIncludingVat = r2(priceAfterDiscount + vatAmount);

  /* ---------- Save — POST /api/ProductReturns ---------- */
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

    const payload: ProductReturnPayload = {
      master: {
        customerContactNumber: customerContact.trim(),
        productPrice: totalPrice,
        discountAmount: totalDiscount,
        priceAfterDiscount,
        vatBeforeDiscount,
        vatAfterDiscount: vatAmount,
        grossValue: priceIncludingVat,
      },
      details: returnItems.map((it) => ({
        productId: it.productId,
        barcode: it.barcode,
        invoiceNo: it.invoiceNo,
        qty: it.qty,
        unitPrice: it.unitPrice,
        totalPrice: it.totalPrice,
        discountPercent: it.discountPercent,
        unitPriceAfterDiscount: it.unitPriceAfterDiscount,
        totalPriceAfterDiscount: it.totalPriceAfterDiscount,
        unitVAT: it.unitVAT,
        unitVATAfterDiscount: it.unitVATAfterDiscount,
        vatPercent: it.vatPercent,
        vatCategoryId: 0,
      })),
    };

    setIsSaving(true);
    try {
      const res = await createProductReturn(payload);
      if (!res.success) throw new Error(res.message);

      setToast({
        message: res.message || "Return request saved successfully",
        type: "success",
      });

      /* Reset everything */
      setCustomerContact("");
      setBarcode("");
      setSearchError(null);
      setFetchedProduct(null);
      setInvoiceNumber("");
      setQuantity("1");
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
                Scan a product barcode and submit a return request against an
                existing sales invoice.
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

            {/* Row 2: Barcode + Fetch + Invoice / Discount / Qty / Add —
                one compact row so a return line can be keyed without
                jumping between panels */}
            <div className="flex flex-wrap items-end gap-3">
              {/* Barcode */}
              <div className="w-full sm:w-[220px]">
                <label className="mb-1.5 block text-[12.5px] font-medium text-[#374151]">
                  Barcode
                </label>
                <div className="relative">
                  <Barcode
                    size={14}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]"
                  />
                  <input
                    ref={barcodeRef}
                    type="text"
                    value={barcode}
                    onChange={(e) => handleBarcodeChange(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleFetch();
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

              {/* Fetch — GET /CurrentStocks/by-barcode/{barcode} */}
              <button
                type="button"
                onClick={handleFetch}
                disabled={fetching}
                className="flex h-10 items-center gap-2 rounded-lg bg-[#10673E] px-5 text-[13px] font-semibold text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#0D5A35] hover:shadow-md active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 disabled:hover:bg-[#10673E]"
              >
                {fetching ? (
                  <Loader2 size={15} className="animate-spin" />
                ) : (
                  <Search size={15} />
                )}
                Fetch
              </button>

              {/* Invoice Number (entered by the operator) */}
              <div className="w-[170px]">
                <label className="mb-1.5 block text-[12.5px] font-medium text-[#374151]">
                  Invoice Number
                </label>
                <div className="relative">
                  <FileText
                    size={14}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]"
                  />
                  <input
                    ref={invoiceRef}
                    type="text"
                    value={invoiceNumber}
                    onChange={(e) => setInvoiceNumber(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        qtyInputRef.current?.focus();
                      }
                    }}
                    placeholder="Enter invoice no"
                    className="h-10 w-full rounded-lg border border-[#D1D5DB] bg-white pl-9 pr-3 text-[13px] font-semibold text-[#1F2937] outline-none transition-all placeholder:font-normal placeholder:text-[#9CA3AF] focus:border-[#10673E] focus:ring-2 focus:ring-[#10673E]/15"
                  />
                </div>
              </div>

              {/* Discount % (operator-editable, defaults to 0) */}
              <div className="w-[120px]">
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
                    placeholder="0"
                    className="h-10 w-full rounded-lg border border-[#D1D5DB] bg-white pl-9 pr-3 text-[13px] tabular-nums text-[#1F2937] outline-none transition-all placeholder:text-[#9CA3AF] focus:border-[#10673E] focus:ring-2 focus:ring-[#10673E]/15"
                  />
                </div>
              </div>

              {/* Quantity — user-defined return qty (NOT the stock qty) */}
              <div className="w-[100px]">
                <label className="mb-1.5 block text-[12.5px] font-medium text-[#374151]">
                  Qty
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
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAdd();
                      }
                    }}
                    placeholder="1"
                    className="h-10 w-full rounded-lg border border-[#D1D5DB] bg-[#F9FAFB] pl-9 pr-3 text-[13px] tabular-nums text-[#1F2937] outline-none transition-all placeholder:text-[#9CA3AF] focus:border-[#10673E] focus:bg-white focus:ring-2 focus:ring-[#10673E]/15"
                  />
                </div>
              </div>

              {/* Add */}
              <button
                type="button"
                onClick={handleAdd}
                disabled={fetching || isSaving}
                className="flex h-10 items-center gap-2 rounded-lg bg-[#10673E] px-5 text-[13px] font-semibold text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#0D5A35] hover:shadow-md active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 disabled:hover:bg-[#10673E]"
              >
                <Plus size={15} />
                Add
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

        {/* -------- Product context strip (loaded via barcode fetch) -------- */}
        {fetchedProduct && (
          <div className="rounded-xl border border-[#E5E7EB] bg-white shadow-xs">
            <div className="flex flex-wrap items-end gap-3 px-5 py-4">
              {/* Product name */}
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
                    value={fetchedProduct.fullName}
                    tabIndex={-1}
                    className="h-10 w-full cursor-default truncate rounded-lg border border-[#D1D5DB] bg-[#F1F5F9] pl-9 pr-3 text-[13px] text-[#1F2937] outline-none"
                  />
                </div>
              </div>

              {/* Stock quantity (reference only — return qty is entered above) */}
              <div className="w-[130px]">
                <label className="mb-1.5 block text-[12.5px] font-medium text-[#374151]">
                  Stock Qty
                </label>
                <div className="relative">
                  <Hash
                    size={14}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]"
                  />
                  <input
                    type="text"
                    readOnly
                    value={fetchedProduct.quantity}
                    tabIndex={-1}
                    className="h-10 w-full cursor-default rounded-lg border border-[#D1D5DB] bg-[#F1F5F9] pl-9 pr-3 text-[13px] font-semibold tabular-nums text-[#1F2937] outline-none"
                  />
                </div>
              </div>

              {/* Sales price */}
              <div className="w-[150px]">
                <label className="mb-1.5 block text-[12.5px] font-medium text-[#374151]">
                  Sales Price
                </label>
                <div className="relative">
                  <Barcode
                    size={14}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]"
                  />
                  <input
                    type="text"
                    readOnly
                    value={formatBDT(fetchedProduct.salesPrice)}
                    tabIndex={-1}
                    className="h-10 w-full cursor-default rounded-lg border border-[#D1D5DB] bg-[#F1F5F9] pl-9 pr-3 text-[13px] font-semibold tabular-nums text-[#1F2937] outline-none"
                  />
                </div>
              </div>

              {/* VAT % */}
              <div className="w-[110px]">
                <label className="mb-1.5 block text-[12.5px] font-medium text-[#374151]">
                  VAT (%)
                </label>
                <div className="relative">
                  <BadgePercent
                    size={14}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]"
                  />
                  <input
                    type="text"
                    readOnly
                    value={fetchedProduct.vatPercent}
                    tabIndex={-1}
                    className="h-10 w-full cursor-default rounded-lg border border-[#D1D5DB] bg-[#F1F5F9] pl-9 pr-3 text-[13px] font-semibold tabular-nums text-[#1F2937] outline-none"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

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
                          Scan a barcode, enter the invoice number and quantity,
                          then click Add.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  returnItems.map((it, idx) => (
                    <tr
                      key={it.id}
                      className="transition-colors hover:bg-[#F8FAFC]"
                    >
                      <td className="px-4 py-2.5 font-medium text-[#374151] tabular-nums">
                        {it.barcode}
                      </td>
                      <td className="px-4 py-2.5 font-semibold text-[#10673E] tabular-nums">
                        {it.invoiceNo}
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
                        {formatBDT(it.totalPrice - it.totalPriceAfterDiscount)}
                      </td>
                      <td className="px-4 py-2.5 text-right text-[#374151] tabular-nums">
                        {formatBDT(it.totalPrice)}
                      </td>
                      <td className="px-4 py-2.5 text-right font-semibold text-[#10673E] tabular-nums">
                        {formatBDT(it.totalPriceAfterDiscount)}
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

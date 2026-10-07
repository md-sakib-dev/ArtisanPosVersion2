import { useState, useEffect, useMemo, useRef } from "react";
import {
  Undo2,
  Search,
  RotateCcw,
  RefreshCw,
  X,
  Check,
  AlertTriangle,
  Loader2,
  FileText,
  ShoppingCart,
  Calculator,
  Ban,
} from "lucide-react";
import {
  getPendingReturnRequests,
  approveReturnRequest,
  discardReturnRequest,
  type PendingReturnRequest,
} from "../../api/productReturnApi";

/* ------------------------------------------------------------------ */
/* Helpers — same business rules as ProductReturnRequest.tsx           */
/* ------------------------------------------------------------------ */

/** Round to 2 decimals to avoid floating-point drift in totals. */
const r2 = (n: number) => Math.round(n * 100) / 100;

const formatDateTime = (iso: string) => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return `${d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })} ${d.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  })}`;
};

const getErrMessage = (err: unknown, fallback: string): string => {
  const anyErr = err as { response?: { data?: { message?: string } } };
  return anyErr?.response?.data?.message || fallback;
};

const money = (n: number) =>
  n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** ৳1,234.56 — en-IN grouping with 2 decimals, same as ProductReturnRequest. */
const formatBDT = (n: number) =>
  `৳${n.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

/* ------------------------------------------------------------------ */
/* Calculation summary — SalesRefund/ProductReturn VAT logic           */
/* ------------------------------------------------------------------ */

interface ReturnCalcSummary {
  totalPrice: number;
  totalDiscount: number;
  priceAfterDiscount: number;
  vatAmount: number;
  priceIncludingVat: number;
}

/**
 * Same proportional VAT rules used by the Product Return Request page:
 * VAT % per product applied to each item's share after discount.
 */
function calcReturnSummary(items: PendingReturnRequest["items"]): ReturnCalcSummary {
  const totalPrice = r2(items.reduce((s, it) => s + it.totalPrice, 0));
  const totalDiscount = r2(items.reduce((s, it) => s + it.discount, 0));
  const priceAfterDiscount = r2(totalPrice - totalDiscount);

  const vatAmount = r2(
    items.reduce((sum, it) => {
      const itemShare = totalPrice > 0 ? it.totalPrice / totalPrice : 0;
      const itemAfterDiscount = it.totalPrice - totalDiscount * itemShare;
      return sum + (itemAfterDiscount * it.vat) / 100;
    }, 0)
  );

  return {
    totalPrice,
    totalDiscount,
    priceAfterDiscount,
    vatAmount,
    priceIncludingVat: r2(priceAfterDiscount + vatAmount),
  };
}

// ======================================================
// TOAST
// ======================================================

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
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div
      className={`fixed top-5 right-5 z-50 flex items-center gap-3 rounded-xl border px-4 py-3 shadow-lg transition-all duration-300 ${
        type === "success"
          ? "border-[#10673E]/20 bg-white text-[#10673E]"
          : "border-red-200 bg-white text-red-600"
      }`}
      style={{ animation: "fade-up 0.3s ease both" }}
    >
      {type === "success" ? <Check size={18} /> : <X size={18} />}
      <span className="text-sm font-medium">{message}</span>
      <button onClick={onClose} className="ml-2 text-[#94A3B8] hover:text-[#64748B]">
        <X size={14} />
      </button>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Confirm dialog — native <dialog>, app modal style                    */
/* ------------------------------------------------------------------ */

function ConfirmDialog({
  mode,
  requestNumber,
  busy,
  onCancel,
  onConfirm,
}: {
  mode: "approve" | "discard";
  requestNumber: string;
  busy: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const isApprove = mode === "approve";

  useEffect(() => {
    const dlg = dialogRef.current;
    if (dlg && !dlg.open) dlg.showModal();
  }, []);

  useEffect(() => {
    const dlg = dialogRef.current;
    if (!dlg) return;

    const handleCancel = (e: Event) => {
      e.preventDefault();
      onCancel();
    };

    dlg.addEventListener("cancel", handleCancel);
    return () => dlg.removeEventListener("cancel", handleCancel);
  }, [onCancel]);

  return (
    <dialog
      ref={dialogRef}
      className="m-auto w-full max-w-sm rounded-2xl border border-[#E5E7EB] bg-white p-0 shadow-2xl backdrop:bg-black/40 backdrop:backdrop-blur-[2px]"
    >
      <div className="p-6">
        <div className="flex items-start gap-3">
          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
              isApprove
                ? "bg-[#10673E]/10 text-[#10673E]"
                : "bg-red-50 text-red-600"
            }`}
          >
            {isApprove ? <Check size={20} /> : <Ban size={20} />}
          </div>
          <div>
            <h2 className="text-[15px] font-bold text-[#1F2937]">
              {isApprove ? "Approve return request?" : "Discard return request?"}
            </h2>
            <p className="mt-1 text-[12.5px] text-[#6B7280]">
              {isApprove
                ? `Request ${requestNumber} will be approved and the return processed.`
                : `Request ${requestNumber} will be rejected and removed from the pending list.`}
            </p>
          </div>
        </div>

        <div className="mt-5 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="flex items-center gap-2 rounded-lg border border-[#D1D5DB] bg-white px-4 py-2.5 text-[13px] font-medium text-[#6B7280] transition-all hover:bg-[#F9FAFB] hover:text-[#374151] disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className={`flex items-center gap-2 rounded-lg px-5 py-2.5 text-[13px] font-semibold text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md disabled:translate-y-0 disabled:opacity-60 ${
              isApprove
                ? "bg-[#10673E] hover:bg-[#0D5A35]"
                : "bg-red-600 hover:bg-red-700"
            }`}
          >
            {busy ? (
              <Loader2 size={15} className="animate-spin" />
            ) : isApprove ? (
              <Check size={15} />
            ) : (
              <Ban size={15} />
            )}
            {busy ? "Processing..." : isApprove ? "Approve" : "Discard"}
          </button>
        </div>
      </div>
    </dialog>
  );
}

// ======================================================
// PAGE
// ======================================================

export default function ProductReturnApproval() {
  // --------------------------------------------------
  // PENDING REQUESTS
  // --------------------------------------------------
  const [requests, setRequests] = useState<PendingReturnRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  // --------------------------------------------------
  // SELECTED REQUEST
  // --------------------------------------------------
  const [selected, setSelected] = useState<PendingReturnRequest | null>(null);
  const [loadingRequest, setLoadingRequest] = useState<number | null>(null);

  // --------------------------------------------------
  // ACTIONS
  // --------------------------------------------------
  const [confirmMode, setConfirmMode] = useState<"approve" | "discard" | null>(null);
  const [acting, setActing] = useState(false);

  // --------------------------------------------------
  // TOAST
  // --------------------------------------------------
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  // --------------------------------------------------
  // DATA LOADING
  // --------------------------------------------------
  const fetchRequests = (): Promise<void> => {
    setLoading(true);
    return getPendingReturnRequests()
      .then((res) => {
        if (res.success && Array.isArray(res.data)) {
          setRequests(res.data);
          setLoadError(null);
        } else {
          throw new Error(res.message || "Failed to load pending requests");
        }
      })
      .catch((err) => {
        console.error("Failed to load pending return requests:", err);
        setLoadError(
          getErrMessage(err, "Failed to load pending return requests. Please try again.")
        );
      })
      .finally(() => setLoading(false));
  };

  /* Initial load — state updates happen inside promise callbacks. */
  useEffect(() => {
    let cancelled = false;

    getPendingReturnRequests()
      .then((res) => {
        if (cancelled) return;
        if (res.success && Array.isArray(res.data)) {
          setRequests(res.data);
          setLoadError(null);
        } else {
          throw new Error(res.message || "Failed to load pending requests");
        }
      })
      .catch((err) => {
        if (cancelled) return;
        console.error("Failed to load pending return requests:", err);
        setLoadError(
          getErrMessage(err, "Failed to load pending return requests. Please try again.")
        );
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  /* Drop the selected request from the local list after approve/discard. */
  const removeRequest = (id: number) => {
    setRequests((prev) => prev.filter((r) => r.returnRequestId !== id));
  };

  // --------------------------------------------------
  // DERIVED
  // --------------------------------------------------
  const filteredRequests = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return requests;
    return requests.filter(
      (r) =>
        r.requestNumber.toLowerCase().includes(term) ||
        r.customerContact.includes(term) ||
        r.requestBy.toLowerCase().includes(term)
    );
  }, [requests, searchTerm]);

  /* Loaded request summary — recalculated with the page's own business rules. */
  const summary = useMemo(
    () => (selected ? calcReturnSummary(selected.items) : null),
    [selected]
  );

  // --------------------------------------------------
  // HANDLERS
  // --------------------------------------------------
  const handleLoad = (request: PendingReturnRequest) => {
    setLoadingRequest(request.returnRequestId);
    // The grid already holds the full request — brief delay keeps the
    // Load affordance visible, then populate the detail section.
    setTimeout(() => {
      setSelected(request);
      setLoadingRequest(null);
    }, 350);
  };

  const clearSelection = () => {
    setSelected(null);
    setConfirmMode(null);
  };

  const handleConfirmAction = async () => {
    if (!selected || acting) return;

    const mode = confirmMode;
    setActing(true);
    try {
      const res =
        mode === "approve"
          ? await approveReturnRequest(selected.returnRequestId)
          : await discardReturnRequest(selected.returnRequestId);
      if (res.success === false) throw new Error(res.message || "Action failed");

      setToast({
        message:
          mode === "approve"
            ? `Return request ${selected.requestNumber} approved successfully`
            : `Return request ${selected.requestNumber} discarded`,
        type: "success",
      });
      removeRequest(selected.returnRequestId);
      clearSelection();
      await fetchRequests();
    } catch (err) {
      console.error("Failed to process return request:", err);
      setToast({
        message: getErrMessage(err, "Failed to process the return request. Please try again."),
        type: "error",
      });
      setConfirmMode(null);
    } finally {
      setActing(false);
    }
  };

  // --------------------------------------------------
  // RENDER
  // --------------------------------------------------
  return (
    <div className="h-full overflow-y-auto bg-[#F5F7F3]">
      <div
        className="mx-auto max-w-[1440px] space-y-5 p-4 lg:p-6"
        style={{ animation: "fade-up 0.4s ease both" }}
      >
        {toast && (
          <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
        )}

        {/* HEADER */}
        <header>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#10673E]/10 text-[#10673E]">
              <Undo2 size={20} />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-[#1F2937] md:text-2xl">
                Product Return Request Approval
              </h1>
              <p className="mt-0.5 text-[12.5px] text-[#6B7280]">
                Review, approve, or discard pending product return requests
              </p>
            </div>
          </div>
        </header>

        {/* ====================================================== */}
        {/* PENDING RETURN REQUESTS GRID                             */}
        {/* ====================================================== */}
        <div className="overflow-hidden rounded-xl border border-[#E5E7EB] bg-white shadow-xs">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E5E7EB] bg-[#FAFBFC] px-5 py-3">
            <div className="flex items-center gap-2">
              <h2 className="text-[14px] font-bold text-[#1F2937]">
                Pending Return Requests
              </h2>
              <span className="rounded-md bg-[#10673E]/10 px-2.5 py-1 text-[11px] font-semibold text-[#10673E]">
                {filteredRequests.length} requests
              </span>
            </div>
            <div className="relative">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]"
              />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search requests..."
                className="h-9 w-full rounded-lg border border-[#D1D5DB] bg-white pl-9 pr-3 text-[13px] text-[#1F2937] outline-none placeholder:text-[#9CA3AF] focus:border-[#10673E] focus:ring-2 focus:ring-[#10673E]/15 sm:w-64"
              />
            </div>
          </div>

          {/* Load error banner */}
          {loadError && (
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#FEE2E2] bg-red-50 px-5 py-3">
              <div className="flex items-center gap-2 text-[12.5px] font-medium text-red-600">
                <AlertTriangle size={15} />
                {loadError}
              </div>
              <button
                onClick={fetchRequests}
                className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-white px-3 py-1.5 text-[12px] font-semibold text-red-600 transition-colors hover:bg-red-50"
              >
                <RefreshCw size={12} />
                Retry
              </button>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-left text-[13px]">
              <thead>
                <tr className="border-b border-[#E5E7EB] bg-[#F8FAFC]">
                  <th className="px-5 py-3 font-semibold text-[#6B7280]">SL</th>
                  <th className="px-5 py-3 font-semibold text-[#6B7280]">
                    Request Number
                  </th>
                  <th className="px-5 py-3 font-semibold text-[#6B7280]">
                    Contact Number
                  </th>
                  <th className="px-5 py-3 font-semibold text-[#6B7280]">Request By</th>
                  <th className="px-5 py-3 font-semibold text-[#6B7280]">Request At</th>
                  <th className="px-5 py-3 text-right font-semibold text-[#6B7280]">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-16 text-center">
                      <div className="flex flex-col items-center justify-center text-[#94A3B8]">
                        <Loader2 size={28} className="animate-spin text-[#10673E]" />
                        <p className="mt-2 text-[13px] font-medium">
                          Loading pending requests...
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : filteredRequests.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-16 text-center">
                      <div className="flex flex-col items-center justify-center text-[#94A3B8]">
                        <RotateCcw size={30} strokeWidth={1.5} />
                        <p className="mt-2 text-[13px] font-medium">
                          No pending return requests
                        </p>
                        <p className="mt-1 text-[12px]">
                          {searchTerm || loadError
                            ? searchTerm
                              ? "Try a different search term"
                              : "Fix the connection and retry"
                            : "All caught up — nothing to approve"}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredRequests.map((req, index) => (
                    <tr
                      key={req.returnRequestId}
                      className={`border-b border-[#F1F5F9] transition-colors hover:bg-[#F8FAFC] ${
                        selected?.returnRequestId === req.returnRequestId
                          ? "bg-[#E8F5ED]/50"
                          : ""
                      }`}
                    >
                      <td className="px-5 py-3 text-[#94A3B8]">{index + 1}</td>
                      <td className="px-5 py-3 font-semibold text-[#10673E] tabular-nums">
                        {req.requestNumber}
                      </td>
                      <td className="px-5 py-3 tabular-nums text-[#374151]">
                        {req.customerContact}
                      </td>
                      <td className="px-5 py-3 text-[#374151]">{req.requestBy}</td>
                      <td className="px-5 py-3 text-[#6B7280] tabular-nums">
                        {formatDateTime(req.requestAt)}
                      </td>
                      <td className="px-5 py-3 text-right">
                        <button
                          onClick={() => handleLoad(req)}
                          disabled={loadingRequest !== null}
                          className="rounded-lg bg-[#10673E] px-4 py-1.5 text-[12px] font-semibold text-white shadow-sm transition-all hover:bg-[#0D5A35] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {loadingRequest === req.returnRequestId ? (
                            <span className="flex items-center gap-1.5">
                              <Loader2 size={12} className="animate-spin" />
                              Loading
                            </span>
                          ) : (
                            "Load"
                          )}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* ====================================================== */}
        {/* SELECTED REQUEST / APPROVAL SECTION                      */}
        {/* ====================================================== */}
        {!selected ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[#D1D5DB] bg-white/60 px-6 py-12 text-center">
            <FileText size={30} strokeWidth={1.5} className="text-[#94A3B8]" />
            <p className="mt-2 text-[13px] font-medium text-[#6B7280]">
              Select a pending return request to review.
            </p>
            <p className="mt-1 text-[12px] text-[#94A3B8]">
              Click Load on a request above to populate this section.
            </p>
          </div>
        ) : (
          <div className="space-y-5">
            {/* REQUEST INFORMATION (read-only) */}
            <div className="overflow-hidden rounded-xl border border-[#E5E7EB] bg-white shadow-xs">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E5E7EB] bg-[#FAFBFC] px-5 py-3">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-md bg-[#10673E]/10 text-[#10673E]">
                    <FileText size={14} />
                  </div>
                  <h2 className="text-[14px] font-bold text-[#1F2937]">
                    Return Request Information
                  </h2>
                </div>
                <button
                  onClick={clearSelection}
                  disabled={acting}
                  className="flex h-8 items-center gap-1.5 rounded-lg border border-[#D1D5DB] bg-white px-3 text-[12px] font-medium text-[#6B7280] transition-colors hover:bg-[#F9FAFB] hover:text-[#374151] disabled:opacity-50"
                >
                  <X size={13} />
                  Close
                </button>
              </div>

              <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2 lg:grid-cols-4">
                {[
                  { label: "Request Number", value: selected.requestNumber },
                  { label: "Contact Number", value: selected.customerContact },
                  { label: "Request By", value: selected.requestBy },
                  { label: "Request At", value: formatDateTime(selected.requestAt) },
                ].map((f) => (
                  <div key={f.label}>
                    <label className="mb-1.5 block text-[13px] font-semibold text-[#374151]">
                      {f.label}
                    </label>
                    <div className="flex h-10 w-full items-center rounded-lg border border-[#D1D5DB] bg-[#F9FAFB] px-3 text-[13px] font-medium text-[#1F2937]">
                      {f.value}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* PRODUCT RETURN DETAILS */}
            <div className="overflow-hidden rounded-xl border border-[#E5E7EB] bg-white shadow-xs">
              <div className="flex items-center gap-2 border-b border-[#E5E7EB] bg-[#FAFBFC] px-5 py-3">
                <div className="flex h-7 w-7 items-center justify-center rounded-md bg-[#10673E]/10 text-[#10673E]">
                  <ShoppingCart size={14} />
                </div>
                <h2 className="text-[14px] font-bold text-[#1F2937]">
                  Product Return Details
                </h2>
                <span className="rounded-md bg-[#10673E]/10 px-2.5 py-1 text-[11px] font-semibold text-[#10673E]">
                  {selected.items.length} items
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-[13px]">
                  <thead>
                    <tr className="border-b border-[#E5E7EB] bg-[#F8FAFC]">
                      <th className="px-5 py-3 font-semibold text-[#6B7280]">SL</th>
                      <th className="px-5 py-3 font-semibold text-[#6B7280]">Product</th>
                      <th className="px-5 py-3 font-semibold text-[#6B7280]">Barcode</th>
                      <th className="px-5 py-3 font-semibold text-[#6B7280]">Invoice</th>
                      <th className="px-5 py-3 text-right font-semibold text-[#6B7280]">
                        Qty
                      </th>
                      <th className="px-5 py-3 text-right font-semibold text-[#6B7280]">
                        Unit Price
                      </th>
                      <th className="px-5 py-3 text-right font-semibold text-[#6B7280]">
                        Discount
                      </th>
                      <th className="px-5 py-3 text-right font-semibold text-[#6B7280]">
                        VAT %
                      </th>
                      <th className="px-5 py-3 text-right font-semibold text-[#6B7280]">
                        Amount
                      </th>
                      <th className="px-5 py-3 text-right font-semibold text-[#6B7280]">
                        Net Amount
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {selected.items.map((item, index) => (
                      <tr
                        key={`${item.barcode}-${item.invoiceNumber}-${index}`}
                        className="border-b border-[#F1F5F9] transition-colors hover:bg-[#F8FAFC]"
                      >
                        <td className="px-5 py-3 text-[#94A3B8]">{index + 1}</td>
                        <td className="px-5 py-3 font-medium text-[#1F2937]">
                          {item.productName}
                        </td>
                        <td className="px-5 py-3">
                          <code className="rounded-md bg-[#F1F5F9] px-2 py-0.5 text-[12px] font-medium text-[#475569]">
                            {item.barcode}
                          </code>
                        </td>
                        <td className="px-5 py-3 tabular-nums text-[#374151]">
                          {item.invoiceNumber}
                        </td>
                        <td className="px-5 py-3 text-right tabular-nums text-[#374151]">
                          {item.qty}
                        </td>
                        <td className="px-5 py-3 text-right tabular-nums text-[#374151]">
                          {money(item.unitPrice)}
                        </td>
                        <td className="px-5 py-3 text-right tabular-nums text-[#374151]">
                          {money(item.discount)}
                        </td>
                        <td className="px-5 py-3 text-right tabular-nums text-[#374151]">
                          {item.vat}%
                        </td>
                        <td className="px-5 py-3 text-right tabular-nums text-[#374151]">
                          {money(item.totalPrice)}
                        </td>
                        <td className="px-5 py-3 text-right font-semibold tabular-nums text-[#1F2937]">
                          {money(item.netPrice)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* CALCULATION SUMMARY + ACTIONS */}
            <div className="overflow-hidden rounded-xl border border-[#E5E7EB] bg-white shadow-xs">
              <div className="flex items-center gap-2 border-b border-[#E5E7EB] bg-[#FAFBFC] px-5 py-3">
                <div className="flex h-7 w-7 items-center justify-center rounded-md bg-[#10673E]/10 text-[#10673E]">
                  <Calculator size={14} />
                </div>
                <h2 className="text-[14px] font-bold text-[#1F2937]">
                  Return Calculation
                </h2>
              </div>

              {/* Calculation fields — flex mode, identical to the
                  Product Return Request page. */}
              <div className="flex flex-wrap items-stretch gap-3 p-5">
                <CalcTile
                  label="Total Price"
                  value={formatBDT(summary!.totalPrice)}
                />
                <CalcTile
                  label="Discount"
                  value={formatBDT(summary!.totalDiscount)}
                  tone="gold"
                />
                <CalcTile
                  label="Price After Discount"
                  value={formatBDT(summary!.priceAfterDiscount)}
                />
                <CalcTile
                  label="VAT"
                  value={formatBDT(summary!.vatAmount)}
                />
                <CalcTile
                  label="Price Including VAT"
                  value={formatBDT(summary!.priceIncludingVat)}
                  strong
                />
              </div>

              {/* Action bar */}
              <div className="flex flex-wrap items-center justify-end gap-3 border-t border-[#E5E7EB] bg-[#FAFBFC] px-5 py-4">
                <button
                  onClick={() => setConfirmMode("discard")}
                  disabled={acting}
                  className="flex items-center gap-2 rounded-lg border border-red-200 bg-white px-5 py-2.5 text-[13px] font-semibold text-red-600 transition-all hover:bg-red-50 disabled:opacity-50"
                >
                  <Ban size={15} />
                  Discard
                </button>
                <button
                  onClick={() => setConfirmMode("approve")}
                  disabled={acting}
                  className="flex items-center gap-2 rounded-lg bg-[#10673E] px-5 py-2.5 text-[13px] font-semibold text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#0D5A35] hover:shadow-md active:scale-[0.98] disabled:translate-y-0 disabled:opacity-60"
                >
                  <Check size={15} />
                  Approve
                </button>
              </div>
            </div>
          </div>
        )}

        {/* -------- Confirm dialog (native <dialog>, page level) -------- */}
        {confirmMode && selected && (
          <ConfirmDialog
            mode={confirmMode}
            requestNumber={selected.requestNumber}
            busy={acting}
            onCancel={() => setConfirmMode(null)}
            onConfirm={handleConfirmAction}
          />
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Calculation tile (flex mode) — identical to ProductReturnRequest     */
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

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Ban,
  Check,
  FileText,
  Gift,
  Loader2,
  Search,
  Sparkles,
  Ticket,
  BadgeCheck,
  X,
} from "lucide-react";

// ======================================================
// TYPES
// ======================================================

type RedeemType = "Voucher" | "Gift Card" | "Loyalty Points" | "Reward Code";

interface RedeemRequestRow {
  id: number;
  redeemType: RedeemType;
  serialNo: string;
  amount: number;
  contactNo: string;
  requestBy: string;
  /** ISO date-time. */
  requestAt: string;
}

type ConfirmMode = "approve" | "discard" | null;

type Toast = {
  message: string;
  type: "success" | "error";
} | null;

// ======================================================
// PROTOTYPE DATA
// ======================================================

/*
 * TODO: replace with the real APIs once available, e.g.:
 *   GET  /api/RedeemRequests/pending
 *   POST /api/RedeemRequests/{id}/approve
 *   POST /api/RedeemRequests/{id}/discard
 */
const PROTOTYPE_REQUESTS: RedeemRequestRow[] = [
  {
    id: 1,
    redeemType: "Voucher",
    serialNo: "GV-100257",
    amount: 1500,
    contactNo: "+8801712345678",
    requestBy: "Cashier 01",
    requestAt: "2026-09-30T10:24:00",
  },
  {
    id: 2,
    redeemType: "Gift Card",
    serialNo: "GC-558201",
    amount: 5000,
    contactNo: "+8801811223344",
    requestBy: "Cashier 02",
    requestAt: "2026-09-30T11:02:00",
  },
  {
    id: 3,
    redeemType: "Loyalty Points",
    serialNo: "LP-990033",
    amount: 750,
    contactNo: "+8801911556677",
    requestBy: "Cashier 01",
    requestAt: "2026-09-29T16:40:00",
  },
  {
    id: 4,
    redeemType: "Reward Code",
    serialNo: "RC-441120",
    amount: 250,
    contactNo: "+8801611778899",
    requestBy: "Cashier 03",
    requestAt: "2026-09-29T14:12:00",
  },
];

// ======================================================
// HELPERS
// ======================================================

const money = (n: number) =>
  n.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const CURRENCY = "$";

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
      <button
        onClick={onClose}
        className="ml-2 text-[#94A3B8] hover:text-[#64748B]"
      >
        <X size={14} />
      </button>
    </div>
  );
}

// ======================================================
// CONFIRM DIALOG — native <dialog>, app modal style
// ======================================================

function ConfirmDialog({
  mode,
  serialNo,
  busy,
  onCancel,
  onConfirm,
}: {
  mode: "approve" | "discard";
  serialNo: string;
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
              {isApprove ? "Approve redeem request?" : "Discard redeem request?"}
            </h2>
            <p className="mt-1 text-[12.5px] text-[#6B7280]">
              {isApprove
                ? `Serial ${serialNo} will be approved and the redeem processed.`
                : `Serial ${serialNo} will be rejected and removed from the pending list.`}
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

export default function RedeemRequestApproval() {
  // --------------------------------------------------
  // REQUESTS
  // --------------------------------------------------
  const [requests, setRequests] =
    useState<RedeemRequestRow[]>(PROTOTYPE_REQUESTS);
  const [searchTerm, setSearchTerm] = useState("");

  // --------------------------------------------------
  // ACTIONS
  // --------------------------------------------------
  const [confirmMode, setConfirmMode] = useState<ConfirmMode>(null);
  const [confirmTarget, setConfirmTarget] = useState<RedeemRequestRow | null>(
    null
  );
  const [acting, setActing] = useState(false);

  // --------------------------------------------------
  // TOAST
  // --------------------------------------------------
  const [toast, setToast] = useState<Toast>(null);

  // --------------------------------------------------
  // DERIVED
  // --------------------------------------------------
  const filteredRequests = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return requests;
    return requests.filter(
      (r) =>
        r.serialNo.toLowerCase().includes(term) ||
        r.contactNo.includes(term) ||
        r.requestBy.toLowerCase().includes(term) ||
        r.redeemType.toLowerCase().includes(term)
    );
  }, [requests, searchTerm]);

  // --------------------------------------------------
  // HANDLERS
  // --------------------------------------------------
  const openConfirm = (
    mode: Exclude<ConfirmMode, null>,
    request: RedeemRequestRow
  ) => {
    setConfirmMode(mode);
    setConfirmTarget(request);
  };

  const closeConfirm = () => {
    setConfirmMode(null);
    setConfirmTarget(null);
  };

  const handleConfirmAction = async () => {
    if (!confirmTarget || acting) return;

    const mode = confirmMode!;
    const target = confirmTarget;

    setActing(true);
    try {
      /*
       * TODO: replace with the real API calls once available, e.g.:
       *   mode === "approve"
       *     ? await approveRedeemRequest(target.id)
       *     : await discardRedeemRequest(target.id);
       */
      await new Promise((resolve) => setTimeout(resolve, 600));

      setToast({
        message:
          mode === "approve"
            ? `Redeem request ${target.serialNo} approved successfully`
            : `Redeem request ${target.serialNo} discarded`,
        type: "success",
      });

      /* Drop the row from the local list after approve/discard. */
      setRequests((prev) => prev.filter((r) => r.id !== target.id));
      closeConfirm();
    } catch {
      setToast({
        message: "Failed to process the redeem request. Please try again.",
        type: "error",
      });
      closeConfirm();
    } finally {
      setActing(false);
    }
  };

  const TYPE_ICONS: Record<RedeemType, typeof Gift> = {
    Voucher: Ticket,
    "Gift Card": Gift,
    "Loyalty Points": Sparkles,
    "Reward Code": BadgeCheck,
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
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        )}

        {/* ============================================== */}
        {/* HEADER                                          */}
        {/* ============================================== */}
        <header>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#10673E]/10 text-[#10673E]">
              <Gift size={20} />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-[#1F2937] md:text-2xl">
                Redeem Request Approval
              </h1>
              <p className="mt-0.5 text-[12.5px] text-[#6B7280]">
                Review, approve, or discard pending redeem
                requests
              </p>
            </div>
          </div>
        </header>

        {/* ============================================== */}
        {/* PENDING REQUESTS TABLE                          */}
        {/* ============================================== */}
        <div className="overflow-hidden rounded-xl border border-[#E5E7EB] bg-white shadow-xs">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E5E7EB] bg-[#FAFBFC] px-5 py-3">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-[#10673E]/10 text-[#10673E]">
                <FileText size={14} />
              </div>
              <h2 className="text-[14px] font-bold text-[#1F2937]">
                Pending Redeem Requests
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

          <div className="overflow-x-auto">
            <table className="w-full text-left text-[13px]">
              <thead>
                <tr className="border-b border-[#E5E7EB] bg-[#F8FAFC]">
                  <th className="px-5 py-3 font-semibold text-[#6B7280]">SL</th>
                  <th className="px-5 py-3 font-semibold text-[#6B7280]">
                    Redeem Type
                  </th>
                  <th className="px-5 py-3 font-semibold text-[#6B7280]">
                    Serial No
                  </th>
                  <th className="px-5 py-3 text-right font-semibold text-[#6B7280]">
                    Amount
                  </th>
                  <th className="px-5 py-3 font-semibold text-[#6B7280]">
                    Contact No
                  </th>
                  <th className="px-5 py-3 font-semibold text-[#6B7280]">
                    Request By
                  </th>
                  <th className="px-5 py-3 font-semibold text-[#6B7280]">
                    Request Time
                  </th>
                  <th className="px-5 py-3 text-center font-semibold text-[#6B7280]">
                    Authorize
                  </th>
                  <th className="px-5 py-3 text-right font-semibold text-[#6B7280]">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredRequests.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-5 py-16 text-center">
                      <div className="flex flex-col items-center justify-center text-[#94A3B8]">
                        <Gift size={30} strokeWidth={1.5} />
                        <p className="mt-2 text-[13px] font-medium">
                          No pending redeem requests
                        </p>
                        <p className="mt-1 text-[12px]">
                          {searchTerm
                            ? "Try a different search term"
                            : "All caught up — nothing to approve"}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredRequests.map((req, index) => {
                    const TypeIcon = TYPE_ICONS[req.redeemType] ?? Gift;

                    return (
                      <tr
                        key={req.id}
                        className="border-b border-[#F1F5F9] transition-colors hover:bg-[#F8FAFC]"
                      >
                        <td className="px-5 py-3 text-[#94A3B8]">
                          {index + 1}
                        </td>

                        <td className="px-5 py-3">
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#10673E]/10 px-2.5 py-1 text-[11px] font-semibold text-[#10673E]">
                            <TypeIcon size={11} />
                            {req.redeemType}
                          </span>
                        </td>

                        <td className="px-5 py-3">
                          <code className="rounded-md bg-[#F1F5F9] px-2 py-0.5 text-[12px] font-medium text-[#475569]">
                            {req.serialNo}
                          </code>
                        </td>

                        <td className="px-5 py-3 text-right font-semibold tabular-nums text-[#1F2937]">
                          {CURRENCY}
                          {money(req.amount)}
                        </td>

                        <td className="px-5 py-3 tabular-nums text-[#374151]">
                          {req.contactNo}
                        </td>

                        <td className="px-5 py-3 text-[#374151]">
                          {req.requestBy}
                        </td>

                        <td className="px-5 py-3 text-[#6B7280] tabular-nums">
                          {formatDateTime(req.requestAt)}
                        </td>

                        {/* AUTHORIZE — status pill */}
                        <td className="px-5 py-3 text-center">
                          <span className="inline-flex items-center rounded-full bg-[#E2BA48]/10 px-2.5 py-1 text-[11px] font-semibold text-[#C9A02E]">
                            Pending
                          </span>
                        </td>

                        {/* ACTIONS */}
                        <td className="px-5 py-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => openConfirm("approve", req)}
                              disabled={acting}
                              title="Approve request"
                              className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-[#10673E] px-3 text-[12px] font-semibold text-white shadow-sm transition-all hover:bg-[#0D5A35] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              <Check size={13} />
                              Approve
                            </button>

                            <button
                              type="button"
                              onClick={() => openConfirm("discard", req)}
                              disabled={acting}
                              title="Discard request"
                              className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-red-200 bg-white px-3 text-[12px] font-semibold text-red-600 transition-all hover:bg-red-50 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              <Ban size={13} />
                              Discard
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* -------- Confirm dialog (native <dialog>, page level) -------- */}
        {confirmMode && confirmTarget && (
          <ConfirmDialog
            mode={confirmMode}
            serialNo={confirmTarget.serialNo}
            busy={acting}
            onCancel={closeConfirm}
            onConfirm={handleConfirmAction}
          />
        )}
      </div>
    </div>
  );
}

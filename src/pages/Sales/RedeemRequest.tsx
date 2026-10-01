import { useCallback, useMemo, useRef, useState } from "react";
import {
  BadgeCheck,
  Check,
  Gift,
  Layers,
  Phone,
  Plus,
  Sparkles,
  Ticket,
  Trash2,
  Wallet,
  X,
  CheckCircle2,
} from "lucide-react";

// ======================================================
// TYPES
// ======================================================

type RedeemType = "Voucher" | "Gift Card" | "Loyalty Points" | "Reward Code";

interface RedeemItem {
  id: number;
  redeemType: RedeemType;
  contactNo: string;
  serialNo: string;
  amount: number;
  /** ISO date (yyyy-mm-dd) — auto-calculated on add. */
  expiryDate: string;
}

type Toast = {
  message: string;
  type: "success" | "error";
} | null;

// ======================================================
// CONSTANTS
// ======================================================

const REDEEM_TYPES: RedeemType[] = [
  "Voucher",
  "Gift Card",
  "Loyalty Points",
  "Reward Code",
];

/**
 * Default validity window per redeem type, in days.
 * Expiry is auto-calculated when an item is added.
 */
const EXPIRY_DAYS: Record<RedeemType, number> = {
  Voucher: 30,
  "Gift Card": 60,
  "Loyalty Points": 90,
  "Reward Code": 30,
};

const CURRENCY = "$";

// ======================================================
// HELPERS
// ======================================================

/** ISO date `days` from now (yyyy-mm-dd). */
function addDays(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

function formatDate(iso: string): string {
  if (!iso) return "—";
  const date = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

const money = (n: number) =>
  n.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

/** Loose E.164-ish phone check: 6–15 digits after optional +. */
function isValidPhone(value: string): boolean {
  return /^\+?\d{6,15}$/.test(value.replace(/[\s-]/g, ""));
}

function isValidAmount(value: string): boolean {
  return /^\d+(\.\d{1,2})?$/.test(value) && Number(value) > 0;
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
  useState(() => setTimeout(onClose, 3000));

  return (
    <div
      className={`fixed top-5 right-5 z-[60] flex items-center gap-3 rounded-xl border px-4 py-3 shadow-lg transition-all duration-300 ${
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

// ======================================================
// REDEEM REQUEST (MAIN)
// ======================================================

export default function RedeemRequest() {
  // --------------------------------------------------
  // FORM STATE
  // --------------------------------------------------
  const [redeemType, setRedeemType] = useState("");
  const [contactNo, setContactNo] = useState("");
  const [serialNo, setSerialNo] = useState("");
  const [amountInput, setAmountInput] = useState("");

  // --------------------------------------------------
  // ITEMS STATE
  // --------------------------------------------------
  const [items, setItems] = useState<RedeemItem[]>([]);
  const [nextId, setNextId] = useState(1);

  // --------------------------------------------------
  // UI STATE
  // --------------------------------------------------
  const [toast, setToast] = useState<Toast>(null);
  const [submitting, setSubmitting] = useState(false);
  const serialRef = useRef<HTMLInputElement>(null);

  // --------------------------------------------------
  // DERIVED — Add enables only when all 4 inputs are valid
  // --------------------------------------------------
  const canAdd =
    redeemType !== "" &&
    isValidPhone(contactNo) &&
    serialNo.trim().length > 0 &&
    isValidAmount(amountInput);

  const totalAmount = useMemo(
    () => items.reduce((total, item) => total + item.amount, 0),
    [items]
  );

  // --------------------------------------------------
  // ADD ITEM
  // --------------------------------------------------
  const handleAdd = () => {
    if (!canAdd) return;

    const amount = Number(amountInput);

    if (items.some((item) => item.serialNo === serialNo.trim())) {
      setToast({
        message: `Serial "${serialNo.trim()}" is already staged`,
        type: "error",
      });
      return;
    }

    setItems((previousItems) => [
      ...previousItems,
      {
        id: nextId,
        redeemType: redeemType as RedeemType,
        contactNo: contactNo.trim(),
        serialNo: serialNo.trim(),
        amount,
        expiryDate: addDays(EXPIRY_DAYS[redeemType as RedeemType] ?? 30),
      },
    ]);

    setNextId((id) => id + 1);

    /* Keep type + contact (same customer often redeems several
       codes) — clear the per-item fields. */
    setSerialNo("");
    setAmountInput("");
    serialRef.current?.focus();

    setToast({
      message: `${redeemType} (${CURRENCY}${money(amount)}) added to the request`,
      type: "success",
    });
  };

  // --------------------------------------------------
  // REMOVE ITEM
  // --------------------------------------------------
  const handleRemove = useCallback((id: number) => {
    setItems((previousItems) =>
      previousItems.filter((item) => item.id !== id)
    );
  }, []);

  // --------------------------------------------------
  // APPLY — POST /api/RedeemRequests (endpoint pending)
  // --------------------------------------------------
  const handleApply = async () => {
    if (submitting || items.length === 0) return;

    /*
     * TODO: wire to the real API once available, e.g.:
     *   await saveRedeemRequest({ details: items.map(...) });
     */
    setSubmitting(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 700));

      setToast({
        message: `Request submitted — ${items.length} item(s), ${CURRENCY}${money(totalAmount)}`,
        type: "success",
      });
      setItems([]);
    } catch {
      setToast({
        message: "Failed to submit redeem request. Please try again.",
        type: "error",
      });
    } finally {
      setSubmitting(false);
    }
  };

  // --------------------------------------------------
  // RENDER
  // --------------------------------------------------
  return (
    <div className="h-full overflow-y-auto bg-[#F5F7F3]">
      <style>{`
        @keyframes rr-pop {
          from {
            opacity: 0;
            transform: translateY(6px) scale(0.99);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>

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
                Redeem Request
              </h1>
              <p className="mt-0.5 text-[12.5px] text-[#6B7280]">
                Queue voucher, gift card &amp; loyalty
                redeems for approval
              </p>
            </div>
          </div>
        </header>

        {/* ============================================== */}
        {/* ENTRY CARD                                      */}
        {/* ============================================== */}
        <div className="overflow-hidden rounded-xl border border-[#E5E7EB] bg-white shadow-xs">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E5E7EB] bg-[#FAFBFC] px-5 py-3">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-[#10673E]/10 text-[#10673E]">
                <Plus size={14} />
              </div>
              <h2 className="text-[14px] font-bold text-[#1F2937]">
                New Redeem Entry
              </h2>
            </div>

            <span className="text-[11px] font-medium text-[#9CA3AF]">
              Expiry is auto-calculated per redeem type
            </span>
          </div>

          <div className="grid grid-cols-1 items-start gap-4 p-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-[repeat(4,minmax(0,1fr))_auto]">
            {/* REDEEM TYPE — plain select, same as Discount
                Management / Product Management forms */}
            <div>
              <label className="mb-1.5 block text-[12.5px] font-semibold text-[#374151]">
                Redeem Type <span className="text-red-500">*</span>
              </label>
              <select
                value={redeemType}
                onChange={(e) => setRedeemType(e.target.value)}
                className={`h-10 w-full rounded-lg border border-[#D1D5DB] bg-white px-3 text-[13px] outline-none transition-colors focus:border-[#0E9351] focus:ring-2 focus:ring-[#0E9351]/15 ${
                  redeemType ? "text-[#1F2937]" : "text-[#9CA3AF]"
                }`}
              >
                <option value="" disabled>
                  Select redeem type
                </option>
                {REDEEM_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            {/* CONTACT NO */}
            <div>
              <label className="mb-1.5 block text-[12.5px] font-semibold text-[#374151]">
                Contact No <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Phone
                  size={14}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]"
                />
                <input
                  type="tel"
                  inputMode="tel"
                  value={contactNo}
                  onChange={(e) => setContactNo(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleAdd();
                  }}
                  placeholder="+8801XXXXXXXXX"
                  className={`h-10 w-full rounded-lg border bg-white pl-9 pr-3 text-[13px] outline-none transition-colors placeholder:text-[#9CA3AF] ${
                    contactNo && !isValidPhone(contactNo)
                      ? "border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-500/15"
                      : "border-[#D1D5DB] focus:border-[#0E9351] focus:ring-2 focus:ring-[#0E9351]/15"
                  }`}
                />
              </div>
              {contactNo && !isValidPhone(contactNo) && (
                <p className="mt-1 text-[11px] font-medium text-red-500">
                  Enter a valid phone number
                </p>
                )}
            </div>

            {/* SERIAL NO */}
            <div>
              <label className="mb-1.5 block text-[12.5px] font-semibold text-[#374151]">
                Serial No <span className="text-red-500">*</span>
              </label>
              <input
                ref={serialRef}
                type="text"
                value={serialNo}
                onChange={(e) => setSerialNo(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleAdd();
                }}
                placeholder="GV-123456"
                className="h-10 w-full rounded-lg border border-[#D1D5DB] bg-white px-3 font-mono text-[13px] tracking-wide text-[#1F2937] outline-none transition-colors placeholder:font-sans placeholder:text-[#9CA3AF] focus:border-[#0E9351] focus:ring-2 focus:ring-[#0E9351]/15"
              />
            </div>

            {/* AMOUNT */}
            <div>
              <label className="mb-1.5 block text-[12.5px] font-semibold text-[#374151]">
                Amount ({CURRENCY}) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[13px] font-semibold text-[#6B7280]">
                  {CURRENCY}
                </span>
                <input
                  type="text"
                  inputMode="decimal"
                  value={amountInput}
                  onChange={(e) => setAmountInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleAdd();
                  }}
                  placeholder="0.00"
                  className={`h-10 w-full rounded-lg border bg-white pl-7 pr-3 text-right text-[13px] tabular-nums outline-none transition-colors placeholder:text-[#9CA3AF] ${
                    amountInput && !isValidAmount(amountInput)
                      ? "border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-500/15"
                      : "border-[#D1D5DB] focus:border-[#0E9351] focus:ring-2 focus:ring-[#0E9351]/15"
                  }`}
                />
              </div>
              {amountInput && !isValidAmount(amountInput) && (
                <p className="mt-1 text-[11px] font-medium text-red-500">
                  Enter a valid amount
                </p>
              )}
            </div>

            {/* ADD BUTTON */}
            <div className="flex items-end xl:pt-[26px]">
              <button
                type="button"
                onClick={handleAdd}
                disabled={!canAdd}
                title={
                  canAdd
                    ? "Add to the request"
                    : "Fill all fields with valid values first"
                }
                className="flex h-10 items-center gap-2 rounded-lg bg-[#10673E] px-5 text-[13px] font-semibold text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#0D5A35] hover:shadow-md active:scale-[0.98] disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Plus size={15} />
                Add
              </button>
            </div>
          </div>
        </div>

        {/* ============================================== */}
        {/* SHOWCASE TABLE                                  */}
        {/* ============================================== */}
        <div className="overflow-hidden rounded-xl border border-[#E5E7EB] bg-white shadow-xs">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E5E7EB] bg-[#FAFBFC] px-5 py-3">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-[#10673E]/10 text-[#10673E]">
                <Layers size={14} />
              </div>
              <h2 className="text-[14px] font-bold text-[#1F2937]">
                Redeem Items
              </h2>
              <span className="rounded-md bg-[#10673E]/10 px-2.5 py-1 text-[11px] font-semibold text-[#10673E]">
                {items.length} items
              </span>
            </div>

            <span className="text-[11px] font-medium text-[#6B7280]">
              Total:{" "}
              <b className="text-[#10673E]">
                {CURRENCY}
                {money(totalAmount)}
              </b>
            </span>
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
                    Expiry Date
                  </th>
                  <th className="px-5 py-3 text-right font-semibold text-[#6B7280]">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-16 text-center">
                      <div className="flex flex-col items-center justify-center text-[#94A3B8]">
                        <Layers size={30} strokeWidth={1.5} />
                        <p className="mt-2 text-[13px] font-medium">
                          No redeem requests added yet
                        </p>
                        <p className="mt-1 text-[12px]">
                          Fill the form above and press Add to stage items
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  items.map((item, index) => {
                    const TypeIcon =
                      {
                        Voucher: Ticket,
                        "Gift Card": Gift,
                        "Loyalty Points": Sparkles,
                        "Reward Code": BadgeCheck,
                      }[item.redeemType] ?? Gift;

                    return (
                      <tr
                        key={item.id}
                        className="border-b border-[#F1F5F9] transition-colors hover:bg-[#F8FAFC]"
                        style={{ animation: "rr-pop 180ms ease-out" }}
                      >
                        <td className="px-5 py-3 text-[#94A3B8]">{index + 1}</td>

                        <td className="px-5 py-3">
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#10673E]/10 px-2.5 py-1 text-[11px] font-semibold text-[#10673E]">
                            <TypeIcon size={11} />
                            {item.redeemType}
                          </span>
                        </td>

                        <td className="px-5 py-3">
                          <code className="rounded-md bg-[#F1F5F9] px-2 py-0.5 text-[12px] font-medium text-[#475569]">
                            {item.serialNo}
                          </code>
                        </td>

                        <td className="px-5 py-3 text-right font-semibold tabular-nums text-[#1F2937]">
                          {CURRENCY}
                          {money(item.amount)}
                        </td>

                        <td className="px-5 py-3 tabular-nums text-[#374151]">
                          {item.contactNo}
                        </td>

                        <td className="px-5 py-3 text-[#6B7280] tabular-nums">
                          {formatDate(item.expiryDate)}
                        </td>

                        <td className="px-5 py-3 text-right">
                          <button
                            type="button"
                            onClick={() => handleRemove(item.id)}
                            title="Remove item"
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-red-500 transition-colors hover:bg-red-50 hover:text-red-600"
                          >
                            <Trash2 size={15} />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* ============================================== */}
        {/* FOOTER — SUMMARY + APPLY                        */}
        {/* ============================================== */}
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#E5E7EB] bg-white px-5 py-4 shadow-xs">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#F1F5F9] px-3 py-1.5 text-[12px] font-semibold text-[#374151]">
              <Layers size={12} className="text-[#10673E]" />
              Total Items: {items.length}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#F1F5F9] px-3 py-1.5 text-[12px] font-semibold text-[#374151]">
              <Wallet size={12} className="text-[#10673E]" />
              Total Amount: {CURRENCY}
              {money(totalAmount)}
            </span>
          </div>

          <button
            type="button"
            onClick={handleApply}
            disabled={items.length === 0 || submitting}
            className={`flex h-10 items-center gap-2 rounded-lg px-6 text-[13px] font-semibold text-white transition-all duration-200 active:scale-[0.98] ${
              items.length === 0 || submitting
                ? "cursor-not-allowed bg-[#D1D5DB] text-[#9CA3AF]"
                : "bg-[#10673E] shadow-sm hover:-translate-y-0.5 hover:bg-[#0D5A35] hover:shadow-md"
            }`}
          >
            {submitting ? (
              <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            ) : (
              <Check size={15} />
            )}
            {submitting ? "Submitting..." : "Apply"}
          </button>
        </div>
      </div>
    </div>
  );
}

import { useState } from "react";
import { X, Smartphone, Plus, Trash2, AlertTriangle, Hash } from "lucide-react";

// ======================================================
// TYPES
// ======================================================

interface MfsPaymentEntry {
  id: number;
  paymentAmount: number;
  mobileNoLast4: string;
  mobilePaymentType: string;
}

interface MfsPaymentModalProps {
  open: boolean;
  onClose: () => void;
  onMfsTotalChange: (total: number) => void;
}

// ======================================================
// OPTIONS
// ======================================================

const MOBILE_PAYMENT_TYPES = [
  "Select Payment Type",
  "bKash",
  "Nagad",
  "UPAY",
  "ROCKET",
];

// ======================================================
// STYLES
// ======================================================

// ======================================================
// CONFIRM MODAL (Nested)
// ======================================================

function ConfirmClearModal({
  open,
  onConfirm,
  onCancel,
  entryCount,
}: {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  entryCount: number;
}) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4 backdrop-blur-[2px]"
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      <div
        className="w-full max-w-md overflow-hidden rounded-2xl border border-[#DDE5DF] bg-white shadow-2xl"
        style={{ animation: "fade-up 0.2s ease both" }}
      >
        {/* Header */}
        <div className="flex items-center gap-3 border-b border-[#E6EAE3] px-6 py-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#FEF3C7]">
            <AlertTriangle size={20} className="text-[#D97706]" />
          </div>
          <div>
            <h3 className="text-base font-bold text-[#17231D]">Confirm Clear</h3>
            <p className="mt-0.5 text-xs text-[#6B7280]">This action cannot be undone</p>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-5">
          <p className="text-sm leading-relaxed text-[#374151]">
            Are you sure you want to clear all{" "}
            <span className="font-semibold text-[#10673E]">{entryCount}</span>{" "}
            MFS payment {entryCount === 1 ? "entry" : "entries"}?
          </p>
          <p className="mt-2 text-sm text-[#6B7280]">
            All added MFS payment data will be removed.
          </p>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-[#E6EAE3] bg-[#FAFBF9] px-6 py-4">
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-[#DDE5DF] bg-white px-4 text-sm font-medium text-[#374151] transition-all hover:bg-[#F3F4F6] active:scale-[0.98]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-[#DC2626] px-4 text-sm font-semibold text-white shadow-sm transition-all hover:bg-[#B91C1C] active:scale-[0.98]"
          >
            <Trash2 size={14} />
            Clear All
          </button>
        </div>
      </div>
    </div>
  );
}

// ======================================================
// MFS PAYMENT MODAL
// ======================================================

export default function MfsPaymentModal({
  open,
  onClose,
  onMfsTotalChange,
}: MfsPaymentModalProps) {
  // ====================================================
  // STATE
  // ====================================================

  const [entries, setEntries] = useState<MfsPaymentEntry[]>([]);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [mobileNoLast4, setMobileNoLast4] = useState<string>("");
  const [mobilePaymentType, setMobilePaymentType] = useState<string>(MOBILE_PAYMENT_TYPES[0]);
  const [validationError, setValidationError] = useState<string>("");
  const [nextId, setNextId] = useState(1);
  const [showConfirmClear, setShowConfirmClear] = useState(false);

  // ====================================================
  // HANDLERS
  // ====================================================

  const handleAddPayment = () => {
    setValidationError("");

    if (!paymentAmount || paymentAmount <= 0) {
      setValidationError("Please enter a valid payment amount");
      return;
    }

    if (!mobileNoLast4 || mobileNoLast4.length !== 4) {
      setValidationError("Please enter last 4 digits of mobile number");
      return;
    }

    if (mobilePaymentType === MOBILE_PAYMENT_TYPES[0]) {
      setValidationError("Please select a Mobile Payment Type");
      return;
    }

    const newEntry: MfsPaymentEntry = {
      id: nextId,
      paymentAmount,
      mobileNoLast4,
      mobilePaymentType,
    };

    const updatedEntries = [...entries, newEntry];
    setEntries(updatedEntries);
    setNextId(nextId + 1);

    setPaymentAmount(0);
    setMobileNoLast4("");
    setMobilePaymentType(MOBILE_PAYMENT_TYPES[0]);
  };

  const handleDeleteEntry = (id: number) => {
    const updatedEntries = entries.filter((e) => e.id !== id);
    setEntries(updatedEntries);

    // Recalculate total
    const total = updatedEntries.reduce((sum, e) => sum + e.paymentAmount, 0);
    onMfsTotalChange(total);
  };

  const handleClearClick = () => {
    if (entries.length === 0) {
      // No entries, just reset form
      setPaymentAmount(0);
      setMobileNoLast4("");
      setMobilePaymentType(MOBILE_PAYMENT_TYPES[0]);
      setValidationError("");
      return;
    }
    // Show nested confirm modal
    setShowConfirmClear(true);
  };

  const handleConfirmClear = () => {
    setEntries([]);
    setPaymentAmount(0);
    setMobileNoLast4("");
    setMobilePaymentType(MOBILE_PAYMENT_TYPES[0]);
    setValidationError("");
    setShowConfirmClear(false);

    // Update total to 0
    onMfsTotalChange(0);
  };

  const handleCancelClear = () => {
    setShowConfirmClear(false);
  };

  const handleSave = () => {
    const total = entries.reduce((sum, e) => sum + e.paymentAmount, 0);
    onMfsTotalChange(total);
    onClose();
  };

  const handleMobileNoChange = (value: string) => {
    const numericValue = value.replace(/[^0-9]/g, "").slice(0, 4);
    setMobileNoLast4(numericValue);
  };

  const handleAmountChange = (value: string) => {
    const numericValue = parseInt(value.replace(/[^0-9]/g, ""), 10);
    setPaymentAmount(isNaN(numericValue) ? 0 : numericValue);
  };

  // ====================================================
  // RENDER
  // ====================================================

  if (!open) {
    return null;
  }

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-[3px]"
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            onClose();
          }
        }}
      >
        <div
          className="w-full max-w-4xl overflow-hidden rounded-2xl border border-[#DDE5DF] bg-white shadow-2xl"
          style={{ animation: "fade-up 0.3s ease both" }}
        >
          {/* ================================================= */}
          {/* HEADER */}
          {/* ================================================= */}

          <div className="flex items-center justify-between border-b border-[#E6EAE3] bg-gradient-to-r from-[#10673E] to-[#0D5A35] px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20">
                <Smartphone size={20} className="text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">MFS Payment</h2>
                <p className="mt-0.5 text-xs text-white/70">
                  Add mobile financial service payment entries
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
          {/* FORM SECTION */}
          {/* ================================================= */}

          <div className="p-6">
            {validationError && (
              <div className="mb-4 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                <X size={16} />
                {validationError}
              </div>
            )}

            {/* Form Grid - 12 column system */}
            <div className="grid grid-cols-12 gap-4">
              {/* Payment Amount - 4 cols */}
              <div className="col-span-4">
                <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-[#66736B]">
                  <Smartphone size={14} className="text-[#10673E]" />
                  Payment Amount
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-[#66736B]">
                    ৳
                  </span>
                  <input
                    type="text"
                    value={paymentAmount || ""}
                    onChange={(e) => handleAmountChange(e.target.value)}
                    placeholder="Enter amount"
                    className="h-10 w-full rounded-lg border border-[#DDE5DF] bg-white pl-8 pr-3 text-sm font-medium text-[#17231D] outline-none transition-all placeholder:text-[#9AA29C] focus:border-[#10673E] focus:ring-2 focus:ring-[#10673E]/15"
                    autoFocus
                  />
                </div>
              </div>

              {/* Mobile No (Last 4 Digit) - 4 cols */}
              <div className="col-span-4">
                <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-[#66736B]">
                  <Hash size={14} className="text-[#10673E]" />
                  Mobile No (Last 4 Digit)
                </label>
                <input
                  type="text"
                  value={mobileNoLast4}
                  onChange={(e) => handleMobileNoChange(e.target.value)}
                  placeholder="XXXX"
                  maxLength={4}
                  className="h-10 w-full rounded-lg border border-[#DDE5DF] bg-white px-3 text-sm font-medium tracking-widest text-[#17231D] outline-none transition-all placeholder:text-[#9AA29C] placeholder:tracking-normal focus:border-[#10673E] focus:ring-2 focus:ring-[#10673E]/15"
                />
              </div>

              {/* Mobile Payment Type - 4 cols */}
              <div className="col-span-4">
                <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-[#66736B]">
                  <Smartphone size={14} className="text-[#10673E]" />
                  Mobile Payment Type
                </label>
                <select
                  value={mobilePaymentType}
                  onChange={(e) => setMobilePaymentType(e.target.value)}
                  className="h-10 w-full rounded-lg border border-[#DDE5DF] bg-white px-3 text-sm text-[#17231D] outline-none transition-all focus:border-[#10673E] focus:ring-2 focus:ring-[#10673E]/15"
                >
                  {MOBILE_PAYMENT_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              {/* Add Payment Button - 4 cols, aligned to bottom */}
              <div className="col-span-4 flex items-end">
                <button
                  type="button"
                  onClick={handleAddPayment}
                  className="h-10 w-full rounded-lg bg-[#10673E] px-5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-[#0D5A35] hover:shadow-md active:scale-[0.98]"
                >
                  <Plus size={16} className="mr-1 inline" />
                  Add Payment
                </button>
              </div>
            </div>
          </div>

          {/* ================================================= */}
          {/* TABLE SECTION */}
          {/* ================================================= */}

          <div className="border-t border-[#E6EAE3] bg-[#FAFBF9]">
            <div className="px-6 py-3">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-[#66736B]">
                <Smartphone size={14} className="text-[#10673E]" />
                MFS Payment Entries
                {entries.length > 0 && (
                  <span className="rounded-full bg-[#E8F5ED] px-2 py-0.5 text-xs font-semibold text-[#10673E]">
                    {entries.length}
                  </span>
                )}
              </h3>
            </div>

            <div className="max-h-48 overflow-y-auto px-6 pb-4">
              {entries.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-[#9AA29C]">
                  <Smartphone size={32} strokeWidth={1.5} />
                  <p className="mt-3 text-sm font-medium">No MFS payment entries yet</p>
                  <p className="mt-1 text-xs">
                    Fill the form above and click "Add Payment" to add entries
                  </p>
                </div>
              ) : (
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-[#E6EAE3]">
                      <th className="pb-3 text-xs font-semibold uppercase tracking-wide text-[#8A938B]">
                        Payment Amount
                      </th>
                      <th className="pb-3 text-xs font-semibold uppercase tracking-wide text-[#8A938B]">
                        Mobile No (Last 4 Digit)
                      </th>
                      <th className="pb-3 text-xs font-semibold uppercase tracking-wide text-[#8A938B]">
                        Mobile Payment Type
                      </th>
                      <th className="pb-3 text-center text-xs font-semibold uppercase tracking-wide text-[#8A938B]">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {entries.map((entry) => (
                      <tr
                        key={entry.id}
                        className="border-b border-[#E6EAE3] transition-colors hover:bg-[#F1F8F3]"
                      >
                        <td className="py-3 font-semibold text-[#10673E]">
                          ৳{entry.paymentAmount.toLocaleString("en-IN")}
                        </td>
                        <td className="py-3 font-mono tracking-wider text-[#17231D]">
                          **** {entry.mobileNoLast4}
                        </td>
                        <td className="py-3">
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#E8F5ED] px-2.5 py-1 text-xs font-semibold text-[#10673E]">
                            {entry.mobilePaymentType}
                          </span>
                        </td>
                        <td className="py-3 text-center">
                          <button
                            type="button"
                            onClick={() => handleDeleteEntry(entry.id)}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-[#B84A4A] transition-all hover:bg-[#FCECEC] hover:shadow-sm"
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  {entries.length > 0 && (
                    <tfoot>
                      <tr className="bg-[#F1F8F3] font-semibold">
                        <td className="rounded-b-lg py-3 pl-0 text-sm text-[#66736B]">
                          Total MFS Payment:
                        </td>
                        <td
                          colSpan={2}
                          className="rounded-b-lg py-3 text-right text-lg font-bold text-[#10673E]"
                        >
                          ৳
                          {entries
                            .reduce((sum, e) => sum + e.paymentAmount, 0)
                            .toLocaleString("en-IN")}
                        </td>
                        <td className="rounded-b-lg" />
                      </tr>
                    </tfoot>
                  )}
                </table>
              )}
            </div>
          </div>

          {/* ================================================= */}
          {/* FOOTER */}
          {/* ================================================= */}

          <div className="flex items-center justify-between border-t border-[#E6EAE3] bg-white px-6 py-4">
            <div className="text-sm text-[#66736B]">
              <span className="font-medium">Total Entries:</span>{" "}
              <span className="font-semibold text-[#17231D]">
                {entries.length}
              </span>
              <span className="mx-2">|</span>
              <span className="font-medium">Total Amount:</span>{" "}
              <span className="font-bold text-[#10673E]">
                ৳
                {entries
                  .reduce((sum, e) => sum + e.paymentAmount, 0)
                  .toLocaleString("en-IN")}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleClearClick}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-[#DDE5DF] bg-white px-5 text-sm font-medium text-[#66736B] transition-all hover:border-[#10673E] hover:bg-[#F1F8F3] hover:text-[#10673E] active:scale-[0.98]"
              >
                Clear
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#10673E] px-5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-[#0D5A35] hover:shadow-md active:scale-[0.98]"
              >
                Save Payment
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ================================================= */}
      {/* NESTED CONFIRM MODAL */}
      {/* ================================================= */}

      <ConfirmClearModal
        open={showConfirmClear}
        onConfirm={handleConfirmClear}
        onCancel={handleCancelClear}
        entryCount={entries.length}
      />
    </>
  );
}

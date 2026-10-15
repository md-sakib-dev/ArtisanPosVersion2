import { useEffect, useState } from "react";
import { X, FileText, Plus, Trash2, AlertTriangle, Hash } from "lucide-react";
import { slipCheck } from "../api/slipCheck";
import {
  getTransactionChannelOptionsByChannel,
  type DropdownOption,
} from "../api/transactionChannelApi";
import {
  PAYMENT_CHANNEL_IDS,
  type ChannelPaymentEntry,
} from "../types/payment";

// ======================================================
// TYPES
// ======================================================

interface SlipPaymentEntry {
  id: number;
  creditSlipAmount: number;
  creditSlipNo: string;
  channelOptionId: number;
}

interface SlipPaymentModalProps {
  open: boolean;
  onClose: () => void;
  onSlipEntriesChange: (entries: ChannelPaymentEntry[]) => void;
  /** Slip types from GET /api/TransactionChannels, loaded by the sale screen. */
  channelOptions?: DropdownOption[];
}

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
            slip {entryCount === 1 ? "entry" : "entries"}?
          </p>
          <p className="mt-2 text-sm text-[#6B7280]">
            All added slip payment data will be removed.
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
// SLIP PAYMENT MODAL
// ======================================================

export default function SlipPaymentModal({
  open,
  onClose,
  onSlipEntriesChange,
  channelOptions: providedChannelOptions,
}: SlipPaymentModalProps) {
  // ====================================================
  // STATE
  // ====================================================

  const [entries, setEntries] = useState<SlipPaymentEntry[]>([]);
  const [creditSlipAmount, setCreditSlipAmount] = useState<number>(0);
  const [creditSlipNo, setCreditSlipNo] = useState<string>("");
  /* Options come from the parent; the local fetch below is only a fallback
     for screens that do not load the channel list themselves. */
  const [fetchedChannelOptions, setFetchedChannelOptions] = useState<
    DropdownOption[]
  >([]);
  const channelOptions = providedChannelOptions ?? fetchedChannelOptions;
  const [channelOptionId, setChannelOptionId] = useState<number>(0);
  const [validationError, setValidationError] = useState<string>("");
  const [nextId, setNextId] = useState(1);
  const [showConfirmClear, setShowConfirmClear] = useState(false);
  const [saveNotice, setSaveNotice] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  /* Slip types come from the transaction-channel-options endpoint. */
  useEffect(() => {
    if (!open || providedChannelOptions) return;

    let cancelled = false;

    getTransactionChannelOptionsByChannel(PAYMENT_CHANNEL_IDS.slip)
      .then((options) => {
        if (!cancelled) setFetchedChannelOptions(options);
      })
      .catch((error) => {
        console.error("Slip channel options error:", error);
      });

    return () => {
      cancelled = true;
    };
  }, [open, providedChannelOptions]);

  /* Every field is mandatory before an entry can be added. */
  const isFormValid =
    creditSlipAmount > 0 &&
    creditSlipNo.trim().length > 0 &&
    channelOptionId > 0;

  /* Parent only needs the amount, the slip no and the channel option. */
  const toSummaries = (list: SlipPaymentEntry[]): ChannelPaymentEntry[] =>
    list.map((entry) => ({
      amount: entry.creditSlipAmount,
      channelOptionId: entry.channelOptionId,
      refNo: entry.creditSlipNo,
    }));

  // ====================================================
  // HANDLERS
  // ====================================================

  const handleAddPayment = async () => {
  setValidationError("");
  setSaveNotice(null);

  if (!creditSlipAmount || creditSlipAmount <= 0) {
    setValidationError("Please enter a valid slip amount");
    setSaveNotice({ type: "error", text: "Please enter a valid slip amount" });
    return;
  }

  if (!creditSlipNo || creditSlipNo.trim() === "") {
    setValidationError("Please enter a credit slip number");
    setSaveNotice({ type: "error", text: "Please enter a credit slip number" });
    return;
  }

  if (channelOptionId <= 0) {
    setValidationError("Please select a Slip Type");
    setSaveNotice({ type: "error", text: "Please select a Slip Type" });
    return;
  }

  try {
    const slip = await slipCheck(
      creditSlipNo.trim(),
      creditSlipAmount,
    );

    if (!slip) {
      setValidationError("Invalid or unavailable credit slip");
      setSaveNotice({ type: "error", text: "Invalid or unavailable credit slip" });
      return;
    }

    // Slip is valid, so add it
    const newEntry: SlipPaymentEntry = {
      id: nextId,
      creditSlipAmount,
      creditSlipNo: creditSlipNo.trim(),
      channelOptionId,
    };

    const updatedEntries = [...entries, newEntry];

    setEntries(updatedEntries);
    onSlipEntriesChange(toSummaries(updatedEntries));
    setNextId(nextId + 1);

    setCreditSlipAmount(0);
    setCreditSlipNo("");
    setChannelOptionId(0);

    setSaveNotice({ type: "success", text: "Payment entry added successfully." });

  } catch (error) {
    console.error("Slip validation error:", error);
    setValidationError("Unable to verify credit slip");
    setSaveNotice({ type: "error", text: "Unable to verify credit slip" });
  }
};

  const handleDeleteEntry = (id: number) => {
    const updatedEntries = entries.filter((e) => e.id !== id);
    setEntries(updatedEntries);

    onSlipEntriesChange(toSummaries(updatedEntries));
  };

  const handleClearClick = () => {
    if (entries.length === 0) {
      // No entries, just reset form
      setCreditSlipAmount(0);
      setCreditSlipNo("");
      setChannelOptionId(0);
      setValidationError("");
      setSaveNotice(null);
      return;
    }
    // Show nested confirm modal
    setShowConfirmClear(true);
  };

  const handleConfirmClear = () => {
    setEntries([]);
    setCreditSlipAmount(0);
    setCreditSlipNo("");
    setChannelOptionId(0);
    setValidationError("");
    setSaveNotice(null);
    setShowConfirmClear(false);

    // Clear the parent totals too
    onSlipEntriesChange([]);
  };

  const handleCancelClear = () => {
    setShowConfirmClear(false);
  };

  const handleSave = () => {
    if (entries.length === 0) {
      setSaveNotice({
        type: "error",
        text: "Add at least one entry before saving.",
      });
      return;
    }

    onSlipEntriesChange(toSummaries(entries));
    onClose();
  };

  const handleAmountChange = (value: string) => {
    const numericValue = parseInt(value.replace(/[^0-9]/g, ""), 10);
    setCreditSlipAmount(isNaN(numericValue) ? 0 : numericValue);
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
                <FileText size={20} className="text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Slip Payment</h2>
                <p className="mt-0.5 text-xs text-white/70">
                  Add credit slip payment entries
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
              {/* Credit Slip Amount - 4 cols */}
              <div className="col-span-4">
                <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-[#66736B]">
                  <FileText size={14} className="text-[#10673E]" />
                  Credit Slip Amount
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-[#66736B]">
                    ৳
                  </span>
                  <input
                    type="text"
                    value={creditSlipAmount || ""}
                    onChange={(e) => handleAmountChange(e.target.value)}
                    placeholder="Enter amount"
                    className="h-10 w-full rounded-lg border border-[#DDE5DF] bg-white pl-8 pr-3 text-sm font-medium text-[#17231D] outline-none transition-all placeholder:text-[#9AA29C] focus:border-[#0E9351] focus:ring-2 focus:ring-[#0E9351]/15"
                    autoFocus
                  />
                </div>
              </div>

              {/* Credit Slip No - 4 cols */}
              <div className="col-span-4">
                <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-[#66736B]">
                  <Hash size={14} className="text-[#10673E]" />
                  Credit Slip No
                </label>
                <input
                  type="text"
                  value={creditSlipNo}
                  onChange={(e) => setCreditSlipNo(e.target.value)}
                  placeholder="Enter slip number"
                  className="h-10 w-full rounded-lg border border-[#DDE5DF] bg-white px-3 text-sm font-medium text-[#17231D] outline-none transition-all placeholder:text-[#9AA29C] focus:border-[#0E9351] focus:ring-2 focus:ring-[#0E9351]/15"
                />
              </div>

              {/* Slip Type (channel option) - 4 cols */}
              <div className="col-span-4">
                <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-[#66736B]">
                  <FileText size={14} className="text-[#10673E]" />
                  Slip Type
                </label>
                <select
                  value={channelOptionId}
                  onChange={(e) => setChannelOptionId(Number(e.target.value))}
                  className="h-10 w-full rounded-lg border border-[#DDE5DF] bg-white px-3 text-sm text-[#17231D] outline-none transition-all focus:border-[#0E9351] focus:ring-2 focus:ring-[#0E9351]/15"
                >
                  <option value={0}>Select Slip Type</option>
                  {channelOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.text}
                    </option>
                  ))}
                  {channelOptions.length === 0 && (
                    <option value={0} disabled>
                      No payment types configured for this channel
                    </option>
                  )}
                </select>
              </div>

              {/* Add Payment Button - 4 cols, aligned to bottom */}
              <div className="col-span-4 flex items-end">
                <button
                  type="button"
                  onClick={handleAddPayment}
                  disabled={!isFormValid}
                  title={isFormValid ? undefined : "Fill every field to add"}
                  className={`h-10 w-full rounded-lg bg-[#0E9351] px-5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-[#10673E] hover:shadow-md active:scale-[0.98] ${
                    isFormValid
                      ? ""
                      : "cursor-not-allowed opacity-50 hover:bg-[#0E9351]"
                  }`}
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
                <FileText size={14} className="text-[#10673E]" />
                Slip Payment Entries
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
                  <FileText size={32} strokeWidth={1.5} />
                  <p className="mt-3 text-sm font-medium">No slip payment entries yet</p>
                  <p className="mt-1 text-xs">
                    Fill the form above and click "Add Payment" to add entries
                  </p>
                </div>
              ) : (
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-[#E6EAE3]">
                      <th className="pb-3 text-xs font-semibold uppercase tracking-wide text-[#8A938B]">
                        Credit Slip Amount
                      </th>
                      <th className="pb-3 text-xs font-semibold uppercase tracking-wide text-[#8A938B]">
                        Credit Slip No
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
                          ৳{entry.creditSlipAmount.toLocaleString("en-IN")}
                        </td>
                        <td className="py-3 font-mono tracking-wider text-[#17231D]">
                          {entry.creditSlipNo}
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
                          Total Slip Payment:
                        </td>
                        <td
                          colSpan={1}
                          className="rounded-b-lg py-3 text-right text-lg font-bold text-[#10673E]"
                        >
                          ৳
                          {entries
                            .reduce((sum, e) => sum + e.creditSlipAmount, 0)
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
                  .reduce((sum, e) => sum + e.creditSlipAmount, 0)
                  .toLocaleString("en-IN")}
              </span>
            </div>
            <div className="flex items-center gap-3">
              {saveNotice && (
                <span
                  className={`inline-flex items-center rounded-md border px-2.5 py-1.5 text-xs font-medium ${
                    saveNotice.type === "success"
                      ? "border-[#B7E2C7] bg-[#E8F5ED] text-[#10673E]"
                      : "border-[#F3C2C2] bg-[#FCECEC] text-[#B84A4A]"
                  }`}
                >
                  {saveNotice.text}
                </span>
              )}

              <button
                type="button"
                onClick={handleClearClick}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-[#DDE5DF] bg-white px-5 text-sm font-medium text-[#66736B] transition-all hover:border-[#0E9351] hover:bg-[#F1F8F3] hover:text-[#10673E] active:scale-[0.98]"
              >
                Clear
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#0E9351] px-5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-[#10673E] hover:shadow-md active:scale-[0.98]"
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

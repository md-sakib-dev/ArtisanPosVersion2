import { useState, useEffect, useMemo, useRef } from "react";
import {
  CreditCard,
  Plus,
  Pencil,
  Trash2,
  X,
  Search,
  Filter,
  Save,
  AlertTriangle,
  RefreshCw,
  Loader2,
} from "lucide-react";
import {
  getTransactionChannelOptions,
  getTransactionChannelDropdown,
  createTransactionChannelOption,
  type TransactionChannelOption,
  type TransactionChannelOptionCreateDto,
  type DropdownOption,
} from "../../api/transactionChannelApi";

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

const getErrMessage = (err: unknown, fallback: string): string => {
  const anyErr = err as { response?: { data?: { message?: string } } };
  return anyErr?.response?.data?.message || fallback;
};

/** Load payment types — throws with a friendly message on failure. */
const listPaymentTypes = async (): Promise<TransactionChannelOption[]> => {
  const res = await getTransactionChannelOptions();
  if (!res.success || !Array.isArray(res.data)) {
    throw new Error(res.message || "Failed to load payment types");
  }
  return res.data;
};

/** Load transaction channel dropdown options. */
const listChannelOptions = (): Promise<DropdownOption[]> =>
  getTransactionChannelDropdown();

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
      {type === "success" ? <RefreshCw size={18} /> : <X size={18} />}
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
/* Payment Type Modal — native <dialog>                                */
/*                                                                     */
/* Conditionally rendered by the parent, so form state initializes     */
/* fresh on every mount (new entry or edit) with no reset effects.     */
/* ------------------------------------------------------------------ */

interface PaymentTypeFormState {
  channelId: string;
  optionCode: string;
  optionName: string;
}

function PaymentTypeModal({
  editing,
  channels,
  channelsLoading,
  channelsError,
  saving,
  onClose,
  onSave,
  onRetryChannels,
}: {
  editing: TransactionChannelOption | null;
  channels: DropdownOption[];
  channelsLoading: boolean;
  channelsError: string | null;
  saving: boolean;
  onClose: () => void;
  onSave: (
    dto: TransactionChannelOptionCreateDto,
    editingId: number | null
  ) => void;
  onRetryChannels: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [form, setForm] = useState<PaymentTypeFormState>(() =>
    editing
      ? {
          channelId: String(editing.channelId),
          optionCode: editing.optionCode ?? "",
          optionName: editing.optionName ?? "",
        }
      : { channelId: "", optionCode: "", optionName: "" }
  );
  const [formError, setFormError] = useState<string | null>(null);

  const isEdit = Boolean(editing);

  // Open the native dialog on mount (DOM only — no state updates)
  useEffect(() => {
    const dlg = dialogRef.current;
    if (dlg && !dlg.open) dlg.showModal();
  }, []);

  // Cancel via Esc → route through onClose
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

  const selectedChannel = channels.find((c) => c.value === form.channelId);

  const update = (field: keyof PaymentTypeFormState, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setFormError(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;

    // ---------- VALIDATION ----------
    if (!form.channelId) {
      setFormError("Please select a transaction channel.");
      return;
    }
    if (!form.optionCode.trim()) {
      setFormError("Please enter a code.");
      return;
    }
    if (!form.optionName.trim()) {
      setFormError("Please enter a name.");
      return;
    }

    // ---------- SINGLE DTO (NOT an array) ----------
    onSave(
      {
        channelOptionId: editing?.channelOptionId ?? 0,
        channelId: Number(form.channelId),
        channelName: selectedChannel?.text ?? "",
        optionCode: form.optionCode.trim(),
        optionName: form.optionName.trim(),
      },
      editing?.channelOptionId ?? null
    );
  };

  return (
    <dialog
      ref={dialogRef}
      className="m-auto w-full max-w-xl rounded-2xl border border-[#E5E7EB] bg-white p-0 shadow-2xl backdrop:bg-black/40 backdrop:backdrop-blur-[2px]"
    >
      <div className="flex max-h-[85vh] flex-col overflow-hidden rounded-2xl">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-[#E5E7EB] px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#10673E]/10 text-[#10673E]">
              {isEdit ? <Pencil size={17} /> : <Plus size={17} />}
            </div>
            <div>
              <h2 className="text-[15px] font-bold text-[#1F2937]">
                {isEdit ? "Edit Payment Type" : "Add Payment Type"}
              </h2>
              <p className="text-[11.5px] text-[#94A3B8]">
                {isEdit
                  ? `Editing ${editing?.optionName} — update details below`
                  : "Fill in the payment type details below"}
              </p>
            </div>
            {isEdit && (
              <span className="ml-1 rounded-md bg-[#F59E0B]/10 px-2 py-0.5 text-[11px] font-semibold text-[#D97706]">
                Update Mode
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-[#94A3B8] transition-colors hover:bg-[#F1F5F9] hover:text-[#64748B] disabled:opacity-50"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <form
          onSubmit={handleSubmit}
          className="min-h-0 flex-1 overflow-y-auto"
        >
          <div className="space-y-4 p-6">
            {/* TRANSACTION CHANNEL */}
            <div>
              <label className="mb-1.5 block text-[13px] font-semibold text-[#374151]">
                Channel <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <select
                  value={form.channelId}
                  onChange={(e) => update("channelId", e.target.value)}
                  disabled={channelsLoading || !!channelsError || saving}
                  required
                  className="h-10 w-full appearance-none rounded-lg border border-[#D1D5DB] bg-white px-3 pr-9 text-[13px] text-[#1F2937] outline-none transition-colors focus:border-[#10673E] focus:ring-2 focus:ring-[#10673E]/15 disabled:cursor-not-allowed disabled:bg-[#F9FAFB] disabled:text-[#9CA3AF]"
                >
                  <option value="">
                    {channelsLoading
                      ? "Loading channels..."
                      : channelsError
                        ? "Channels unavailable"
                        : "Select Channel"}
                  </option>
                  {channels.map((ch) => (
                    <option key={ch.value} value={ch.value}>
                      {ch.text}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]">
                  {channelsLoading ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : channelsError ? (
                    <AlertTriangle size={14} className="text-[#D97706]" />
                  ) : (
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="m6 9 6 6 6-6" />
                    </svg>
                  )}
                </div>
              </div>
              {channelsError && (
                <button
                  type="button"
                  onClick={onRetryChannels}
                  className="mt-1.5 inline-flex items-center gap-1 text-[11.5px] font-medium text-[#D97706] hover:text-[#B45309]"
                >
                  <RefreshCw size={11} />
                  Retry loading channels
                </button>
              )}
            </div>

            {/* CODE */}
            <div>
              <label className="mb-1.5 block text-[13px] font-semibold text-[#374151]">
                Code <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.optionCode}
                onChange={(e) => update("optionCode", e.target.value)}
                disabled={saving}
                placeholder="Enter Option Code (e.g. CASH)"
                maxLength={50}
                className="h-10 w-full rounded-lg border border-[#D1D5DB] bg-white px-3 text-[13px] uppercase text-[#1F2937] outline-none transition-colors placeholder:normal-case placeholder:text-[#9CA3AF] focus:border-[#10673E] focus:ring-2 focus:ring-[#10673E]/15 disabled:cursor-not-allowed disabled:bg-[#F9FAFB]"
              />
            </div>

            {/* NAME */}
            <div>
              <label className="mb-1.5 block text-[13px] font-semibold text-[#374151]">
                Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.optionName}
                onChange={(e) => update("optionName", e.target.value)}
                disabled={saving}
                placeholder="Enter Option Name (e.g. Cash Payment)"
                maxLength={100}
                className="h-10 w-full rounded-lg border border-[#D1D5DB] bg-white px-3 text-[13px] text-[#1F2937] outline-none transition-colors placeholder:text-[#9CA3AF] focus:border-[#10673E] focus:ring-2 focus:ring-[#10673E]/15 disabled:cursor-not-allowed disabled:bg-[#F9FAFB]"
              />
            </div>

            {/* Inline validation error */}
            {formError && (
              <p className="flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[12.5px] font-medium text-red-600">
                <AlertTriangle size={14} />
                {formError}
              </p>
            )}
          </div>

          {/* Modal Footer */}
          <div className="border-t border-[#E5E7EB] bg-[#FAFBFC] px-6 py-4">
            <div className="flex items-center justify-between">
              <p className="text-[12px] text-[#94A3B8]">
                All fields marked with <span className="text-red-500">*</span>{" "}
                are required
              </p>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={saving}
                  className="flex items-center gap-2 rounded-lg border border-[#D1D5DB] bg-white px-4 py-2.5 text-[13px] font-medium text-[#6B7280] transition-all hover:bg-[#F9FAFB] hover:text-[#374151] disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-2 rounded-lg bg-[#10673E] px-5 py-2.5 text-[13px] font-semibold text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#0D5A35] hover:shadow-md disabled:translate-y-0 disabled:opacity-60"
                >
                  {saving ? (
                    <Loader2 size={15} className="animate-spin" />
                  ) : (
                    <Save size={15} />
                  )}
                  {saving ? "Saving..." : isEdit ? "Update" : "Save"}
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </dialog>
  );
}

// ======================================================
// PAGE
// ======================================================

export default function PaymentTypeManagement() {
  // --------------------------------------------------
  // DATA (complete API result — never filtered in place)
  // --------------------------------------------------
  const [data, setData] = useState<TransactionChannelOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // --------------------------------------------------
  // TRANSACTION CHANNEL DROPDOWN
  // --------------------------------------------------
  const [channels, setChannels] = useState<DropdownOption[]>([]);
  const [channelsLoading, setChannelsLoading] = useState(true);
  const [channelsError, setChannelsError] = useState<string | null>(null);

  // --------------------------------------------------
  // MODAL STATE
  // --------------------------------------------------
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<TransactionChannelOption | null>(null);
  const [saving, setSaving] = useState(false);

  // --------------------------------------------------
  // FILTER STATE
  // --------------------------------------------------
  const [searchTerm, setSearchTerm] = useState("");
  /* Channel filter — "" = All channels. Only affects the VIEW: the full
   * API result stays untouched in `data`. */
  const [filterChannelId, setFilterChannelId] = useState("");

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
  /*
   * Returns the update promise so save handlers can await the refresh.
   * Called from event handlers (retry, after-save) and — via promise
   * callbacks — from the mount effect below.
   */
  const fetchOptions = (): Promise<void> => {
    setLoading(true);
    return listPaymentTypes()
      .then((list) => {
        setData(list);
        setLoadError(null);
      })
      .catch((err) => {
        console.error("Failed to load payment types:", err);
        setLoadError(
          getErrMessage(err, "Failed to load payment types. Please try again.")
        );
      })
      .finally(() => setLoading(false));
  };

  const loadChannels = (): Promise<void> => {
    setChannelsLoading(true);
    return listChannelOptions()
      .then((list) => {
        setChannels(list);
        setChannelsError(null);
      })
      .catch((err) => {
        console.error("Failed to load transaction channels:", err);
        setChannelsError(
          getErrMessage(err, "Failed to load transaction channels.")
        );
      })
      .finally(() => setChannelsLoading(false));
  };

  /* Initial load — state updates happen inside promise callbacks. */
  useEffect(() => {
    let cancelled = false;

    listPaymentTypes()
      .then((list) => {
        if (cancelled) return;
        setData(list);
        setLoadError(null);
      })
      .catch((err) => {
        if (cancelled) return;
        console.error("Failed to load payment types:", err);
        setLoadError(
          getErrMessage(err, "Failed to load payment types. Please try again.")
        );
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    listChannelOptions()
      .then((list) => {
        if (cancelled) return;
        setChannels(list);
        setChannelsError(null);
      })
      .catch((err) => {
        if (cancelled) return;
        console.error("Failed to load transaction channels:", err);
        setChannelsError(
          getErrMessage(err, "Failed to load transaction channels.")
        );
      })
      .finally(() => {
        if (!cancelled) setChannelsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  // --------------------------------------------------
  // DERIVED
  // --------------------------------------------------
  /*
   * Derive the table rows from the COMPLETE API list:
   * allPaymentTypes → channel filter (channelId) → search term → table.
   * `data` itself is never mutated or permanently filtered.
   */
  const filteredData = useMemo(() => {
    const byChannel = filterChannelId
      ? data.filter((item) => item.channelId === Number(filterChannelId))
      : data;

    const term = searchTerm.trim().toLowerCase();
    if (!term) return byChannel;
    return byChannel.filter(
      (item) =>
        item.optionName?.toLowerCase().includes(term) ||
        item.optionCode?.toLowerCase().includes(term) ||
        item.channelName?.toLowerCase().includes(term)
    );
  }, [data, searchTerm, filterChannelId]);

  const uniqueChannelCount = useMemo(
    () => new Set(data.map((item) => item.channelId)).size,
    [data]
  );

  // --------------------------------------------------
  // HANDLERS
  // --------------------------------------------------
  const handleAddNew = () => {
    setEditing(null);
    setModalOpen(true);
  };

  const handleEdit = (item: TransactionChannelOption) => {
    setEditing(item);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    if (saving) return;
    setModalOpen(false);
    setEditing(null);
  };

  const handleSave = async (
    dto: TransactionChannelOptionCreateDto,
    editingId: number | null
  ) => {
    if (saving) return;

    // Duplicate code within the same channel
    const duplicate = data.find(
      (item) =>
        item.channelId === dto.channelId &&
        item.optionCode.trim().toLowerCase() === dto.optionCode.toLowerCase() &&
        item.channelOptionId !== editingId
    );
    if (duplicate) {
      setToast({
        message: `Code "${dto.optionCode}" already exists in ${
          dto.channelName || "this channel"
        }`,
        type: "error",
      });
      return;
    }

    setSaving(true);
    try {
      const res = await createTransactionChannelOption(dto);
      if (res.success === false) throw new Error(res.message || "Failed to save");

      setToast({
        message:
          editingId !== null
            ? "Payment type updated successfully"
            : "Payment type added successfully",
        type: "success",
      });
      // Close the modal, keep the channel filter, reload the list
      setModalOpen(false);
      setEditing(null);
      await fetchOptions();
    } catch (err) {
      console.error("Failed to save payment type:", err);
      setToast({
        message: getErrMessage(err, "Failed to save payment type. Please try again."),
        type: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (item: TransactionChannelOption) => {
    setData((prev) =>
      prev.filter((row) => row.channelOptionId !== item.channelOptionId)
    );
    setToast({ message: "Payment type deleted", type: "success" });
    if (editing?.channelOptionId === item.channelOptionId) {
      setModalOpen(false);
      setEditing(null);
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
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        )}

        {/* HEADER */}
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#10673E]/10 text-[#10673E]">
              <CreditCard size={20} />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-[#1F2937] md:text-2xl">
                Payment Type Management
              </h1>
              <p className="mt-0.5 text-[12.5px] text-[#6B7280]">
                Manage transaction channels and their payment options
              </p>
            </div>
          </div>
          <button
            onClick={handleAddNew}
            className="flex h-10 items-center gap-2 rounded-lg bg-[#10673E] px-4 text-[13px] font-semibold text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#0D5A35] hover:shadow-md active:scale-[0.98]"
          >
            <Plus size={16} />
            Add Payment Type
          </button>
        </header>

        {/* TOTAL RECORDS */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-xl border border-[#10673E] bg-[#E8F5ED] px-4 py-2.5 shadow-sm">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-[#10673E]/15 text-[#10673E]">
              <CreditCard size={14} />
            </div>
            <div>
              <p className="text-[12px] font-semibold text-[#10673E]">
                All Payment Types
              </p>
              <p className="text-[11px] text-[#94A3B8]">
                {data.length} total records · {uniqueChannelCount} channels
              </p>
            </div>
          </div>
        </div>

        {/* DATA TABLE */}
        <div className="overflow-hidden rounded-xl border border-[#E5E7EB] bg-white shadow-xs">
          {/* Table Header */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E5E7EB] bg-[#FAFBFC] px-5 py-3">
            <div className="flex items-center gap-2">
              <h2 className="text-[14px] font-bold text-[#1F2937]">
                Payment Types
              </h2>
              <span className="rounded-md bg-[#10673E]/10 px-2.5 py-1 text-[11px] font-semibold text-[#10673E]">
                {filteredData.length} records
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {/* CHANNEL FILTER — filters the table by channelId */}
              <div className="relative">
                <select
                  value={filterChannelId}
                  onChange={(e) => setFilterChannelId(e.target.value)}
                  disabled={channelsLoading || !!channelsError}
                  className="h-9 w-full appearance-none rounded-lg border border-[#D1D5DB] bg-white pl-3 pr-8 text-[13px] text-[#1F2937] outline-none transition-colors focus:border-[#10673E] focus:ring-2 focus:ring-[#10673E]/15 disabled:cursor-not-allowed disabled:bg-[#F9FAFB] disabled:text-[#9CA3AF] sm:w-44"
                >
                  <option value="">
                    {channelsLoading
                      ? "Loading..."
                      : channelsError
                        ? "Channels unavailable"
                        : "All Channels"}
                  </option>
                  {channels.map((ch) => (
                    <option key={ch.value} value={ch.value}>
                      {ch.text}
                    </option>
                  ))}
                </select>
                <Filter
                  size={12}
                  className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]"
                />
              </div>

              {/* SEARCH */}
              <div className="relative">
                <Search
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]"
                />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search payment types..."
                  className="h-9 w-full rounded-lg border border-[#D1D5DB] bg-white pl-9 pr-3 text-[13px] text-[#1F2937] outline-none placeholder:text-[#9CA3AF] focus:border-[#10673E] focus:ring-2 focus:ring-[#10673E]/15 sm:w-64"
                />
              </div>
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
                onClick={fetchOptions}
                className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-white px-3 py-1.5 text-[12px] font-semibold text-red-600 transition-colors hover:bg-red-50"
              >
                <RefreshCw size={12} />
                Retry
              </button>
            </div>
          )}

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[13px]">
              <thead>
                <tr className="border-b border-[#E5E7EB] bg-[#F8FAFC]">
                  <th className="px-5 py-3 font-semibold text-[#6B7280]">SL</th>
                  <th className="px-5 py-3 font-semibold text-[#6B7280]">
                    Transaction Channel
                  </th>
                  <th className="px-5 py-3 font-semibold text-[#6B7280]">Code</th>
                  <th className="px-5 py-3 font-semibold text-[#6B7280]">Name</th>
                  <th className="px-5 py-3 text-right font-semibold text-[#6B7280]">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-5 py-16 text-center">
                      <div className="flex flex-col items-center justify-center text-[#94A3B8]">
                        <Loader2 size={28} className="animate-spin text-[#10673E]" />
                        <p className="mt-2 text-[13px] font-medium">
                          Loading payment types...
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : filteredData.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-5 py-16 text-center">
                      <div className="flex flex-col items-center justify-center text-[#94A3B8]">
                        <CreditCard size={30} strokeWidth={1.5} />
                        <p className="mt-2 text-[13px] font-medium">
                          No payment types found
                        </p>
                        <p className="mt-1 text-[12px]">
                          {searchTerm || filterChannelId
                            ? "Try a different filter or search term"
                            : loadError
                              ? "Fix the connection and retry"
                              : "Click Add Payment Type to create one"}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredData.map((item, index) => (
                    <tr
                      key={item.channelOptionId}
                      className={`border-b border-[#F1F5F9] transition-colors hover:bg-[#F8FAFC] ${
                        editing?.channelOptionId === item.channelOptionId
                          ? "bg-[#E8F5ED]/50"
                          : ""
                      }`}
                    >
                      <td className="px-5 py-3 text-[#94A3B8]">{index + 1}</td>
                      <td className="px-5 py-3">
                        <span className="inline-flex items-center gap-1.5 rounded-md bg-[#F1F5F9] px-2.5 py-1 text-[12px] font-medium text-[#475569]">
                          {item.channelName || `Channel #${item.channelId}`}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <span className="rounded-md bg-[#10673E]/10 px-2 py-0.5 font-mono text-[12px] font-semibold text-[#10673E]">
                          {item.optionCode}
                        </span>
                      </td>
                      <td className="px-5 py-3 font-medium text-[#1F2937]">
                        {item.optionName}
                      </td>
                      <td className="px-5 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleEdit(item)}
                            className="flex h-7 w-7 items-center justify-center rounded-md text-[#64748B] transition-colors hover:bg-[#E8F5ED] hover:text-[#10673E]"
                            title="Edit"
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            onClick={() => handleDelete(item)}
                            className="flex h-7 w-7 items-center justify-center rounded-md text-[#94A3B8] transition-colors hover:bg-[#FEE2E2] hover:text-[#DC2626]"
                            title="Delete"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Table Footer */}
          {!loading && filteredData.length > 0 && (
            <div className="flex items-center justify-between border-t border-[#E5E7EB] bg-[#FAFBFC] px-5 py-3">
              <p className="text-[12px] text-[#94A3B8]">
                Showing {filteredData.length} of {data.length} payment types
              </p>
              <p className="text-[12px] text-[#94A3B8]">
                Use Add Payment Type or the row edit action to open the entry
                modal
              </p>
            </div>
          )}
        </div>

        {/* -------- Payment Type Modal (native <dialog>, page level) -------- */}
        {modalOpen && (
          <PaymentTypeModal
            editing={editing}
            channels={channels}
            channelsLoading={channelsLoading}
            channelsError={channelsError}
            saving={saving}
            onClose={handleCloseModal}
            onSave={handleSave}
            onRetryChannels={loadChannels}
          />
        )}
      </div>
    </div>
  );
}

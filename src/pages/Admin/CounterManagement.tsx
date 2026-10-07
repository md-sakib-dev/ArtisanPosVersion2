import { useState, useEffect, useMemo, useRef } from "react";
import {
  Monitor,
  Plus,
  Pencil,
  Trash2,
  X,
  Check,
  Search,
  Globe,
  Hash,
  Wifi,
  Building2,
  Save,
  AlertTriangle,
  RefreshCw,
  Loader2,
} from "lucide-react";
import { getBranchOptions, type DropdownOption } from "../../api/userApi";
import {
  getPOSCounters,
  createPOSCounter,
  updatePOSCounter,
  type POSCounter,
} from "../../api/counterApi";

const getErrMessage = (err: unknown, fallback: string): string => {
  const anyErr = err as { response?: { data?: { message?: string } } };
  return anyErr?.response?.data?.message || fallback;
};

// ======================================================
// TYPES
// ======================================================

interface Counter {
  id: number;
  branchId: number;
  branchName: string;
  counterName: string;
  counterCode: string;
  ipAddress: string;
  macAddress: string;
}

/** Map an API counter row to the page's row model. */
const toRow = (c: POSCounter): Counter => ({
  id: c.counterId,
  branchId: c.branchId,
  branchName: c.branchName ?? "",
  counterName: c.counterName,
  counterCode: c.counterCode,
  ipAddress: c.ipAddress,
  macAddress: c.macAddress,
});

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
/* Counter Modal — native <dialog>                                     */
/*                                                                     */
/* Conditionally rendered by the parent, so form state initializes     */
/* fresh on every mount (new entry or edit) with no reset effects.     */
/* ------------------------------------------------------------------ */

interface CounterFormState {
  branchId: string;
  counterName: string;
  counterCode: string;
  ipAddress: string;
  macAddress: string;
}

function CounterModal({
  editing,
  branches,
  branchesLoading,
  branchesError,
  saving,
  onClose,
  onSave,
  onRetryBranches,
}: {
  editing: Counter | null;
  branches: DropdownOption[];
  branchesLoading: boolean;
  branchesError: string | null;
  saving: boolean;
  onClose: () => void;
  onSave: (form: CounterFormState, editingId: number | null) => void;
  onRetryBranches: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [form, setForm] = useState<CounterFormState>(() =>
    editing
      ? {
          branchId: String(editing.branchId),
          counterName: editing.counterName,
          counterCode: editing.counterCode,
          ipAddress: editing.ipAddress,
          macAddress: editing.macAddress,
        }
      : { branchId: "", counterName: "", counterCode: "", ipAddress: "", macAddress: "" }
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

  const update = <K extends keyof CounterFormState>(
    field: K,
    value: CounterFormState[K]
  ) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setFormError(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;

    // ---------- VALIDATION ----------
    if (!form.branchId) {
      setFormError("Please select a branch.");
      return;
    }
    if (!form.counterName.trim()) {
      setFormError("Counter name is required.");
      return;
    }
    if (!form.counterCode.trim()) {
      setFormError("Counter code is required.");
      return;
    }
    if (!form.ipAddress.trim()) {
      setFormError("IP address is required.");
      return;
    }
    if (!form.macAddress.trim()) {
      setFormError("MAC address is required.");
      return;
    }

    onSave(
      {
        branchId: form.branchId,
        counterName: form.counterName.trim(),
        counterCode: form.counterCode.trim(),
        ipAddress: form.ipAddress.trim(),
        macAddress: form.macAddress.trim(),
      },
      editing?.id ?? null
    );
  };

  const inputClass =
    "h-10 w-full rounded-lg border border-[#D1D5DB] bg-white px-3 text-[13px] text-[#1F2937] outline-none transition-colors placeholder:text-[#9CA3AF] focus:border-[#10673E] focus:ring-2 focus:ring-[#10673E]/15 disabled:cursor-not-allowed disabled:bg-[#F9FAFB]";
  const labelClass =
    "mb-1.5 flex items-center gap-1.5 text-[13px] font-semibold text-[#374151]";

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
                {isEdit ? "Edit Counter" : "Add New Counter"}
              </h2>
              <p className="text-[11.5px] text-[#94A3B8]">
                {isEdit
                  ? `Editing ${editing?.counterName} — update details below`
                  : "Configure a POS counter device"}
              </p>
            </div>
            {isEdit && (
              <span className="ml-1 rounded-md bg-[#F59E0B]/10 px-2 py-0.5 text-[11px] font-semibold text-[#D97706]">
                Edit Mode
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
        <form onSubmit={handleSubmit} className="min-h-0 flex-1 overflow-y-auto">
          <div className="grid grid-cols-1 gap-4 p-6 sm:grid-cols-2">
            {/* BRANCH */}
            <div className="sm:col-span-2">
              <label className={labelClass}>
                <Building2 size={13} className="text-[#6B7280]" />
                Branch <span className="text-[#DC2626]">*</span>
              </label>
              <div className="relative">
                <select
                  value={form.branchId}
                  onChange={(e) => update("branchId", e.target.value)}
                  disabled={
                    branchesLoading || !!branchesError || saving || isEdit
                  }
                  required
                  className={`${inputClass} appearance-none pr-9`}
                >
                  <option value="">
                    {branchesLoading
                      ? "Loading branches..."
                      : branchesError
                        ? "Branches unavailable"
                        : "Select Branch"}
                  </option>
                  {branches.map((b) => (
                    <option key={b.value} value={b.value}>
                      {b.text}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]">
                  {branchesLoading ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : branchesError ? (
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
              {branchesError && (
                <button
                  type="button"
                  onClick={onRetryBranches}
                  className="mt-1.5 inline-flex items-center gap-1 text-[11.5px] font-medium text-[#D97706] hover:text-[#B45309]"
                >
                  <RefreshCw size={11} />
                  Retry loading branches
                </button>
              )}
            </div>

            {/* COUNTER NAME */}
            <div>
              <label className={labelClass}>
                <Monitor size={13} className="text-[#6B7280]" />
                Counter Name <span className="text-[#DC2626]">*</span>
              </label>
              <input
                type="text"
                value={form.counterName}
                onChange={(e) => update("counterName", e.target.value)}
                disabled={saving}
                placeholder="e.g. Counter 1"
                maxLength={50}
                className={inputClass}
              />
            </div>

            {/* COUNTER CODE */}
            <div>
              <label className={labelClass}>
                <Hash size={13} className="text-[#6B7280]" />
                Counter Code <span className="text-[#DC2626]">*</span>
              </label>
              <input
                type="text"
                value={form.counterCode}
                onChange={(e) => update("counterCode", e.target.value)}
                disabled={saving}
                placeholder="e.g. C-01"
                maxLength={20}
                className={`${inputClass} font-mono uppercase`}
              />
            </div>

            {/* IP ADDRESS */}
            <div>
              <label className={labelClass}>
                <Globe size={13} className="text-[#6B7280]" />
                Counter IP Address <span className="text-[#DC2626]">*</span>
              </label>
              <input
                type="text"
                value={form.ipAddress}
                onChange={(e) => update("ipAddress", e.target.value)}
                disabled={saving}
                placeholder="192.168.1.100"
                maxLength={15}
                className={inputClass}
              />
            </div>

            {/* MAC ADDRESS */}
            <div>
              <label className={labelClass}>
                <Wifi size={13} className="text-[#6B7280]" />
                MAC Address <span className="text-[#DC2626]">*</span>
              </label>
              <input
                type="text"
                value={form.macAddress}
                onChange={(e) => update("macAddress", e.target.value)}
                disabled={saving}
                placeholder="00:1A:2B:3C:4D:5E"
                maxLength={17}
                className={`${inputClass} font-mono uppercase`}
              />
            </div>

            {/* Inline validation error */}
            {formError && (
              <p className="flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[12.5px] font-medium text-red-600 sm:col-span-2">
                <AlertTriangle size={14} />
                {formError}
              </p>
            )}
          </div>

          {/* Modal Footer */}
          <div className="border-t border-[#E5E7EB] bg-[#FAFBFC] px-6 py-4">
            <div className="flex items-center justify-between">
              <p className="text-[12px] text-[#94A3B8]">
                Fields marked with <span className="text-red-500">*</span> are
                required
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
                  {saving ? "Saving..." : isEdit ? "Update Counter" : "Save Counter"}
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

export default function CounterManagement() {
  const [data, setData] = useState<Counter[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Counter | null>(null);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  // --------------------------------------------------
  // BRANCH DROPDOWN
  // --------------------------------------------------
  const [branches, setBranches] = useState<DropdownOption[]>([]);
  const [branchesLoading, setBranchesLoading] = useState(true);
  const [branchesError, setBranchesError] = useState<string | null>(null);

  const loadBranches = (): Promise<void> => {
    setBranchesLoading(true);
    return getBranchOptions()
      .then((list) => {
        setBranches(list);
        setBranchesError(null);
      })
      .catch((err) => {
        console.error("Failed to load branches:", err);
        setBranchesError(getErrMessage(err, "Failed to load branches."));
      })
      .finally(() => setBranchesLoading(false));
  };

  // --------------------------------------------------
  // DATA LOADING
  // --------------------------------------------------
  const fetchCounters = (): Promise<void> => {
    setLoading(true);
    return getPOSCounters()
      .then((res) => {
        if (res.success && Array.isArray(res.data)) {
          setData(res.data.map(toRow));
          setLoadError(null);
        } else {
          throw new Error(res.message || "Failed to load counters");
        }
      })
      .catch((err) => {
        console.error("Failed to load counters:", err);
        setLoadError(
          getErrMessage(err, "Failed to load counters. Please try again.")
        );
      })
      .finally(() => setLoading(false));
  };

  /* Initial load — state updates happen inside promise callbacks. */
  useEffect(() => {
    let cancelled = false;

    getBranchOptions()
      .then((list) => {
        if (cancelled) return;
        setBranches(list);
        setBranchesError(null);
      })
      .catch((err) => {
        if (cancelled) return;
        console.error("Failed to load branches:", err);
        setBranchesError(getErrMessage(err, "Failed to load branches."));
      })
      .finally(() => {
        if (!cancelled) setBranchesLoading(false);
      });

    getPOSCounters()
      .then((res) => {
        if (cancelled) return;
        if (res.success && Array.isArray(res.data)) {
          setData(res.data.map(toRow));
          setLoadError(null);
        } else {
          throw new Error(res.message || "Failed to load counters");
        }
      })
      .catch((err) => {
        if (cancelled) return;
        console.error("Failed to load counters:", err);
        setLoadError(
          getErrMessage(err, "Failed to load counters. Please try again.")
        );
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const filteredData = useMemo(() => {
    if (!searchTerm.trim()) return data;
    const term = searchTerm.toLowerCase();
    return data.filter(
      (item) =>
        item.counterName.toLowerCase().includes(term) ||
        item.counterCode.toLowerCase().includes(term) ||
        item.branchName.toLowerCase().includes(term) ||
        item.ipAddress.toLowerCase().includes(term) ||
        item.macAddress.toLowerCase().includes(term)
    );
  }, [data, searchTerm]);

  // --------------------------------------------------
  // HANDLERS
  // --------------------------------------------------
  const handleAddNew = () => {
    setEditing(null);
    setModalOpen(true);
  };

  const handleEdit = (item: Counter) => {
    setEditing(item);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    if (saving) return;
    setModalOpen(false);
    setEditing(null);
  };

  const handleSave = async (
    form: CounterFormState,
    editingId: number | null
  ) => {
    if (saving) return;

    const branchName =
      branches.find((b) => b.value === form.branchId)?.text ?? "";

    // Duplicate counter code within the same branch
    const duplicate = data.find(
      (item) =>
        item.branchId === Number(form.branchId) &&
        item.counterCode.toLowerCase() === form.counterCode.toLowerCase() &&
        item.id !== editingId
    );
    if (duplicate) {
      setToast({
        message: `Counter code "${form.counterCode}" already exists in ${branchName || "this branch"}`,
        type: "error",
      });
      return;
    }

    setSaving(true);
    try {
      if (editingId !== null) {
        // PUT /api/POSCounters/{id} — update (branchId is not part of the update contract)
        const res = await updatePOSCounter(editingId, {
          counterCode: form.counterCode,
          counterName: form.counterName,
          ipAddress: form.ipAddress,
          macAddress: form.macAddress,
        });
        if (res.success === false)
          throw new Error(res.message || "Failed to update");

        setToast({ message: "Counter updated successfully", type: "success" });
      } else {
        // POST /api/POSCounters — create (single DTO)
        const res = await createPOSCounter({
          branchId: Number(form.branchId),
          counterCode: form.counterCode,
          counterName: form.counterName,
          ipAddress: form.ipAddress,
          macAddress: form.macAddress,
        });
        if (res.success === false)
          throw new Error(res.message || "Failed to save");

        setToast({ message: "Counter added successfully", type: "success" });
      }

      setModalOpen(false);
      setEditing(null);
      await fetchCounters();
    } catch (err) {
      console.error("Failed to save counter:", err);
      setToast({
        message: getErrMessage(err, "Failed to save counter. Please try again."),
        type: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (id: number) => {
    setData((prev) => prev.filter((item) => item.id !== id));
    setToast({ message: "Counter deleted", type: "success" });
    if (editing?.id === id) {
      setModalOpen(false);
      setEditing(null);
    }
  };

  return (
    <div className="h-full overflow-y-auto bg-[#F5F7F3]">
      <div className="mx-auto max-w-[1440px] space-y-5 p-4 lg:p-6" style={{ animation: "fade-up 0.4s ease both" }}>
        {loadError && (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#FEE2E2] bg-red-50 px-5 py-3">
            <div className="flex items-center gap-2 text-[12.5px] font-medium text-red-600">
              <AlertTriangle size={15} />
              {loadError}
            </div>
            <button
              onClick={fetchCounters}
              className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-white px-3 py-1.5 text-[12px] font-semibold text-red-600 transition-colors hover:bg-red-50"
            >
              <RefreshCw size={12} />
              Retry
            </button>
          </div>
        )}

        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

        {/* HEADER */}
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#10673E]/10 text-[#10673E]">
              <Monitor size={20} />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-[#1F2937] md:text-2xl">Counter Management</h1>
              <p className="mt-0.5 text-[12.5px] text-[#6B7280]">Configure POS counter devices, IPs, and MAC addresses</p>
            </div>
          </div>
          <button
            onClick={handleAddNew}
            className="flex h-10 items-center gap-2 rounded-lg bg-[#10673E] px-4 text-[13px] font-semibold text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#0D5A35] hover:shadow-md active:scale-[0.98]"
          >
            <Plus size={16} />
            Add Counter
          </button>
        </header>

        {/* ====================================================== */}
        {/* COUNTER LIST                                             */}
        {/* ====================================================== */}
        <div className="rounded-xl border border-[#E5E7EB] bg-white shadow-xs overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E5E7EB] bg-[#FAFBFC] px-5 py-3">
            <div className="flex items-center gap-2">
              <h2 className="text-[14px] font-bold text-[#1F2937]">Counter List</h2>
              <span className="rounded-md bg-[#10673E]/10 px-2.5 py-1 text-[11px] font-semibold text-[#10673E]">
                {filteredData.length} counters
              </span>
            </div>
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search counters..."
                className="h-9 w-full rounded-lg border border-[#D1D5DB] bg-white pl-9 pr-3 text-[13px] text-[#1F2937] outline-none placeholder:text-[#9CA3AF] focus:border-[#10673E] focus:ring-2 focus:ring-[#10673E]/15 sm:w-64"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-[13px]">
              <thead>
                <tr className="border-b border-[#E5E7EB] bg-[#F8FAFC]">
                  <th className="px-5 py-3 font-semibold text-[#6B7280]">SL</th>
                  <th className="px-5 py-3 font-semibold text-[#6B7280]">Branch</th>
                  <th className="px-5 py-3 font-semibold text-[#6B7280]">Counter Name</th>
                  <th className="px-5 py-3 font-semibold text-[#6B7280]">Counter Code</th>
                  <th className="px-5 py-3 font-semibold text-[#6B7280]">Counter IP</th>
                  <th className="px-5 py-3 font-semibold text-[#6B7280]">MAC Address</th>
                  <th className="px-5 py-3 text-right font-semibold text-[#6B7280]">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-16 text-center">
                      <div className="flex flex-col items-center justify-center text-[#94A3B8]">
                        <Loader2 size={28} className="animate-spin text-[#10673E]" />
                        <p className="mt-2 text-[13px] font-medium">Loading counters...</p>
                      </div>
                    </td>
                  </tr>
                ) : filteredData.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-16 text-center">
                      <div className="flex flex-col items-center justify-center text-[#94A3B8]">
                        <Monitor size={30} strokeWidth={1.5} />
                        <p className="mt-2 text-[13px] font-medium">No counters found</p>
                        <p className="mt-1 text-[12px]">{searchTerm ? "Try a different search term" : loadError ? "Fix the connection and retry" : "Click Add Counter to create one"}</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredData.map((item, index) => (
                    <tr key={item.id} className={`border-b border-[#F1F5F9] transition-colors hover:bg-[#F8FAFC] ${editing?.id === item.id ? "bg-[#E8F5ED]/50" : ""}`}>
                      <td className="px-5 py-3 text-[#94A3B8]">{index + 1}</td>
                      <td className="px-5 py-3">
                        <span className="inline-flex items-center gap-1.5 rounded-md bg-[#F1F5F9] px-2.5 py-1 text-[12px] font-medium text-[#475569]">
                          <Building2 size={12} />
                          {item.branchName || `Branch #${item.branchId}`}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-[#10673E]/10 text-[#10673E]">
                            <Monitor size={13} />
                          </div>
                          <span className="font-semibold text-[#1F2937]">{item.counterName}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <span className="rounded-md bg-[#10673E]/10 px-2 py-0.5 font-mono text-[12px] font-semibold text-[#10673E]">{item.counterCode}</span>
                      </td>
                      <td className="px-5 py-3">
                        <code className="rounded-md bg-[#F1F5F9] px-2 py-0.5 text-[12px] font-medium text-[#475569]">{item.ipAddress}</code>
                      </td>
                      <td className="px-5 py-3">
                        <code className="rounded-md bg-[#F1F5F9] px-2 py-0.5 text-[12px] font-medium text-[#475569]">{item.macAddress}</code>
                      </td>
                      <td className="px-5 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => handleEdit(item)} className="flex h-7 w-7 items-center justify-center rounded-md text-[#64748B] transition-colors hover:bg-[#E8F5ED] hover:text-[#10673E]" title="Edit">
                            <Pencil size={14} />
                          </button>
                          <button onClick={() => handleDelete(item.id)} className="flex h-7 w-7 items-center justify-center rounded-md text-[#94A3B8] transition-colors hover:bg-[#FEE2E2] hover:text-[#DC2626]" title="Delete">
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

          {!loading && filteredData.length > 0 && (
            <div className="flex items-center justify-between border-t border-[#E5E7EB] bg-[#FAFBFC] px-5 py-3">
              <p className="text-[12px] text-[#94A3B8]">Showing {filteredData.length} of {data.length} counters</p>
              <p className="text-[12px] text-[#94A3B8]">Use Add Counter or the row edit action to open the entry modal</p>
            </div>
          )}
        </div>

        {/* -------- Counter Modal (native <dialog>, page level) -------- */}
        {modalOpen && (
          <CounterModal
            editing={editing}
            branches={branches}
            branchesLoading={branchesLoading}
            branchesError={branchesError}
            saving={saving}
            onClose={handleCloseModal}
            onSave={handleSave}
            onRetryBranches={loadBranches}
          />
        )}
      </div>
    </div>
  );
}

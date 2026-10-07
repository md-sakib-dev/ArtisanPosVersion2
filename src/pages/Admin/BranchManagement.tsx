import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import {
  Building2,
  Plus,
  Pencil,
  ToggleLeft,
  ToggleRight,
  X,
  Check,
  Search,
  MapPin,
  Phone,
  FileText,
  CheckCircle2,
  AlertCircle,
  Loader2,
  RotateCcw,
} from "lucide-react";
import {
  getBranches,
  createBranch,
  updateBranch,
  type Branch,
  type BranchCreateDto,
} from "../../api/branchApi";

// ======================================================
// TYPES / FORM MODEL
// ======================================================

/* Opening Date is hidden per requirement — not part of the form. */
interface BranchFormState {
  branchName: string;
  branchAddress: string;
  branchContact: string;
  vatRegNo: string;
  branchStatus: number; // 1 = Active, 0 = Inactive
}

const EMPTY_FORM: BranchFormState = {
  branchName: "",
  branchAddress: "",
  branchContact: "",
  vatRegNo: "",
  branchStatus: 1,
};

const statusLabel = (sts: number) => (sts === 1 ? "Active" : "Inactive");

const getErrMessage = (err: unknown, fallback: string): string => {
  const anyErr = err as { response?: { data?: { message?: string } } };
  return anyErr?.response?.data?.message || fallback;
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

// ======================================================
// BRANCH MODAL — native <dialog>, Customer-page style
// ======================================================

function BranchModal({
  open,
  branch,
  saving,
  onClose,
  onSave,
}: {
  open: boolean;
  branch: Branch | null;
  saving: boolean;
  onClose: () => void;
  onSave: (dto: BranchCreateDto, branchId: number | null) => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [form, setForm] = useState<BranchFormState>({ ...EMPTY_FORM });

  const isEdit = Boolean(branch);

  const formFromBranch = (b: Branch): BranchFormState => ({
    branchName: b.branchName ?? "",
    branchAddress: b.branchAddress ?? "",
    branchContact: b.branchContact ?? "",
    vatRegNo: b.vatRegNo ?? "",
    branchStatus: b.branchStatus === 0 ? 0 : 1,
  });

  // Open/close the native dialog; reset form on each open
  useEffect(() => {
    const dlg = dialogRef.current;
    if (!dlg) return;

    if (open) {
      if (!dlg.open) dlg.showModal();
      setForm(branch ? formFromBranch(branch) : { ...EMPTY_FORM });
    } else if (dlg.open) {
      dlg.close();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, branch]);

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

  const updateField = (
    field: keyof BranchFormState,
    value: string | number
  ) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;
    if (!form.branchName.trim() || !form.branchAddress.trim()) {
      return; // handled by native required attrs; safety net
    }
    onSave(
      {
        branchName: form.branchName.trim(),
        branchAddress: form.branchAddress.trim(),
        branchContact: form.branchContact.trim(),
        vatRegNo: form.vatRegNo.trim(),
        branchStatus: form.branchStatus,
      },
      branch?.branchId ?? null
    );
  };

  const handleReset = () => {
    setForm(branch ? formFromBranch(branch) : { ...EMPTY_FORM });
  };

  return (
    <dialog
      ref={dialogRef}
      className="m-auto w-full max-w-3xl rounded-2xl border border-[#E5E7EB] bg-white p-0 shadow-2xl backdrop:bg-black/40 backdrop:backdrop-blur-[2px]"
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
                {isEdit ? "Edit Branch" : "Add Branch"}
              </h2>
              <p className="text-[11.5px] text-[#94A3B8]">
                {isEdit
                  ? `Editing ${branch?.branchName} — update details below`
                  : "Fill in the branch details below"}
              </p>
            </div>
            {isEdit && (
              <span className="ml-1 rounded-md bg-[#2D5597]/10 px-2 py-0.5 text-[11px] font-semibold text-[#2D5597]">
                Edit Mode
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-[#94A3B8] transition-colors hover:bg-[#F1F5F9] hover:text-[#64748B]"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <form
          onSubmit={handleSubmit}
          className="min-h-0 flex-1 overflow-y-auto"
        >
          <div className="p-6">
            <p className="mb-3 text-[11.5px] font-semibold uppercase tracking-wider text-[#94A3B8]">
              Branch Information
            </p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {/* Branch Name */}
              <div>
                <label className="mb-1.5 flex items-center gap-1.5 text-[12.5px] font-medium text-[#374151]">
                  <Building2 size={13} className="text-[#6B7280]" />
                  Branch Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.branchName}
                  onChange={(e) => updateField("branchName", e.target.value)}
                  placeholder="Enter branch name"
                  required
                  maxLength={100}
                  className="w-full rounded-lg border border-[#D1D5DB] bg-[#F9FAFB] px-3.5 py-2.5 text-[13px] text-[#1F2937] outline-none transition-all placeholder:text-[#9CA3AF] focus:border-[#10673E] focus:bg-white focus:ring-2 focus:ring-[#10673E]/15"
                />
              </div>

              {/* Address */}
              <div className="sm:col-span-1 lg:col-span-2">
                <label className="mb-1.5 flex items-center gap-1.5 text-[12.5px] font-medium text-[#374151]">
                  <MapPin size={13} className="text-[#6B7280]" />
                  Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.branchAddress}
                  onChange={(e) => updateField("branchAddress", e.target.value)}
                  placeholder="Enter full address"
                  required
                  maxLength={250}
                  className="w-full rounded-lg border border-[#D1D5DB] bg-[#F9FAFB] px-3.5 py-2.5 text-[13px] text-[#1F2937] outline-none transition-all placeholder:text-[#9CA3AF] focus:border-[#10673E] focus:bg-white focus:ring-2 focus:ring-[#10673E]/15"
                />
              </div>

              {/* Contact No */}
              <div>
                <label className="mb-1.5 flex items-center gap-1.5 text-[12.5px] font-medium text-[#374151]">
                  <Phone size={13} className="text-[#6B7280]" />
                  Contact No
                </label>
                <input
                  type="tel"
                  value={form.branchContact}
                  onChange={(e) => updateField("branchContact", e.target.value)}
                  placeholder="+880XXXXXXXXXX"
                  maxLength={20}
                  className="w-full rounded-lg border border-[#D1D5DB] bg-[#F9FAFB] px-3.5 py-2.5 text-[13px] text-[#1F2937] outline-none transition-all placeholder:text-[#9CA3AF] focus:border-[#10673E] focus:bg-white focus:ring-2 focus:ring-[#10673E]/15"
                />
              </div>

              {/* VAT Reg. No */}
              <div>
                <label className="mb-1.5 flex items-center gap-1.5 text-[12.5px] font-medium text-[#374151]">
                  <FileText size={13} className="text-[#6B7280]" />
                  VAT Reg. No
                </label>
                <input
                  type="text"
                  value={form.vatRegNo}
                  onChange={(e) => updateField("vatRegNo", e.target.value)}
                  placeholder="e.g. VAT-100001"
                  maxLength={50}
                  className="w-full rounded-lg border border-[#D1D5DB] bg-[#F9FAFB] px-3.5 py-2.5 text-[13px] text-[#1F2937] outline-none transition-all placeholder:text-[#9CA3AF] focus:border-[#10673E] focus:bg-white focus:ring-2 focus:ring-[#10673E]/15"
                />
              </div>

              {/* Status */}
              <div>
                <label className="mb-1.5 flex items-center gap-1.5 text-[12.5px] font-medium text-[#374151]">
                  <Building2 size={13} className="text-[#6B7280]" />
                  Status
                </label>
                <div className="flex gap-2">
                  {[
                    { value: 1, label: "Active" },
                    { value: 0, label: "Inactive" },
                  ].map((s) => (
                    <button
                      key={s.value}
                      type="button"
                      onClick={() => updateField("branchStatus", s.value)}
                      className={`flex flex-1 items-center justify-center gap-2 rounded-lg border py-2.5 text-[13px] font-medium transition-all ${
                        form.branchStatus === s.value
                          ? s.value === 1
                            ? "border-[#10673E] bg-[#E8F5ED] text-[#10673E]"
                            : "border-red-300 bg-red-50 text-red-600"
                          : "border-[#D1D5DB] bg-[#F9FAFB] text-[#94A3B8] hover:bg-[#F1F5F9]"
                      }`}
                    >
                      {s.value === 1 ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="border-t border-[#E5E7EB] bg-[#FAFBFC] px-6 py-4">
            <div className="flex items-center justify-between">
              <p className="text-[12px] text-[#94A3B8]">
                All fields marked with * are required
              </p>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleReset}
                  disabled={saving}
                  className="flex items-center gap-2 rounded-lg border border-[#D1D5DB] bg-white px-4 py-2.5 text-[13px] font-medium text-[#6B7280] transition-all hover:bg-[#F9FAFB] hover:text-[#374151] disabled:opacity-50"
                >
                  <RotateCcw size={15} />
                  Reset
                </button>
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
                    <Check size={15} />
                  )}
                  {saving
                    ? "Saving..."
                    : isEdit
                      ? "Update Branch"
                      : "Save Branch"}
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

export default function BranchManagement() {
  // --------------------------------------------------
  // DATA
  // --------------------------------------------------
  const [data, setData] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // --------------------------------------------------
  // MODAL STATE
  // --------------------------------------------------
  const [modalOpen, setModalOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
  const [saving, setSaving] = useState(false);

  // --------------------------------------------------
  // SEARCH
  // --------------------------------------------------
  const [searchTerm, setSearchTerm] = useState("");

  // --------------------------------------------------
  // TOAST
  // --------------------------------------------------
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  // --------------------------------------------------
  // FETCH
  // --------------------------------------------------
  const fetchBranches = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const res = await getBranches();
      if (res.success && Array.isArray(res.data)) {
        setData(res.data);
      } else {
        throw new Error(res.message || "Failed to load branches");
      }
    } catch (err) {
      console.error("Failed to load branches:", err);
      setLoadError(getErrMessage(err, "Failed to load branches. Please try again."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBranches();
  }, [fetchBranches]);

  // --------------------------------------------------
  // FILTERED DATA
  // --------------------------------------------------
  const filteredData = useMemo(() => {
    if (!searchTerm.trim()) return data;
    const term = searchTerm.toLowerCase();
    return data.filter(
      (item) =>
        item.branchName?.toLowerCase().includes(term) ||
        item.branchAddress?.toLowerCase().includes(term) ||
        item.branchContact?.toLowerCase().includes(term) ||
        item.vatRegNo?.toLowerCase().includes(term)
    );
  }, [data, searchTerm]);

  // --------------------------------------------------
  // MODAL HANDLERS
  // --------------------------------------------------
  const handleAddNew = () => {
    setEditingBranch(null);
    setModalOpen(true);
  };

  const handleEdit = (branch: Branch) => {
    setEditingBranch(branch);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    if (saving) return;
    setModalOpen(false);
    setEditingBranch(null);
  };

  const handleSave = async (
    dto: BranchCreateDto,
    branchId: number | null
  ) => {
    if (saving) return;

    /* Client-side duplicate check (same as before) */
    const duplicate = data.find(
      (item) =>
        item.branchName.toLowerCase() === dto.branchName.toLowerCase() &&
        item.branchId !== branchId
    );
    if (duplicate) {
      setToast({
        message: `"${dto.branchName}" already exists`,
        type: "error",
      });
      return;
    }

    setSaving(true);
    try {
      if (branchId != null) {
        const res = await updateBranch(branchId, dto);
        if (res.success === false) throw new Error(res.message);
        setToast({
          message: `Branch "${dto.branchName}" updated successfully`,
          type: "success",
        });
      } else {
        const res = await createBranch(dto);
        if (res.success === false) throw new Error(res.message);
        setToast({
          message: `Branch "${dto.branchName}" added successfully`,
          type: "success",
        });
      }
      setModalOpen(false);
      setEditingBranch(null);
      await fetchBranches();
    } catch (err) {
      console.error("Failed to save branch:", err);
      setToast({
        message: getErrMessage(err, "Failed to save branch. Please try again."),
        type: "error",
      });
    } finally {
      setSaving(false);
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
        <header>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#10673E]/10 text-[#10673E]">
              <Building2 size={20} />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-[#1F2937] md:text-2xl">
                Branch Management
              </h1>
              <p className="mt-0.5 text-[12.5px] text-[#6B7280]">
                Manage branch locations, contact details, and registration info
              </p>
            </div>
          </div>
        </header>

        {/* ====================================================== */}
        {/* BRANCH LIST TABLE                                       */}
        {/* ====================================================== */}
        <div className="overflow-hidden rounded-xl border border-[#E5E7EB] bg-white shadow-xs">
          {/* Table Header Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E5E7EB] bg-[#FAFBFC] px-5 py-3">
            <div className="flex items-center gap-2">
              <h2 className="text-[14px] font-bold text-[#1F2937]">
                Branch List
              </h2>
              <span className="rounded-md bg-[#10673E]/10 px-2.5 py-1 text-[11px] font-semibold text-[#10673E]">
                {filteredData.length} branches
              </span>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]"
                />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search branches..."
                  className="h-9 w-full rounded-lg border border-[#D1D5DB] bg-white pl-9 pr-3 text-[13px] text-[#1F2937] outline-none placeholder:text-[#9CA3AF] focus:border-[#10673E] focus:ring-2 focus:ring-[#10673E]/15 sm:w-64"
                />
              </div>
              <button
                onClick={handleAddNew}
                className="flex h-9 items-center gap-2 rounded-lg bg-[#10673E] px-4 text-[13px] font-semibold text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#0D5A35] hover:shadow-md active:scale-[0.98]"
              >
                <Plus size={15} />
                Add Branch
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[13px]">
              <thead>
                <tr className="border-b border-[#E5E7EB] bg-[#F8FAFC]">
                  <th className="px-5 py-3 font-semibold text-[#6B7280]">SL</th>
                  <th className="px-5 py-3 font-semibold text-[#6B7280]">Branch Name</th>
                  <th className="px-5 py-3 font-semibold text-[#6B7280]">Address</th>
                  <th className="px-5 py-3 font-semibold text-[#6B7280]">Contact No</th>
                  <th className="px-5 py-3 font-semibold text-[#6B7280]">VAT Reg. No</th>
                  <th className="px-5 py-3 font-semibold text-[#6B7280]">Status</th>
                  <th className="px-5 py-3 text-right font-semibold text-[#6B7280]">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-16 text-center">
                      <div className="flex flex-col items-center justify-center text-[#94A3B8]">
                        <Loader2 size={28} className="animate-spin text-[#10673E]" />
                        <p className="mt-3 text-[13px] font-medium">
                          Loading branches...
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : loadError ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-16 text-center">
                      <div className="flex flex-col items-center justify-center text-[#94A3B8]">
                        <AlertCircle size={30} className="text-red-400" />
                        <p className="mt-2 text-[13px] font-medium text-red-500">
                          {loadError}
                        </p>
                        <button
                          onClick={fetchBranches}
                          className="mt-3 rounded-lg border border-[#D1D5DB] bg-white px-4 py-2 text-[12.5px] font-medium text-[#374151] transition-colors hover:bg-[#F9FAFB]"
                        >
                          Retry
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : filteredData.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-16 text-center">
                      <div className="flex flex-col items-center justify-center text-[#94A3B8]">
                        <Building2 size={30} strokeWidth={1.5} />
                        <p className="mt-2 text-[13px] font-medium">
                          No branches found
                        </p>
                        <p className="mt-1 text-[12px]">
                          {searchTerm
                            ? "Try a different search term"
                            : "Add your first branch above"}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredData.map((item, index) => (
                    <tr
                      key={item.branchId}
                      className="border-b border-[#F1F5F9] transition-colors hover:bg-[#F8FAFC]"
                    >
                      <td className="px-5 py-3 text-[#94A3B8]">{index + 1}</td>
                      <td className="px-5 py-3 font-medium text-[#1F2937]">
                        <div className="flex items-center gap-2">
                          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-[#10673E]/10 text-[#10673E]">
                            <Building2 size={13} />
                          </div>
                          {item.branchName}
                        </div>
                      </td>
                      <td className="max-w-[220px] truncate px-5 py-3 text-[#6B7280]">
                        {item.branchAddress || "—"}
                      </td>
                      <td className="px-5 py-3 text-[#1F2937]">
                        {item.branchContact || "—"}
                      </td>
                      <td className="px-5 py-3 text-[#1F2937]">
                        {item.vatRegNo || "—"}
                      </td>
                      <td className="px-5 py-3">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                            item.branchStatus === 1
                              ? "bg-[#10673E]/10 text-[#10673E]"
                              : "bg-[#F1F5F9] text-[#94A3B8]"
                          }`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              item.branchStatus === 1 ? "bg-[#10673E]" : "bg-[#CBD5E1]"
                            }`}
                          />
                          {statusLabel(item.branchStatus)}
                        </span>
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
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Table Footer */}
          {filteredData.length > 0 && (
            <div className="flex items-center justify-between border-t border-[#E5E7EB] bg-[#FAFBFC] px-5 py-3">
              <p className="text-[12px] text-[#94A3B8]">
                Showing {filteredData.length} of {data.length} branches
              </p>
              <div className="flex items-center gap-2 text-[12px]">
                <span className="text-[#94A3B8]">Active:</span>
                <span className="font-semibold text-[#10673E]">
                  {filteredData.filter((i) => i.branchStatus === 1).length}
                </span>
                <span className="mx-1 text-[#E5E7EB]">|</span>
                <span className="text-[#94A3B8]">Inactive:</span>
                <span className="font-semibold text-[#94A3B8]">
                  {filteredData.filter((i) => i.branchStatus !== 1).length}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* -------- Branch Modal (native <dialog>, page level) -------- */}
        <BranchModal
          open={modalOpen}
          branch={editingBranch}
          saving={saving}
          onClose={handleCloseModal}
          onSave={handleSave}
        />
      </div>
    </div>
  );
}

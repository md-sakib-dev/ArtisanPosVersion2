import { useState, useMemo, useRef } from "react";
import {
  Building2,
  Plus,
  Pencil,
  Trash2,
  X,
  Check,
  Search,
  MapPin,
  Phone,
  Calendar,
  FileText,
} from "lucide-react";

// ======================================================
// TYPES
// ======================================================

interface Branch {
  id: number;
  branchName: string;
  address: string;
  contactNo: string;
  vatRegNo: string;
  openingDate: string;
  status: "Active" | "Inactive";
}

// ======================================================
// INITIAL DATA
// ======================================================

const INITIAL_DATA: Branch[] = [
  {
    id: 1,
    branchName: "Dhaka Main Branch",
    address: "123 Gulshan Avenue, Gulshan-1, Dhaka 1212",
    contactNo: "+8801712345678",
    vatRegNo: "VAT-100001",
    openingDate: "2023-01-15",
    status: "Active",
  },
  {
    id: 2,
    branchName: "Chittagong Branch",
    address: "45 Agrabad Commercial Area, Chittagong 4100",
    contactNo: "+8801812345679",
    vatRegNo: "VAT-100002",
    openingDate: "2023-06-20",
    status: "Active",
  },
  {
    id: 3,
    branchName: "Sylhet Branch",
    address: "78 Zindabazar, Sylhet 3100",
    contactNo: "+8801912345680",
    vatRegNo: "VAT-100003",
    openingDate: "2024-01-10",
    status: "Active",
  },
  {
    id: 4,
    branchName: "Rajshahi Branch",
    address: "22 Saheb Bazar, Rajshahi 6200",
    contactNo: "+8801612345681",
    vatRegNo: "VAT-100004",
    openingDate: "2024-03-05",
    status: "Inactive",
  },
];

const EMPTY_FORM: Omit<Branch, "id"> = {
  branchName: "",
  address: "",
  contactNo: "",
  vatRegNo: "",
  openingDate: "",
  status: "Active" as "Active" | "Inactive",
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
  useState(() => setTimeout(onClose, 3000));
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
// PAGE
// ======================================================

export default function BranchManagement() {
  // --------------------------------------------------
  // DATA
  // --------------------------------------------------
  const [data, setData] = useState<Branch[]>(INITIAL_DATA);
  const [nextId, setNextId] = useState(5);

  // --------------------------------------------------
  // FORM STATE
  // --------------------------------------------------
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState<number | null>(null);

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
  const scrollRef = useRef<HTMLDivElement>(null);

  // --------------------------------------------------
  // FILTERED DATA
  // --------------------------------------------------
  const filteredData = useMemo(() => {
    if (!searchTerm.trim()) return data;
    const term = searchTerm.toLowerCase();
    return data.filter(
      (item) =>
        item.branchName.toLowerCase().includes(term) ||
        item.address.toLowerCase().includes(term) ||
        item.contactNo.toLowerCase().includes(term) ||
        item.vatRegNo.toLowerCase().includes(term)
    );
  }, [data, searchTerm]);

  // --------------------------------------------------
  // HANDLERS
  // --------------------------------------------------
  const updateField = (field: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
  };

  const handleSubmit = () => {
    if (!form.branchName.trim()) {
      setToast({ message: "Branch name is required", type: "error" });
      return;
    }
    if (!form.address.trim()) {
      setToast({ message: "Address is required", type: "error" });
      return;
    }

    const duplicate = data.find(
      (item) =>
        item.branchName.toLowerCase() === form.branchName.trim().toLowerCase() &&
        item.id !== editingId
    );
    if (duplicate) {
      setToast({
        message: `"${form.branchName.trim()}" already exists`,
        type: "error",
      });
      return;
    }

    if (editingId !== null) {
      setData((prev) =>
        prev.map((item) =>
          item.id === editingId
            ? { ...item, ...form, branchName: form.branchName.trim(), address: form.address.trim() }
            : item
        )
      );
      setToast({ message: "Branch updated successfully", type: "success" });
    } else {
      setData((prev) => [
        ...prev,
        {
          id: nextId,
          ...form,
          branchName: form.branchName.trim(),
          address: form.address.trim(),
        },
      ]);
      setNextId((p) => p + 1);
      setToast({ message: "Branch added successfully", type: "success" });
    }
    resetForm();
  };

  const handleEdit = (item: Branch) => {
    setForm({
      branchName: item.branchName,
      address: item.address,
      contactNo: item.contactNo,
      vatRegNo: item.vatRegNo,
      openingDate: item.openingDate,
      status: item.status,
    });
    setEditingId(item.id);
    scrollRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = (id: number) => {
    setData((prev) => prev.filter((item) => item.id !== id));
    setToast({ message: "Branch deleted", type: "success" });
    if (editingId === id) resetForm();
  };

  const handleToggleStatus = (id: number) => {
    setData((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, status: item.status === "Active" ? "Inactive" : "Active" }
          : item
      )
    );
  };

  // --------------------------------------------------
  // RENDER
  // --------------------------------------------------
  return (
    <div ref={scrollRef} className="h-full overflow-y-auto bg-[#F5F7F3]">
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
        {/* TOP FORM SECTION                                        */}
        {/* ====================================================== */}
        <div className="rounded-xl border border-[#E5E7EB] bg-white shadow-xs overflow-hidden">
          {/* Card Header */}
          <div className="flex items-center gap-2 border-b border-[#E5E7EB] bg-[#FAFBFC] px-5 py-3">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-[#10673E]/10 text-[#10673E]">
              {editingId !== null ? <Pencil size={14} /> : <Plus size={14} />}
            </div>
            <h2 className="text-[14px] font-bold text-[#1F2937]">
              {editingId !== null ? "Update Branch" : "Add New Branch"}
            </h2>
            {editingId !== null && (
              <span className="rounded-md bg-[#F59E0B]/10 px-2 py-0.5 text-[11px] font-semibold text-[#D97706]">
                Edit Mode
              </span>
            )}
          </div>

          {/* Card Body — Form */}
          <div className="p-5">
            <div className="grid grid-cols-1 gap-x-5 gap-y-4 md:grid-cols-2 lg:grid-cols-3">
              {/* Branch Name */}
              <div>
                <label className="mb-1.5 flex items-center gap-1.5 text-[13px] font-semibold text-[#374151]">
                  <Building2 size={13} className="text-[#6B7280]" />
                  Branch Name <span className="text-[#DC2626]">*</span>
                </label>
                <input
                  type="text"
                  value={form.branchName}
                  onChange={(e) => updateField("branchName", e.target.value)}
                  placeholder="Enter branch name"
                  className="h-10 w-full rounded-lg border border-[#D1D5DB] bg-white px-3 text-[13px] text-[#1F2937] outline-none transition-colors placeholder:text-[#9CA3AF] focus:border-[#10673E] focus:ring-2 focus:ring-[#10673E]/15"
                />
              </div>

              {/* Address */}
              <div>
                <label className="mb-1.5 flex items-center gap-1.5 text-[13px] font-semibold text-[#374151]">
                  <MapPin size={13} className="text-[#6B7280]" />
                  Address <span className="text-[#DC2626]">*</span>
                </label>
                <input
                  type="text"
                  value={form.address}
                  onChange={(e) => updateField("address", e.target.value)}
                  placeholder="Enter full address"
                  className="h-10 w-full rounded-lg border border-[#D1D5DB] bg-white px-3 text-[13px] text-[#1F2937] outline-none transition-colors placeholder:text-[#9CA3AF] focus:border-[#10673E] focus:ring-2 focus:ring-[#10673E]/15"
                />
              </div>

              {/* Contact No */}
              <div>
                <label className="mb-1.5 flex items-center gap-1.5 text-[13px] font-semibold text-[#374151]">
                  <Phone size={13} className="text-[#6B7280]" />
                  Contact No
                </label>
                <input
                  type="tel"
                  value={form.contactNo}
                  onChange={(e) => updateField("contactNo", e.target.value)}
                  placeholder="+880XXXXXXXXXX"
                  className="h-10 w-full rounded-lg border border-[#D1D5DB] bg-white px-3 text-[13px] text-[#1F2937] outline-none transition-colors placeholder:text-[#9CA3AF] focus:border-[#10673E] focus:ring-2 focus:ring-[#10673E]/15"
                />
              </div>

              {/* VAT Reg. No */}
              <div>
                <label className="mb-1.5 flex items-center gap-1.5 text-[13px] font-semibold text-[#374151]">
                  <FileText size={13} className="text-[#6B7280]" />
                  VAT Reg. No
                </label>
                <input
                  type="text"
                  value={form.vatRegNo}
                  onChange={(e) => updateField("vatRegNo", e.target.value)}
                  placeholder="e.g. VAT-100001"
                  className="h-10 w-full rounded-lg border border-[#D1D5DB] bg-white px-3 text-[13px] text-[#1F2937] outline-none transition-colors placeholder:text-[#9CA3AF] focus:border-[#10673E] focus:ring-2 focus:ring-[#10673E]/15"
                />
              </div>

              {/* Opening Date */}
              <div>
                <label className="mb-1.5 flex items-center gap-1.5 text-[13px] font-semibold text-[#374151]">
                  <Calendar size={13} className="text-[#6B7280]" />
                  Opening Date
                </label>
                <input
                  type="date"
                  value={form.openingDate}
                  onChange={(e) => updateField("openingDate", e.target.value)}
                  className="h-10 w-full rounded-lg border border-[#D1D5DB] bg-white px-3 text-[13px] text-[#1F2937] outline-none transition-colors focus:border-[#10673E] focus:ring-2 focus:ring-[#10673E]/15"
                />
              </div>

              {/* Status */}
              <div>
                <label className="mb-1.5 flex items-center gap-1.5 text-[13px] font-semibold text-[#374151]">
                  <Building2 size={13} className="text-[#6B7280]" />
                  Status
                </label>
                <select
                  value={form.status}
                  onChange={(e) => updateField("status", e.target.value as "Active" | "Inactive")}
                  className="h-10 w-full rounded-lg border border-[#D1D5DB] bg-white px-3 text-[13px] text-[#1F2937] outline-none transition-colors focus:border-[#10673E] focus:ring-2 focus:ring-[#10673E]/15"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>

              {/* Action Buttons */}
              <div className="flex items-end gap-2 pt-4 md:pt-0">
                <button
                  onClick={handleSubmit}
                  className="flex h-10 items-center gap-2 rounded-lg bg-[#10673E] px-6 text-[13px] font-semibold text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#0D5A35] hover:shadow-md active:scale-[0.98]"
                >
                  {editingId !== null ? (
                    <>
                      <Check size={15} />
                      Update Branch
                    </>
                  ) : (
                    <>
                      <Plus size={15} />
                      Save Branch
                    </>
                  )}
                </button>
                <button
                  onClick={resetForm}
                  className="flex h-10 items-center gap-2 rounded-lg border border-[#D1D5DB] bg-white px-4 text-[13px] font-medium text-[#6B7280] transition-colors hover:bg-[#F9FAFB] hover:text-[#374151]"
                >
                  <X size={14} />
                  Clear
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ====================================================== */}
        {/* BOTTOM DATA TABLE                                       */}
        {/* ====================================================== */}
        <div className="rounded-xl border border-[#E5E7EB] bg-white shadow-xs overflow-hidden">
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
                  <th className="px-5 py-3 font-semibold text-[#6B7280]">Opening Date</th>
                  <th className="px-5 py-3 font-semibold text-[#6B7280]">Status</th>
                  <th className="px-5 py-3 text-right font-semibold text-[#6B7280]">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-5 py-16 text-center">
                      <div className="flex flex-col items-center justify-center text-[#94A3B8]">
                        <Building2 size={30} strokeWidth={1.5} />
                        <p className="mt-2 text-[13px] font-medium">
                          No branches found
                        </p>
                        <p className="mt-1 text-[12px]">
                          {searchTerm
                            ? "Try a different search term"
                            : "Add a new branch above"}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredData.map((item, index) => (
                    <tr
                      key={item.id}
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
                        {item.address}
                      </td>
                      <td className="px-5 py-3 text-[#1F2937]">
                        {item.contactNo || "—"}
                      </td>
                      <td className="px-5 py-3 text-[#1F2937]">
                        {item.vatRegNo || "—"}
                      </td>
                      <td className="px-5 py-3 text-[#6B7280]">
                        {item.openingDate
                          ? new Date(item.openingDate).toLocaleDateString("en-BD", {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            })
                          : "—"}
                      </td>
                      <td className="px-5 py-3">
                        <button
                          onClick={() => handleToggleStatus(item.id)}
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold transition-colors ${
                            item.status === "Active"
                              ? "bg-[#10673E]/10 text-[#10673E] hover:bg-[#10673E]/15"
                              : "bg-[#F1F5F9] text-[#94A3B8] hover:bg-[#E2E8F0]"
                          }`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              item.status === "Active" ? "bg-[#10673E]" : "bg-[#CBD5E1]"
                            }`}
                          />
                          {item.status}
                        </button>
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
                            onClick={() => handleDelete(item.id)}
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
          {filteredData.length > 0 && (
            <div className="flex items-center justify-between border-t border-[#E5E7EB] bg-[#FAFBFC] px-5 py-3">
              <p className="text-[12px] text-[#94A3B8]">
                Showing {filteredData.length} of {data.length} branches
              </p>
              <div className="flex items-center gap-2 text-[12px]">
                <span className="text-[#94A3B8]">Active:</span>
                <span className="font-semibold text-[#10673E]">
                  {filteredData.filter((i) => i.status === "Active").length}
                </span>
                <span className="mx-1 text-[#E5E7EB]">|</span>
                <span className="text-[#94A3B8]">Inactive:</span>
                <span className="font-semibold text-[#94A3B8]">
                  {filteredData.filter((i) => i.status === "Inactive").length}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

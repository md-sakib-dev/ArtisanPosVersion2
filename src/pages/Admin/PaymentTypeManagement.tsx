import { useState, useMemo, useRef } from "react";
import {
  CreditCard,
  Plus,
  Pencil,
  Trash2,
  X,
  Check,
  Search,
  Smartphone,
  Ticket,
  Monitor,
} from "lucide-react";

// ======================================================
// TYPES
// ======================================================

interface PaymentType {
  id: number;
  category: string;
  name: string;
  status: "Active" | "Inactive";
}

// ======================================================
// CONSTANTS
// ======================================================

const CATEGORIES = [
  { value: "POS Machine", label: "POS Machine", icon: Monitor },
  { value: "Card Type", label: "Card Type", icon: CreditCard },
  { value: "MFS Type", label: "MFS Type", icon: Smartphone },
  { value: "Voucher Type", label: "Voucher Type", icon: Ticket },
];

const CATEGORY_PLACEHOLDERS: Record<string, string> = {
  "POS Machine": "Enter POS Machine Name",
  "Card Type": "Enter Card Type Name (e.g. Visa, Mastercard)",
  "MFS Type": "Enter MFS Name (e.g. bKash, Nagad, Rocket)",
  "Voucher Type": "Enter Voucher Type Name (e.g. Gift Voucher)",
};

const CATEGORY_LABELS: Record<string, string> = {
  "POS Machine": "POS Machine Name",
  "Card Type": "Card Type Name",
  "MFS Type": "MFS Name",
  "Voucher Type": "Voucher Type Name",
};

// ======================================================
// INITIAL DATA
// ======================================================

const INITIAL_DATA: PaymentType[] = [
  { id: 1, category: "POS Machine", name: "POS-001 Main", status: "Active" },
  { id: 2, category: "POS Machine", name: "POS-002 Counter", status: "Active" },
  { id: 3, category: "Card Type", name: "Visa", status: "Active" },
  { id: 4, category: "Card Type", name: "Mastercard", status: "Active" },
  { id: 5, category: "Card Type", name: "AMEX", status: "Inactive" },
  { id: 6, category: "MFS Type", name: "bKash", status: "Active" },
  { id: 7, category: "MFS Type", name: "Nagad", status: "Active" },
  { id: 8, category: "MFS Type", name: "Rocket", status: "Active" },
  { id: 9, category: "Voucher Type", name: "Gift Voucher", status: "Active" },
  { id: 10, category: "Voucher Type", name: "Discount Coupon", status: "Active" },
];

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

export default function PaymentTypeManagement() {
  // --------------------------------------------------
  // DATA
  // --------------------------------------------------
  const [data, setData] = useState<PaymentType[]>(INITIAL_DATA);
  const [nextId, setNextId] = useState(11);

  // --------------------------------------------------
  // FORM STATE
  // --------------------------------------------------
  const [selectedCategory, setSelectedCategory] = useState("");
  const [typeName, setTypeName] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);

  // --------------------------------------------------
  // FILTER STATE
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
    return data.filter((item) => {
      const matchesSearch = item.name
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      return matchesSearch;
    });
  }, [data, searchTerm]);

  // --------------------------------------------------
  // HANDLERS
  // --------------------------------------------------
  const resetForm = () => {
    setSelectedCategory("");
    setTypeName("");
    setEditingId(null);
  };

  const handleSubmit = () => {
    if (!selectedCategory) {
      setToast({ message: "Please select a category", type: "error" });
      return;
    }
    if (!typeName.trim()) {
      setToast({ message: "Please enter a name", type: "error" });
      return;
    }

    // Check duplicate
    const duplicate = data.find(
      (item) =>
        item.category === selectedCategory &&
        item.name.toLowerCase() === typeName.trim().toLowerCase() &&
        item.id !== editingId
    );
    if (duplicate) {
      setToast({
        message: `"${typeName.trim()}" already exists in ${selectedCategory}`,
        type: "error",
      });
      return;
    }

    if (editingId !== null) {
      // UPDATE
      setData((prev) =>
        prev.map((item) =>
          item.id === editingId
            ? { ...item, category: selectedCategory, name: typeName.trim() }
            : item
        )
      );
      setToast({ message: "Payment type updated successfully", type: "success" });
    } else {
      // CREATE
      setData((prev) => [
        ...prev,
        {
          id: nextId,
          category: selectedCategory,
          name: typeName.trim(),
          status: "Active",
        },
      ]);
      setNextId((prev) => prev + 1);
      setToast({ message: "Payment type added successfully", type: "success" });
    }
    resetForm();
  };

  const handleEdit = (item: PaymentType) => {
    setSelectedCategory(item.category);
    setTypeName(item.name);
    setEditingId(item.id);
    scrollRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = (id: number) => {
    setData((prev) => prev.filter((item) => item.id !== id));
    setToast({ message: "Payment type deleted", type: "success" });
    if (editingId === id) resetForm();
  };

  const handleToggleStatus = (id: number) => {
    setData((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              status: item.status === "Active" ? "Inactive" : "Active",
            }
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
              <CreditCard size={20} />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-[#1F2937] md:text-2xl">
                Payment Type Management
              </h1>
              <p className="mt-0.5 text-[12.5px] text-[#6B7280]">
                Manage payment categories, types, and sub-types
              </p>
            </div>
          </div>
        </header>

        {/* TOP FORM */}
        <div className="rounded-xl border border-[#E5E7EB] bg-white shadow-xs overflow-hidden">
          <div className="flex items-center gap-2 border-b border-[#E5E7EB] bg-[#FAFBFC] px-5 py-3">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-[#10673E]/10 text-[#10673E]">
              {editingId !== null ? <Pencil size={14} /> : <Plus size={14} />}
            </div>
            <h2 className="text-[14px] font-bold text-[#1F2937]">
              {editingId !== null ? "Edit Payment Type" : "Add Payment Type"}
            </h2>
            {editingId !== null && (
              <span className="rounded-md bg-[#F59E0B]/10 px-2 py-0.5 text-[11px] font-semibold text-[#D97706]">
                Update Mode
              </span>
            )}
          </div>

          <div className="p-5">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {/* CATEGORY DROPDOWN */}
              <div>
                <label className="mb-1.5 block text-[13px] font-semibold text-[#374151]">
                  Payment Category
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="h-10 w-full rounded-lg border border-[#D1D5DB] bg-white px-3 text-[13px] text-[#1F2937] outline-none transition-colors focus:border-[#10673E] focus:ring-2 focus:ring-[#10673E]/15"
                >
                  <option value="">Select Category</option>
                  {CATEGORIES.map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* CONDITIONAL INPUT */}
              <div className="sm:col-span-2 lg:col-span-2">
                <label className="mb-1.5 block text-[13px] font-semibold text-[#374151]">
                  {selectedCategory
                    ? CATEGORY_LABELS[selectedCategory] || "Payment Type Name"
                    : "Payment Type Name"}
                </label>
                <input
                  type="text"
                  value={typeName}
                  onChange={(e) => setTypeName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSubmit();
                  }}
                  disabled={!selectedCategory}
                  placeholder={
                    selectedCategory
                      ? CATEGORY_PLACEHOLDERS[selectedCategory]
                      : "Select a category first"
                  }
                  className="h-10 w-full rounded-lg border border-[#D1D5DB] bg-white px-3 text-[13px] text-[#1F2937] outline-none transition-colors placeholder:text-[#9CA3AF] focus:border-[#10673E] focus:ring-2 focus:ring-[#10673E]/15 disabled:cursor-not-allowed disabled:bg-[#F9FAFB] disabled:text-[#9CA3AF]"
                />
              </div>

              {/* BUTTONS */}
              <div className="flex items-end gap-2">
                <button
                  onClick={handleSubmit}
                  className="flex h-10 items-center gap-2 rounded-lg bg-[#10673E] px-5 text-[13px] font-semibold text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#0D5A35] hover:shadow-md active:scale-[0.98]"
                >
                  {editingId !== null ? (
                    <>
                      <Check size={15} />
                      Update
                    </>
                  ) : (
                    <>
                      <Plus size={15} />
                      Add
                    </>
                  )}
                </button>
                {editingId !== null && (
                  <button
                    onClick={resetForm}
                    className="flex h-10 items-center gap-2 rounded-lg border border-[#D1D5DB] bg-white px-4 text-[13px] font-medium text-[#6B7280] transition-colors hover:bg-[#F9FAFB] hover:text-[#374151]"
                  >
                    <X size={14} />
                    Cancel
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* TOTAL RECORDS */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-xl border border-[#10673E] bg-[#E8F5ED] px-4 py-2.5 shadow-sm">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-[#10673E]/15 text-[#10673E]">
              <CreditCard size={14} />
            </div>
            <div>
              <p className="text-[12px] font-semibold text-[#10673E]">All Payment Types</p>
              <p className="text-[11px] text-[#94A3B8]">{data.length} total records</p>
            </div>
          </div>
        </div>

        {/* DATA TABLE */}
        <div className="rounded-xl border border-[#E5E7EB] bg-white shadow-xs overflow-hidden">
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

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[13px]">
              <thead>
                <tr className="border-b border-[#E5E7EB] bg-[#F8FAFC]">
                  <th className="px-5 py-3 font-semibold text-[#6B7280]">
                    SL
                  </th>
                  <th className="px-5 py-3 font-semibold text-[#6B7280]">
                    Category
                  </th>
                  <th className="px-5 py-3 font-semibold text-[#6B7280]">
                    Payment Type Name
                  </th>
                  <th className="px-5 py-3 font-semibold text-[#6B7280]">
                    Status
                  </th>
                  <th className="px-5 py-3 text-right font-semibold text-[#6B7280]">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredData.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-5 py-16 text-center">
                      <div className="flex flex-col items-center justify-center text-[#94A3B8]">
                        <CreditCard size={30} strokeWidth={1.5} />
                        <p className="mt-2 text-[13px] font-medium">
                          No payment types found
                        </p>
                        <p className="mt-1 text-[12px]">
                          {searchTerm
                            ? "Try a different search term"
                            : "Add a new payment type above"}
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
                      <td className="px-5 py-3 text-[#94A3B8]">
                        {index + 1}
                      </td>
                      <td className="px-5 py-3">
                        <span className="inline-flex items-center gap-1.5 rounded-md bg-[#F1F5F9] px-2.5 py-1 text-[12px] font-medium text-[#475569]">
                          {CATEGORIES.find((c) => c.value === item.category)
                            ?.icon &&
                            (() => {
                              const Icon = CATEGORIES.find(
                                (c) => c.value === item.category
                              )!.icon;
                              return <Icon size={12} />;
                            })()}
                          {item.category}
                        </span>
                      </td>
                      <td className="px-5 py-3 font-medium text-[#1F2937]">
                        {item.name}
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
                              item.status === "Active"
                                ? "bg-[#10673E]"
                                : "bg-[#CBD5E1]"
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
                Showing {filteredData.length} of {data.length} payment types

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

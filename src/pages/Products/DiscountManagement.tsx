import { useMemo, useState } from "react";
import {
  BadgePercent,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  Pencil,
  Plus,
  Search,
  Tag,
  Trash2,
  X,
} from "lucide-react";

// ======================================================
// TYPES
// ======================================================

type DiscountType = "Percentage (%)" | "Fixed Amount ($)" | "Tiered";

type DiscountStatus = "Active" | "Expired" | "Scheduled";

interface Discount {
  id: number;
  code: string;
  name: string;
  type: DiscountType;
  amount: number;
  validFrom: string; // yyyy-mm-dd
  validTo: string; // yyyy-mm-dd, "" = no end date
  minAmount: number | null;
  maxAmount: number | null;
}

interface DiscountForm {
  code: string;
  name: string;
  type: DiscountType | "";
  amount: string;
  validFrom: string;
  validTo: string;
  minAmount: string;
  maxAmount: string;
}

type Toast = { message: string; type: "success" | "error" } | null;

// ======================================================
// CONSTANTS
// ======================================================

const DISCOUNT_TYPES: DiscountType[] = [
  "Percentage (%)",
  "Fixed Amount ($)",
  "Tiered",
];

const EMPTY_FORM: DiscountForm = {
  code: "",
  name: "",
  type: "",
  amount: "",
  validFrom: "",
  validTo: "",
  minAmount: "",
  maxAmount: "",
};

const INITIAL_DATA: Discount[] = [
  {
    id: 1,
    code: "SUMMER2026",
    name: "Summer Clearance Sale",
    type: "Percentage (%)",
    amount: 15,
    validFrom: "2026-06-01",
    validTo: "2026-09-30",
    minAmount: 500,
    maxAmount: 5000,
  },
  {
    id: 2,
    code: "NEWYEAR26",
    name: "New Year Special",
    type: "Fixed Amount ($)",
    amount: 100,
    validFrom: "2026-01-01",
    validTo: "2026-01-15",
    minAmount: null,
    maxAmount: null,
  },
  {
    id: 3,
    code: "VIPTIER",
    name: "VIP Tiered Discount",
    type: "Tiered",
    amount: 250,
    validFrom: "2026-08-01",
    validTo: "2026-12-31",
    minAmount: 2000,
    maxAmount: 10000,
  },
  {
    id: 4,
    code: "FESTIVE",
    name: "Eid Festival Offer",
    type: "Percentage (%)",
    amount: 20,
    validFrom: "2026-09-10",
    validTo: "2026-09-25",
    minAmount: 1000,
    maxAmount: 8000,
  },
  {
    id: 5,
    code: "FLASH5",
    name: "Flash Sale 5%",
    type: "Percentage (%)",
    amount: 5,
    validFrom: "2026-09-05",
    validTo: "2026-09-09",
    minAmount: null,
    maxAmount: 2000,
  },
  {
    id: 6,
    code: "WELCOME",
    name: "Welcome Bonus",
    type: "Fixed Amount ($)",
    amount: 50,
    validFrom: "2026-01-01",
    validTo: "",
    minAmount: null,
    maxAmount: null,
  },
  {
    id: 7,
    code: "CLEARANCE",
    name: "Clearance Blowout",
    type: "Percentage (%)",
    amount: 30,
    validFrom: "2026-07-01",
    validTo: "2026-08-31",
    minAmount: 300,
    maxAmount: null,
  },
  {
    id: 8,
    code: "BULK10",
    name: "Bulk Order Discount",
    type: "Tiered",
    amount: 500,
    validFrom: "2026-09-01",
    validTo: "2026-12-31",
    minAmount: 5000,
    maxAmount: 50000,
  },
  {
    id: 9,
    code: "MONSOON",
    name: "Monsoon Offer",
    type: "Percentage (%)",
    amount: 10,
    validFrom: "2026-08-15",
    validTo: "2026-09-15",
    minAmount: null,
    maxAmount: null,
  },
  {
    id: 10,
    code: "ANNIV",
    name: "Anniversary Special",
    type: "Fixed Amount ($)",
    amount: 200,
    validFrom: "2026-09-20",
    validTo: "2026-10-05",
    minAmount: 1500,
    maxAmount: 6000,
  },
];

// ======================================================
// HELPERS
// ======================================================

function getStatus(discount: Discount): DiscountStatus {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const start = new Date(`${discount.validFrom}T00:00:00`);

  if (start > today) {
    return "Scheduled";
  }

  if (discount.validTo) {
    const end = new Date(`${discount.validTo}T00:00:00`);
    if (end < today) {
      return "Expired";
    }
  }

  return "Active";
}

function formatAmount(discount: Discount): string {
  if (discount.type === "Percentage (%)") {
    return `${discount.amount}%`;
  }
  return `$${discount.amount.toFixed(2)}`;
}

function formatDate(iso: string): string {
  if (!iso) {
    return "—";
  }

  const date = new Date(`${iso}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return iso;
  }

  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

const STATUS_STYLES: Record<
  DiscountStatus,
  { dot: string; badge: string }
> = {
  Active: {
    dot: "bg-[#0E9351]",
    badge: "bg-[#E8F5ED] text-[#10673E]",
  },
  Scheduled: {
    dot: "bg-[#D97706]",
    badge: "bg-[#F7EFD8] text-[#9A7B1F]",
  },
  Expired: {
    dot: "bg-[#B84A4A]",
    badge: "bg-[#FCECEC] text-[#B84A4A]",
  },
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
      className={`fixed top-5 right-5 z-[60] flex items-center gap-3 rounded-xl border px-4 py-3 shadow-lg transition-all duration-300 ${
        type === "success"
          ? "border-[#10673E]/20 bg-white text-[#10673E]"
          : "border-red-200 bg-white text-red-600"
      }`}
      style={{ animation: "dm-fade-up 0.3s ease both" }}
    >
      {type === "success" ? (
        <CheckCircle2 size={18} />
      ) : (
        <CircleAlert size={18} />
      )}
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
// ADD / EDIT MODAL
// ======================================================

interface DiscountModalProps {
  open: boolean;
  editingId: number | null;
  form: DiscountForm;
  errors: Record<string, string>;
  onChange: (field: keyof DiscountForm, value: string) => void;
  onSave: () => void;
  onClose: () => void;
}

function DiscountModal({
  open,
  editingId,
  form,
  errors,
  onChange,
  onSave,
  onClose,
}: DiscountModalProps) {
  if (!open) {
    return null;
  }

  const inputClass = (field: keyof DiscountForm) => `
    h-10
    w-full
    rounded-lg
    border
    bg-white
    px-3
    text-[13px]
    text-[#17231D]
    outline-none
    transition-colors
    placeholder:text-[#9CA3AF]
    ${
      errors[field]
        ? "border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-500/15"
        : "border-[#DDE5DF] focus:border-[#0E9351] focus:ring-2 focus:ring-[#0E9351]/15"
    }
  `;

  const requiredLabel = (label: string) => (
    <>
      {label} <span className="text-red-500">*</span>
    </>
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-[2px]"
      style={{ animation: "dm-fade 150ms ease-out" }}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-[#E5E7EB] bg-white shadow-2xl"
        style={{ animation: "dm-pop 180ms ease-out" }}
      >
        {/* MODAL HEADER */}
        <div className="flex shrink-0 items-center justify-between border-b border-[#E6EAE3] bg-[#F1F8F3] px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#10673E] text-white">
              {editingId !== null ? (
                <Pencil size={16} />
              ) : (
                <Plus size={16} />
              )}
            </div>
            <div>
              <h2 className="text-[15px] font-bold text-[#17231D]">
                {editingId !== null
                  ? "Edit Discount"
                  : "Create New Discount"}
              </h2>
              <p className="text-[11px] text-[#66736B]">
                {editingId !== null
                  ? `Updating discount code ${form.code || "—"}`
                  : "Add a new discount rule to the system"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-[#66736B] transition-colors hover:bg-[#E8F5ED] hover:text-[#10673E]"
          >
            <X size={18} />
          </button>
        </div>

        {/* MODAL BODY */}
        <div className="min-h-0 flex-1 overflow-y-auto p-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* DISCOUNT CODE */}
            <div>
              <label className="mb-1.5 block text-[12.5px] font-semibold text-[#374151]">
                {requiredLabel("Discount Code")}
              </label>
              <input
                type="text"
                value={form.code}
                onChange={(e) => onChange("code", e.target.value)}
                placeholder="e.g. SUMMER2026"
                className={inputClass("code")}
              />
              {errors.code && (
                <p className="mt-1 text-[11px] font-medium text-red-500">
                  {errors.code}
                </p>
              )}
            </div>

            {/* DISCOUNT NAME */}
            <div>
              <label className="mb-1.5 block text-[12.5px] font-semibold text-[#374151]">
                {requiredLabel("Discount Name")}
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => onChange("name", e.target.value)}
                placeholder="e.g. Summer Clearance Sale"
                className={inputClass("name")}
              />
              {errors.name && (
                <p className="mt-1 text-[11px] font-medium text-red-500">
                  {errors.name}
                </p>
              )}
            </div>

            {/* DISCOUNT TYPE */}
            <div>
              <label className="mb-1.5 block text-[12.5px] font-semibold text-[#374151]">
                {requiredLabel("Discount Type")}
              </label>
              <select
                value={form.type}
                onChange={(e) =>
                  onChange("type", e.target.value as DiscountType | "")
                }
                className={`${inputClass("type")} ${
                  form.type ? "" : "text-[#9CA3AF]"
                }`}
              >
                <option value="" disabled>
                  Select discount type
                </option>
                {DISCOUNT_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
              {errors.type && (
                <p className="mt-1 text-[11px] font-medium text-red-500">
                  {errors.type}
                </p>
              )}
            </div>

            {/* AMOUNT */}
            <div>
              <label className="mb-1.5 block text-[12.5px] font-semibold text-[#374151]">
                {requiredLabel("Amount")}
              </label>
              <input
                type="number"
                min={0}
                step="0.01"
                value={form.amount}
                onChange={(e) => onChange("amount", e.target.value)}
                placeholder={
                  form.type === "Percentage (%)"
                    ? "e.g. 15"
                    : form.type === "Tiered"
                      ? "e.g. 100.00"
                      : "e.g. 100.00"
                }
                className={inputClass("amount")}
              />
              {errors.amount && (
                <p className="mt-1 text-[11px] font-medium text-red-500">
                  {errors.amount}
                </p>
              )}
            </div>

            {/* START DATE (REQUIRED) */}
            <div>
              <label className="mb-1.5 block text-[12.5px] font-semibold text-[#374151]">
                {requiredLabel("Start Date")}
              </label>
              <input
                type="date"
                value={form.validFrom}
                onChange={(e) => onChange("validFrom", e.target.value)}
                className={inputClass("validFrom")}
              />
              {errors.validFrom && (
                <p className="mt-1 text-[11px] font-medium text-red-500">
                  {errors.validFrom}
                </p>
              )}
            </div>

            {/* END DATE (OPTIONAL) */}
            <div>
              <label className="mb-1.5 block text-[12.5px] font-semibold text-[#374151]">
                End Date
              </label>
              <input
                type="date"
                value={form.validTo}
                onChange={(e) => onChange("validTo", e.target.value)}
                className={inputClass("validTo")}
              />
              {errors.validTo && (
                <p className="mt-1 text-[11px] font-medium text-red-500">
                  {errors.validTo}
                </p>
              )}
            </div>

            {/* MIN DISCOUNT AMOUNT (OPTIONAL) */}
            <div>
              <label className="mb-1.5 block text-[12.5px] font-semibold text-[#374151]">
                Minimum Discount Amount
              </label>
              <input
                type="number"
                min={0}
                step="0.01"
                value={form.minAmount}
                onChange={(e) => onChange("minAmount", e.target.value)}
                placeholder="Optional"
                className={inputClass("minAmount")}
              />
              {errors.minAmount && (
                <p className="mt-1 text-[11px] font-medium text-red-500">
                  {errors.minAmount}
                </p>
              )}
            </div>

            {/* MAX DISCOUNT AMOUNT (OPTIONAL) */}
            <div>
              <label className="mb-1.5 block text-[12.5px] font-semibold text-[#374151]">
                Maximum Discount Amount
              </label>
              <input
                type="number"
                min={0}
                step="0.01"
                value={form.maxAmount}
                onChange={(e) => onChange("maxAmount", e.target.value)}
                placeholder="Optional"
                className={inputClass("maxAmount")}
              />
              {errors.maxAmount && (
                <p className="mt-1 text-[11px] font-medium text-red-500">
                  {errors.maxAmount}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* MODAL FOOTER */}
        <div className="flex shrink-0 items-center justify-end gap-2 border-t border-[#E6EAE3] bg-[#FAFBF9] px-5 py-3.5">
          <button
            onClick={onClose}
            className="flex h-10 items-center gap-2 rounded-lg border border-[#D1D5DB] bg-white px-5 text-[13px] font-medium text-[#6B7280] transition-colors hover:bg-[#F3F4F6] hover:text-[#374151]"
          >
            Cancel
          </button>
          <button
            onClick={onSave}
            className="flex h-10 items-center gap-2 rounded-lg bg-[#0E9351] px-5 text-[13px] font-semibold text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#10673E] hover:shadow-md active:scale-[0.98]"
          >
            <CheckCircle2 size={15} />
            Save Discount
          </button>
        </div>
      </div>
    </div>
  );
}

// ======================================================
// PAGE
// ======================================================

export default function DiscountManagement() {
  // --------------------------------------------------
  // DATA
  // --------------------------------------------------
  const [data, setData] = useState<Discount[]>(INITIAL_DATA);
  const [nextId, setNextId] = useState(11);

  // --------------------------------------------------
  // MODAL STATE
  // --------------------------------------------------
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<DiscountForm>(EMPTY_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // --------------------------------------------------
  // FILTER / PAGINATION STATE
  // --------------------------------------------------
  const [searchTerm, setSearchTerm] = useState("");
  const [pageSize, setPageSize] = useState<"all" | 5 | 10>("all");
  const [page, setPage] = useState(1);

  // --------------------------------------------------
  // TOAST
  // --------------------------------------------------
  const [toast, setToast] = useState<Toast>(null);

  // --------------------------------------------------
  // FILTERED + PAGINATED DATA
  // --------------------------------------------------
  const filteredData = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    if (!term) {
      return data;
    }

    return data.filter((item) =>
      [item.code, item.name, item.type].some((value) =>
        value.toLowerCase().includes(term)
      )
    );
  }, [data, searchTerm]);

  const pageCount =
    pageSize === "all"
      ? 1
      : Math.max(1, Math.ceil(filteredData.length / pageSize));

  const safePage = Math.min(page, pageCount);

  const visibleData =
    pageSize === "all"
      ? filteredData
      : filteredData.slice(
          (safePage - 1) * pageSize,
          safePage * pageSize
        );

  // --------------------------------------------------
  // MODAL HELPERS
  // --------------------------------------------------
  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setErrors({});
    setIsModalOpen(true);
  };

  const openEdit = (discount: Discount) => {
    setEditingId(discount.id);
    setForm({
      code: discount.code,
      name: discount.name,
      type: discount.type,
      amount: String(discount.amount),
      validFrom: discount.validFrom,
      validTo: discount.validTo,
      minAmount:
        discount.minAmount === null
          ? ""
          : String(discount.minAmount),
      maxAmount:
        discount.maxAmount === null
          ? ""
          : String(discount.maxAmount),
    });
    setErrors({});
    setIsModalOpen(true);
  };

  const handleChange = (
    field: keyof DiscountForm,
    value: string
  ) => {
    setForm((prev) => ({ ...prev, [field]: value }));

    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  // --------------------------------------------------
  // SAVE
  // --------------------------------------------------
  const handleSave = () => {
    const nextErrors: Record<string, string> = {};

    if (!form.code.trim()) {
      nextErrors.code = "Discount code is required";
    } else {
      const duplicate = data.find(
        (item) =>
          item.code.toLowerCase() ===
            form.code.trim().toLowerCase() &&
          item.id !== editingId
      );
      if (duplicate) {
        nextErrors.code = `Code "${form.code.trim()}" already exists`;
      }
    }

    if (!form.name.trim()) {
      nextErrors.name = "Discount name is required";
    }

    if (!form.type) {
      nextErrors.type = "Select a discount type";
    }

    const amount = Number(form.amount);
    if (
      form.amount.trim() === "" ||
      !Number.isFinite(amount) ||
      amount <= 0
    ) {
      nextErrors.amount =
        "Enter a valid amount greater than 0";
    }

    if (!form.validFrom) {
      nextErrors.validFrom = "Start date is required";
    }

    if (
      form.validTo &&
      form.validFrom &&
      form.validTo < form.validFrom
    ) {
      nextErrors.validTo =
        "End date must be after the start date";
    }

    const parseOptional = (value: string): number | null => {
      if (value.trim() === "") {
        return null;
      }
      const num = Number(value);
      return Number.isFinite(num) && num >= 0 ? num : NaN;
    };

    const min = parseOptional(form.minAmount);
    const max = parseOptional(form.maxAmount);

    if (min !== null && Number.isNaN(min)) {
      nextErrors.minAmount =
        "Enter a valid minimum amount";
    }

    if (max !== null && Number.isNaN(max)) {
      nextErrors.maxAmount =
        "Enter a valid maximum amount";
    }

    if (
      min !== null &&
      max !== null &&
      !Number.isNaN(min) &&
      !Number.isNaN(max) &&
      min > max
    ) {
      nextErrors.maxAmount =
        "Maximum must be greater than or equal to minimum";
    }

    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    const discount: Discount = {
      id: editingId ?? nextId,
      code: form.code.trim(),
      name: form.name.trim(),
      type: form.type as DiscountType,
      amount,
      validFrom: form.validFrom,
      validTo: form.validTo,
      minAmount: min,
      maxAmount: max,
    };

    if (editingId !== null) {
      setData((prev) =>
        prev.map((item) =>
          item.id === editingId ? discount : item
        )
      );
      setToast({
        message: `Discount "${discount.code}" updated successfully`,
        type: "success",
      });
    } else {
      setData((prev) => [...prev, discount]);
      setNextId((prev) => prev + 1);
      setToast({
        message: `Discount "${discount.code}" created successfully`,
        type: "success",
      });
    }

    setIsModalOpen(false);
  };

  // --------------------------------------------------
  // DELETE
  // --------------------------------------------------
  const handleDelete = (discount: Discount) => {
    setData((prev) =>
      prev.filter((item) => item.id !== discount.id)
    );
    setToast({
      message: `Discount "${discount.code}" deleted`,
      type: "success",
    });
  };

  // --------------------------------------------------
  // RENDER
  // --------------------------------------------------
  return (
    <div className="h-full overflow-y-auto bg-[#F5F7F3]">
      <style>{`
        @keyframes dm-fade {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes dm-pop {
          from {
            opacity: 0;
            transform: translateY(10px) scale(0.98);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        @keyframes dm-fade-up {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div
        className="mx-auto max-w-[1440px] space-y-5 p-4 lg:p-6"
        style={{ animation: "dm-fade-up 0.4s ease both" }}
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
              <BadgePercent size={20} />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-[#1F2937] md:text-2xl">
                Discount Management
              </h1>
              <p className="mt-0.5 text-[12.5px] text-[#6B7280]">
                Create and manage discount rules,
                offers, and promotions
              </p>
            </div>
          </div>

          <button
            onClick={openCreate}
            className="flex h-10 items-center gap-2 rounded-lg bg-[#0E9351] px-5 text-[13px] font-semibold text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#10673E] hover:shadow-md active:scale-[0.98]"
          >
            <Plus size={15} />
            Create New Discount
          </button>
        </header>

        {/* DATA TABLE */}
        <div className="overflow-hidden rounded-xl border border-[#E5E7EB] bg-white shadow-sm">
          {/* TOOLBAR — SEARCH + PAGINATION */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E5E7EB] bg-[#FAFBFC] px-5 py-3">
            <div className="flex items-center gap-2">
              <h2 className="text-[14px] font-bold text-[#1F2937]">
                Discounts
              </h2>
              <span className="rounded-md bg-[#10673E]/10 px-2.5 py-1 text-[11px] font-semibold text-[#10673E]">
                {filteredData.length} records
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* SEARCH */}
              <div className="relative">
                <Search
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]"
                />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setPage(1);
                  }}
                  placeholder="Search code, name, type..."
                  className="h-9 w-full rounded-lg border border-[#D1D5DB] bg-white pl-9 pr-3 text-[13px] text-[#1F2937] outline-none placeholder:text-[#9CA3AF] focus:border-[#0E9351] focus:ring-2 focus:ring-[#0E9351]/15 sm:w-64"
                />
              </div>

              {/* PAGE SIZE */}
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(
                    e.target.value === "all"
                      ? "all"
                      : (Number(e.target.value) as 5 | 10)
                  );
                  setPage(1);
                }}
                className="h-9 rounded-lg border border-[#D1D5DB] bg-white px-2.5 text-[12px] font-medium text-[#374151] outline-none focus:border-[#0E9351] focus:ring-2 focus:ring-[#0E9351]/15"
              >
                <option value="all">All</option>
                <option value={5}>5 / page</option>
                <option value={10}>10 / page</option>
              </select>

              {/* PAGINATION CONTROLS */}
              {pageSize !== "all" && pageCount > 1 && (
                <div className="flex items-center gap-1">
                  <button
                    onClick={() =>
                      setPage((prev) => Math.max(1, prev - 1))
                    }
                    disabled={safePage <= 1}
                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#D1D5DB] bg-white text-[#374151] transition-colors hover:bg-[#E8F5ED] hover:text-[#10673E] disabled:cursor-not-allowed disabled:opacity-40"
                    title="Previous page"
                  >
                    <ChevronLeft size={14} />
                  </button>
                  <span className="px-2 text-[12px] font-medium text-[#6B7280]">
                    Page {safePage} of {pageCount}
                  </span>
                  <button
                    onClick={() =>
                      setPage((prev) =>
                        Math.min(pageCount, prev + 1)
                      )
                    }
                    disabled={safePage >= pageCount}
                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#D1D5DB] bg-white text-[#374151] transition-colors hover:bg-[#E8F5ED] hover:text-[#10673E] disabled:cursor-not-allowed disabled:opacity-40"
                    title="Next page"
                  >
                    <ChevronRight size={14} />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* TABLE */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[13px]">
              <thead>
                <tr className="bg-[#10673E] text-white">
                  <th className="px-5 py-3.5 font-bold tracking-wide">
                    Code
                  </th>
                  <th className="px-5 py-3.5 font-bold tracking-wide">
                    Name
                  </th>
                  <th className="px-5 py-3.5 font-bold tracking-wide">
                    Type
                  </th>
                  <th className="px-5 py-3.5 font-bold tracking-wide">
                    Amount
                  </th>
                  <th className="px-5 py-3.5 font-bold tracking-wide">
                    Valid From
                  </th>
                  <th className="px-5 py-3.5 font-bold tracking-wide">
                    Valid To
                  </th>
                  <th className="px-5 py-3.5 font-bold tracking-wide">
                    Status
                  </th>
                  <th className="px-5 py-3.5 text-right font-bold tracking-wide">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {visibleData.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-5 py-16 text-center">
                      <div className="flex flex-col items-center justify-center text-[#94A3B8]">
                        <BadgePercent size={30} strokeWidth={1.5} />
                        <p className="mt-2 text-[13px] font-medium">
                          No discounts found
                        </p>
                        <p className="mt-1 text-[12px]">
                          {searchTerm
                            ? "Try a different search term"
                            : "Create your first discount above"}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  visibleData.map((discount) => {
                    const status = getStatus(discount);
                    const statusStyle = STATUS_STYLES[status];

                    return (
                      <tr
                        key={discount.id}
                        className="border-b border-[#F1F5F9] transition-colors hover:bg-[#F1F8F3]"
                      >
                        <td className="px-5 py-3">
                          <span className="inline-flex items-center gap-1.5 rounded-md bg-[#10673E]/5 px-2.5 py-1 font-mono text-[12px] font-semibold text-[#17231D]">
                            <Tag size={11} className="text-[#10673E]" />
                            {discount.code}
                          </span>
                        </td>
                        <td className="px-5 py-3 font-medium text-[#1F2937]">
                          {discount.name}
                        </td>
                        <td className="px-5 py-3">
                          <span className="inline-flex items-center rounded-md bg-[#F1F5F9] px-2.5 py-1 text-[12px] font-medium text-[#475569]">
                            {discount.type}
                          </span>
                        </td>
                        <td className="px-5 py-3 font-semibold text-[#10673E]">
                          {formatAmount(discount)}
                        </td>
                        <td className="px-5 py-3 text-[#6B7280]">
                          {formatDate(discount.validFrom)}
                        </td>
                        <td className="px-5 py-3 text-[#6B7280]">
                          {formatDate(discount.validTo)}
                        </td>
                        <td className="px-5 py-3">
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${statusStyle.badge}`}
                          >
                            <span
                              className={`h-1.5 w-1.5 rounded-full ${statusStyle.dot}`}
                            />
                            {status}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => openEdit(discount)}
                              className="flex h-7 w-7 items-center justify-center rounded-md text-[#64748B] transition-colors hover:bg-[#E8F5ED] hover:text-[#10673E]"
                              title="Edit discount"
                            >
                              <Pencil size={14} />
                            </button>
                            <button
                              onClick={() => handleDelete(discount)}
                              className="flex h-7 w-7 items-center justify-center rounded-md text-[#94A3B8] transition-colors hover:bg-[#FEE2E2] hover:text-[#DC2626]"
                              title="Delete discount"
                            >
                              <Trash2 size={14} />
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

          {/* TABLE FOOTER */}
          {filteredData.length > 0 && (
            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[#E5E7EB] bg-[#FAFBFC] px-5 py-3">
              <p className="text-[12px] text-[#94A3B8]">
                Showing {visibleData.length} of{" "}
                {filteredData.length} discounts
              </p>
              <div className="flex items-center gap-2 text-[12px]">
                <span className="text-[#94A3B8]">Active:</span>
                <span className="font-semibold text-[#10673E]">
                  {
                    filteredData.filter(
                      (item) => getStatus(item) === "Active"
                    ).length
                  }
                </span>
                <span className="mx-1 text-[#E5E7EB]">|</span>
                <span className="text-[#94A3B8]">Scheduled:</span>
                <span className="font-semibold text-[#9A7B1F]">
                  {
                    filteredData.filter(
                      (item) => getStatus(item) === "Scheduled"
                    ).length
                  }
                </span>
                <span className="mx-1 text-[#E5E7EB]">|</span>
                <span className="text-[#94A3B8]">Expired:</span>
                <span className="font-semibold text-[#B84A4A]">
                  {
                    filteredData.filter(
                      (item) => getStatus(item) === "Expired"
                    ).length
                  }
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ADD / EDIT MODAL */}
      <DiscountModal
        open={isModalOpen}
        editingId={editingId}
        form={form}
        errors={errors}
        onChange={handleChange}
        onSave={handleSave}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
}
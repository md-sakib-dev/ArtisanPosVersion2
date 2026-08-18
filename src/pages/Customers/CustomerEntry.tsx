import { useState, useRef, useEffect } from "react";
import {
  UserPlus,
  Save,
  RotateCcw,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Search,
  Pencil,
  CheckCircle2,
  X,
  BadgePercent,
  Globe,
  Users,
  List,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/* Mock customer data                                                    */
/* ------------------------------------------------------------------ */

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  gender: string;
  dob: string;
  address: string;
  country: string;
  discount: string;
}

const MOCK_CUSTOMERS: Customer[] = [
  { id: "C001", name: "Farhan Ahmed", email: "farhan@email.com", phone: "01712345678", gender: "Male", dob: "1990-05-15", address: "Road 12, Dhanmondi, Dhaka", country: "Bangladesh", discount: "VIP" },
  { id: "C002", name: "Nusrat Jahan", email: "nusrat@email.com", phone: "01812345678", gender: "Female", dob: "1988-11-22", address: "Gulshan 2, Dhaka", country: "Bangladesh", discount: "Regular" },
  { id: "C003", name: "Rafiqul Islam", email: "rafiq@email.com", phone: "01912345678", gender: "Male", dob: "1995-03-10", address: "Uttara Sector 7, Dhaka", country: "Bangladesh", discount: "5% Off" },
  { id: "C004", name: "Sadia Rahman", email: "sadia@email.com", phone: "01612345678", gender: "Female", dob: "1992-07-28", address: "Banani, Dhaka", country: "Bangladesh", discount: "VIP" },
  { id: "C005", name: "Tanvir Hasan", email: "tanvir@email.com", phone: "01512345678", gender: "Male", dob: "1985-01-05", address: "Chittagong EPZ", country: "Bangladesh", discount: "Regular" },
];

const EMPTY_FORM: Customer = {
  id: "",
  name: "",
  email: "",
  phone: "",
  gender: "",
  dob: "",
  address: "",
  country: "Bangladesh",
  discount: "Regular",
};

const COUNTRIES = ["Bangladesh", "India", "Nepal", "Sri Lanka", "Myanmar", "Pakistan"];
const DISCOUNT_TIERS = ["Regular", "5% Off", "10% Off", "VIP", "Wholesale"];

/* ------------------------------------------------------------------ */
/* Toast                                                                 */
/* ------------------------------------------------------------------ */

function Toast({ message, type, onClose }: { message: string; type: "success" | "error"; onClose: () => void }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3000);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div
      className={`
        fixed top-5 right-5 z-50 flex items-center gap-3 rounded-xl border px-4 py-3 shadow-lg
        transition-all duration-300
        ${type === "success" ? "border-[#10673E]/20 bg-white text-[#10673E]" : "border-red-200 bg-white text-red-600"}
      `}
      style={{ animation: "fade-up 0.3s ease both" }}
    >
      {type === "success" ? <CheckCircle2 size={18} /> : <X size={18} />}
      <span className="text-sm font-medium">{message}</span>
      <button onClick={onClose} className="ml-2 text-[#94A3B8] hover:text-[#64748B]">
        <X size={14} />
      </button>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Page                                                                 */
/* ------------------------------------------------------------------ */

export default function CustomerEntry() {
  const [form, setForm] = useState<Customer>({ ...EMPTY_FORM });
  const [isEditing, setIsEditing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Customer[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  /* Close dropdown on outside click */
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  /* Search customers */
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query.length < 2) {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }
    const q = query.toLowerCase();
    const results = MOCK_CUSTOMERS.filter(
      (c) => c.phone.includes(q) || c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q)
    );
    setSearchResults(results);
    setShowDropdown(results.length > 0);
  };

  /* Select a customer for editing */
  const handleSelectCustomer = (customer: Customer) => {
    setForm({ ...customer });
    setIsEditing(true);
    setSearchQuery(customer.phone);
    setShowDropdown(false);
  };

  /* Clear search and load blank form */
  const handleClearSearch = () => {
    setSearchQuery("");
    setForm({ ...EMPTY_FORM });
    setIsEditing(false);
    setSearchResults([]);
    setShowDropdown(false);
  };

  /* Update form field */
  const update = (field: keyof Customer, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  /* Submit */
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.phone.trim()) {
      setToast({ message: "Please fill in Name and Contact Number", type: "error" });
      return;
    }
    if (isEditing) {
      setToast({ message: `Customer "${form.name}" updated successfully`, type: "success" });
    } else {
      setToast({ message: `Customer "${form.name}" registered successfully`, type: "success" });
      setForm({ ...EMPTY_FORM });
      setSearchQuery("");
      setIsEditing(false);
    }
  };

  /* Reset form */
  const handleReset = () => {
    setForm({ ...EMPTY_FORM });
    setIsEditing(false);
    setSearchQuery("");
  };

  return (
    <div className="h-full overflow-y-auto bg-[#F5F7F3]">
      <div
        className="mx-auto max-w-[1200px] space-y-5 p-4 lg:p-6"
        style={{ animation: "fade-up 0.4s ease both" }}
      >
        {/* Toast */}
        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

        {/* -------- Header -------- */}
        <header>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#10673E]/10 text-[#10673E]">
              <UserPlus size={20} />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-[#1F2937] md:text-2xl">
                Customer Registration
              </h1>
              <p className="mt-0.5 text-[12.5px] text-[#6B7280]">
                Create and manage customer profiles, preferences, and loyalty details
              </p>
            </div>
            {isEditing && (
              <span className="ml-2 inline-flex items-center gap-1.5 rounded-lg bg-[#2D5597]/10 px-3 py-1.5 text-[12px] font-semibold text-[#2D5597]">
                <Pencil size={13} />
                Editing: {form.id}
              </span>
            )}
          </div>
        </header>

        {/* -------- Search / Contact Row -------- */}
        <div className="rounded-xl border border-[#E5E7EB] bg-white p-5 shadow-xs">
          <div className="flex items-start gap-3 mb-4">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#2D5597]/10 text-[#2D5597]">
              <Search size={18} />
            </div>
            <div>
              <h2 className="text-[14px] font-bold text-[#1F2937]">Find Existing Customer</h2>
              <p className="mt-0.5 text-[11.5px] text-[#94A3B8]">Search by phone number, name, or email to edit an existing record</p>
            </div>
          </div>

          <div className="relative" ref={dropdownRef}>
            <div className="flex items-center gap-3">
              <div className="relative flex-1 max-w-md">
                <Phone size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  placeholder="01XXXXXXXXX or customer name"
                  className="
                    w-full
                    rounded-lg
                    border
                    border-[#D1D5DB]
                    bg-[#F9FAFB]
                    py-2.5
                    pl-10
                    pr-4
                    text-[13px]
                    text-[#1F2937]
                    placeholder-[#9CA3AF]
                    transition-all
                    focus:border-[#10673E]
                    focus:bg-white
                    focus:outline-none
                    focus:ring-2
                    focus:ring-[#10673E]/20
                  "
                />
              </div>
              {isEditing && (
                <button
                  onClick={handleClearSearch}
                  className="
                    flex
                    items-center
                    gap-1.5
                    rounded-lg
                    border
                    border-[#D1D5DB]
                    bg-white
                    px-3
                    py-2.5
                    text-[12px]
                    font-medium
                    text-[#6B7280]
                    transition-colors
                    hover:bg-[#F9FAFB]
                    hover:text-[#374151]
                  "
                >
                  <RotateCcw size={14} />
                  New Customer
                </button>
              )}
            </div>

            {/* Search Dropdown */}
            {showDropdown && searchResults.length > 0 && (
              <div className="absolute left-0 top-full z-30 mt-2 w-full max-w-lg overflow-hidden rounded-xl border border-[#E5E7EB] bg-white shadow-xl">
                <div className="border-b border-[#E5E7EB] px-4 py-2.5">
                  <p className="text-[11.5px] font-medium text-[#94A3B8]">{searchResults.length} customer{searchResults.length !== 1 ? "s" : ""} found</p>
                </div>
                <div className="max-h-64 overflow-y-auto">
                  {searchResults.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => handleSelectCustomer(c)}
                      className="
                        flex
                        w-full
                        items-center
                        gap-3
                        px-4
                        py-3
                        text-left
                        transition-colors
                        hover:bg-[#F1F8F3]
                      "
                    >
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#10673E]/10 text-[#10673E] text-[12px] font-bold">
                        {c.id}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[13px] font-semibold text-[#1F2937]">{c.name}</p>
                        <p className="text-[11.5px] text-[#94A3B8]">{c.phone} · {c.email}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`rounded-md px-2 py-0.5 text-[10.5px] font-semibold ${c.discount === "VIP" ? "bg-[#E2BA48]/15 text-[#C9A02E]" : "bg-[#F1F5F9] text-[#64748B]"}`}>
                          {c.discount}
                        </span>
                        <Pencil size={13} className="text-[#94A3B8]" />
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* -------- Customer Form -------- */}
        <form onSubmit={handleSubmit}>
          <div className="rounded-xl border border-[#E5E7EB] bg-white shadow-xs overflow-hidden">
            {/* Section Header */}
            <div className="border-b border-[#E5E7EB] px-5 py-4">
              <div className="flex items-center gap-2">
                <Users size={16} className="text-[#10673E]" />
                <h2 className="text-[14px] font-bold text-[#1F2937]">Customer Details</h2>
              </div>
            </div>

            <div className="p-5 space-y-6">
              {/* ---- Primary Details (4-col) ---- */}
              <div>
                <p className="mb-3 text-[11.5px] font-semibold uppercase tracking-wider text-[#94A3B8]">Primary Information</p>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <FormField
                    label="Customer Name"
                    required
                    icon={<Users size={14} />}
                    value={form.name}
                    onChange={(v) => update("name", v)}
                    placeholder="Full name"
                  />
                  <FormField
                    label="Email Address"
                    type="email"
                    icon={<Mail size={14} />}
                    value={form.email}
                    onChange={(v) => update("email", v)}
                    placeholder="email@example.com"
                  />
                  <FormSelect
                    label="Gender"
                    icon={<Users size={14} />}
                    value={form.gender}
                    onChange={(v) => update("gender", v)}
                    options={["", "Male", "Female", "Other"]}
                    placeholders={["Select gender", "Male", "Female", "Other"]}
                  />
                  <FormField
                    label="Date of Birth"
                    type="date"
                    icon={<Calendar size={14} />}
                    value={form.dob}
                    onChange={(v) => update("dob", v)}
                  />
                </div>
              </div>

              {/* ---- Secondary Details (4-col) ---- */}
              <div>
                <p className="mb-3 text-[11.5px] font-semibold uppercase tracking-wider text-[#94A3B8]">Additional Details</p>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="lg:col-span-2">
                    <FormField
                      label="Address"
                      icon={<MapPin size={14} />}
                      value={form.address}
                      onChange={(v) => update("address", v)}
                      placeholder="Full address"
                    />
                  </div>
                  <FormSelect
                    label="Country"
                    icon={<Globe size={14} />}
                    value={form.country}
                    onChange={(v) => update("country", v)}
                    options={COUNTRIES}
                    placeholders={COUNTRIES}
                  />
                  <FormSelect
                    label="Discount / Category"
                    icon={<BadgePercent size={14} />}
                    value={form.discount}
                    onChange={(v) => update("discount", v)}
                    options={DISCOUNT_TIERS}
                    placeholders={DISCOUNT_TIERS}
                  />
                </div>
              </div>
            </div>

            {/* ---- Action Bar ---- */}
            <div className="border-t border-[#E5E7EB] bg-[#FAFBFC] px-5 py-4">
              <div className="flex items-center justify-between">
                <p className="text-[12px] text-[#94A3B8]">
                  {isEditing ? `Editing customer ${form.id}` : "All fields marked with * are required"}
                </p>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handleReset}
                    className="
                      flex
                      items-center
                      gap-2
                      rounded-lg
                      border
                      border-[#D1D5DB]
                      bg-white
                      px-4
                      py-2.5
                      text-[13px]
                      font-medium
                      text-[#6B7280]
                      transition-all
                      hover:bg-[#F9FAFB]
                      hover:text-[#374151]
                    "
                  >
                    <RotateCcw size={15} />
                    Clear
                  </button>
                  <button
                    type="submit"
                    className="
                      flex
                      items-center
                      gap-2
                      rounded-lg
                      bg-[#10673E]
                      px-5
                      py-2.5
                      text-[13px]
                      font-semibold
                      text-white
                      shadow-sm
                      transition-all
                      duration-200
                      hover:-translate-y-0.5
                      hover:bg-[#0D5A35]
                      hover:shadow-md
                    "
                  >
                    <Save size={15} />
                    {isEditing ? "Update Customer" : "Save Customer"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </form>

        {/* -------- Customer List Table -------- */}
        <div className="rounded-xl border border-[#E5E7EB] bg-white shadow-xs overflow-hidden">
          <div className="border-b border-[#E5E7EB] px-5 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <List size={16} className="text-[#10673E]" />
                <h2 className="text-[14px] font-bold text-[#1F2937]">All Customers</h2>
              </div>
              <span className="rounded-lg bg-[#F1F5F9] px-2.5 py-1 text-[11.5px] font-semibold text-[#64748B]">
                {MOCK_CUSTOMERS.length} records
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-[13px]">
              <thead>
                <tr className="border-b border-[#E5E7EB]">
                  <th className="px-5 py-3 text-[11.5px] font-semibold text-[#6B7280]">ID</th>
                  <th className="px-5 py-3 text-[11.5px] font-semibold text-[#6B7280]">Name</th>
                  <th className="px-5 py-3 text-[11.5px] font-semibold text-[#6B7280]">Phone</th>
                  <th className="px-5 py-3 text-[11.5px] font-semibold text-[#6B7280]">Email</th>
                  <th className="px-5 py-3 text-[11.5px] font-semibold text-[#6B7280]">Gender</th>
                  <th className="px-5 py-3 text-[11.5px] font-semibold text-[#6B7280]">Category</th>
                  <th className="px-5 py-3 text-right text-[11.5px] font-semibold text-[#6B7280]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F5F9]">
                {MOCK_CUSTOMERS.map((c) => (
                  <tr
                    key={c.id}
                    className={`transition-colors hover:bg-[#F9FAFB] ${
                      form.id === c.id ? "bg-[#F1F8F3]" : ""
                    }`}
                  >
                    <td className="px-5 py-3 font-medium text-[#64748B] tabular-nums">{c.id}</td>
                    <td className="px-5 py-3 font-semibold text-[#1F2937]">{c.name}</td>
                    <td className="px-5 py-3 text-[#374151] tabular-nums">{c.phone}</td>
                    <td className="px-5 py-3 text-[#6B7280]">{c.email}</td>
                    <td className="px-5 py-3 text-[#6B7280]">{c.gender}</td>
                    <td className="px-5 py-3">
                      <span className={`rounded-md px-2 py-0.5 text-[11px] font-medium ${
                        c.discount === "VIP" ? "bg-[#E2BA48]/15 text-[#C9A02E]" :
                        c.discount === "Wholesale" ? "bg-[#2D5597]/10 text-[#2D5597]" :
                        "bg-[#F1F5F9] text-[#64748B]"
                      }`}>
                        {c.discount}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <button
                        onClick={() => handleSelectCustomer(c)}
                        className="
                          inline-flex
                          items-center
                          gap-1.5
                          rounded-lg
                          px-2.5
                          py-1.5
                          text-[12px]
                          font-medium
                          text-[#10673E]
                          transition-colors
                          hover:bg-[#E8F5ED]
                        "
                      >
                        <Pencil size={13} />
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Reusable form field                                                   */
/* ------------------------------------------------------------------ */

function FormField({
  label,
  type = "text",
  required = false,
  icon,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  type?: string;
  required?: boolean;
  icon?: React.ReactNode;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-[12.5px] font-medium text-[#374151]">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <div className="relative">
        {icon && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]">{icon}</span>
        )}
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={`
            w-full
            rounded-lg
            border
            border-[#D1D5DB]
            bg-[#F9FAFB]
            py-2.5
            text-[13px]
            text-[#1F2937]
            placeholder-[#9CA3AF]
            transition-all
            focus:border-[#10673E]
            focus:bg-white
            focus:outline-none
            focus:ring-2
            focus:ring-[#10673E]/20
            ${icon ? "pl-10" : "pl-3.5"}
            pr-3.5
          `}
        />
      </div>
    </div>
  );
}

function FormSelect({
  label,
  icon,
  value,
  onChange,
  options,
  placeholders,
}: {
  label: string;
  icon?: React.ReactNode;
  value: string;
  onChange: (v: string) => void;
  options: string[];
  placeholders: string[];
}) {
  return (
    <div>
      <label className="mb-1.5 block text-[12.5px] font-medium text-[#374151]">{label}</label>
      <div className="relative">
        {icon && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]">{icon}</span>
        )}
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`
            w-full
            appearance-none
            rounded-lg
            border
            border-[#D1D5DB]
            bg-[#F9FAFB]
            py-2.5
            text-[13px]
            text-[#1F2937]
            transition-all
            focus:border-[#10673E]
            focus:bg-white
            focus:outline-none
            focus:ring-2
            focus:ring-[#10673E]/20
            ${icon ? "pl-10" : "pl-3.5"}
            pr-8
          `}
        >
          {options.map((opt, i) => (
            <option key={opt || "empty"} value={opt}>
              {opt || placeholders[i]}
            </option>
          ))}
        </select>
        <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M3 4.5L6 7.5L9 4.5" stroke="#94A3B8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </div>
    </div>
  );
}

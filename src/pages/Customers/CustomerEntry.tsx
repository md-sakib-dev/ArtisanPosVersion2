import { useState, useEffect, useMemo } from "react";
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
  Plus,
  Trash2,
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
      className={`fixed top-5 right-5 z-[60] flex items-center gap-3 rounded-xl border px-4 py-3 shadow-lg transition-all duration-300 ${type === "success" ? "border-[#10673E]/20 bg-white text-[#10673E]" : "border-red-200 bg-white text-red-600"}`}
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
/* Customer Modal                                                        */
/* ------------------------------------------------------------------ */

function CustomerModal({
  open,
  customer,
  onClose,
  onSave,
}: {
  open: boolean;
  customer: Customer | null;
  onClose: () => void;
  onSave: (customer: Customer, isEdit: boolean) => void;
}) {
  const [form, setForm] = useState<Customer>({ ...EMPTY_FORM });
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  useEffect(() => {
    if (customer) {
      setForm({ ...customer });
    } else {
      setForm({ ...EMPTY_FORM });
    }
  }, [customer, open]);

  const update = (field: keyof Customer, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.phone.trim()) {
      setToast({ message: "Please fill in Name and Contact Number", type: "error" });
      return;
    }
    const isEdit = Boolean(customer);
    onSave(form, isEdit);
    onClose();
  };

  const handleReset = () => {
    setForm(customer ? { ...customer } : { ...EMPTY_FORM });
  };

  if (!open) return null;

  const isEdit = Boolean(customer);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-[2px]"
      style={{ animation: "fade-up 0.2s ease both" }}
    >
      <div className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-[#E5E7EB] bg-white shadow-2xl">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-[#E5E7EB] px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#10673E]/10 text-[#10673E]">
              {isEdit ? <Pencil size={17} /> : <UserPlus size={17} />}
            </div>
            <div>
              <h2 className="text-[15px] font-bold text-[#1F2937]">
                {isEdit ? "Edit Customer" : "Add New Customer"}
              </h2>
              <p className="text-[11.5px] text-[#94A3B8]">
                {isEdit ? `Editing ${customer?.id} — Update customer details below` : "Fill in the customer details below"}
              </p>
            </div>
            {isEdit && (
              <span className="rounded-md bg-[#2D5597]/10 px-2 py-0.5 text-[11px] font-semibold text-[#2D5597]">
                Edit Mode
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-[#94A3B8] transition-colors hover:bg-[#F1F5F9] hover:text-[#64748B]"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="min-h-0 flex-1 overflow-y-auto">
          <div className="space-y-5 p-6">
            {/* Primary Info */}
            <div>
              <p className="mb-3 text-[11.5px] font-semibold uppercase tracking-wider text-[#94A3B8]">Primary Information</p>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <FormField label="Customer Name" required icon={<Users size={14} />} value={form.name} onChange={(v) => update("name", v)} placeholder="Full name" />
                <FormField label="Phone Number" required icon={<Phone size={14} />} value={form.phone} onChange={(v) => update("phone", v)} placeholder="01XXXXXXXXX" />
                <FormField label="Email Address" type="email" icon={<Mail size={14} />} value={form.email} onChange={(v) => update("email", v)} placeholder="email@example.com" />
                <FormSelect label="Gender" icon={<Users size={14} />} value={form.gender} onChange={(v) => update("gender", v)} options={["", "Male", "Female", "Other"]} placeholders={["Select gender", "Male", "Female", "Other"]} />
                <FormField label="Date of Birth" type="date" icon={<Calendar size={14} />} value={form.dob} onChange={(v) => update("dob", v)} />
                <FormSelect label="Country" icon={<Globe size={14} />} value={form.country} onChange={(v) => update("country", v)} options={COUNTRIES} placeholders={COUNTRIES} />
              </div>
            </div>

            {/* Additional Info */}
            <div>
              <p className="mb-3 text-[11.5px] font-semibold uppercase tracking-wider text-[#94A3B8]">Additional Details</p>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <FormField label="Address" icon={<MapPin size={14} />} value={form.address} onChange={(v) => update("address", v)} placeholder="Full address" />
                </div>
                <FormSelect label="Discount / Category" icon={<BadgePercent size={14} />} value={form.discount} onChange={(v) => update("discount", v)} options={DISCOUNT_TIERS} placeholders={DISCOUNT_TIERS} />
              </div>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="border-t border-[#E5E7EB] bg-[#FAFBFC] px-6 py-4">
            <div className="flex items-center justify-between">
              <p className="text-[12px] text-[#94A3B8]">
                {isEdit ? `Editing customer ${customer?.id}` : "All fields marked with * are required"}
              </p>
              <div className="flex items-center gap-3">
                <button type="button" onClick={handleReset} className="flex items-center gap-2 rounded-lg border border-[#D1D5DB] bg-white px-4 py-2.5 text-[13px] font-medium text-[#6B7280] transition-all hover:bg-[#F9FAFB] hover:text-[#374151]">
                  <RotateCcw size={15} />
                  Reset
                </button>
                <button type="button" onClick={onClose} className="flex items-center gap-2 rounded-lg border border-[#D1D5DB] bg-white px-4 py-2.5 text-[13px] font-medium text-[#6B7280] transition-all hover:bg-[#F9FAFB] hover:text-[#374151]">
                  Cancel
                </button>
                <button type="submit" className="flex items-center gap-2 rounded-lg bg-[#10673E] px-5 py-2.5 text-[13px] font-semibold text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#0D5A35] hover:shadow-md">
                  <Save size={15} />
                  {isEdit ? "Update Customer" : "Save Customer"}
                </button>
              </div>
            </div>
          </div>
        </form>

        {toast && (
          <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Page                                                                 */
/* ------------------------------------------------------------------ */

export default function CustomerEntry() {
  const [customers, setCustomers] = useState<Customer[]>(MOCK_CUSTOMERS);
  const [nextId, setNextId] = useState(6);
  const [searchTerm, setSearchTerm] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const filteredData = useMemo(() => {
    if (!searchTerm.trim()) return customers;
    const term = searchTerm.toLowerCase();
    return customers.filter(
      (c) =>
        c.name.toLowerCase().includes(term) ||
        c.phone.toLowerCase().includes(term) ||
        c.email.toLowerCase().includes(term) ||
        c.id.toLowerCase().includes(term)
    );
  }, [customers, searchTerm]);

  const handleAddNew = () => {
    setEditingCustomer(null);
    setModalOpen(true);
  };

  const handleEdit = (customer: Customer) => {
    setEditingCustomer(customer);
    setModalOpen(true);
  };

  const handleSave = (formData: Customer, isEdit: boolean) => {
    if (isEdit) {
      setCustomers((prev) =>
        prev.map((c) => (c.id === formData.id ? { ...formData } : c))
      );
      setToast({ message: `Customer "${formData.name}" updated successfully`, type: "success" });
    } else {
      const newId = `C${String(nextId).padStart(3, "0")}`;
      setCustomers((prev) => [...prev, { ...formData, id: newId }]);
      setNextId((p) => p + 1);
      setToast({ message: `Customer "${formData.name}" registered successfully`, type: "success" });
    }
  };

  const handleDelete = (id: string) => {
    setCustomers((prev) => prev.filter((c) => c.id !== id));
    setToast({ message: "Customer deleted", type: "success" });
  };

  return (
    <div className="h-full overflow-y-auto bg-[#F5F7F3]">
      <div className="mx-auto max-w-[1440px] space-y-5 p-4 lg:p-6" style={{ animation: "fade-up 0.4s ease both" }}>
        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

        {/* -------- Header -------- */}
        <header>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#10673E]/10 text-[#10673E]">
              <Users size={20} />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-[#1F2937] md:text-2xl">Customer Management</h1>
              <p className="mt-0.5 text-[12.5px] text-[#6B7280]">Manage customer profiles, preferences, and loyalty details</p>
            </div>
          </div>
        </header>

        {/* -------- Customer List Table -------- */}
        <div className="rounded-xl border border-[#E5E7EB] bg-white shadow-xs overflow-hidden">
          {/* Table Header Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E5E7EB] bg-[#FAFBFC] px-5 py-3">
            <div className="flex items-center gap-2">
              <List size={16} className="text-[#10673E]" />
              <h2 className="text-[14px] font-bold text-[#1F2937]">All Customers</h2>
              <span className="rounded-md bg-[#10673E]/10 px-2.5 py-1 text-[11px] font-semibold text-[#10673E]">
                {filteredData.length} records
              </span>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by name, phone, or email..."
                  className="h-9 w-full rounded-lg border border-[#D1D5DB] bg-white pl-9 pr-3 text-[13px] text-[#1F2937] outline-none placeholder:text-[#9CA3AF] focus:border-[#10673E] focus:ring-2 focus:ring-[#10673E]/15 sm:w-72"
                />
              </div>
              <button
                onClick={handleAddNew}
                className="flex h-9 items-center gap-2 rounded-lg bg-[#10673E] px-4 text-[13px] font-semibold text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#0D5A35] hover:shadow-md active:scale-[0.98]"
              >
                <Plus size={15} />
                Add Customer
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[13px]">
              <thead>
                <tr className="border-b border-[#E5E7EB] bg-[#F8FAFC]">
                  <th className="px-5 py-3 font-semibold text-[#6B7280]">ID</th>
                  <th className="px-5 py-3 font-semibold text-[#6B7280]">Name</th>
                  <th className="px-5 py-3 font-semibold text-[#6B7280]">Phone</th>
                  <th className="px-5 py-3 font-semibold text-[#6B7280]">Email</th>
                  <th className="px-5 py-3 font-semibold text-[#6B7280]">Gender</th>
                  <th className="px-5 py-3 font-semibold text-[#6B7280]">Country</th>
                  <th className="px-5 py-3 font-semibold text-[#6B7280]">Category</th>
                  <th className="px-5 py-3 text-right font-semibold text-[#6B7280]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F5F9]">
                {filteredData.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-5 py-16 text-center">
                      <div className="flex flex-col items-center justify-center text-[#94A3B8]">
                        <Users size={30} strokeWidth={1.5} />
                        <p className="mt-2 text-[13px] font-medium">No customers found</p>
                        <p className="mt-1 text-[12px]">{searchTerm ? "Try a different search term" : "Add your first customer above"}</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredData.map((c) => (
                    <tr key={c.id} className="transition-colors hover:bg-[#F8FAFC]">
                      <td className="px-5 py-3 font-medium text-[#94A3B8] tabular-nums">{c.id}</td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-[#10673E]/10 text-[#10673E] text-[11px] font-bold">
                            {c.name.charAt(0)}
                          </div>
                          <span className="font-semibold text-[#1F2937]">{c.name}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3 tabular-nums text-[#374151]">{c.phone}</td>
                      <td className="px-5 py-3 text-[#6B7280]">{c.email}</td>
                      <td className="px-5 py-3 text-[#6B7280]">{c.gender || "—"}</td>
                      <td className="px-5 py-3 text-[#6B7280]">{c.country}</td>
                      <td className="px-5 py-3">
                        <span className={`rounded-md px-2 py-0.5 text-[11px] font-semibold ${
                          c.discount === "VIP" ? "bg-[#E2BA48]/15 text-[#C9A02E]" :
                          c.discount === "Wholesale" ? "bg-[#2D5597]/10 text-[#2D5597]" :
                          "bg-[#F1F5F9] text-[#64748B]"
                        }`}>
                          {c.discount}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleEdit(c)}
                            className="flex h-7 w-7 items-center justify-center rounded-md text-[#64748B] transition-colors hover:bg-[#E8F5ED] hover:text-[#10673E]"
                            title="Edit"
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            onClick={() => handleDelete(c.id)}
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
                Showing {filteredData.length} of {customers.length} customers
              </p>
              <div className="flex items-center gap-2 text-[12px]">
                <span className="text-[#94A3B8]">VIP:</span>
                <span className="font-semibold text-[#C9A02E]">{filteredData.filter((c) => c.discount === "VIP").length}</span>
                <span className="mx-1 text-[#E5E7EB]">|</span>
                <span className="text-[#94A3B8]">Regular:</span>
                <span className="font-semibold text-[#10673E]">{filteredData.filter((c) => c.discount === "Regular").length}</span>
              </div>
            </div>
          )}
        </div>

        {/* -------- Customer Modal -------- */}
        <CustomerModal
          open={modalOpen}
          customer={editingCustomer}
          onClose={() => { setModalOpen(false); setEditingCustomer(null); }}
          onSave={handleSave}
        />
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
        {icon && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]">{icon}</span>}
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={`w-full rounded-lg border border-[#D1D5DB] bg-[#F9FAFB] py-2.5 text-[13px] text-[#1F2937] placeholder-[#9CA3AF] transition-all focus:border-[#10673E] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#10673E]/20 ${icon ? "pl-10" : "pl-3.5"} pr-3.5`}
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
        {icon && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]">{icon}</span>}
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`w-full appearance-none rounded-lg border border-[#D1D5DB] bg-[#F9FAFB] py-2.5 text-[13px] text-[#1F2937] transition-all focus:border-[#10673E] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#10673E]/20 ${icon ? "pl-10" : "pl-3.5"} pr-8`}
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



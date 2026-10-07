import { useState, useEffect, useMemo, useRef, useCallback } from "react";
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
  AlertCircle,
  Loader2,
} from "lucide-react";
import {
  getCustomers,
  getCountries,
  createCustomer,
  updateCustomer,
  type Customer,
  type CustomerCreateDto,
  type DropdownOption,
} from "../../api/customerApi";

/* ------------------------------------------------------------------ */
/* Toast                                                                */
/* ------------------------------------------------------------------ */

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

/* ------------------------------------------------------------------ */
/* Form model                                                           */
/* ------------------------------------------------------------------ */

interface CustomerFormState {
  customerName: string;
  mobileNumber: string;
  emailAddress: string;
  presentAddress: string;
  birthMonth: string;
  birthDay: string;
  countryOrigin: string; // country code (Dropdown/countries value)
  gender: string;
  discount: string;
}

/* Default country for new customers (code from Dropdown/countries). */
const DEFAULT_COUNTRY = "BD";

const EMPTY_FORM: CustomerFormState = {
  customerName: "",
  mobileNumber: "",
  emailAddress: "",
  presentAddress: "",
  birthMonth: "",
  birthDay: "",
  countryOrigin: DEFAULT_COUNTRY,
  gender: "",
  discount: "",
};

/* Backend gender field is maxLength:1 — send a single-char code,
   display the full word in the UI. */
const GENDER_OPTIONS: { value: string; label: string }[] = [
  { value: "", label: "Select" },
  { value: "M", label: "Male" },
  { value: "F", label: "Female" },
  { value: "O", label: "Other" },
];

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const MONTH_OPTIONS: { value: string; label: string }[] = [
  { value: "", label: "Select month" },
  ...MONTH_NAMES.map((name, i) => ({ value: String(i + 1), label: name })),
];

const dash = (v: string | null | undefined) => (v && v.trim() ? v : "-");

/* Gender display: single-char codes (M/F/O) → full word; legacy rows
   that stored full words are shown as-is. */
const genderLabel = (code: string | null | undefined) => {
  if (!code || !code.trim()) return "-";
  const v = code.trim();
  const match = GENDER_OPTIONS.find((g) => g.value === v);
  if (match) return match.label;
  return v.charAt(0).toUpperCase() + v.slice(1);
};

/* Resolve a stored countryOrigin to a dropdown option value.
   Handles legacy data: lowercase codes ("bd") or stored full names
   ("Bangladesh" from the old hardcoded list). */
const resolveCountrySelection = (
  origin: string | null | undefined,
  countries: DropdownOption[]
): string => {
  if (!origin || !origin.trim()) return "";
  const v = origin.trim();

  const byCode = countries.find(
    (c) => c.value.toUpperCase() === v.toUpperCase()
  );
  if (byCode) return byCode.value;

  const byName = countries.find(
    (c) => c.text.toLowerCase() === v.toLowerCase()
  );
  if (byName) return byName.value;

  return v; // unknown value — keep as-is so no data is lost
};

const birthMonthLabel = (month: number | null | undefined) => {
  if (month == null || month < 1 || month > 12) return "-";
  return MONTH_NAMES[month - 1];
};

const getErrMessage = (err: unknown, fallback: string): string => {
  const anyErr = err as { response?: { data?: { message?: string } } };
  return anyErr?.response?.data?.message || fallback;
};

/* ------------------------------------------------------------------ */
/* Customer Modal — native <dialog>                                     */
/* ------------------------------------------------------------------ */

function CustomerModal({
  open,
  customer,
  saving,
  countries,
  countriesLoading,
  onClose,
  onSave,
}: {
  open: boolean;
  customer: Customer | null;
  saving: boolean;
  countries: DropdownOption[];
  countriesLoading: boolean;
  onClose: () => void;
  onSave: (dto: CustomerCreateDto, customerId: number | null) => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [form, setForm] = useState<CustomerFormState>({ ...EMPTY_FORM });

  const isEdit = Boolean(customer);

  const formFromCustomer = (c: Customer): CustomerFormState => ({
    customerName: c.customerName ?? "",
    mobileNumber: c.mobileNumber ?? "",
    emailAddress: c.emailAddress ?? "",
    presentAddress: c.presentAddress ?? "",
    birthMonth: c.birthMonth != null ? String(c.birthMonth) : "",
    birthDay: c.birthDay != null ? String(c.birthDay) : "",
    countryOrigin: resolveCountrySelection(c.countryOriginCode, countries),
    gender: c.gender ?? "",
    discount: c.discount != null ? String(c.discount) : "",
  });

  // Open/close the native dialog; reset form on each open
  useEffect(() => {
    const dlg = dialogRef.current;
    if (!dlg) return;

    if (open) {
      if (!dlg.open) dlg.showModal();
      setForm(customer ? formFromCustomer(customer) : { ...EMPTY_FORM });
    } else if (dlg.open) {
      dlg.close();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, customer]); // countries intentionally excluded: list is static once loaded

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

  const update = (
    field: keyof CustomerFormState,
    value: string | boolean
  ) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;
    if (
      !form.customerName.trim() ||
      !form.mobileNumber.trim() ||
      !form.presentAddress.trim() ||
      !form.gender ||
      !form.birthMonth ||
      !form.birthDay ||
      !form.countryOrigin ||
      form.discount === ""
    ) {
      return; // handled by native required attrs; safety net
    }
    onSave(
      {
        customerName: form.customerName.trim(),
        mobileNumber: form.mobileNumber.trim(),
        emailAddress: form.emailAddress.trim() || null,
        presentAddress: form.presentAddress.trim() || null,
        countryOrigin: form.countryOrigin || null,
        gender: form.gender || null,
        birthMonth: form.birthMonth ? Number(form.birthMonth) : null,
        birthDay: form.birthDay ? Number(form.birthDay) : null,
        discount: form.discount !== "" ? Number(form.discount) : null,
      },
      customer?.customerId ?? null
    );
  };

  const handleReset = () => {
    setForm(customer ? formFromCustomer(customer) : { ...EMPTY_FORM });
  };

  const countryOptions: { value: string; label: string }[] = countriesLoading
    ? [{ value: "", label: "Loading countries..." }]
    : [
        { value: "", label: "Select country" },
        ...countries.map((c) => ({ value: c.value, label: c.text })),
        /* Keep a legacy/unknown stored value selectable so editing
           doesn't silently change it */
        /* Keep a legacy/unknown stored code selectable so editing
           doesn't silently change it */
        ...(customer?.countryOriginCode &&
        !countries.some((c) => c.value === customer.countryOriginCode)
          ? [
              {
                value: customer.countryOriginCode,
                label: `${customer.countryOriginName || customer.countryOriginCode} (saved)`,
              },
            ]
          : []),
      ];

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
              {isEdit ? <Pencil size={17} /> : <UserPlus size={17} />}
            </div>
            <div>
              <h2 className="text-[15px] font-bold text-[#1F2937]">
                {isEdit ? "Edit Customer" : "Add Customer"}
              </h2>
              <p className="text-[11.5px] text-[#94A3B8]">
                {isEdit
                  ? `Editing ${customer?.customerName} — update details below`
                  : "Fill in the customer details below"}
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
          <div className="space-y-5 p-6">
            {/* Primary Info */}
            <div>
              <p className="mb-3 text-[11.5px] font-semibold uppercase tracking-wider text-[#94A3B8]">
                Primary Information
              </p>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <FormField
                  label="Customer Name"
                  required
                  icon={<Users size={14} />}
                  value={form.customerName}
                  onChange={(v) => update("customerName", v)}
                  placeholder="Full name"
                  maxLength={100}
                />
                <FormField
                  label="Mobile Number"
                  required
                  icon={<Phone size={14} />}
                  value={form.mobileNumber}
                  onChange={(v) => update("mobileNumber", v)}
                  placeholder="01XXXXXXXXX"
                  maxLength={16}
                />
                <FormField
                  label="Email Address"
                  type="email"
                  icon={<Mail size={14} />}
                  value={form.emailAddress}
                  onChange={(v) => update("emailAddress", v)}
                  placeholder="email@example.com"
                  maxLength={100}
                />
                <FormSelect
                  label="Gender"
                  required
                  icon={<Users size={14} />}
                  value={form.gender}
                  onChange={(v) => update("gender", v)}
                  options={GENDER_OPTIONS}
                />
                <FormSelect
                  label="Birth Month"
                  required
                  icon={<Calendar size={14} />}
                  value={form.birthMonth}
                  onChange={(v) => update("birthMonth", v)}
                  options={MONTH_OPTIONS}
                />
                <FormField
                  label="Birth Day"
                  type="number"
                  required
                  icon={<Calendar size={14} />}
                  value={form.birthDay}
                  onChange={(v) => update("birthDay", v)}
                  placeholder="1-31"
                  min={1}
                  max={31}
                />
                <FormSelect
                  label="Country"
                  required
                  icon={<Globe size={14} />}
                  value={form.countryOrigin}
                  onChange={(v) => update("countryOrigin", v)}
                  options={countryOptions}
                  disabled={countriesLoading}
                />
                <FormField
                  label="Discount (%)"
                  type="number"
                  required
                  icon={<BadgePercent size={14} />}
                  value={form.discount}
                  onChange={(v) => update("discount", v)}
                  placeholder="e.g. 5"
                  min={0}
                  max={100}
                  step="0.01"
                />
              </div>
            </div>

            {/* Additional Info */}
            <div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <FormTextarea
                    label="Present Address"
                    required
                    icon={<MapPin size={14} />}
                    value={form.presentAddress}
                    onChange={(v) => update("presentAddress", v)}
                    placeholder="Full address"
                    maxLength={250}
                  />
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
                    <Save size={15} />
                  )}
                  {saving
                    ? "Saving..."
                    : isEdit
                      ? "Update Customer"
                      : "Save Customer"}
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </dialog>
  );
}

/* ------------------------------------------------------------------ */
/* Page                                                                 */
/* ------------------------------------------------------------------ */

export default function CustomerEntry() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  /* Countries: one API call on page load → feeds the form dropdown.
     (The table shows countryOriginName resolved by the backend.) */
  const [countries, setCountries] = useState<DropdownOption[]>([]);
  const [countriesLoading, setCountriesLoading] = useState(true);

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const res = await getCustomers();
      setCustomers(res?.data?.items ?? []);
    } catch (err) {
      console.error("Failed to load customers:", err);
      setLoadError(
        getErrMessage(err, "Failed to load customers. Please try again.")
      );
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchCountries = useCallback(async () => {
    setCountriesLoading(true);
    try {
      setCountries(await getCountries());
    } catch (err) {
      console.error("Failed to load countries:", err);
      // Non-fatal: table falls back to showing raw country codes.
    } finally {
      setCountriesLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCustomers();
    fetchCountries();
  }, [fetchCustomers, fetchCountries]);

  const filteredData = useMemo(() => {
    if (!searchTerm.trim()) return customers;
    const term = searchTerm.toLowerCase();
    return customers.filter(
      (c) =>
        (c.customerName ?? "").toLowerCase().includes(term) ||
        (c.mobileNumber ?? "").toLowerCase().includes(term) ||
        (c.emailAddress ?? "").toLowerCase().includes(term)
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

  const handleCloseModal = () => {
    if (saving) return;
    setModalOpen(false);
    setEditingCustomer(null);
  };

  const handleSave = async (
    dto: CustomerCreateDto,
    customerId: number | null
  ) => {
    if (saving) return;
    setSaving(true);
    try {
      if (customerId != null) {
        const res = await updateCustomer(customerId, dto);
        if (res.success === false) throw new Error(res.message);
        setToast({
          message: `Customer "${dto.customerName}" updated successfully`,
          type: "success",
        });
      } else {
        const res = await createCustomer(dto);
        if (res.success === false) throw new Error(res.message);
        setToast({
          message: `Customer "${dto.customerName}" added successfully`,
          type: "success",
        });
      }
      setModalOpen(false);
      setEditingCustomer(null);
      await fetchCustomers();
    } catch (err) {
      console.error("Failed to save customer:", err);
      setToast({
        message: getErrMessage(
          err,
          "Failed to save customer. Please try again."
        ),
        type: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  const discountedCount = filteredData.filter((c) => c.discount != null).length;

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

        {/* -------- Header -------- */}
        <header>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#10673E]/10 text-[#10673E]">
              <Users size={20} />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-[#1F2937] md:text-2xl">
                Customer Management
              </h1>
              <p className="mt-0.5 text-[12.5px] text-[#6B7280]">
                Manage customer profiles, preferences, and loyalty details
              </p>
            </div>
          </div>
        </header>

        {/* -------- Customer List Table -------- */}
        <div className="overflow-hidden rounded-xl border border-[#E5E7EB] bg-white shadow-xs">
          {/* Table Header Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E5E7EB] bg-[#FAFBFC] px-5 py-3">
            <div className="flex items-center gap-2">
              <List size={16} className="text-[#10673E]" />
              <h2 className="text-[14px] font-bold text-[#1F2937]">
                All Customers
              </h2>
              <span className="rounded-md bg-[#10673E]/10 px-2.5 py-1 text-[11px] font-semibold text-[#10673E]">
                {filteredData.length} records
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
                  <th className="px-5 py-3 font-semibold text-[#6B7280]">
                    Name
                  </th>
                  <th className="px-5 py-3 font-semibold text-[#6B7280]">
                    Mobile
                  </th>
                  <th className="px-5 py-3 font-semibold text-[#6B7280]">
                    Email
                  </th>
                  <th className="px-5 py-3 font-semibold text-[#6B7280]">
                    Birth Month
                  </th>
                  <th className="px-5 py-3 font-semibold text-[#6B7280]">
                    Birth Day
                  </th>
                  <th className="px-5 py-3 font-semibold text-[#6B7280]">
                    Country
                  </th>
                  <th className="px-5 py-3 font-semibold text-[#6B7280]">
                    Gender
                  </th>
                  <th className="px-5 py-3 font-semibold text-[#6B7280]">
                    Discount
                  </th>
                  <th className="px-5 py-3 font-semibold text-[#6B7280]">
                    Address
                  </th>
                  <th className="px-5 py-3 text-right font-semibold text-[#6B7280]">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F5F9]">
                {loading ? (
                  <tr>
                    <td colSpan={10} className="px-5 py-16 text-center">
                      <div className="flex flex-col items-center justify-center text-[#94A3B8]">
                        <Loader2
                          size={28}
                          className="animate-spin text-[#10673E]"
                        />
                        <p className="mt-3 text-[13px] font-medium">
                          Loading customers...
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : loadError ? (
                  <tr>
                    <td colSpan={10} className="px-5 py-16 text-center">
                      <div className="flex flex-col items-center justify-center text-[#94A3B8]">
                        <AlertCircle size={30} className="text-red-400" />
                        <p className="mt-2 text-[13px] font-medium text-red-500">
                          {loadError}
                        </p>
                        <button
                          onClick={fetchCustomers}
                          className="mt-3 rounded-lg border border-[#D1D5DB] bg-white px-4 py-2 text-[12.5px] font-medium text-[#374151] transition-colors hover:bg-[#F9FAFB]"
                        >
                          Retry
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : filteredData.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="px-5 py-16 text-center">
                      <div className="flex flex-col items-center justify-center text-[#94A3B8]">
                        <Users size={30} strokeWidth={1.5} />
                        <p className="mt-2 text-[13px] font-medium">
                          No customers found.
                        </p>
                        <p className="mt-1 text-[12px]">
                          {searchTerm
                            ? "Try a different search term"
                            : "Add your first customer above"}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredData.map((c) => (
                    <tr
                      key={c.customerId}
                      className="transition-colors hover:bg-[#F8FAFC]"
                    >
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          {/* <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-[#10673E]/10 text-[11px] font-bold text-[#10673E]">
                            {(c.customerName || "?").charAt(0).toUpperCase()}
                          </div> */}
                          <span className="font-semibold text-[#10673E]">
                            {c.customerName}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-3 tabular-nums text-[#374151]">
                        {c.mobileNumber || "-"}
                      </td>
                      <td className="px-5 py-3 text-[#6B7280]">
                        {dash(c.emailAddress)}
                      </td>
                      <td className="px-5 py-3 text-[#6B7280]">
                        {birthMonthLabel(c.birthMonth)}
                      </td>
                      <td className="px-5 py-3 tabular-nums text-[#6B7280]">
                        {c.birthDay ?? "-"}
                      </td>
                      <td className="px-5 py-3 text-[#6B7280]">
                        {c.countryOriginName || c.countryOriginCode || "-"}
                      </td>
                      <td className="px-5 py-3 text-[#6B7280]">
                        {genderLabel(c.gender)}
                      </td>
                      <td className="px-5 py-3 text-[#6B7280]">
                        {c.discount != null ? (
                          <span className="inline-flex items-center gap-1 rounded-md bg-[#E2BA48]/15 px-2 py-0.5 text-[11px] font-semibold text-[#C9A02E]">
                            <BadgePercent size={11} />
                            {c.discount}%
                          </span>
                        ) : (
                          <span className="rounded-md bg-[#F1F5F9] px-2 py-0.5 text-[11px] font-semibold text-[#64748B]">
                            No Discount
                          </span>
                        )}
 </td>
                      <td
                        className="max-w-[220px] truncate px-5 py-3 text-[#6B7280]"
                        title={c.presentAddress ?? undefined}
                      >
                        {dash(c.presentAddress)}
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
                <span className="text-[#94A3B8]">With Discount:</span>
                <span className="font-semibold text-[#C9A02E]">
                  {discountedCount}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* -------- Customer Modal (native <dialog>, page level) -------- */}
        <CustomerModal
          open={modalOpen}
          customer={editingCustomer}
          saving={saving}
          countries={countries}
          countriesLoading={countriesLoading}
          onClose={handleCloseModal}
          onSave={handleSave}
        />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Reusable form field                                                  */
/* ------------------------------------------------------------------ */

function FormField({
  label,
  type = "text",
  required = false,
  icon,
  value,
  onChange,
  placeholder,
  maxLength,
  min,
  max,
  step,
}: {
  label: string;
  type?: string;
  required?: boolean;
  icon?: React.ReactNode;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  maxLength?: number;
  min?: number;
  max?: number;
  step?: string;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-[12.5px] font-medium text-[#374151]">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <div className="relative">
        {icon && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]">
            {icon}
          </span>
        )}
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          maxLength={maxLength}
          min={min}
          max={max}
          step={step}
          required={required}
          className={`w-full rounded-lg border border-[#D1D5DB] bg-[#F9FAFB] py-2.5 text-[13px] text-[#1F2937] placeholder-[#9CA3AF] transition-all focus:border-[#10673E] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#10673E]/20 ${icon ? "pl-10" : "pl-3.5"} pr-3.5`}
        />
      </div>
    </div>
  );
}

function FormTextarea({
  label,
  required = false,
  icon,
  value,
  onChange,
  placeholder,
  maxLength,
}: {
  label: string;
  required?: boolean;
  icon?: React.ReactNode;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  maxLength?: number;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-[12.5px] font-medium text-[#374151]">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <div className="relative">
        {icon && (
          <span className="absolute left-3 top-3 text-[#94A3B8]">{icon}</span>
        )}
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          maxLength={maxLength}
          required={required}
          rows={3}
          className={`w-full resize-none rounded-lg border border-[#D1D5DB] bg-[#F9FAFB] py-2.5 text-[13px] text-[#1F2937] placeholder-[#9CA3AF] transition-all focus:border-[#10673E] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#10673E]/20 ${icon ? "pl-10" : "pl-3.5"} pr-3.5`}
        />
      </div>
    </div>
  );
}

function FormSelect({
  label,
  required = false,
  icon,
  value,
  onChange,
  options,
  disabled = false,
}: {
  label: string;
  required?: boolean;
  icon?: React.ReactNode;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  disabled?: boolean;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-[12.5px] font-medium text-[#374151]">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <div className="relative">
        {icon && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]">
            {icon}
          </span>
        )}
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          required={required}
          className={`w-full appearance-none rounded-lg border border-[#D1D5DB] bg-[#F9FAFB] py-2.5 text-[13px] text-[#1F2937] transition-all focus:border-[#10673E] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#10673E]/20 disabled:cursor-not-allowed disabled:opacity-60 ${icon ? "pl-10" : "pl-3.5"} pr-8`}
        >
          {options.map((opt) => (
            <option key={opt.value || "empty"} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path
              d="M3 4.5L6 7.5L9 4.5"
              stroke="#94A3B8"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </div>
    </div>
  );
}

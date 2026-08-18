import { useState } from "react";
import {
  User,
  IdCard,
  Briefcase,
  Shield,
  Phone,
  MapPin,
  KeyRound,
  Eye,
  EyeOff,
  Save,
  RotateCcw,
  CheckCircle2,
  X,
  UserCog,
  List,
  Pencil,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/* Types & Data                                                         */
/* ------------------------------------------------------------------ */

interface UserForm {
  name: string;
  nid: string;
  designation: string;
  role: string;
  phone: string;
  address: string;
  loginId: string;
  password: string;
  status: string;
}

const EMPTY_FORM: UserForm = {
  name: "",
  nid: "",
  designation: "",
  role: "",
  phone: "",
  address: "",
  loginId: "",
  password: "",
  status: "Active",
};

const ROLES = ["Admin", "Manager", "Cashier", "Sales Associate", "Accountant", "Inventory Clerk"];
const STATUSES = ["Active", "Inactive"];

const MOCK_USERS = [
  { id: "U001", name: "Admin User", role: "Admin", loginId: "admin", designation: "General Manager", status: "Active" },
  { id: "U002", name: "Rafiqul Islam", role: "Manager", loginId: "rafiq.m", designation: "Store Manager", status: "Active" },
  { id: "U003", name: "Farhan Ahmed", role: "Cashier", loginId: "farhan.c", designation: "Senior Cashier", status: "Active" },
  { id: "U004", name: "Nusrat Jahan", role: "Sales Associate", loginId: "nusrat.s", designation: "Sales Executive", status: "Inactive" },
  { id: "U005", name: "Tanvir Hasan", role: "Inventory Clerk", loginId: "tanvir.i", designation: "Inventory Manager", status: "Active" },
];

const ROLE_COLORS: Record<string, string> = {
  Admin: "bg-[#10673E]/10 text-[#10673E]",
  Manager: "bg-[#2D5597]/10 text-[#2D5597]",
  Cashier: "bg-[#3AAFA9]/10 text-[#3AAFA9]",
  "Sales Associate": "bg-[#E2BA48]/15 text-[#C9A02E]",
  Accountant: "bg-[#50B4D8]/10 text-[#0E8FBF]",
  "Inventory Clerk": "bg-[#1E293B]/10 text-[#1E293B]",
};

/* ------------------------------------------------------------------ */
/* Toast                                                                 */
/* ------------------------------------------------------------------ */

function Toast({ message, type, onClose }: { message: string; type: "success" | "error"; onClose: () => void }) {
  useState(() => setTimeout(onClose, 3000));
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
/* Password strength                                                    */
/* ------------------------------------------------------------------ */

function getStrength(pw: string): { label: string; pct: number; color: string } {
  if (!pw) return { label: "", pct: 0, color: "" };
  let score = 0;
  if (pw.length >= 6) score++;
  if (pw.length >= 10) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  if (score <= 1) return { label: "Weak", pct: 20, color: "bg-red-500" };
  if (score <= 2) return { label: "Fair", pct: 40, color: "bg-[#E2BA48]" };
  if (score <= 3) return { label: "Good", pct: 60, color: "bg-[#3AAFA9]" };
  if (score <= 4) return { label: "Strong", pct: 80, color: "bg-[#10673E]" };
  return { label: "Very Strong", pct: 100, color: "bg-[#10673E]" };
}

/* ------------------------------------------------------------------ */
/* Page                                                                 */
/* ------------------------------------------------------------------ */

export default function CreateUser() {
  const [form, setForm] = useState<UserForm>({ ...EMPTY_FORM });
  const [showPassword, setShowPassword] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const strength = getStrength(form.password);

  const update = (field: keyof UserForm, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSelectUser = (user: (typeof MOCK_USERS)[0]) => {
    setForm({
      name: user.name,
      nid: "",
      designation: user.designation,
      role: user.role,
      phone: "",
      address: "",
      loginId: user.loginId,
      password: "",
      status: user.status,
    });
    setIsEditing(true);
  };

  const handleReset = () => {
    setForm({ ...EMPTY_FORM });
    setIsEditing(false);
    setShowPassword(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.loginId.trim() || !form.role) {
      setToast({ message: "Please fill in Name, Login ID, and Role", type: "error" });
      return;
    }
    if (!isEditing && !form.password.trim()) {
      setToast({ message: "Password is required for new users", type: "error" });
      return;
    }
    if (form.password && form.password.length < 6) {
      setToast({ message: "Password must be at least 6 characters", type: "error" });
      return;
    }
    setToast({
      message: isEditing ? `User "${form.name}" updated successfully` : `User "${form.name}" created successfully`,
      type: "success",
    });
    if (!isEditing) handleReset();
  };

  return (
    <div className="h-full overflow-y-auto bg-[#F5F7F3]">
      <div
        className="mx-auto max-w-[1200px] space-y-5 p-4 lg:p-6"
        style={{ animation: "fade-up 0.4s ease both" }}
      >
        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

        {/* -------- Header -------- */}
        <header>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#10673E]/10 text-[#10673E]">
              <UserCog size={20} />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-[#1F2937] md:text-2xl">
                User Management
              </h1>
              <p className="mt-0.5 text-[12.5px] text-[#6B7280]">
                Add new staff members, set access permissions, and configure login credentials
              </p>
            </div>
            {isEditing && (
              <span className="ml-2 inline-flex items-center gap-1.5 rounded-lg bg-[#2D5597]/10 px-3 py-1.5 text-[12px] font-semibold text-[#2D5597]">
                <Pencil size={13} />
                Editing User
              </span>
            )}
          </div>
        </header>

        {/* -------- Form -------- */}
        <form onSubmit={handleSubmit}>
          <div className="rounded-xl border border-[#E5E7EB] bg-white shadow-xs overflow-hidden">
            {/* ---- Section 1: Employee Information ---- */}
            <div className="border-b border-[#E5E7EB] px-5 py-4">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-md bg-[#10673E]/10 text-[#10673E]">
                  <User size={14} />
                </div>
                <div>
                  <h2 className="text-[14px] font-bold text-[#1F2937]">Employee Information</h2>
                  <p className="text-[11px] text-[#94A3B8]">Personal details and role assignment</p>
                </div>
              </div>
            </div>

            <div className="p-5">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <FF label="Employee Name" required icon={<User size={14} />} value={form.name} onChange={(v) => update("name", v)} placeholder="Full name" />
                <FF label="Employee NID" icon={<IdCard size={14} />} value={form.nid} onChange={(v) => update("nid", v)} placeholder="National ID number" />
                <FF label="Designation" icon={<Briefcase size={14} />} value={form.designation} onChange={(v) => update("designation", v)} placeholder="Job title" />
                <FS label="User Group / Role" required icon={<Shield size={14} />} value={form.role} onChange={(v) => update("role", v)} options={["", ...ROLES]} placeholders={["Select Role", ...ROLES]} />
                <FF label="Contact No" icon={<Phone size={14} />} value={form.phone} onChange={(v) => update("phone", v)} placeholder="01XXXXXXXXX" />
                <div className="lg:col-span-1">
                  <FF label="Address" icon={<MapPin size={14} />} value={form.address} onChange={(v) => update("address", v)} placeholder="Full address" />
                </div>
              </div>
            </div>

            {/* ---- Section 2: Security & Account Access ---- */}
            <div className="border-t border-[#E5E7EB] border-b border-[#E5E7EB] px-5 py-4">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-md bg-[#2D5597]/10 text-[#2D5597]">
                  <KeyRound size={14} />
                </div>
                <div>
                  <h2 className="text-[14px] font-bold text-[#1F2937]">Security & Account Access</h2>
                  <p className="text-[11px] text-[#94A3B8]">Login credentials and account status</p>
                </div>
              </div>
            </div>

            <div className="p-5">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <FF label="Login ID / Username" required icon={<User size={14} />} value={form.loginId} onChange={(v) => update("loginId", v)} placeholder="Unique username" />
                <div>
                  <FF
                    label={isEditing ? "New Password (leave blank to keep)" : "Password"}
                    required={!isEditing}
                    icon={<KeyRound size={14} />}
                    type={showPassword ? "text" : "password"}
                    value={form.password}
                    onChange={(v) => update("password", v)}
                    placeholder="Min. 6 characters"
                  />
                  {/* Eye toggle */}
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-[38px] text-[#94A3B8] hover:text-[#64748B] transition-colors"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                  {/* Strength bar */}
                  {form.password && (
                    <div className="mt-2">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-[#94A3B8]">Strength</span>
                        <span className={`font-medium ${strength.pct >= 60 ? "text-[#10673E]" : strength.pct >= 40 ? "text-[#C9A02E]" : "text-red-500"}`}>
                          {strength.label}
                        </span>
                      </div>
                      <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-[#E5E7EB]">
                        <div className={`h-full rounded-full transition-all duration-300 ${strength.color}`} style={{ width: `${strength.pct}%` }} />
                      </div>
                    </div>
                  )}
                </div>
                <div>
                  <label className="mb-1.5 block text-[12.5px] font-medium text-[#374151]">Active Status</label>
                  <div className="flex gap-2">
                    {STATUSES.map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => update("status", s)}
                        className={`
                          flex flex-1 items-center justify-center gap-2 rounded-lg border py-2.5 text-[13px] font-medium transition-all
                          ${form.status === s
                            ? s === "Active"
                              ? "border-[#10673E] bg-[#E8F5ED] text-[#10673E]"
                              : "border-red-300 bg-red-50 text-red-600"
                            : "border-[#D1D5DB] bg-[#F9FAFB] text-[#94A3B8] hover:bg-[#F1F5F9]"
                          }
                        `}
                      >
                        {s === "Active" ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* ---- Action Bar ---- */}
            <div className="border-t border-[#E5E7EB] bg-[#FAFBFC] px-5 py-4">
              <div className="flex items-center justify-between">
                <p className="text-[12px] text-[#94A3B8]">
                  {isEditing ? "Leave password blank to keep the existing one" : "All fields marked with * are required"}
                </p>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handleReset}
                    className="flex items-center gap-2 rounded-lg border border-[#D1D5DB] bg-white px-4 py-2.5 text-[13px] font-medium text-[#6B7280] transition-all hover:bg-[#F9FAFB] hover:text-[#374151]"
                  >
                    <RotateCcw size={15} />
                    Clear
                  </button>
                  <button
                    type="submit"
                    className="flex items-center gap-2 rounded-lg bg-[#10673E] px-5 py-2.5 text-[13px] font-semibold text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#0D5A35] hover:shadow-md"
                  >
                    <Save size={15} />
                    {isEditing ? "Update User" : "Create User"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </form>

        {/* -------- User List Table -------- */}
        <div className="rounded-xl border border-[#E5E7EB] bg-white shadow-xs overflow-hidden">
          <div className="border-b border-[#E5E7EB] px-5 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <List size={16} className="text-[#10673E]" />
                <h2 className="text-[14px] font-bold text-[#1F2937]">All Users</h2>
              </div>
              <span className="rounded-lg bg-[#F1F5F9] px-2.5 py-1 text-[11.5px] font-semibold text-[#64748B]">
                {MOCK_USERS.length} users
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-[13px]">
              <thead>
                <tr className="border-b border-[#E5E7EB]">
                  <th className="px-5 py-3 text-[11.5px] font-semibold text-[#6B7280]">ID</th>
                  <th className="px-5 py-3 text-[11.5px] font-semibold text-[#6B7280]">Name</th>
                  <th className="px-5 py-3 text-[11.5px] font-semibold text-[#6B7280]">Login ID</th>
                  <th className="px-5 py-3 text-[11.5px] font-semibold text-[#6B7280]">Role</th>
                  <th className="px-5 py-3 text-[11.5px] font-semibold text-[#6B7280]">Designation</th>
                  <th className="px-5 py-3 text-[11.5px] font-semibold text-[#6B7280]">Status</th>
                  <th className="px-5 py-3 text-right text-[11.5px] font-semibold text-[#6B7280]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F5F9]">
                {MOCK_USERS.map((u) => (
                  <tr key={u.id} className="transition-colors hover:bg-[#F9FAFB]">
                    <td className="px-5 py-3 font-medium text-[#64748B] tabular-nums">{u.id}</td>
                    <td className="px-5 py-3 font-semibold text-[#1F2937]">{u.name}</td>
                    <td className="px-5 py-3 text-[#374151] tabular-nums">{u.loginId}</td>
                    <td className="px-5 py-3">
                      <span className={`rounded-md px-2 py-0.5 text-[11px] font-semibold ${ROLE_COLORS[u.role] ?? "bg-[#F1F5F9] text-[#64748B]"}`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-[#6B7280]">{u.designation}</td>
                    <td className="px-5 py-3">
                      <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-medium ${
                        u.status === "Active" ? "bg-[#E8F5ED] text-[#10673E]" : "bg-red-50 text-red-500"
                      }`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${u.status === "Active" ? "bg-[#10673E]" : "bg-red-500"}`} />
                        {u.status}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <button
                        onClick={() => handleSelectUser(u)}
                        className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[12px] font-medium text-[#10673E] transition-colors hover:bg-[#E8F5ED]"
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
/* Reusable form components                                             */
/* ------------------------------------------------------------------ */

function FF({
  label, required, icon, type = "text", value, onChange, placeholder,
}: {
  label: string; required?: boolean; icon?: React.ReactNode; type?: string; value: string; onChange: (v: string) => void; placeholder?: string;
}) {
  return (
    <div className="relative">
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
          className={`
            w-full rounded-lg border border-[#D1D5DB] bg-[#F9FAFB] py-2.5 text-[13px] text-[#1F2937]
            placeholder-[#9CA3AF] transition-all focus:border-[#10673E] focus:bg-white focus:outline-none
            focus:ring-2 focus:ring-[#10673E]/20 ${icon ? "pl-10" : "pl-3.5"} pr-3.5
          `}
        />
      </div>
    </div>
  );
}

function FS({
  label, required, icon, value, onChange, options, placeholders,
}: {
  label: string; required?: boolean; icon?: React.ReactNode; value: string; onChange: (v: string) => void; options: string[]; placeholders: string[];
}) {
  return (
    <div>
      <label className="mb-1.5 block text-[12.5px] font-medium text-[#374151]">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <div className="relative">
        {icon && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]">{icon}</span>}
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`
            w-full appearance-none rounded-lg border border-[#D1D5DB] bg-[#F9FAFB] py-2.5
            text-[13px] text-[#1F2937] transition-all focus:border-[#10673E] focus:bg-white
            focus:outline-none focus:ring-2 focus:ring-[#10673E]/20 ${icon ? "pl-10" : "pl-3.5"} pr-8
          `}
        >
          {options.map((opt, i) => (
            <option key={opt || "empty"} value={opt}>{opt || placeholders[i]}</option>
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

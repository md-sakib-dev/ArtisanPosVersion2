import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import {
  UserCog,
  UserPlus,
  Save,
  RotateCcw,
  Search,
  Pencil,
  CheckCircle2,
  X,
  Users,
  List,
  Plus,
  AlertCircle,
  Loader2,
  IdCard,
  Briefcase,
  Shield,
  Building2,
  KeyRound,
  Eye,
  EyeOff,
  // ToggleLeft,
  // ToggleRight,
} from "lucide-react";
import {
  getUsers,
  createUser,
  updateUser,
  getBranchOptions,
  getRoleOptions,
  type User,
  type DropdownOption,
} from "../../api/userApi";

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
/* Helpers                                                              */
/* ------------------------------------------------------------------ */

const getErrMessage = (err: unknown, fallback: string): string => {
  const anyErr = err as { response?: { data?: { message?: string } } };
  return anyErr?.response?.data?.message || fallback;
};

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
/* Form model                                                           */
/* ------------------------------------------------------------------ */

interface UserFormState {
  loginId: string;
  employeeId: string;
  employeeName: string;
  roleId: string; // dropdown value (string of role ID)
  branchId: string; // dropdown value (string of branch ID)
  password: string;
  //status: string;
}

const EMPTY_FORM: UserFormState = {
  loginId: "",
  employeeId: "",
  employeeName: "",
  roleId: "",
  branchId: "",
  password: "",
  // status: "Active",
};

/** Body sent to POST/PUT — password omitted on edit when left blank. */
interface UserSavePayload {
  loginId: string;
  employeeId: string;
  roleId: number;
  branchId: number;
  password?: string;
}

/* ------------------------------------------------------------------ */
/* User Modal — native <dialog>                                         */
/* ------------------------------------------------------------------ */

function UserModal({
  open,
  user,
  saving,
  branches,
  branchesLoading,
  roles,
  rolesLoading,
  onClose,
  onSave,
}: {
  open: boolean;
  user: User | null;
  saving: boolean;
  branches: DropdownOption[];
  branchesLoading: boolean;
  roles: DropdownOption[];
  rolesLoading: boolean;
  onClose: () => void;
  onSave: (dto: UserSavePayload, userId: number | null) => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [form, setForm] = useState<UserFormState>({ ...EMPTY_FORM });
  const [showPassword, setShowPassword] = useState(false);

  const isEdit = Boolean(user);
  const strength = getStrength(form.password);

  const formFromUser = (u: User): UserFormState => ({
    loginId: u.loginId ?? "",
    employeeId: u.employeeId ?? "",
    employeeName: u.employeeName ?? "",
    roleId: u.roleId != null ? String(u.roleId) : "",
    branchId: u.branchId != null ? String(u.branchId) : "",
    password: "",
    //status: "Active",
  });

  // Open/close the native dialog; reset form on each open
  useEffect(() => {
    const dlg = dialogRef.current;
    if (!dlg) return;

    if (open) {
      if (!dlg.open) dlg.showModal();
      setForm(user ? formFromUser(user) : { ...EMPTY_FORM });
      setShowPassword(false);
    } else if (dlg.open) {
      dlg.close();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, user]); // branches/roles intentionally excluded: static once loaded

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

  const update = (field: keyof UserFormState, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;
    if (!form.loginId.trim() || !form.roleId || !form.branchId) {
      return; // handled by native required attrs; safety net
    }
    if (!isEdit && !form.password) {
      return; // native required; safety net
    }
    if (form.password && form.password.length < 6) {
      return; // native minLength; safety net
    }
    onSave(
      {
        loginId: form.loginId.trim(),
        employeeId: form.employeeId.trim(),
        roleId: Number(form.roleId),
        branchId: Number(form.branchId),
        // On edit: blank password = keep current → omit from payload
        ...(form.password ? { password: form.password } : {}),
      },
      user?.userId ?? null
    );
  };

  const handleReset = () => {
    setForm(user ? formFromUser(user) : { ...EMPTY_FORM });
    setShowPassword(false);
  };

  /* Dropdown options: keep a saved value selectable even when the
     dropdown list doesn't contain it (so editing never silently
     changes the assignment) — same pattern as legacy countries. */
  const roleOptions: { value: string; label: string }[] = rolesLoading
    ? [{ value: "", label: "Loading roles..." }]
    : [
        { value: "", label: "Select role" },
        ...roles.map((r) => ({ value: r.value, label: r.text })),
        ...(user?.roleId != null && !roles.some((r) => r.value === String(user.roleId))
          ? [
              {
                value: String(user.roleId),
                label: `${user.roleName || `Role #${user.roleId}`} (saved)`,
              },
            ]
          : []),
      ];

  const branchOptions: { value: string; label: string }[] = branchesLoading
    ? [{ value: "", label: "Loading branches..." }]
    : [
        { value: "", label: "Select branch" },
        ...branches.map((b) => ({ value: b.value, label: b.text })),
        ...(user?.branchId != null && !branches.some((b) => b.value === String(user.branchId))
          ? [
              {
                value: String(user.branchId),
                label: `${user.branchName || `Branch #${user.branchId}`} (saved)`,
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
                {isEdit ? "Edit User" : "Add User"}
              </h2>
              <p className="text-[11.5px] text-[#94A3B8]">
                {isEdit
                  ? `Editing ${user?.loginId} — update details below`
                  : "Fill in the login details below"}
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
            {/* Account Info */}
            <div>
              <p className="mb-3 text-[11.5px] font-semibold uppercase tracking-wider text-[#94A3B8]">
                Account Information
              </p>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <FormField
                  label="Login ID / Username"
                  required
                  icon={<UserCog size={14} />}
                  value={form.loginId}
                  onChange={(v) => update("loginId", v)}
                  placeholder="Unique username"
                  maxLength={50}
                />
                <FormField
                  label="Employee ID"
                  icon={<IdCard size={14} />}
                  value={form.employeeId}
                  onChange={(v) => update("employeeId", v)}
                  placeholder="e.g. EMP-001"
                  maxLength={50}
                />
                <FormField
                  label="Employee Name"
                  icon={<Briefcase size={14} />}
                  value={form.employeeName}
                  onChange={(v) => update("employeeName", v)}
                  placeholder="Full name"
                  maxLength={100}
                />
                <FormSelect
                  label="Role"
                  required
                  icon={<Shield size={14} />}
                  value={form.roleId}
                  onChange={(v) => update("roleId", v)}
                  options={roleOptions}
                  disabled={rolesLoading}
                />
                <FormSelect
                  label="Branch"
                  required
                  icon={<Building2 size={14} />}
                  value={form.branchId}
                  onChange={(v) => update("branchId", v)}
                  options={branchOptions}
                  disabled={branchesLoading}
                />
                {/* <div>
                  <label className="mb-1.5 block text-[12.5px] font-medium text-[#374151]">
                    Active Status
                  </label>
                  <div className="flex gap-2">
                    {["Active", "Inactive"].map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => update("status", s)}
                        className={`flex flex-1 items-center justify-center gap-2 rounded-lg border py-2.5 text-[13px] font-medium transition-all ${
                          form.status === s
                            ? s === "Active"
                              ? "border-[#10673E] bg-[#E8F5ED] text-[#10673E]"
                              : "border-red-300 bg-red-50 text-red-600"
                            : "border-[#D1D5DB] bg-[#F9FAFB] text-[#94A3B8] hover:bg-[#F1F5F9]"
                        }`}
                      >
                        {s === "Active" ? (
                          <ToggleRight size={16} />
                        ) : (
                          <ToggleLeft size={16} />
                        )}
                        {s}
                      </button>
                    ))}
                  </div>
                </div> */}
              </div>
            </div>

            {/* Security */}
            <div>
              <p className="mb-3 text-[11.5px] font-semibold uppercase tracking-wider text-[#94A3B8]">
                Security & Access
              </p>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <FormPassword
                  label={
                    isEdit
                      ? "New Password (blank = keep current)"
                      : "Password"
                  }
                  required={!isEdit}
                  value={form.password}
                  onChange={(v) => update("password", v)}
                  placeholder="Min. 6 characters"
                  showPassword={showPassword}
                  onToggleShow={() => setShowPassword(!showPassword)}
                  strength={strength}
                />
              </div>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="border-t border-[#E5E7EB] bg-[#FAFBFC] px-6 py-4">
            <div className="flex items-center justify-between">
              <p className="text-[12px] text-[#94A3B8]">
                {isEdit
                  ? "Leave password blank to keep the existing one"
                  : "All fields marked with * are required"}
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
                      ? "Update User"
                      : "Save User"}
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

export default function CreateUser() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  /* Dropdown data: one API call each on page load → feeds the modal. */
  const [branches, setBranches] = useState<DropdownOption[]>([]);
  const [branchesLoading, setBranchesLoading] = useState(true);
  const [roles, setRoles] = useState<DropdownOption[]>([]);
  const [rolesLoading, setRolesLoading] = useState(true);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const res = await getUsers();
      if (res.success && Array.isArray(res.data)) {
        setUsers(res.data);
      } else {
        throw new Error(res.message || "Failed to load users");
      }
    } catch (err) {
      console.error("Failed to load users:", err);
      setLoadError(getErrMessage(err, "Failed to load users. Please try again."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [branchList, roleList] = await Promise.all([
          getBranchOptions(),
          getRoleOptions(),
        ]);
        if (cancelled) return;
        setBranches(branchList);
        setRoles(roleList);
      } catch (err) {
        console.error("Failed to load dropdowns:", err);
        // Non-fatal: modal selects show a retryable loading state.
      } finally {
        if (!cancelled) {
          setBranchesLoading(false);
          setRolesLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const filteredData = useMemo(() => {
    if (!searchTerm.trim()) return users;
    const term = searchTerm.toLowerCase();
    return users.filter(
      (u) =>
        (u.loginId ?? "").toLowerCase().includes(term) ||
        (u.employeeName ?? "").toLowerCase().includes(term) ||
        (u.employeeId ?? "").toLowerCase().includes(term) ||
        (u.roleName ?? "").toLowerCase().includes(term) ||
        (u.branchName ?? "").toLowerCase().includes(term)
    );
  }, [users, searchTerm]);

  const handleAddNew = () => {
    setEditingUser(null);
    setModalOpen(true);
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    if (saving) return;
    setModalOpen(false);
    setEditingUser(null);
  };

  const handleSave = async (dto: UserSavePayload, userId: number | null) => {
    if (saving) return;
    setSaving(true);
    try {
      if (userId != null) {
        const res = await updateUser(userId, dto);
        if (res.success === false) throw new Error(res.message);
        setToast({
          message: `User "${dto.loginId}" updated successfully`,
          type: "success",
        });
      } else {
        const res = await createUser({
          loginId: dto.loginId,
          employeeId: dto.employeeId,
          roleId: dto.roleId,
          branchId: dto.branchId,
          passwordHash: dto.password ?? "",
        });
        if (res.success === false) throw new Error(res.message);
        setToast({
          message: `User "${dto.loginId}" created successfully`,
          type: "success",
        });
      }
      setModalOpen(false);
      setEditingUser(null);
      await fetchUsers();
    } catch (err) {
      console.error("Failed to save user:", err);
      setToast({
        message: getErrMessage(err, "Failed to save user. Please try again."),
        type: "error",
      });
    } finally {
      setSaving(false);
    }
  };

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
              <UserCog size={20} />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-[#1F2937] md:text-2xl">
                User Management
              </h1>
              <p className="mt-0.5 text-[12.5px] text-[#6B7280]">
                Manage staff login accounts, roles, and branch assignment
              </p>
            </div>
          </div>
        </header>

        {/* -------- User List Table -------- */}
        <div className="overflow-hidden rounded-xl border border-[#E5E7EB] bg-white shadow-xs">
          {/* Table Header Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E5E7EB] bg-[#FAFBFC] px-5 py-3">
            <div className="flex items-center gap-2">
              <List size={16} className="text-[#10673E]" />
              <h2 className="text-[14px] font-bold text-[#1F2937]">
                All Users
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
                  placeholder="Search by login, name, role, or branch..."
                  className="h-9 w-full rounded-lg border border-[#D1D5DB] bg-white pl-9 pr-3 text-[13px] text-[#1F2937] outline-none placeholder:text-[#9CA3AF] focus:border-[#10673E] focus:ring-2 focus:ring-[#10673E]/15 sm:w-72"
                />
              </div>
              <button
                onClick={handleAddNew}
                className="flex h-9 items-center gap-2 rounded-lg bg-[#10673E] px-4 text-[13px] font-semibold text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#0D5A35] hover:shadow-md active:scale-[0.98]"
              >
                <Plus size={15} />
                Add User
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[13px]">
              <thead>
                <tr className="border-b border-[#E5E7EB] bg-[#F8FAFC]">
                  <th className="px-5 py-3 font-semibold text-[#6B7280]">
                    Login ID
                  </th>
                  <th className="px-5 py-3 font-semibold text-[#6B7280]">
                    Employee
                  </th>
                  <th className="px-5 py-3 font-semibold text-[#6B7280]">
                    Role
                  </th>
                  <th className="px-5 py-3 font-semibold text-[#6B7280]">
                    Branch
                  </th>
                  <th className="px-5 py-3 text-right font-semibold text-[#6B7280]">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F5F9]">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-5 py-16 text-center">
                      <div className="flex flex-col items-center justify-center text-[#94A3B8]">
                        <Loader2
                          size={28}
                          className="animate-spin text-[#10673E]"
                        />
                        <p className="mt-3 text-[13px] font-medium">
                          Loading users...
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : loadError ? (
                  <tr>
                    <td colSpan={5} className="px-5 py-16 text-center">
                      <div className="flex flex-col items-center justify-center text-[#94A3B8]">
                        <AlertCircle size={30} className="text-red-400" />
                        <p className="mt-2 text-[13px] font-medium text-red-500">
                          {loadError}
                        </p>
                        <button
                          onClick={fetchUsers}
                          className="mt-3 rounded-lg border border-[#D1D5DB] bg-white px-4 py-2 text-[12.5px] font-medium text-[#374151] transition-colors hover:bg-[#F9FAFB]"
                        >
                          Retry
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : filteredData.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-5 py-16 text-center">
                      <div className="flex flex-col items-center justify-center text-[#94A3B8]">
                        <Users size={30} strokeWidth={1.5} />
                        <p className="mt-2 text-[13px] font-medium">
                          No users found.
                        </p>
                        <p className="mt-1 text-[12px]">
                          {searchTerm
                            ? "Try a different search term"
                            : "Add your first user above"}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredData.map((u) => (
                    <tr
                      key={u.userId}
                      className="transition-colors hover:bg-[#F8FAFC]"
                    >
                      <td className="px-5 py-3 font-semibold text-[#10673E] tabular-nums">
                        {u.loginId}
                      </td>
                      <td className="px-5 py-3 text-[#374151]">
                        {u.employeeName || "-"}
                        {u.employeeId ? (
                          <span className="ml-1.5 text-[11px] text-[#94A3B8] tabular-nums">
                            ({u.employeeId})
                          </span>
                        ) : null}
                      </td>
                      <td className="px-5 py-3">
                        <span className="rounded-md bg-[#2D5597]/10 px-2 py-0.5 text-[11px] font-semibold text-[#2D5597]">
                          {u.roleName || "-"}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-[#6B7280]">
                        {u.branchName || "-"}
                      </td>
                      <td className="px-5 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleEdit(u)}
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
                Showing {filteredData.length} of {users.length} users
              </p>
            </div>
          )}
        </div>

        {/* -------- User Modal (native <dialog>, page level) -------- */}
        <UserModal
          open={modalOpen}
          user={editingUser}
          saving={saving}
          branches={branches}
          branchesLoading={branchesLoading}
          roles={roles}
          rolesLoading={rolesLoading}
          onClose={handleCloseModal}
          onSave={handleSave}
        />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Reusable form fields                                                 */
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
}: {
  label: string;
  type?: string;
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
          required={required}
          className={`w-full rounded-lg border border-[#D1D5DB] bg-[#F9FAFB] py-2.5 text-[13px] text-[#1F2937] placeholder-[#9CA3AF] transition-all focus:border-[#10673E] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#10673E]/20 ${icon ? "pl-10" : "pl-3.5"} pr-3.5`}
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

function FormPassword({
  label,
  required = false,
  value,
  onChange,
  placeholder,
  showPassword,
  onToggleShow,
  strength,
}: {
  label: string;
  required?: boolean;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  showPassword: boolean;
  onToggleShow: () => void;
  strength: { label: string; pct: number; color: string };
}) {
  return (
    <div>
      <label className="mb-1.5 block text-[12.5px] font-medium text-[#374151]">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]">
          <KeyRound size={14} />
        </span>
        <input
          type={showPassword ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          required={required}
          minLength={6}
          className="w-full rounded-lg border border-[#D1D5DB] bg-[#F9FAFB] py-2.5 pl-10 pr-11 text-[13px] text-[#1F2937] placeholder-[#9CA3AF] transition-all focus:border-[#10673E] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#10673E]/20"
        />
        <button
          type="button"
          onClick={onToggleShow}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94A3B8] transition-colors hover:text-[#64748B]"
        >
          {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
      {value && (
        <div className="mt-2">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-[#94A3B8]">Strength</span>
            <span
              className={`font-medium ${
                strength.pct >= 60
                  ? "text-[#10673E]"
                  : strength.pct >= 40
                    ? "text-[#C9A02E]"
                    : "text-red-500"
              }`}
            >
              {strength.label}
            </span>
          </div>
          <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-[#E5E7EB]">
            <div
              className={`h-full rounded-full transition-all duration-300 ${strength.color}`}
              style={{ width: `${strength.pct}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

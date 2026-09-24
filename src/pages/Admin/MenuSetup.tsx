import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import {
  ListTree,
  CornerDownRight,
  Plus,
  X,
  CheckCircle2,
  Save,
  RotateCcw,
  MonitorSmartphone,
  FolderTree,
  Pencil,
  Loader2,
} from "lucide-react";
import {
  getApplicationSystems,
  getApplicationMenusBySystem,
  createApplicationMenu,
  updateApplicationMenu,
  resolveSystemIdFromMenus,
  getRootMenus,
  buildMenuTableRows,
} from "../../api/menuApi";
import type {
  ApplicationMenu,
  DropdownOption,
} from "../../api/menuApi";

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
      className={`fixed top-5 right-5 z-[60] flex items-center gap-3 rounded-xl border px-4 py-3 shadow-lg transition-all duration-300 ${
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
/* Form state                                                           */
/* ------------------------------------------------------------------ */

interface MenuFormState {
  systemCode: string;
  systemId: number | null;
  menuCode: string;
  menuName: string;
  menuUrl: string;
  menuIcon: string;
  displayOrder: number;
  isParent: boolean;
  parentMenuId: number;
}

const EMPTY_FORM: MenuFormState = {
  systemCode: "",
  systemId: null,
  menuCode: "",
  menuName: "",
  menuUrl: "",
  menuIcon: "",
  displayOrder: 0,
  isParent: true,
  parentMenuId: 0,
};

/* ------------------------------------------------------------------ */
/* Add Menu Modal                                                       */
/* ------------------------------------------------------------------ */

function AddMenuModal({
  open,
  system,
  editingMenu,
  parentMenus,
  saving,
  onClose,
  onSave,
}: {
  open: boolean;
  system: DropdownOption | null;
  editingMenu: ApplicationMenu | null;
  parentMenus: ApplicationMenu[];
  saving: boolean;
  onClose: () => void;
  onSave: (form: MenuFormState) => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [form, setForm] = useState<MenuFormState>({ ...EMPTY_FORM });
  const [error, setError] = useState<string | null>(null);

  const isEdit = Boolean(editingMenu);

  const formFromMenu = (menu: ApplicationMenu): MenuFormState => ({
    systemCode: system?.value ?? "",
    systemId: menu.systemId,
    menuCode: menu.menuCode ?? "",
    menuName: menu.menuName ?? "",
    menuUrl: menu.menuUrl ?? "",
    menuIcon: menu.icon ?? "",
    displayOrder: menu.displayOrder ?? 0,
    isParent: !menu.parentMenuId,
    parentMenuId: menu.parentMenuId ?? 0,
  });

  /* Open/close the native dialog; fresh form every time it opens —
     pre-filled from editingMenu in edit mode, empty otherwise. */
  useEffect(() => {
    const dlg = dialogRef.current;
    if (!dlg) return;

    if (open) {
      if (!dlg.open) dlg.showModal();
      setForm(
        editingMenu
          ? formFromMenu(editingMenu)
          : {
              ...EMPTY_FORM,
              systemCode: system?.value ?? "",
              systemId: null,
            }
      );
      setError(null);
    } else if (dlg.open) {
      dlg.close();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, editingMenu]);

  /* Cancel via Esc → route through onClose */
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

  const update = <K extends keyof MenuFormState>(
    field: K,
    value: MenuFormState[K]
  ) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleIsParentChange = (isParent: boolean) => {
    setForm((prev) => ({
      ...prev,
      isParent,
      /* Yes → parentMenuId = 0; No → dropdown starts empty until a
         parent is selected (validated on save) */
      parentMenuId: 0,
    }));
  };

  /* Exclude self from the parent dropdown so a menu can't become
     its own parent while editing */
  const selectableParents = useMemo(
    () => parentMenus.filter((m) => m.menuId !== editingMenu?.menuId),
    [parentMenus, editingMenu]
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;
    setError(null);

    if (!form.menuName.trim()) {
      setError("Menu Name is required");
      return;
    }
    if (!form.menuUrl.trim()) {
      setError("Menu URL is required");
      return;
    }
    /* Icon is nullable in the backend DTO — optional here */
    if (form.displayOrder < 0) {
      setError("Display Order must be 0 or greater");
      return;
    }
    if (!form.isParent && form.parentMenuId <= 0) {
      setError("Please select a parent menu");
      return;
    }

    onSave(form);
  };

  return (
    <dialog
      ref={dialogRef}
      className="m-auto w-full max-w-2xl rounded-2xl border border-[#E5E7EB] bg-white p-0 shadow-2xl backdrop:bg-black/40 backdrop:backdrop-blur-[2px]"
    >
      <div className="flex max-h-[85vh] flex-col overflow-hidden rounded-2xl">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-[#E5E7EB] px-6 py-4">
          <div className="flex items-center gap-3">              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#10673E]/10 text-[#10673E]">
              {isEdit ? <Pencil size={17} /> : <Plus size={17} />}
            </div>
            <div>
              <h2 className="text-[15px] font-bold text-[#1F2937]">
                {isEdit ? "Edit Menu" : "Add Menu"}
              </h2>
              <p className="text-[11.5px] text-[#94A3B8]">
                {isEdit
                  ? `Editing ${editingMenu?.menuName} — update details below`
                  : system
                    ? `New menu for ${system.text} (${system.value})`
                    : "Select a system first"}
              </p>
            </div>
            {isEdit ? (
              <span className="ml-1 rounded-md bg-[#2D5597]/10 px-2 py-0.5 text-[11px] font-semibold text-[#2D5597]">
                Edit Mode
              </span>
            ) : (
              system && (
                <span className="ml-1 rounded-md bg-[#2D5597]/10 px-2 py-0.5 text-[11px] font-semibold text-[#2D5597]">
                  {system.value}
                </span>
              )
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
          <div className="space-y-5 p-6">
            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-[12.5px] font-medium text-red-600">
                {error}
              </div>
            )}

            <div>
              <p className="mb-3 text-[11.5px] font-semibold uppercase tracking-wider text-[#94A3B8]">
                Menu Details
              </p>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {/* Menu Code */}
                <div>
                  <label className="mb-1.5 block text-[12.5px] font-medium text-[#374151]">
                    Menu Code <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.menuCode}
                    onChange={(e) => update("menuCode", e.target.value)}
                    placeholder="e.g. POS_DASH"
                    maxLength={20}
                    disabled={isEdit}
                    className="w-full rounded-lg border border-[#D1D5DB] bg-[#F9FAFB] px-3.5 py-2.5 text-[13px] text-[#1F2937] placeholder-[#9CA3AF] transition-all focus:border-[#10673E] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#10673E]/20 disabled:cursor-not-allowed disabled:opacity-60"
                  />
                </div>

                {/* Menu Name */}
                <div>
                  <label className="mb-1.5 block text-[12.5px] font-medium text-[#374151]">
                    Menu Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.menuName}
                    onChange={(e) => update("menuName", e.target.value)}
                    placeholder="e.g. Dashboard"
                    maxLength={50}
                    className="w-full rounded-lg border border-[#D1D5DB] bg-[#F9FAFB] px-3.5 py-2.5 text-[13px] text-[#1F2937] placeholder-[#9CA3AF] transition-all focus:border-[#10673E] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#10673E]/20"
                  />
                </div>

                {/* Menu URL */}
                <div>
                  <label className="mb-1.5 block text-[12.5px] font-medium text-[#374151]">
                    Menu URL <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.menuUrl}
                    onChange={(e) => update("menuUrl", e.target.value)}
                    placeholder="e.g. /dashboard"
                    maxLength={300}
                    className="w-full rounded-lg border border-[#D1D5DB] bg-[#F9FAFB] px-3.5 py-2.5 text-[13px] text-[#1F2937] placeholder-[#9CA3AF] transition-all focus:border-[#10673E] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#10673E]/20"
                  />
                </div>

                {/* Icon */}
                <div>
                  <label className="mb-1.5 block text-[12.5px] font-medium text-[#374151]">
                    Icon
                  </label>
                  <input
                    type="text"
                    value={form.menuIcon}
                    onChange={(e) => update("menuIcon", e.target.value)}
                    placeholder="e.g. LayoutDashboard"
                    maxLength={100}
                    className="w-full rounded-lg border border-[#D1D5DB] bg-[#F9FAFB] px-3.5 py-2.5 text-[13px] text-[#1F2937] placeholder-[#9CA3AF] transition-all focus:border-[#10673E] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#10673E]/20"
                  />
                  <p className="mt-1 text-[11px] text-[#94A3B8]">
                    Lucide icon name — e.g. LayoutDashboard, ShoppingCart,
                    Package, Warehouse, Users, Settings
                  </p>
                </div>

                {/* Display Order */}
                <div>
                  <label className="mb-1.5 block text-[12.5px] font-medium text-[#374151]">
                    Display Order <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={form.displayOrder}
                    onChange={(e) =>
                      update("displayOrder", Number(e.target.value) || 0)
                    }
                    className="w-full rounded-lg border border-[#D1D5DB] bg-[#F9FAFB] px-3.5 py-2.5 text-[13px] tabular-nums text-[#1F2937] transition-all focus:border-[#10673E] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#10673E]/20"
                  />
                </div>
              </div>
            </div>

            {/* Hierarchy */}
            <div>
              <p className="mb-3 text-[11.5px] font-semibold uppercase tracking-wider text-[#94A3B8]">
                Hierarchy
              </p>

              {/* Is Parent Menu? */}
              <div className="mb-4">
                <label className="mb-1.5 block text-[12.5px] font-medium text-[#374151]">
                  Is Parent Menu?
                </label>
                <div className="flex items-center gap-4">
                  {[
                    { label: "Yes", value: true },
                    { label: "No", value: false },
                  ].map((opt) => (
                    <label
                      key={opt.label}
                      className="flex cursor-pointer items-center gap-2 select-none"
                    >
                      <input
                        type="radio"
                        name="isParentMenu"
                        checked={form.isParent === opt.value}
                        onChange={() => handleIsParentChange(opt.value)}
                        className="h-4 w-4 accent-[#10673E]"
                      />
                      <span className="text-[13px] font-medium text-[#1F2937]">
                        {opt.label}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Parent Menu dropdown */}                <div>
                  <label className="mb-1.5 block text-[12.5px] font-medium text-[#374151]">
                    Parent Menu{" "}
                    {!form.isParent && <span className="text-red-500">*</span>}
                  </label>
                <div className="relative">
                  <select
                    value={form.parentMenuId === 0 ? "" : String(form.parentMenuId)}
                    onChange={(e) =>
                      update("parentMenuId", Number(e.target.value) || 0)
                    }
                    disabled={form.isParent || selectableParents.length === 0}
                    className={`w-full appearance-none rounded-lg border py-2.5 pl-3.5 pr-8 text-[13px] transition-all focus:outline-none focus:ring-2 ${
                      form.isParent || selectableParents.length === 0
                        ? "cursor-not-allowed border-[#D1D5DB] bg-[#F9FAFB] text-[#9CA3AF] focus:ring-0"
                        : "border-[#D1D5DB] bg-[#F9FAFB] text-[#1F2937] focus:border-[#10673E] focus:bg-white focus:ring-[#10673E]/20"
                    }`}
                  >
                    <option value="">
                      {form.isParent
                        ? "Not required for parent menu"
                        : selectableParents.length === 0
                          ? "No parent menus available"
                          : "Select Parent Menu"}
                    </option>
                    {!form.isParent &&
                      selectableParents.map((menu) => (
                        <option key={menu.menuId} value={menu.menuId}>
                          {menu.menuName}
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
                  onClick={() => {
                    setForm(
                      editingMenu
                        ? formFromMenu(editingMenu)
                        : {
                            ...EMPTY_FORM,
                            systemCode: system?.value ?? "",
                          }
                    );
                    setError(null);
                  }}
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
                      ? "Update Menu"
                      : "Save Menu"}
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

export default function MenuSetup() {
  /* System dropdown (loaded on mount, nothing auto-selected) */
  const [systems, setSystems] = useState<DropdownOption[]>([]);
  const [systemsLoading, setSystemsLoading] = useState(true);
  const [selectedSystem, setSelectedSystem] = useState<string>("");

  /* Menus of the selected system */
  const [menus, setMenus] = useState<ApplicationMenu[]>([]);
  const [menusLoading, setMenusLoading] = useState(false);
  const [menusError, setMenusError] = useState<string | null>(null);

  /* Resolved numeric systemId (dropdown returns codes like "POS",
     while the menus APIs work with numeric system IDs) */
  const [systemId, setSystemId] = useState<number | null>(null);

  /* Modal + save state */
  const [modalOpen, setModalOpen] = useState(false);
  const [editingMenu, setEditingMenu] = useState<ApplicationMenu | null>(null);
  const [saving, setSaving] = useState(false);

  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  /* Guards against stale responses when switching systems fast */
  const fetchSeqRef = useRef(0);

  /* Load systems on mount — the menu table stays empty until a
     system is selected */
  useEffect(() => {
    let cancelled = false;

    const loadSystems = async () => {
      setSystemsLoading(true);

      try {
        const response = await getApplicationSystems();

        if (cancelled) return;

        if (!response.success) {
          setToast({
            message: response.message || "Failed to load systems",
            type: "error",
          });
          setSystems([]);
        } else {
          setSystems(response.data ?? []);
        }
      } catch (error) {
        if (cancelled) return;
        setToast({
          message:
            error instanceof Error
              ? error.message
              : "Failed to load systems",
          type: "error",
        });
        setSystems([]);
      } finally {
        if (!cancelled) setSystemsLoading(false);
      }
    };

    loadSystems();

    return () => {
      cancelled = true;
    };
  }, []);

  /* Load menus whenever a system is selected */
  const loadMenus = useCallback(async (systemCode: string) => {
    const seq = ++fetchSeqRef.current;

    setMenusLoading(true);
    setMenusError(null);
    setMenus([]);
    setSystemId(null);

    if (!systemCode) return;

    try {
      const response = await getApplicationMenusBySystem(systemCode);

      if (seq !== fetchSeqRef.current) return;

      setMenus(response.menus);
      setSystemId(resolveSystemIdFromMenus(response.menus));
    } catch (error) {
      if (seq !== fetchSeqRef.current) return;

      const message =
        error instanceof Error ? error.message : "Failed to load menus";
      setMenusError(message);
      setToast({ message, type: "error" });
    } finally {
      if (seq === fetchSeqRef.current) {
        setMenusLoading(false);
      }
    }
  }, []);

  const handleSystemChange = (code: string) => {
    setSelectedSystem(code);
    loadMenus(code);
  };

  /* Parent menus of the selected system (parentMenuId = 0) */
  const parentMenus = useMemo(
    () => getRootMenus(menus),
    [menus]
  );

  /* Indented hierarchy rows for the table */
  const tableRows = useMemo(() => buildMenuTableRows(menus), [menus]);

  const selectedSystemOption = useMemo(
    () => systems.find((s) => s.value === selectedSystem) ?? null,
    [systems, selectedSystem]
  );

  const handleAddMenu = () => {
    if (!selectedSystem) {
      setToast({
        message: "Please select a system first",
        type: "error",
      });
      return;
    }
    setEditingMenu(null);
    setModalOpen(true);
  };

  const handleEditMenu = (menu: ApplicationMenu) => {
    setEditingMenu(menu);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    if (saving) return;
    setModalOpen(false);
    setEditingMenu(null);
  };

  const handleSaveMenu = async (form: MenuFormState) => {
    if (saving) return;

    if (!selectedSystem || systemId === null) {
      setToast({
        message: "Please select a system first",
        type: "error",
      });
      return;
    }

    setSaving(true);

    try {
      /* Edit keeps the menu's own systemId; create resolves it from
         the selected system's menu records. */
      const dto = {
        systemId: editingMenu ? editingMenu.systemId : systemId,
        parentMenuId: form.isParent ? 0 : form.parentMenuId,
        menuCode: form.menuCode.trim(),
        menuName: form.menuName.trim(),
        menuUrl: form.menuUrl.trim(),
        icon: form.menuIcon.trim(),
        displayOrder: form.displayOrder,
      };

      const response = editingMenu
        ? await updateApplicationMenu(editingMenu.menuId, dto)
        : await createApplicationMenu(dto);

      if (!response.success) {
        setToast({
          message:
            response.message ||
            (editingMenu ? "Failed to update menu" : "Failed to create menu"),
          type: "error",
        });
        return;
      }

      setToast({
        message:
          response.message ||
          (editingMenu
            ? `Menu "${form.menuName.trim()}" updated successfully`
            : `Menu "${form.menuName.trim()}" created successfully`),
        type: "success",
      });
      setModalOpen(false);
      setEditingMenu(null);

      /* Refresh the selected system's menus — system stays selected */
      await loadMenus(selectedSystem);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to save menu";
      setToast({ message, type: "error" });
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
              <ListTree size={20} />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-[#1F2937] md:text-2xl">
                Menu Setup
              </h1>
              <p className="mt-0.5 text-[12.5px] text-[#6B7280]">
                Configure application menus for each system
              </p>
            </div>
          </div>
        </header>

        {/* -------- System selector bar -------- */}
        <div className="rounded-xl border border-[#E5E7EB] bg-white shadow-xs">
          <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-[#2D5597]/10 text-[#2D5597]">
                <MonitorSmartphone size={14} />
              </div>
              <label className="text-[13px] font-semibold text-[#374151]">
                System:
              </label>
              <div className="relative">
                <select
                  value={selectedSystem}
                  onChange={(e) => handleSystemChange(e.target.value)}
                  disabled={systemsLoading}
                  className="h-9 w-full appearance-none rounded-lg border border-[#D1D5DB] bg-white pl-3 pr-8 text-[13px] text-[#1F2937] outline-none transition-colors focus:border-[#10673E] focus:ring-2 focus:ring-[#10673E]/15 disabled:cursor-not-allowed disabled:bg-[#F9FAFB] sm:w-72"
                >
                  <option value="">
                    {systemsLoading ? "Loading systems..." : "Select System"}
                  </option>
                  {systems.map((system) => (
                    <option key={system.value} value={system.value}>
                      {system.text}
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

            <button
              onClick={handleAddMenu}
              disabled={!selectedSystem}
              className="flex h-9 items-center gap-2 rounded-lg bg-[#10673E] px-4 text-[13px] font-semibold text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#0D5A35] hover:shadow-md active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:-translate-y-0 disabled:hover:shadow-sm"
              title={
                selectedSystem
                  ? "Add a new menu"
                  : "Select a system first"
              }
            >
              <Plus size={15} />
              Add Menu
            </button>
          </div>
        </div>

        {/* -------- Menu Table -------- */}
        <div className="overflow-hidden rounded-xl border border-[#E5E7EB] bg-white shadow-xs">
          {/* Table Header Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E5E7EB] bg-[#FAFBFC] px-5 py-3">
            <div className="flex items-center gap-2">
              <FolderTree size={16} className="text-[#10673E]" />
              <h2 className="text-[14px] font-bold text-[#1F2937]">
                Menus
              </h2>
              {selectedSystemOption && (
                <span className="rounded-md bg-[#10673E]/10 px-2.5 py-1 text-[11px] font-semibold text-[#10673E]">
                  {selectedSystemOption.text}
                </span>
              )}
              {!menusLoading && menus.length > 0 && (
                <span className="rounded-md bg-[#10673E]/10 px-2.5 py-1 text-[11px] font-semibold text-[#10673E]">
                  {menus.length} records
                </span>
              )}
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[13px]">
              <thead>
                <tr className="border-b border-[#E5E7EB] bg-[#F8FAFC]">
                  <th className="px-5 py-3 font-semibold text-[#6B7280]">
                    Menu Name
                  </th>
                  <th className="px-5 py-3 font-semibold text-[#6B7280]">
                    Menu URL
                  </th>
                  <th className="px-5 py-3 font-semibold text-[#6B7280]">
                    Icon
                  </th>
                  <th className="px-5 py-3 font-semibold text-[#6B7280]">
                    Display Order
                  </th>
                  <th className="px-5 py-3 text-right font-semibold text-[#6B7280]">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F5F9]">
                {/* Initial state: no system selected */}
                {!selectedSystem && !menusLoading ? (
                  <tr>
                    <td colSpan={5} className="px-5 py-16 text-center">
                      <div className="flex flex-col items-center justify-center text-[#94A3B8]">
                        <ListTree size={30} strokeWidth={1.5} />
                        <p className="mt-2 text-[13px] font-medium">
                          Select a system to view menus.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : menusLoading ? (
                  <tr>
                    <td colSpan={5} className="px-5 py-16 text-center">
                      <div className="flex flex-col items-center justify-center text-[#94A3B8]">
                        <span className="h-6 w-6 animate-spin rounded-full border-2 border-[#10673E]/20 border-t-[#10673E]" />
                        <p className="mt-3 text-[13px] font-medium">
                          Loading menus...
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : menusError ? (
                  <tr>
                    <td colSpan={5} className="px-5 py-16 text-center">
                      <div className="flex flex-col items-center justify-center text-red-500">
                        <X size={30} strokeWidth={1.5} />
                        <p className="mt-2 text-[13px] font-medium">
                          {menusError}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : tableRows.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-5 py-16 text-center">
                      <div className="flex flex-col items-center justify-center text-[#94A3B8]">
                        <FolderTree size={30} strokeWidth={1.5} />
                        <p className="mt-2 text-[13px] font-medium">
                          No menus found for this system.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  tableRows.map(({ menu, isChild }) => (
                    <tr
                      key={menu.menuId}
                      className="transition-colors hover:bg-[#F8FAFC]"
                    >
                      <td className="px-5 py-3">
                        <div
                          className="flex items-center gap-2"
                          style={{ paddingLeft: isChild ? 24 : 0 }}
                        >
                          {isChild ? (
                            <CornerDownRight
                              size={14}
                              className="shrink-0 text-[#94A3B8]"
                            />
                          ) : (
                            <FolderTree
                              size={14}
                              className="shrink-0 text-[#10673E]"
                            />
                          )}
                          <span
                            className={`${
                              isChild
                                ? "text-[13px] text-[#374151]"
                                : "font-semibold text-[#1F2937]"
                            }`}
                          >
                            {menu.menuName}
                          </span>
                          {!isChild && (
                            <span className="ml-1 rounded bg-[#F1F5F9] px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#64748B]">
                              Parent
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-3 font-mono text-[12px] text-[#6B7280]">
                        {menu.menuUrl || "—"}
                      </td>
                      <td className="px-5 py-3">
                        {menu.icon ? (
                          <span className="inline-flex items-center gap-1.5 rounded-md bg-[#F1F5F9] px-2 py-0.5 font-mono text-[11.5px] text-[#475569]">
                            {menu.icon}
                          </span>
                        ) : (
                          <span className="text-[#94A3B8]">—</span>
                        )}
                      </td>
                      <td className="px-5 py-3 tabular-nums text-[#374151]">
                        {menu.displayOrder}
                      </td>
                      <td className="px-5 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleEditMenu(menu)}
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
          {menus.length > 0 && !menusLoading && !menusError && (
            <div className="flex items-center justify-between border-t border-[#E5E7EB] bg-[#FAFBFC] px-5 py-3">
              <p className="text-[12px] text-[#94A3B8]">
                Showing {menus.length} menus for{" "}
                <span className="font-medium text-[#374151]">
                  {selectedSystemOption?.text ?? selectedSystem}
                </span>
              </p>
              <div className="flex items-center gap-2 text-[12px]">
                <span className="text-[#94A3B8]">Parent menus:</span>
                <span className="font-semibold text-[#10673E]">
                  {parentMenus.length}
                </span>
                <span className="mx-1 text-[#E5E7EB]">|</span>
                <span className="text-[#94A3B8]">Child menus:</span>
                <span className="font-semibold text-[#2D5597]">
                  {menus.length - parentMenus.length}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* -------- Add/Edit Menu Modal -------- */}
        <AddMenuModal
          open={modalOpen}
          system={selectedSystemOption}
          editingMenu={editingMenu}
          parentMenus={parentMenus}
          saving={saving}
          onClose={handleCloseModal}
          onSave={handleSaveMenu}
        />
      </div>
    </div>
  );
}

import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import {
  Shield,
  ChevronDown,
  ChevronRight,
  Save,
  Check,
  Pencil,
  X,
  Layers,
  Loader2,
  Plus,
  RotateCcw,
} from "lucide-react";
import {
  getApplicationRoles,
  getApplicationRolesBySystem,
  createApplicationRole,
  updateApplicationRole,
} from "../../api/applicationRoleApi";
import type { ApplicationRole } from "../../api/applicationRoleApi";
import { getApplicationSystems } from "../../api/menuApi";
import type { DropdownOption } from "../../api/menuApi";
import {
  getRoleMenusByRoleId,
  saveRoleMenus,
} from "../../api/roleMenuApi";
import type { RoleMenu, SaveRoleMenuItem } from "../../api/roleMenuApi";

/* ------------------------------------------------------------------ */
/* Types                                                                */
/* ------------------------------------------------------------------ */

interface MenuNode {
  id: number;
  label: string;
  children: MenuNode[];
}

/* Form state of the Role Entry modal (POST /ApplicationRoles). */
interface RoleFormState {
  systemId: string; // systems dropdown value
  roleCode: string;
  roleName: string;
  roleDescription: string;
}

const EMPTY_ROLE_FORM: RoleFormState = {
  systemId: "",
  roleCode: "",
  roleName: "",
  roleDescription: "",
};

/* ------------------------------------------------------------------ */
/* Build the menu tree from the RoleMenus API response                  */
/* (menuId + menuName + parentMenuId) so IDs always match the backend   */
/* ------------------------------------------------------------------ */

function buildTreeFromRoleMenus(records: RoleMenu[]): MenuNode[] {
  const sorted = [...records].sort((a, b) => a.menuId - b.menuId);

  const nodeMap = new Map<number, MenuNode>();
  for (const record of sorted) {
    nodeMap.set(record.menuId, {
      id: record.menuId,
      label: record.menuName,
      children: [],
    });
  }

  const roots: MenuNode[] = [];
  const attached = new Set<number>();

  for (const record of sorted) {
    const node = nodeMap.get(record.menuId);
    if (!node || attached.has(node.id)) continue;
    attached.add(node.id);

    const parentId = record.parentMenuId;
    const parent =
      parentId !== null && parentId !== undefined
        ? nodeMap.get(parentId)
        : undefined;

    if (parent && parent.id !== node.id) {
      parent.children.push(node);
    } else {
      roots.push(node);
    }
  }

  return roots;
}

/* ------------------------------------------------------------------ */
/* Collect all parent (expandable) IDs from a tree                      */
/* ------------------------------------------------------------------ */

function collectExpandableIds(nodes: MenuNode[]): Set<number> {
  const allIds = new Set<number>();
  const addAll = (list: MenuNode[]) => {
    for (const n of list) {
      if (n.children.length > 0) {
        allIds.add(n.id);
        addAll(n.children);
      }
    }
  };
  addAll(nodes);
  return allIds;
}

/* ------------------------------------------------------------------ */
/* Checkbox                                                             */
/* ------------------------------------------------------------------ */

function Checkbox({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: () => void;
  label: string;
}) {
  return (
    <label
      className="flex cursor-pointer items-center gap-2 select-none"
      onClick={(e) => {
        e.preventDefault();
        onChange();
      }}
    >
      <span
        className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors ${
          checked
            ? "border-[#10673E] bg-[#10673E]"
            : "border-[#D1D5DB] bg-white"
        }`}
      >
        {checked && <Check size={12} className="text-white" strokeWidth={3} />}
      </span>
      <span className="text-[13px] font-medium text-[#1F2937]">{label}</span>
    </label>
  );
}

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

/* ------------------------------------------------------------------ */
/* Helper: collect all IDs from a list of MenuNodes                     */
/* ------------------------------------------------------------------ */

function collectIdsFromNodes(nodes: MenuNode[]): number[] {
  const ids: number[] = [];
  for (const n of nodes) {
    ids.push(n.id);
    if (n.children.length > 0) ids.push(...collectIdsFromNodes(n.children));
  }
  return ids;
}

/* ------------------------------------------------------------------ */
/* Tree traversal helpers                                               */
/* ------------------------------------------------------------------ */

function findDescendantIds(node: MenuNode): number[] {
  const ids: number[] = [];
  for (const child of node.children) {
    ids.push(child.id);
    ids.push(...findDescendantIds(child));
  }
  return ids;
}

/*
 * Enforce the parent-check invariant over a subtree:
 * a parent belongs in the checked set as long as ANY child under it
 * (recursively) is checked — it is unselected only when ALL of its
 * children are unselected. Returns whether the subtree has any check.
 */
function reconcileParentCheckStates(
  nodes: MenuNode[],
  checked: Set<number>
): boolean {
  let anyChecked = false;

  for (const node of nodes) {
    if (node.children.length > 0) {
      const anyChildChecked = reconcileParentCheckStates(
        node.children,
        checked
      );
      if (anyChildChecked) {
        checked.add(node.id);
        anyChecked = true;
      } else {
        checked.delete(node.id);
      }
    } else if (checked.has(node.id)) {
      anyChecked = true;
    }
  }

  return anyChecked;
}

function findNodeById(tree: MenuNode[], id: number): MenuNode | null {
  for (const node of tree) {
    if (node.id === id) return node;
    if (node.children.length > 0) {
      const found = findNodeById(node.children, id);
      if (found) return found;
    }
  }
  return null;
}



/* ------------------------------------------------------------------ */
/* Role loading helpers                                                 */
/* ------------------------------------------------------------------ */

/**
 * Load the roles shown in the Select Role list.
 *
 * With a system selected: GET /ApplicationRoles/by-system/{systemId}
 * with the dropdown's system value (server-side filtering). With
 * "All Applications": the unfiltered GET /ApplicationRoles, reduced
 * to active roles.
 */
async function fetchRolesForScope(
  system: number | string | null
): Promise<{ roles: ApplicationRole[]; error: string | null }> {
  try {
    if (system === null) {
      const response = await getApplicationRoles();

      if (!response.success) {
        return {
          roles: [],
          error: response.message || "Failed to load roles",
        };
      }

      return {
        roles: (response.data?.items ?? []).filter(
          (role) => role.activeSts === 1
        ),
        error: null,
      };
    }

    const response = await getApplicationRolesBySystem(system);

    if (!response.success) {
      return {
        roles: [],
        error: response.message || "Failed to load roles",
      };
    }

    return {
      roles: response.data?.items ?? [],
      error: null,
    };
  } catch (error) {
    // API returns 400 when no roles exist for the selected system
    const anyErr = error as {
      response?: { status?: number; data?: { message?: string } };
      message?: string;
    };

    if (anyErr?.response?.status === 400) {
      return {
        roles: [],
        error:
          anyErr.response?.data?.message ||
          "No application roles found for the specified system",
      };
    }

    return {
      roles: [],
      error:
        anyErr?.response?.data?.message ||
        anyErr?.message ||
        "Failed to load roles",
    };
  }
}

/* ------------------------------------------------------------------ */
/* Page                                                                 */
/* ------------------------------------------------------------------ */

export default function RoleManagement() {
  /* Roles shown in the Select Role dropdown — loaded from
   * GET /ApplicationRoles (no system) or
   * GET /ApplicationRoles/by-system/{systemId} (system picked). */
  const [roles, setRoles] = useState<ApplicationRole[]>([]);
  const [rolesLoading, setRolesLoading] = useState(true);
  const [rolesError, setRolesError] = useState<string | null>(null);

  /* Currently selected role */
  const [selectedRoleId, setSelectedRoleId] = useState<number | null>(null);
  const selectedRoleIdRef = useRef<number | null>(null);

  /* Complete RoleMenu records from GET /RoleMenus/{roleId} — preserved
   * verbatim so the save payload sends full objects (menuName, roleName,
   * roleDescription, parentMenuId included). Only canView changes. */
  const [menuRecords, setMenuRecords] = useState<RoleMenu[]>([]);
  /* Locally-edited canView per menuId (controlled checkbox state). */
  const [localMenuIds, setLocalMenuIds] = useState<number[]>([]);
  const [permissionsLoading, setPermissionsLoading] = useState(true);
  const [permissionsError, setPermissionsError] = useState<string | null>(null);

  /* True while the POST save request is in flight */
  const [saving, setSaving] = useState(false);

  /* Menu tree built from the RoleMenus API response */
  const [menuTree, setMenuTree] = useState<MenuNode[]>([]);

  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  /* -------------------------------------------------------------- */
  /* Header filter dropdowns                                          */
  /* -------------------------------------------------------------- */

  /* Application (system) dropdown — GET /Dropdown/application-systems */
  const [systems, setSystems] = useState<DropdownOption[]>([]);
  const [systemsLoading, setSystemsLoading] = useState(true);
  const [systemsError, setSystemsError] = useState<string | null>(null);
  const [selectedSystem, setSelectedSystem] = useState("");

  /* Guards against stale by-system responses when the user
   * switches systems quickly. */
  const systemSeqRef = useRef(0);

  /* Role Entry modal (add/edit) + /ApplicationRoles save state */
  const [roleModalOpen, setRoleModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<ApplicationRole | null>(null);
  const [creatingRole, setCreatingRole] = useState(false);
  /* roleCode of a freshly created role — the next role-list reload
   * auto-selects it (create response carries no roleId). */
  const pendingRoleCodeRef = useRef<string | null>(null);

  /* Load the header dropdown on mount — state updates only in
     promise callbacks. */
  useEffect(() => {
    let cancelled = false;

    getApplicationSystems()
      .then((res) => {
        if (cancelled) return;
        setSystems(res.data ?? []);
        setSystemsError(null);
      })
      .catch((err) => {
        if (cancelled) return;
        console.error("Failed to load application systems:", err);
        const anyErr = err as { response?: { data?: { message?: string } } };
        setSystemsError(
          anyErr?.response?.data?.message || "Failed to load applications."
        );
      })
      .finally(() => {
        if (!cancelled) setSystemsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  /* Guards against stale RoleMenus responses when switching roles fast */
  const fetchSeqRef = useRef(0);

  const selectedRole = useMemo(
    () => roles.find((r) => r.roleId === selectedRoleId),
    [roles, selectedRoleId]
  );

  const totalMenus = useMemo(() => collectIdsFromNodes(menuTree), [menuTree]);

  const checkedIds = useMemo(() => new Set(localMenuIds), [localMenuIds]);

  const grantedCount = useMemo(
    () => localMenuIds.filter((id) => totalMenus.includes(id)).length,
    [localMenuIds, totalMenus]
  );

  /*
   * Load one role's menu permissions: GET /RoleMenus/{roleId}
   * showLoading=false performs a silent refresh (used after saving)
   * without showing the full loading overlay.
   */
  const loadRoleMenus = useCallback(
    async (roleId: number, showLoading = true) => {
    const seq = ++fetchSeqRef.current;

    if (showLoading) {
      setPermissionsLoading(true);
      setPermissionsError(null);
    }

    try {
      const response = await getRoleMenusByRoleId(roleId);

      /* A newer request was made — ignore this stale response */
      if (seq !== fetchSeqRef.current) return;

      if (!response.success) {
        setPermissionsError(
          response.message || "Failed to load permissions"
        );
        setLocalMenuIds([]);
        setMenuTree([]);
        setToast({
          message: response.message || "Failed to load permissions",
          type: "error",
        });
        return;
      }

      /* data is an ARRAY directly (not data.items) */
      const records = response.data ?? [];

      /* Preserve the COMPLETE API records for the save payload. */
      setMenuRecords(records);

      /*
       * Build the menu tree from the API records so menu IDs
       * always match the backend (no hardcoded IDs).
       */
      const tree = buildTreeFromRoleMenus(records);
      setMenuTree(tree);
      setExpandedIds(collectExpandableIds(tree));

      /* canView === true → checked */
      const checked = new Set(
        records
          .filter((record) => record.canView)
          .map((record) => record.menuId)
      );

      /* Parent rule on load as well: a parent stays checked while
         ANY of its children is checked. */
      reconcileParentCheckStates(tree, checked);

      /* Replace completely so no previous role's state remains */
      setLocalMenuIds([...checked]);
    } catch (error) {
      if (seq !== fetchSeqRef.current) return;

      const message =
        error instanceof Error ? error.message : "Failed to load permissions";
      setPermissionsError(message);
      setLocalMenuIds([]);
      setMenuTree([]);
      setToast({ message, type: "error" });
    } finally {
      if (showLoading && seq === fetchSeqRef.current) {
        setPermissionsLoading(false);
      }
    }
    },
    []
  );

  /*
   * Update the selected role (state + ref used by async flows that
   * re-scope the role list when roles and systems resolve out of order).
   */
  const applySelectedRole = useCallback((roleId: number | null) => {
    selectedRoleIdRef.current = roleId;
    setSelectedRoleId(roleId);
  }, []);

  /* Load roles on mount: GET /ApplicationRoles (no system selected) */
  useEffect(() => {
    let cancelled = false;

    (async () => {
      setRolesLoading(true);
      setRolesError(null);

      try {
        const { roles: activeRoles, error } = await fetchRolesForScope(null);

        if (cancelled) return;

        if (error) {
          setRolesError(error);
          setPermissionsLoading(false);
          setToast({ message: error, type: "error" });
          return;
        }

        setRoles(activeRoles);

        /* Auto-select the first role and load its permissions */
        if (activeRoles.length > 0) {
          const firstRoleId = activeRoles[0].roleId;
          applySelectedRole(firstRoleId);
          await loadRoleMenus(firstRoleId);
        } else {
          setPermissionsLoading(false);
        }
      } catch (err) {
        if (cancelled) return;

        const message =
          err instanceof Error ? err.message : "Failed to load roles";
        setRolesError(message);
        setPermissionsLoading(false);
        setToast({ message, type: "error" });
      } finally {
        if (!cancelled) setRolesLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [loadRoleMenus, applySelectedRole]);

  /* When role changes, load that role's permissions from the API */
  const handleRoleChange = useCallback(
    (roleId: number) => {
      applySelectedRole(roleId);
      loadRoleMenus(roleId);
    },
    [applySelectedRole, loadRoleMenus]
  );  /*
   * Application (system) filter change — loads the roles of that system
   * directly from GET /ApplicationRoles/by-system/{systemId} using the
   * dropdown's system value, then shows them in the Select Role list.
   * Keeps the current role when it belongs to the system, otherwise
   * auto-selects the first one and loads its permissions via
   * GET /RoleMenus/{roleId}.
   */
  const handleSystemChange = (value: string) => {
    setSelectedSystem(value);
    setRolesLoading(true);

    /* seq invalidates this flow when the user switches systems again */
    const seq = ++systemSeqRef.current;

    /* "" = All Applications — load the unfiltered role list */
    fetchRolesForScope(value || null)
      .then(({ roles: scopedRoles, error }) => {
        if (seq !== systemSeqRef.current) return; // stale — system changed

        setRolesLoading(false);

        if (error) {
          setRolesError(error);
          setRoles([]);
          setPermissionsLoading(false);
          setToast({ message: error, type: "error" });
          return;
        }

        setRolesError(null);
        setRoles(scopedRoles);

        if (scopedRoles.length === 0) {
          /* No roles for this application — clear the permission view */
          applySelectedRole(null);
          setMenuRecords([]);
          setLocalMenuIds([]);
          setMenuTree([]);
          setPermissionsError(null);
          setPermissionsLoading(false);
          return;
        }          /* Prefer the freshly created role (after role entry), then
             keep the current role when it belongs to this system, else
             the first role of the list. */
          const pendingCode = pendingRoleCodeRef.current;
          pendingRoleCodeRef.current = null;

          const target =
            (pendingCode
              ? scopedRoles.find((role) => role.roleCode === pendingCode)
              : undefined) ??
            scopedRoles.find(
              (role) => role.roleId === selectedRoleIdRef.current
            ) ??
            scopedRoles[0];

          if (target.roleId !== selectedRoleIdRef.current) {
            applySelectedRole(target.roleId);
            loadRoleMenus(target.roleId);
          }
      })
      .catch((err) => {
        if (seq !== systemSeqRef.current) return;

        setRolesLoading(false);

        const message =
          err instanceof Error ? err.message : "Failed to load roles";
        setRolesError(message);
        setRoles([]);
        setPermissionsLoading(false);
        setToast({ message, type: "error" });
      });
  };

  /*
   * Role modal save — POST /ApplicationRoles (create) or
   * PUT /ApplicationRoles/{roleId} (edit), then reload the role list
   * of the selected system (or all roles) and keep/auto-select the
   * affected role with its permissions loaded.
   */
  const handleSaveRole = async (form: RoleFormState) => {
    if (creatingRole) return;
    setCreatingRole(true);

    try {
      const payload = {
        systemId: Number(form.systemId),
        roleCode: form.roleCode.trim(),
        roleName: form.roleName.trim(),
        roleDescription: form.roleDescription.trim(),
      };

      const response = editingRole
        ? await updateApplicationRole(editingRole.roleId, payload)
        : await createApplicationRole(payload);

      if (!response.success) {
        setToast({
          message:
            response.message ||
            (editingRole ? "Failed to update role" : "Failed to create role"),
          type: "error",
        });
        return;
      }

      setToast({
        message:
          response.message ||
          (editingRole
            ? `Role "${form.roleName}" updated`
            : `Role "${form.roleName}" created`),
        type: "success",
      });
      setRoleModalOpen(false);
      setEditingRole(null);

      if (editingRole) {
        /* Edit — update the row in place and refresh permissions if the
           edited role is the selected one (header badge, description). */
        const editedId = editingRole.roleId;
        const updatedRole: ApplicationRole = {
          ...editingRole,
          roleName: payload.roleName,
          roleCode: payload.roleCode,
          roleDescription: payload.roleDescription || null,
          systemId: payload.systemId,
        };

        setRoles((prev) =>
          prev.map((role) =>
            role.roleId === editedId ? updatedRole : role
          )
        );

        /* Role moved to another system → re-scope the list */
        if (
          selectedSystem &&
          String(updatedRole.systemId) !== selectedSystem
        ) {
          handleSystemChange(selectedSystem);
        }
      } else {
        /* Create — the response carries no roleId, so remember the
           roleCode for the reload below to auto-select the new role. */
        pendingRoleCodeRef.current = payload.roleCode;
        handleSystemChange(selectedSystem);
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to save role";
      setToast({ message, type: "error" });
    } finally {
      setCreatingRole(false);
    }
  };

  /*
   * Toggle a menu item with hierarchical cascading:
   *
   * CHECK a node   → the node and ALL its descendants become checked
   *                  (a parent can never be selected singly).
   * UNCHECK a node → the node and ALL its descendants become unchecked
   *                  (unselecting a parent clears everything under it).
   *
   * After every toggle, reconcileParentCheckStates enforces the parent
   * rule: a parent stays checked while ANY child under it is checked —
   * it is unselected only when ALL of its children are unselected.
   */
  const handleToggle = useCallback(
    (id: number) => {
      setLocalMenuIds((prev) => {
        const current = new Set(prev);
        const isCurrentlyChecked = current.has(id);
        const node = findNodeById(menuTree, id);
        if (!node) return prev;

        if (isCurrentlyChecked) {
          /* Uncheck: clear the node and its whole subtree */
          current.delete(id);
          for (const descId of findDescendantIds(node)) {
            current.delete(descId);
          }
        } else {
          /* Check: select the node and its whole subtree */
          current.add(id);
          for (const descId of findDescendantIds(node)) {
            current.add(descId);
          }
        }

        /* A parent stays checked while ANY of its children is
           checked — it unselects only when ALL children are gone. */
        reconcileParentCheckStates(menuTree, current);

        return Array.from(current);
      });
    },
    [menuTree]
  );

  /* Toggle expand/collapse */
  const handleExpand = useCallback((id: number) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  /* Expand all / Collapse all */
  const toggleAllExpand = useCallback(
    (expand: boolean) => {
      if (expand) {
        setExpandedIds(collectExpandableIds(menuTree));
      } else {
        setExpandedIds(new Set());
      }
    },
    [menuTree]
  );

  /* Select All / Deselect All */
  const handleSelectAll = useCallback((selectAll: boolean) => {
    setLocalMenuIds(selectAll ? [...totalMenus] : []);
  }, [totalMenus]);

  /*
   * Save — POST /RoleMenus
   *
   * Builds menuList for ALL menus currently displayed
   * (checked AND unchecked) from the current UI state,
   * never from the original GET response.
   */
  const handleSave = async () => {
    if (saving) return;

    if (selectedRoleId === null) {
      setToast({ message: "Please select a role first", type: "error" });
      return;
    }

    setSaving(true);

    try {
      /*
       * Send ALL menu records — the COMPLETE objects from the GET
       * response, with ONLY canView (and its synchronized activeSts)
       * changed according to the checkbox state. No slimmed objects.
       */
      const menuList: SaveRoleMenuItem[] = menuRecords.map((record) => {
        const isChecked = checkedIds.has(record.menuId);
        return {
          menuId: record.menuId,
          menuName: record.menuName,
          roleId: record.roleId,
          roleName: record.roleName,
          roleDescription: record.roleDescription,
          parentMenuId: record.parentMenuId,
          canView: isChecked,
          activeSts: isChecked ? 1 : 0,
        };
      });

      const response = await saveRoleMenus({
        roleId: selectedRoleId,
        menuList,
      });

      if (!response.success) {
        /* Keep checkbox state so the user can retry */
        setToast({
          message: response.message || "Failed to save permissions",
          type: "error",
        });
        return;
      }

      setToast({
        message:
          response.message ||
          `Permissions saved for "${selectedRole?.roleName ?? "role"}"`,
        type: "success",
      });

      /*
       * Silently refresh the selected role's permissions so the
       * UI reflects the server's saved state. The selected role
       * stays selected and the page does not navigate away.
       */
      await loadRoleMenus(selectedRoleId, false);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to save permissions";
      setToast({ message, type: "error" });
    } finally {
      setSaving(false);
    }
  };

  /* Reset — reload the selected role's permissions from the API */
  const handleReset = () => {
    if (selectedRoleId !== null) {
      loadRoleMenus(selectedRoleId);
      setToast({ message: "Permissions reloaded from server", type: "success" });
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

        {/* Header */}
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#10673E]/10 text-[#10673E]">
              <Shield size={20} />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-[#1F2937] md:text-2xl">
                Role Management
              </h1>
              <p className="mt-0.5 text-[12.5px] text-[#6B7280]">
                Configure menu access permissions for each user role
              </p>
            </div>
          </div>
          

          {/* Header filter dropdown: Application */}
          <div className="flex flex-wrap items-center gap-2">
            {/* APPLICATION — GET /Dropdown/application-systems */}
            <div className="relative">
              <select
                value={selectedSystem}
                onChange={(e) => handleSystemChange(e.target.value)}
                disabled={systemsLoading || !!systemsError}
                className="h-9 w-full appearance-none rounded-lg border border-[#D1D5DB] bg-white pl-9 pr-8 text-[13px] text-[#1F2937] outline-none transition-colors focus:border-[#10673E] focus:ring-2 focus:ring-[#10673E]/15 disabled:cursor-not-allowed disabled:bg-[#F9FAFB] disabled:text-[#9CA3AF] sm:w-48"
              >
                <option value="">
                  {systemsLoading
                    ? "Loading..."
                    : systemsError
                      ? "Unavailable"
                      : "All Applications"}
                </option>
                {systems.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.text}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]">
                {systemsLoading ? (
                  <Loader2 size={13} className="animate-spin" />
                ) : (
                  <Layers size={13} />
                )}
              </div>
              <ChevronDown
                size={13}
                className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]"
              />
            </div>
          </div>
        </header>

        {/* Main Content */}
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-12">
          {/* LEFT: Role Selector */}
          <div className="xl:col-span-3">
            <div className="rounded-xl border border-[#E5E7EB] bg-white p-5 shadow-xs">
              <div className="flex items-center gap-2 mb-4">
                <div className="flex h-7 w-7 items-center justify-center rounded-md bg-[#2D5597]/10 text-[#2D5597]">
                  <Shield size={14} />
                </div>
                <h2 className="text-[14px] font-bold text-[#1F2937]">
                  Select Role
                </h2>
                <button
                  onClick={() => {
                    setEditingRole(null);
                    setRoleModalOpen(true);
                  }}
                  className="ml-auto flex h-7 w-7 items-center justify-center rounded-md bg-[#10673E] text-white shadow-sm transition-all hover:-translate-y-0.5 hover:bg-[#0D5A35] hover:shadow-md"
                  title="Add a new role"
                >
                  <Plus size={14} />
                </button>
              </div>

              {rolesLoading ? (
                <div className="flex items-center justify-center py-8">
                  <span className="text-[13px] text-[#6B7280]">
                    Loading roles...
                  </span>
                </div>
              ) : rolesError ? (
                <div className="py-8 text-center">
                  <p className="text-[13px] text-[#E53E3E]">{rolesError}</p>
                </div>
              ) : roles.length === 0 ? (
                <div className="py-8 text-center">
                  <p className="text-[13px] text-[#6B7280]">
                    {selectedSystem
                      ? "No roles found for this application"
                      : "No active roles found"}
                  </p>
                </div>
              ) : (
                <div className="max-h-72 space-y-1.5 overflow-y-auto pr-0.5">
                  {/*
                   * Role list — one clickable row per role, displaying
                   * roleName (roleCode beneath). Clicking a role loads its
                   * menu permissions via GET /RoleMenus/{roleId}.
                   */}
                  {roles.map((role) => {
                    const isSelected = role.roleId === selectedRoleId;

                    return (
                      <div
                        key={role.roleId}
                        onClick={() => handleRoleChange(role.roleId)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            handleRoleChange(role.roleId);
                          }
                        }}
                        className={`group flex w-full cursor-pointer items-center justify-between gap-2 rounded-lg border px-3 py-2 text-left transition-colors ${
                          isSelected
                            ? "border-[#10673E] bg-[#E8F5ED]"
                            : "border-[#E5E7EB] bg-white hover:border-[#10673E]/40 hover:bg-[#F1F8F3]"
                        }`}
                      >
                        <span className="min-w-0">
                          <span
                            className={`block truncate text-[13px] font-semibold ${
                              isSelected
                                ? "text-[#10673E]"
                                : "text-[#1F2937]"
                            }`}
                          >
                            {role.roleName}
                          </span>
                          <span className="block truncate text-[11px] text-[#94A3B8]">
                            {role.roleCode}
                          </span>
                        </span>
                        <span className="flex shrink-0 items-center gap-1.5">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingRole(role);
                              setRoleModalOpen(true);
                            }}
                            className="flex h-6 w-6 items-center justify-center rounded-md text-[#94A3B8] transition-colors hover:bg-[#E8F5ED] hover:text-[#10673E]"
                            title={`Edit ${role.roleName}`}
                          >
                            <Pencil size={13} />
                          </button>
                          <span
                            className={`flex h-5 w-5 items-center justify-center rounded-full border transition-colors ${
                              isSelected
                                ? "border-[#10673E] bg-[#10673E]"
                                : "border-[#D1D5DB] bg-white"
                            }`}
                          >
                            {isSelected && (
                              <Check
                                size={12}
                                className="text-white"
                                strokeWidth={3}
                              />
                            )}
                          </span>
                        </span>
                      </div>
                    );
                  })}
                  {selectedRole?.roleDescription && (
                    <p className="mt-2 text-[11.5px] text-[#94A3B8]">
                      {selectedRole.roleDescription}
                    </p>
                  )}
                </div>
              )}

              {/* Summary */}
              <div className="mt-5 rounded-lg bg-[#F8FAFC] p-3">
                <div className="flex items-center justify-between text-[12px]">
                  <span className="text-[#94A3B8]">Total Menus</span>
                  <span className="font-semibold text-[#1F2937]">
                    {totalMenus.length}
                  </span>
                </div>
                <div className="mt-1.5 flex items-center justify-between text-[12px]">
                  <span className="text-[#94A3B8]">Granted</span>
                  <span className="font-semibold text-[#10673E]">
                    {grantedCount}
                  </span>
                </div>
                <div className="mt-1.5 flex items-center justify-between text-[12px]">
                  <span className="text-[#94A3B8]">Denied</span>
                  <span className="font-semibold text-[#E53E3E]">
                    {totalMenus.length - grantedCount}
                  </span>
                </div>
                <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-[#E5E7EB]">
                  <div
                    className="h-full rounded-full bg-[#10673E] transition-all duration-300"
                    style={{
                      width: `${
                        totalMenus.length > 0
                          ? (grantedCount / totalMenus.length) * 100
                          : 0
                      }%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT: Menu Permissions */}
          <div className="xl:col-span-9">
            <div className="rounded-xl border border-[#E5E7EB] bg-white shadow-xs overflow-hidden">
              {/* Toolbar */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E5E7EB] px-5 py-3 bg-[#FAFBFC]">
                <div className="flex items-center gap-2">
                  <h2 className="text-[14px] font-bold text-[#1F2937]">
                    Menu Permissions
                  </h2>
                  {selectedRole && (
                    <span className="rounded-md bg-[#10673E]/10 px-2.5 py-1 text-[11px] font-semibold text-[#10673E]">
                      {selectedRole.roleName}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleAllExpand(true)}
                    className="rounded-lg border border-[#D1D5DB] bg-white px-3 py-1.5 text-[12px] font-medium text-[#6B7280] transition-colors hover:bg-[#F9FAFB] hover:text-[#374151]"
                  >
                    Expand All
                  </button>
                  <button
                    onClick={() => toggleAllExpand(false)}
                    className="rounded-lg border border-[#D1D5DB] bg-white px-3 py-1.5 text-[12px] font-medium text-[#6B7280] transition-colors hover:bg-[#F9FAFB] hover:text-[#374151]"
                  >
                    Collapse All
                  </button>
                  <div className="h-5 w-px bg-[#E5E7EB]" />
                  <button
                    onClick={() => handleSelectAll(true)}
                    className="rounded-lg border border-[#10673E]/30 bg-[#E8F5ED] px-3 py-1.5 text-[12px] font-medium text-[#10673E] transition-colors hover:bg-[#D4EDDA]"
                  >
                    Select All
                  </button>
                  <button
                    onClick={() => handleSelectAll(false)}
                    className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-[12px] font-medium text-red-600 transition-colors hover:bg-red-100"
                  >
                    Deselect All
                  </button>
                </div>
              </div>

              {/* Menu Tree */}
              <div className="max-h-[calc(100vh-320px)] overflow-y-auto p-4">
                {permissionsLoading ? (
                  <div className="flex items-center justify-center py-16">
                    <span className="text-[13px] text-[#6B7280]">
                      Loading menu permissions...
                    </span>
                  </div>
                ) : permissionsError ? (
                  <div className="py-16 text-center">
                    <p className="text-[13px] text-[#E53E3E]">
                      {permissionsError}
                    </p>
                  </div>
                ) : menuTree.length === 0 ? (
                  <div className="py-16 text-center">
                    <p className="text-[13px] text-[#6B7280]">
                      No menu permissions found for this role.
                    </p>
                  </div>
                ) : (
                  menuTree.map((node) => (
                    <TreeNode
                      key={node.id}
                      node={node}
                      checkedIds={checkedIds}
                      expandedIds={expandedIds}
                      onToggle={handleToggle}
                      onExpand={handleExpand}
                      depth={0}
                    />
                  ))
                )}
              </div>

              {/* Action Bar */}
              <div className="flex items-center justify-between border-t border-[#E5E7EB] bg-[#FAFBFC] px-5 py-4">
                <p className="text-[12px] text-[#94A3B8]">
                  {grantedCount} of {totalMenus.length} menus granted for{" "}
                  <span className="font-medium text-[#374151]">
                    {selectedRole?.roleName}
                  </span>
                </p>
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleReset}
                    className="flex items-center gap-2 rounded-lg border border-[#D1D5DB] bg-white px-4 py-2.5 text-[13px] font-medium text-[#6B7280] transition-all hover:bg-[#F9FAFB] hover:text-[#374151]"
                  >
                    Reset
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 rounded-lg bg-[#10673E] px-5 py-2.5 text-[13px] font-semibold text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#0D5A35] hover:shadow-md disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:-translate-y-0 disabled:hover:shadow-sm"
                  >
                    {saving ? (
                      <>
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save size={16} />
                        Save Permissions
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* -------- Role Entry Modal (add / edit) -------- */}
      <RoleEntryModal
        open={roleModalOpen}
        systems={systems}
        systemsLoading={systemsLoading}
        saving={creatingRole}
        defaultSystem={selectedSystem}
        editingRole={editingRole}
        onClose={() => {
          setRoleModalOpen(false);
          setEditingRole(null);
        }}
        onSave={handleSaveRole}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Tree Node Component                                                  */
/* ------------------------------------------------------------------ */

function TreeNode({
  node,
  checkedIds,
  expandedIds,
  onToggle,
  onExpand,
  depth,
}: {
  node: MenuNode;
  checkedIds: Set<number>;
  expandedIds: Set<number>;
  onToggle: (id: number) => void;
  onExpand: (id: number) => void;
  depth: number;
}) {
  const hasChildren = node.children.length > 0;
  const isExpanded = expandedIds.has(node.id);
  const isChecked = checkedIds.has(node.id);

  return (
    <div>
      <div
        className={`flex items-center gap-2 rounded-lg px-3 py-2 transition-colors hover:bg-[#F1F8F3]`}
        style={{ paddingLeft: `${12 + depth * 20}px` }}
      >
        {hasChildren && (
          <button
            onClick={() => onExpand(node.id)}
            className="flex h-5 w-5 shrink-0 items-center justify-center rounded text-[#94A3B8] hover:bg-[#E5E7EB] hover:text-[#6B7280] transition-colors"
          >
            {isExpanded ? (
              <ChevronDown size={14} />
            ) : (
              <ChevronRight size={14} />
            )}
          </button>
        )}
        {!hasChildren && <span className="w-5 shrink-0" />}

        <Checkbox
          checked={isChecked}
          onChange={() => onToggle(node.id)}
          label={node.label}
        />
      </div>

      {hasChildren && isExpanded && (
        <div className="relative">
          <div
            className="absolute top-0 bottom-0 w-px bg-[#E5E7EB]"
            style={{ left: `${26 + depth * 20}px` }}
          />
          {node.children.map((child) => (
            <TreeNode
              key={child.id}
              node={child}
              checkedIds={checkedIds}
              expandedIds={expandedIds}
              onToggle={onToggle}
              onExpand={onExpand}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Role Entry Modal — POST /ApplicationRoles (add),                     */
/* PUT /ApplicationRoles/{roleId} (edit)                                */
/* ------------------------------------------------------------------ */

function RoleEntryModal({
  open,
  systems,
  systemsLoading,
  saving,
  defaultSystem,
  editingRole,
  onClose,
  onSave,
}: {
  open: boolean;
  systems: DropdownOption[];
  systemsLoading: boolean;
  saving: boolean;
  defaultSystem: string;
  editingRole: ApplicationRole | null;
  onClose: () => void;
  onSave: (form: RoleFormState) => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [form, setForm] = useState<RoleFormState>({ ...EMPTY_ROLE_FORM });
  const [error, setError] = useState<string | null>(null);

  const isEdit = Boolean(editingRole);

  /* Open/close the native dialog; fresh form every time it opens —
     pre-filled from editingRole in edit mode, system-preselected
     otherwise (same pattern as AddMenuModal in MenuSetup.tsx). */
  useEffect(() => {
    const dlg = dialogRef.current;
    if (!dlg) return;

    if (open) {
      if (!dlg.open) dlg.showModal();
      /* Fresh form each open — dialog is an external system to
         synchronize with. */
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setForm(
        editingRole
          ? {
              systemId: String(editingRole.systemId),
              roleCode: editingRole.roleCode ?? "",
              roleName: editingRole.roleName ?? "",
              roleDescription: editingRole.roleDescription ?? "",
            }
          : { ...EMPTY_ROLE_FORM, systemId: defaultSystem }
      );
      setError(null);
    } else if (dlg.open) {
      dlg.close();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, editingRole]);

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

  const update = <K extends keyof RoleFormState>(
    field: K,
    value: RoleFormState[K]
  ) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;
    setError(null);

    if (!form.systemId) {
      setError("Please select a system");
      return;
    }
    if (!form.roleCode.trim()) {
      setError("Role Code is required");
      return;
    }
    if (!form.roleName.trim()) {
      setError("Role Name is required");
      return;
    }

    onSave(form);
  };

  return (
    <dialog
      ref={dialogRef}
      className="m-auto w-full max-w-xl rounded-2xl border border-[#E5E7EB] bg-white p-0 shadow-2xl backdrop:bg-black/40 backdrop:backdrop-blur-[2px]"
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
                {isEdit ? "Edit Role" : "Add Role"}
              </h2>
              <p className="text-[11.5px] text-[#94A3B8]">
                {isEdit
                  ? `Editing ${editingRole?.roleName} — update details below`
                  : "Create a new role for an application system"}
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
                Role Details
              </p>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {/* System dropdown */}
                <div className="sm:col-span-2">
                  <label className="mb-1.5 block text-[12.5px] font-medium text-[#374151]">
                    System <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <select
                      value={form.systemId}
                      onChange={(e) => update("systemId", e.target.value)}
                      disabled={systemsLoading || systems.length === 0}
                      className="w-full appearance-none rounded-lg border border-[#D1D5DB] bg-[#F9FAFB] px-3.5 py-2.5 pr-8 text-[13px] text-[#1F2937] transition-all focus:border-[#10673E] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#10673E]/20 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <option value="">
                        {systemsLoading
                          ? "Loading systems..."
                          : systems.length === 0
                            ? "No systems available"
                            : "Select System"}
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

                {/* Role Code */}
                <div>
                  <label className="mb-1.5 block text-[12.5px] font-medium text-[#374151]">
                    Role Code <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.roleCode}
                    onChange={(e) => update("roleCode", e.target.value)}
                    placeholder="e.g. POSOPERATOR"
                    maxLength={50}
                    className="w-full rounded-lg border border-[#D1D5DB] bg-[#F9FAFB] px-3.5 py-2.5 text-[13px] uppercase text-[#1F2937] placeholder-[#9CA3AF] transition-all focus:border-[#10673E] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#10673E]/20"
                  />
                </div>

                {/* Role Name */}
                <div>
                  <label className="mb-1.5 block text-[12.5px] font-medium text-[#374151]">
                    Role Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.roleName}
                    onChange={(e) => update("roleName", e.target.value)}
                    placeholder="e.g. POS Operator"
                    maxLength={100}
                    className="w-full rounded-lg border border-[#D1D5DB] bg-[#F9FAFB] px-3.5 py-2.5 text-[13px] text-[#1F2937] placeholder-[#9CA3AF] transition-all focus:border-[#10673E] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#10673E]/20"
                  />
                </div>

                {/* Role Description */}
                <div className="sm:col-span-2">
                  <label className="mb-1.5 block text-[12.5px] font-medium text-[#374151]">
                    Role Description
                  </label>
                  <textarea
                    value={form.roleDescription}
                    onChange={(e) =>
                      update("roleDescription", e.target.value)
                    }
                    placeholder="Short description of what this role can do"
                    maxLength={250}
                    rows={3}
                    className="w-full resize-none rounded-lg border border-[#D1D5DB] bg-[#F9FAFB] px-3.5 py-2.5 text-[13px] text-[#1F2937] placeholder-[#9CA3AF] transition-all focus:border-[#10673E] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#10673E]/20"
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
                  onClick={() => {
                    setForm(
                      editingRole
                        ? {
                            systemId: String(editingRole.systemId),
                            roleCode: editingRole.roleCode ?? "",
                            roleName: editingRole.roleName ?? "",
                            roleDescription: editingRole.roleDescription ?? "",
                          }
                        : {
                            ...EMPTY_ROLE_FORM,
                            systemId: defaultSystem,
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
                  ) : isEdit ? (
                    <Save size={15} />
                  ) : (
                    <Plus size={15} />
                  )}
                  {saving
                    ? "Saving..."
                    : isEdit
                      ? "Update Role"
                      : "Create Role"}
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </dialog>
  );
}

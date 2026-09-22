import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import {
  Shield,
  ChevronDown,
  ChevronRight,
  Save,
  Check,
  Minus,
  X,
} from "lucide-react";
import { getApplicationRoles } from "../../api/applicationRoleApi";
import type { ApplicationRole } from "../../api/applicationRoleApi";
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
/* Indeterminate checkbox helper                                        */
/* ------------------------------------------------------------------ */

function TriStateCheckbox({
  checked,
  indeterminate,
  onChange,
  label,
}: {
  checked: boolean;
  indeterminate: boolean;
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
            : indeterminate
              ? "border-[#10673E] bg-[#10673E]/20"
              : "border-[#D1D5DB] bg-white"
        }`}
      >
        {checked && <Check size={12} className="text-white" strokeWidth={3} />}
        {!checked && indeterminate && (
          <Minus size={12} className="text-[#10673E]" strokeWidth={3} />
        )}
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

function findAncestors(
  tree: MenuNode[],
  targetId: number,
  path: number[] = []
): number[] {
  for (const node of tree) {
    if (node.id === targetId) return path;
    if (node.children.length > 0) {
      const result = findAncestors(node.children, targetId, [...path, node.id]);
      if (result.length > 0) return result;
    }
  }
  return [];
}

function findDescendantIds(node: MenuNode): number[] {
  const ids: number[] = [];
  for (const child of node.children) {
    ids.push(child.id);
    ids.push(...findDescendantIds(child));
  }
  return ids;
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

function findSiblings(
  tree: MenuNode[],
  targetId: number
): MenuNode[] | null {
  for (const node of tree) {
    if (node.children.some((c) => c.id === targetId)) return node.children;
    if (node.children.length > 0) {
      const result = findSiblings(node.children, targetId);
      if (result) return result;
    }
  }
  return null;
}

/* ------------------------------------------------------------------ */
/* Page                                                                 */
/* ------------------------------------------------------------------ */

export default function RoleManagement() {
  /* Roles loaded from GET /ApplicationRoles */
  const [roles, setRoles] = useState<ApplicationRole[]>([]);
  const [rolesLoading, setRolesLoading] = useState(true);
  const [rolesError, setRolesError] = useState<string | null>(null);

  /* Currently selected role */
  const [selectedRoleId, setSelectedRoleId] = useState<number | null>(null);

  /* Menu permission state loaded from GET /RoleMenus/{roleId} */
  const [localMenuIds, setLocalMenuIds] = useState<number[]>([]);
  const [permissionsLoading, setPermissionsLoading] = useState(true);
  const [permissionsError, setPermissionsError] = useState<string | null>(null);

  /* True while the POST save request is in flight */
  const [saving, setSaving] = useState(false);

  /* Granted menu count per role (filled in as roles are loaded) */
  const [roleMenuCounts, setRoleMenuCounts] = useState<
    Record<number, number>
  >({});

  /* Menu tree built from the RoleMenus API response */
  const [menuTree, setMenuTree] = useState<MenuNode[]>([]);

  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

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

      /*
       * Build the menu tree from the API records so menu IDs
       * always match the backend (no hardcoded IDs).
       */
      const tree = buildTreeFromRoleMenus(records);
      setMenuTree(tree);
      setExpandedIds(collectExpandableIds(tree));

      /* activeSts === 1 → checked, activeSts === 0 → unchecked */
      const checked = records
        .filter((record) => record.activeSts === 1)
        .map((record) => record.menuId);

      /* Replace completely so no previous role's state remains */
      setLocalMenuIds(checked);
      setRoleMenuCounts((prev) => ({
        ...prev,
        [roleId]: checked.length,
      }));
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

  /* Load roles on mount: GET /ApplicationRoles */
  useEffect(() => {
    let cancelled = false;

    const loadRoles = async () => {
      setRolesLoading(true);
      setRolesError(null);

      try {
        const response = await getApplicationRoles();

        if (cancelled) return;

        if (!response.success) {
          setRolesError(response.message || "Failed to load roles");
          setPermissionsLoading(false);
          setToast({
            message: response.message || "Failed to load roles",
            type: "error",
          });
          return;
        }

        /* Only active roles: activeSts === 1 */
        const activeRoles = (response.data?.items ?? []).filter(
          (role) => role.activeSts === 1
        );

        setRoles(activeRoles);

        if (activeRoles.length > 0) {
          /* Auto-select the first role and load its permissions */
          const firstRoleId = activeRoles[0].roleId;
          setSelectedRoleId(firstRoleId);
          await loadRoleMenus(firstRoleId);
        } else {
          setPermissionsLoading(false);
        }
      } catch (error) {
        if (cancelled) return;

        const message =
          error instanceof Error ? error.message : "Failed to load roles";
        setRolesError(message);
        setPermissionsLoading(false);
        setToast({ message, type: "error" });
      } finally {
        if (!cancelled) setRolesLoading(false);
      }
    };

    loadRoles();

    return () => {
      cancelled = true;
    };
  }, [loadRoleMenus]);

  /* When role changes, load that role's permissions from the API */
  const handleRoleChange = useCallback(
    (roleId: number) => {
      setSelectedRoleId(roleId);
      loadRoleMenus(roleId);
    },
    [loadRoleMenus]
  );

  /* Toggle a single menu item */
  const handleToggle = useCallback(
    (id: number) => {
      setLocalMenuIds((prev) => {
        const current = new Set(prev);
        const isCurrentlyChecked = current.has(id);

        if (isCurrentlyChecked) {
          current.delete(id);
          // Uncheck all descendants
          const node = findNodeById(menuTree, id);
          if (node) {
            const descIds = findDescendantIds(node);
            descIds.forEach((dId) => current.delete(dId));
          }
          // Re-evaluate ancestors
          const ancestors = findAncestors(menuTree, id);
          for (const ancId of ancestors) {
            const ancNode = findNodeById(menuTree, ancId);
            if (ancNode) {
              const ancDesc = findDescendantIds(ancNode);
              const anyChecked = ancDesc.some((dId) => current.has(dId));
              if (!anyChecked) current.delete(ancId);
            }
          }
        } else {
          current.add(id);
          // If all siblings are now checked, check the parent
          const siblings = findSiblings(menuTree, id);
          if (siblings) {
            const allSiblingsChecked = siblings.every((s) =>
              current.has(s.id)
            );
            if (allSiblingsChecked) {
              const ancestors = findAncestors(menuTree, id);
              for (const ancId of ancestors) {
                current.add(ancId);
              }
            }
          }
        }

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
       * Include EVERY menu in the permission list.
       * checked   → canView: true,  activeSts: 1
       * unchecked → canView: false, activeSts: 0
       */
      const menuList: SaveRoleMenuItem[] = totalMenus.map((menuId) => {
        const isChecked = checkedIds.has(menuId);
        return {
          menuId,
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
        <header>
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
                    No active roles found
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {roles.map((role) => {
                    const isSelected = role.roleId === selectedRoleId;
                    const permCount = roleMenuCounts[role.roleId] ?? 0;
                    return (
                      <button
                        key={role.roleId}
                        onClick={() => handleRoleChange(role.roleId)}
                        className={`w-full rounded-lg border p-3 text-left transition-all ${
                          isSelected
                            ? "border-[#10673E] bg-[#E8F5ED] shadow-sm"
                            : "border-[#E5E7EB] bg-white hover:border-[#D1D5DB] hover:bg-[#F9FAFB]"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span
                            className={`text-[13px] font-semibold ${
                              isSelected ? "text-[#10673E]" : "text-[#1F2937]"
                            }`}
                          >
                            {role.roleName}
                          </span>
                          <span
                            className={`rounded-md px-2 py-0.5 text-[11px] font-semibold ${
                              isSelected
                                ? "bg-[#10673E]/15 text-[#10673E]"
                                : "bg-[#F1F5F9] text-[#64748B]"
                            }`}
                          >
                            {permCount}
                          </span>
                        </div>
                        <p className="mt-1 text-[11.5px] text-[#94A3B8]">
                          {role.roleDescription ?? ""}
                        </p>
                      </button>
                    );
                  })}
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
                      Loading permissions...
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
                      No menus found
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

  const allChildIds = useMemo(
    () => collectIdsFromNodes(node.children),
    [node.children]
  );
  const checkedChildCount = allChildIds.filter((id) =>
    checkedIds.has(id)
  ).length;
  const indeterminate =
    hasChildren &&
    checkedChildCount > 0 &&
    checkedChildCount < allChildIds.length;

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

        <TriStateCheckbox
          checked={isChecked}
          indeterminate={indeterminate}
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

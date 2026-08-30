import { useState, useMemo, useCallback } from "react";
import {
  Shield,
  ChevronDown,
  ChevronRight,
  Save,
  Check,
  Minus,
  X,
} from "lucide-react";
import { menuItems } from "../../data/menuitems";
import { useRole } from "../../contexts/RoleContext";
import rolesData from "../../data/roles.json";
import rolePermissionsData from "../../data/rolePermissions.json";
import type { MenuItem } from "../../types/menu";

/* ------------------------------------------------------------------ */
/* Types                                                                */
/* ------------------------------------------------------------------ */

interface MenuNode {
  id: number;
  label: string;
  children: MenuNode[];
}

/* ------------------------------------------------------------------ */
/* Build flat ID list & tree from nested menuItems                      */
/* ------------------------------------------------------------------ */

function collectIds(items: MenuItem[]): number[] {
  const ids: number[] = [];
  for (const item of items) {
    if (item.id !== undefined) ids.push(item.id);
    if (item.children) ids.push(...collectIds(item.children));
  }
  return ids;
}

function buildTree(items: MenuItem[]): MenuNode[] {
  return items.map((item) => ({
    id: item.id ?? 0,
    label: item.label,
    children: item.children ? buildTree(item.children) : [],
  }));
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

const menuTree = buildTree(menuItems);

export default function RoleManagement() {
  const {
    currentRoleId,
    permissions,
    currentMenuIds,
    setCurrentRoleId,
    updatePermissions,
  } = useRole();

  // Local edit state for the selected role's permissions
  const [localMenuIds, setLocalMenuIds] = useState<number[]>(() => [
    ...currentMenuIds,
  ]);
  const [expandedIds, setExpandedIds] = useState<Set<number>>(() => {
    const allIds = new Set<number>();
    const expandAll = (nodes: MenuNode[]) => {
      for (const n of nodes) {
        if (n.children.length > 0) {
          allIds.add(n.id);
          expandAll(n.children);
        }
      }
    };
    expandAll(menuTree);
    return allIds;
  });
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);
  const [showJson, setShowJson] = useState(false);

  const selectedRole = useMemo(
    () => rolesData.find((r) => r.id === currentRoleId),
    [currentRoleId]
  );

  const totalMenus = useMemo(() => collectIds(menuItems), []);

  const checkedIds = useMemo(() => new Set(localMenuIds), [localMenuIds]);

  const grantedCount = useMemo(
    () => localMenuIds.filter((id) => totalMenus.includes(id)).length,
    [localMenuIds, totalMenus]
  );

  /* When role changes, load that role's permissions into local state */
  const handleRoleChange = useCallback(
    (roleId: number) => {
      setCurrentRoleId(roleId);
      const perm = permissions.find((p) => p.roleId === roleId);
      setLocalMenuIds([...(perm?.menuIds ?? [])]);
    },
    [permissions, setCurrentRoleId]
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
    []
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
  const toggleAllExpand = useCallback((expand: boolean) => {
    if (expand) {
      const allIds = new Set<number>();
      const addAll = (nodes: MenuNode[]) => {
        for (const n of nodes) {
          if (n.children.length > 0) {
            allIds.add(n.id);
            addAll(n.children);
          }
        }
      };
      addAll(menuTree);
      setExpandedIds(allIds);
    } else {
      setExpandedIds(new Set());
    }
  }, []);

  /* Select All / Deselect All */
  const handleSelectAll = useCallback((selectAll: boolean) => {
    setLocalMenuIds(selectAll ? [...totalMenus] : []);
  }, [totalMenus]);

  /* Save — pushes local state into the global context */
  const handleSave = () => {
    updatePermissions(currentRoleId, localMenuIds);
    setShowJson(true);
    setToast({
      message: `Permissions saved for "${selectedRole?.name}"`,
      type: "success",
    });
  };

  /* Reset to initial dummy data */
  const handleReset = () => {
    const init = rolePermissionsData.find((p) => p.roleId === currentRoleId);
    setLocalMenuIds([...(init?.menuIds ?? [])]);
    setToast({ message: "Permissions reset to default", type: "success" });
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

              <div className="space-y-2">
                {rolesData.map((role) => {
                  const isSelected = role.id === currentRoleId;
                  const rolePerm = permissions.find(
                    (p) => p.roleId === role.id
                  );
                  const permCount = rolePerm?.menuIds.length ?? 0;
                  return (
                    <button
                      key={role.id}
                      onClick={() => handleRoleChange(role.id)}
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
                          {role.name}
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
                        {role.description}
                      </p>
                    </button>
                  );
                })}
              </div>

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
                      {selectedRole.name}
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
                {menuTree.map((node) => (
                  <TreeNode
                    key={node.id}
                    node={node}
                    checkedIds={checkedIds}
                    expandedIds={expandedIds}
                    onToggle={handleToggle}
                    onExpand={handleExpand}
                    depth={0}
                  />
                ))}
              </div>

              {/* Action Bar */}
              <div className="flex items-center justify-between border-t border-[#E5E7EB] bg-[#FAFBFC] px-5 py-4">
                <p className="text-[12px] text-[#94A3B8]">
                  {grantedCount} of {totalMenus.length} menus granted for{" "}
                  <span className="font-medium text-[#374151]">
                    {selectedRole?.name}
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
                    className="flex items-center gap-2 rounded-lg bg-[#10673E] px-5 py-2.5 text-[13px] font-semibold text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#0D5A35] hover:shadow-md"
                  >
                    <Save size={16} />
                    Save Permissions
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* JSON Preview Modal */}
        {showJson && selectedRole && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
            style={{ animation: "fade-up 0.2s ease both" }}
            onClick={() => setShowJson(false)}
          >
            <div
              className="w-full max-w-lg overflow-hidden rounded-2xl border border-[#E5E7EB] bg-white shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-[#E5E7EB] px-5 py-4">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-md bg-[#10673E]/10 text-[#10673E]">
                    <Shield size={14} />
                  </div>
                  <h2 className="text-[15px] font-bold text-[#1F2937]">
                    Saved Permissions JSON
                  </h2>
                </div>
                <button
                  onClick={() => setShowJson(false)}
                  className="text-[#94A3B8] hover:text-[#64748B] transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="p-5">
                <pre className="overflow-x-auto rounded-lg bg-[#1E293B] p-4 text-[13px] leading-relaxed text-[#E2E8F0]">
                  {JSON.stringify(
                    {
                      roleId: currentRoleId,
                      roleName: selectedRole.name,
                      menuIds: localMenuIds,
                    },
                    null,
                    2
                  )}
                </pre>
              </div>
              <div className="flex items-center justify-end border-t border-[#E5E7EB] px-5 py-3">
                <button
                  onClick={() => setShowJson(false)}
                  className="rounded-lg border border-[#D1D5DB] bg-white px-4 py-2 text-[13px] font-medium text-[#6B7280] transition-colors hover:bg-[#F9FAFB]"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
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

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from "react";
import rolesData from "../data/roles.json";
import rolePermissionsData from "../data/rolePermissions.json";
import type { Role, RolePermissions } from "../types/role";
import { useAuth } from "./AuthContext";

interface RoleContextType {
  currentRoleId: number;
  currentRole: Role | undefined;
  permissions: RolePermissions[];
  currentMenuIds: number[];
  setCurrentRoleId: (id: number) => void;
  updatePermissions: (roleId: number, menuIds: number[]) => void;
}

const RoleContext = createContext<RoleContextType | undefined>(undefined);

export const useRole = () => {
  const context = useContext(RoleContext);
  if (!context) {
    throw new Error("useRole must be used within a RoleProvider");
  }
  return context;
};

export const RoleProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { user } = useAuth();

  // Initialize from the logged-in user's role, or fall back to localStorage / default
  const [currentRoleId, setCurrentRoleIdState] = useState<number>(() => {
    if (user) return user.roleId;
    const saved = localStorage.getItem("currentRoleId");
    return saved ? parseInt(saved, 10) : 1;
  });

  // When user changes (login/logout), update the role
  useEffect(() => {
    if (user) {
      setCurrentRoleIdState(user.roleId);
      localStorage.setItem("currentRoleId", String(user.roleId));
    }
  }, [user]);

  const [permissions, setPermissions] = useState<RolePermissions[]>(() => {
    const saved = localStorage.getItem("rolePermissions");
    if (saved) {
      try {
        const cached = JSON.parse(saved) as RolePermissions[];
        // Merge: ensure any new menuIds from the JSON source are included
        return rolePermissionsData.map((def) => {
          const existing = cached.find((c) => c.roleId === def.roleId);
          if (existing) {
            const mergedIds = Array.from(new Set([...existing.menuIds, ...def.menuIds]));
            return { ...existing, menuIds: mergedIds };
          }
          return def;
        });
      } catch {
        return rolePermissionsData;
      }
    }
    return rolePermissionsData;
  });

  const currentRole = rolesData.find((r) => r.id === currentRoleId);
  const currentPerm = permissions.find((p) => p.roleId === currentRoleId);
  const currentMenuIds = currentPerm?.menuIds ?? [];

  const handleSetCurrentRoleId = useCallback((id: number) => {
    setCurrentRoleIdState(id);
    localStorage.setItem("currentRoleId", String(id));
  }, []);

  const updatePermissions = useCallback(
    (roleId: number, menuIds: number[]) => {
      setPermissions((prev) => {
        const existing = prev.find((p) => p.roleId === roleId);
        const role = rolesData.find((r) => r.id === roleId);
        let next: RolePermissions[];
        if (existing) {
          next = prev.map((p) =>
            p.roleId === roleId ? { ...p, menuIds } : p
          );
        } else {
          next = [
            ...prev,
            {
              roleId,
              roleName: role?.name ?? "",
              menuIds,
            },
          ];
        }
        localStorage.setItem("rolePermissions", JSON.stringify(next));
        return next;
      });
    },
    []
  );

  return (
    <RoleContext.Provider
      value={{
        currentRoleId,
        currentRole,
        permissions,
        currentMenuIds,
        setCurrentRoleId: handleSetCurrentRoleId,
        updatePermissions,
      }}
    >
      {children}
    </RoleContext.Provider>
  );
};

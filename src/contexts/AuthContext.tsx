import React, { createContext, useContext, useState } from "react";
import usersData from "../data/users.json";

interface AuthUser {
  id: number;
  username: string;
  displayName: string;
  roleId: number;
  roleName: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: AuthUser | null;
  login: (username: string, password: string) => boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem("isAuthenticated") === "true";
  });

  const [user, setUser] = useState<AuthUser | null>(() => {
    const saved = localStorage.getItem("authUser");
    if (saved) {
      try {
        return JSON.parse(saved) as AuthUser;
      } catch {
        return null;
      }
    }
    return null;
  });

  const login = (username: string, password: string): boolean => {
    const found = usersData.find(
      (u) => u.username === username && u.password === password
    );
    if (found) {
      const authUser: AuthUser = {
        id: found.id,
        username: found.username,
        displayName: found.displayName,
        roleId: found.roleId,
        roleName: found.roleName,
      };
      setIsAuthenticated(true);
      setUser(authUser);
      localStorage.setItem("isAuthenticated", "true");
      localStorage.setItem("authUser", JSON.stringify(authUser));
      // Set the role ID so RoleContext picks it up
      localStorage.setItem("currentRoleId", String(found.roleId));
      return true;
    }
    return false;
  };

  const logout = () => {
    setIsAuthenticated(false);
    setUser(null);
    localStorage.removeItem("isAuthenticated");
    localStorage.removeItem("authUser");
    // Keep currentRoleId so next login starts from last role,
    // but it will be overwritten on next login anyway
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

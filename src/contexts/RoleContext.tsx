import React, {
  createContext,
  useContext,
  useState,
  useEffect,
} from "react";

import type { MenuItem } from "../types/menu";

import { useAuth } from "./AuthContext";

import { getAuthorizedMenus } from "../api/roleMenuApi";
import type { AuthorizedMenu } from "../api/roleMenuApi";

import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Warehouse,
  Users,
  Receipt,
  BarChart3,
  Settings,
  Shield,
  Target,
  CreditCard,
  UserPlus,
  ClipboardList,
  type LucideIcon,
} from "lucide-react";

interface RoleContextType {
  menuItems: MenuItem[];
  sidebarLoading: boolean;
  sidebarError: string | null;
}

const RoleContext = createContext<RoleContextType | undefined>(undefined);

export const useRole = () => {
  const context = useContext(RoleContext);

  if (!context) {
    throw new Error("useRole must be used within a RoleProvider");
  }

  return context;
};


const iconMap: Record<string, LucideIcon> = {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Warehouse,
  Users,
  Receipt,
  BarChart3,
  Settings,
  Shield,
  Target,
  CreditCard,
  UserPlus,
};

/*
 * Get the icon for an API menu.
 *
 * The API's menuIcon names an existing Lucide icon.
 * Unknown names fall back to a generic existing icon.
 */
const getMenuIcon = (
  menuIcon: string | null | undefined
): LucideIcon | undefined => {
  if (!menuIcon) {
    return ClipboardList;
  }


  return iconMap[menuIcon] ?? iconMap[menuIcon.toLowerCase()] ?? ClipboardList;
};

const getMenuPath = (menuUrl: string | null | undefined) => {
  if (!menuUrl) {
    return undefined;
  }

  return menuUrl.startsWith("/") ? menuUrl : `/${menuUrl}`;
};

/*
 * Build the nested MenuItem tree from the
 * /RoleMenus/authorized response.
 *
 * The API is flat:
 *
 * menuId | parentMenuId
 *
 * We convert it to:
 *
 * Parent
 *   ├── Child
 *   └── Child
 */
const buildMenuTree = (authorizedMenus: AuthorizedMenu[]): MenuItem[] => {
  /*
   * Create all MenuItem objects first.
   */
  const menuMap = new Map<number, MenuItem>();

  authorizedMenus.forEach((menu) => {
    menuMap.set(menu.menuId, {
      id: menu.menuId,
      label: menu.menuName,
      path: getMenuPath(menu.menuUrl),
      icon: getMenuIcon(menu.menuIcon),
      children: [],
    });
  });

  /*
   * Build parent/child relationships from parentMenuId.
   */
  const tree: MenuItem[] = [];

  authorizedMenus.forEach((menu) => {
    const currentItem = menuMap.get(menu.menuId);

    if (!currentItem) {
      return;
    }

    /*
     * No parent = root menu.
     */
    if (menu.parentMenuId === null || menu.parentMenuId === undefined) {
      tree.push(currentItem);
      return;
    }

    /*
     * Has parent.
     */
    const parentItem = menuMap.get(menu.parentMenuId);

    if (parentItem) {
      parentItem.children = [...(parentItem.children ?? []), currentItem];
    } else {
      /*
       * If the parent isn't in the authorized list,
       * keep the child visible at root level instead
       * of losing it completely.
       */
      tree.push(currentItem);
    }
  });

  return tree;
};

export const RoleProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const { user } = useAuth();

  /*
   * This is the menu structure that Sidebar uses,
   * built from GET /RoleMenus/authorized.
   */
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [sidebarLoading, setSidebarLoading] = useState<boolean>(true);
  const [sidebarError, setSidebarError] = useState<string | null>(null);

  /*
   * Load the authorized menus for the logged-in user.
   */
  useEffect(() => {
    let cancelled = false;

    const loadAuthorizedMenus = async () => {
      if (!user) {
        setMenuItems([]);
        setSidebarLoading(false);
        setSidebarError(null);
        return;
      }

      setSidebarLoading(true);
      setSidebarError(null);

      try {
        const authorizedMenus = await getAuthorizedMenus();

        if (cancelled) {
          return;
        }

        setMenuItems(buildMenuTree(authorizedMenus));
        setSidebarLoading(false);
      } catch (error) {
        if (cancelled) {
          return;
        }

        /*
         * Log for debugging; keep the app running.
         * HTTP 401 is handled by the existing auth mechanism.
         */
        console.error("Failed to load authorized menus:", error);

        setSidebarError(
          error instanceof Error ? error.message : "Failed to load menus"
        );
        setMenuItems([]);
        setSidebarLoading(false);
      }
    };

    loadAuthorizedMenus();

    return () => {
      cancelled = true;
    };
  }, [user]);

  return (
    <RoleContext.Provider
      value={{
        menuItems,
        sidebarLoading,
        sidebarError,
      }}
    >
      {children}
    </RoleContext.Provider>
  );
};

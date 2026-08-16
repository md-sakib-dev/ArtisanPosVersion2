import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Warehouse,
  Users,
  Receipt,
  BarChart3,
  Settings,
} from "lucide-react";
import type { MenuItem } from "../types/menu";
export const menuItems: MenuItem[] = [
  {
    label: "Home",
    icon: LayoutDashboard,
      path: "/",
  },
  {
    label: "Admin Home",
    icon: ShoppingCart,
      path: "/products",
  },
  {
    label: "Purchase",
    icon: Package,
     children: [
      {
        label: "New Purchase",
        icon: ShoppingCart,
          path: "/products",
      },
      {
        label: "Purchase History",
        icon: Receipt,
          path: "/products",
      },
      {
        label: "Returns",
        icon: Receipt,
          path: "/products",
      },
    ],
  },
  {
    label: "Inventory",
    icon: Warehouse,
     children: [
      {
        label: "Current Stock",
        icon: Package,
          path: "/stock",
      },
      {
        label: "Stock Transfer",
        icon: Package,
          path: "/products",
      },
    ],
  },
  {
    label: "Customers",
    icon: Users,
      path: "/products",
  },
  {
    label: "Sales",
    icon: Receipt,
    children: [
      {
        label: "New Sale",
        icon: ShoppingCart,
          path: "/saleentry",
      },
      {
        label: "Sales History",
        icon: Receipt,
          path: "/products",
      },
      {
        label: "Returns",
        icon: Receipt,
          path: "/products",
      },
    ],
  },
  {
    label: "Reports",
    icon: BarChart3,
    children: [
      {
        label: "Sale Reports",
        icon: ShoppingCart,
          path: "/products",
      },
      {
        label: "Purchase Reports",
        icon: Receipt,
          path: "/products",
      },
      {
        label: "Stock Report",
        icon: Receipt,
          path: "/products",
      },
    ],
  },
  {
    label: "Settings",
    icon: Settings,
      path: "/products",
  },
];
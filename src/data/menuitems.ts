import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Warehouse,
  Users,
  Receipt,
  BarChart3,
  Settings,
  PackageCheck,
  RotateCcw,
  Gift,
  ArrowLeftRight,
  Tags,
  Shield,
  Target,
} from "lucide-react";
import type { MenuItem } from "../types/menu";

export const menuItems: MenuItem[] = [
  {
    id: 1,
    label: "POS Dashboard",
    icon: LayoutDashboard,
    path: "/dashboard",
  },
  {
    id: 2,
    label: "Report Dashboard",
    icon: ShoppingCart,
    path: "/reportdashboard",
  },
  {
    id: 3,
    label: "Administration",
    icon: Package,
    children: [
      {
        id: 4,
        label: "New User",
        icon: ShoppingCart,
        path: "/createuser",
      },
      {
        id: 25,
        label: "Sales Target",
        icon: Target,
        path: "/salestarget",
      },
    ],
  },
  {
    id: 5,
    label: "Inventory",
    icon: Warehouse,
    children: [
      {
        id: 6,
        label: "Current Stock",
        icon: Package,
        path: "/stock",
      },
      {
        id: 7,
        label: "Stock Transfer",
        icon: Package,
        path: "/stocktransfer",
      },
      {
        id: 8,
        label: "Product Receive",
        icon: PackageCheck,
        path: "/productreceive",
      },
      {
        id: 9,
        label: "Factory Return",
        icon: RotateCcw,
        path: "/factoryreturn",
      },
      {
        id: 10,
        label: "Gift Voucher Receive",
        icon: Gift,
        path: "/giftvoucherreceive",
      },
      {
        id: 11,
        label: "Voucher Transfer",
        icon: ArrowLeftRight,
        path: "/vouchertransfer",
      },
      {
        id: 12,
        label: "Label Print",
        icon: Tags,
        path: "/labelprint",
      },
    ],
  },
  {
    id: 13,
    label: "Customers",
    icon: Users,
    path: "/customers",
  },
  {
    id: 14,
    label: "Sales",
    icon: Receipt,
    children: [
      {
        id: 15,
        label: "New Sale",
        icon: ShoppingCart,
        path: "/saleentry",
      },
      {
        id: 16,
        label: "Returns",
        icon: RotateCcw,
        path: "/salesrefund",
      },
      {
        id: 17,
        label: "Gift Voucher Sale",
        icon: Receipt,
        path: "/voucherentry",
      },
    ],
  },
  {
    id: 18,
    label: "Configuration",
    icon: Settings,
    children: [
      {
        id: 19,
        label: "Invoice Discounts",
        icon: ShoppingCart,
        path: "/products",
      },
      {
        id: 20,
        label: "Label Printing",
        icon: ShoppingCart,
        path: "/products",
      },
    ],
  },
  {
    id: 21,
    label: "Reports",
    icon: BarChart3,
    path: "/reports",
  },
  {
    id: 24,
    label: "Role Management",
    icon: Shield,
    path: "/roles",
  },
];

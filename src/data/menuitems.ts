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
  Boxes,
} from "lucide-react";
import type { MenuItem } from "../types/menu";
export const menuItems: MenuItem[] = [
  {
    label: "Home",
    icon: LayoutDashboard,
      path: "/dashboard",
  },
  {
    label: "Admin Home",
    icon: ShoppingCart,
      path: "/products",
  },
  {
    label: "Product Management",
    icon: Boxes,
      path: "/productmanagement",
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
      {
        label: "Product Receive",
        icon: PackageCheck,
          path: "/productreceive",
      },
      {
        label: "Factory Return",
        icon: RotateCcw,
          path: "/factoryreturn",
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
        label: "Stock Update",
        icon: PackageCheck,
          path: "/stockupdate",
      },
      {
        label: "Stock Transfer",
        icon: Package,
          path: "/stocktransfer",
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
        icon: RotateCcw,
          path: "/salesrefund",
      },
      {
        label: "Voucher Entry",
        icon: Receipt,
          path: "/voucherentry",
      },
      {
        label: "Gift Voucher Receive",
        icon: Gift,
          path: "/giftvoucherreceive",
      },
      {
        label: "Voucher Transfer",
        icon: ArrowLeftRight,
          path: "/vouchertransfer",
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
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
  //Boxes,
} from "lucide-react";
import type { MenuItem } from "../types/menu";
export const menuItems: MenuItem[] = [
  {
    label: "POS Dashboard",
    icon: LayoutDashboard,
      path: "/dashboard",
  },
  {
    label: "Report Dashboard",
    icon: ShoppingCart,
      path: "/reportdashboard",
  },
  // {
  //   label: "Product Management",
  //   icon: Boxes,
  //     path: "/productmanagement",
  // },
  {
    label: "Administration",
    icon: Package,
     children: [
      {
        label: "New User",
        icon: ShoppingCart,
          path: "/createuser",
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
      // {
      //   label: "Stock Update",
      //   icon: PackageCheck,
      //     path: "/stockupdate",
      // },
      {
        label: "Stock Transfer",
        icon: Package,
          path: "/stocktransfer",
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
      {
        label: "Label Print",
        icon: Tags,
          path: "/labelprint",
      },
    ],
  },
  {
    label: "Customers",
    icon: Users,
      path: "/customers",
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
        label: "Returns",
        icon: RotateCcw,
          path: "/salesrefund",
      },
      {
        label: "Gift Voucher Sale",
        icon: Receipt,
          path: "/voucherentry",
      },
     
    ],
  },  
  {
    label: "Configuration",
    icon: Settings,
      children: [
      {
        label: "Invoice Discounts",
        icon: ShoppingCart,
          path: "/products",
      },
      {
        label: "Label Printing",
        icon: ShoppingCart,
          path: "/products",
      },
      
    ],
  },
  {
    label: "Reports",
    icon: BarChart3,
     children: [
      {
        label: "Product Report",
        icon: ShoppingCart,
          path: "/prodreport",
      },
      {
        label: "Label Printing",
        icon: ShoppingCart,
          path: "/products",
      },
      
    ],
  },
];
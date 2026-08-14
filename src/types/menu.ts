import type { LucideIcon } from "lucide-react";
export interface MenuItem {
  label: string;
  icon: LucideIcon;
    path?: string;
   children?: MenuItem[];
}
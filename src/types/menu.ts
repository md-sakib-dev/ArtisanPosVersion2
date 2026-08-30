import type { LucideIcon } from "lucide-react";
export interface MenuItem {
  id?: number;
  label: string;
  icon: LucideIcon;
  path?: string;
  children?: MenuItem[];
}
import type { LucideIcon } from "lucide-react";

export interface ReportItem {
  id: number;
  label: string;
  path: string;
  icon: LucideIcon;
  description?: string;
}

export interface ReportSection {
  id: number;
  title: string;
  icon: LucideIcon;
  color: string;
  reports: ReportItem[];
}

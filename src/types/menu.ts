import type { LucideIcon } from "lucide-react"; 
export interface MenuItem { id: number; label: string; path?: string; icon?: LucideIcon; children?: MenuItem[]; }
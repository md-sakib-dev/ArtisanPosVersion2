export type PeriodFilter = "today" | "week" | "month";
export type RevenueMetric = "revenue" | "units";
export type ProductSort = "revenue" | "volume";
export type StoreName = "All Stores" | "Dhanmondi Flagship" | "Gulshan 2 Store" | "Chittagong EPZ" | "Uttara Branch" | "Sylhet City Center" | "Khulna Outlet";

/** A single point on the sales trend chart */
export interface SalesPoint {
  label: string;
  revenue: number; // BDT
  units: number;
}

/** KPI values for a given period filter */
export interface KpiSet {
  revenue: {
    value: number;
    delta: number;
    compare: string;
    spark: number[];
  };
  orders: {
    value: number;
    items: number;
    delta: number;
    compare: string;
    spark: number[];
  };
  outlets: {
    active: number;
    total: number;
    online: number;
    offline: number;
    delta: number;
    compare: string;
    spark: number[];
  };
  stock: {
    value: number;
    delta: number;
    lowStock: number;
    compare: string;
    spark: number[];
  };
}

export interface TopProduct {
  id: string;
  name: string;
  category: string;
  sku: string;
  unitsSold: number;
  revenue: number;
  trend: number;
  color: string;
  glyph: string;
}

export type OutletStatus = "top" | "solid" | "attention";

export interface OutletRow {
  id: string;
  name: string;
  location: string;
  revenue: number;
  orders: number;
  status: OutletStatus;
}

export interface CategorySlice {
  label: string;
  value: number; // percentage share
  amount: number; // BDT
  color: string;
}

/** Payment method share — same shape as a category slice */
export type PaymentSlice = CategorySlice;

/** One group of a grouped bar chart (current vs previous period) */
export interface ComparisonPoint {
  label: string;
  current: number;
  previous: number;
}

/** Day × hour sales heatmap */
export interface HeatmapData {
  days: string[];
  hours: string[];
  values: number[][]; // [day][hour] in BDT
}

export interface SizeDatum {
  label: string;
  value: number;
}

/** Monthly best-selling outlet */
export interface OutletMonthly {
  id: string;
  name: string;
  location: string;
  revenue: number;
  orders: number;
  growth: number; // % vs last month
}

export type FeedType = "restock" | "transfer" | "receive" | "low-stock" | "stockout";

export interface FeedEvent {
  id: string;
  type: FeedType;
  text: string;
  outlet: string;
  time: string;
}

export type OrderStatus = "completed" | "processing" | "returned";

export interface RecentOrder {
  id: string;
  customer: string;
  outlet: string;
  items: number;
  total: number;
  status: OrderStatus;
  time: string;
}

export interface NotificationItem {
  id: string;
  text: string;
  meta: string;
  tone: "mint" | "cyan" | "gold" | "danger";
}

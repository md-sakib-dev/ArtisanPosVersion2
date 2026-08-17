import type {
  CategorySlice,
  ComparisonPoint,
  FeedEvent,
  HeatmapData,
  KpiSet,
  NotificationItem,
  OutletMonthly,
  OutletRow,
  PaymentSlice,
  PeriodFilter,
  RecentOrder,
  SalesPoint,
  SizeDatum,
  TopProduct,
} from "./types";

/* ------------------------------------------------------------------ */
/* Formatters — BDT with Indian/Bangladeshi digit grouping (lakh/crore) */
/* ------------------------------------------------------------------ */

const bdtFull = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 });
const bdtCompact = new Intl.NumberFormat("en-IN", {
  notation: "compact",
  maximumFractionDigits: 1,
});
const plainCompact = new Intl.NumberFormat("en-IN", {
  notation: "compact",
  maximumFractionDigits: 1,
});
const plainFull = new Intl.NumberFormat("en-IN");

/** ৳28,47,392 */
export const fmtBDT = (n: number) => `৳${bdtFull.format(n)}`;
/** ৳28.5L / ৳1.2Cr — compact form used on chart axes */
export const fmtBDTShort = (n: number) => `৳${bdtCompact.format(n)}`;
/** 1,284 */
export const fmtNum = (n: number) => plainFull.format(n);
/** 1.3K / 24K — compact plain number */
export const fmtCompact = (n: number) => plainCompact.format(n);

/* ------------------------------------------------------------------ */
/* Sales series per period filter                                       */
/* ------------------------------------------------------------------ */

export const PERIOD_OPTIONS: { key: PeriodFilter; label: string }[] = [
  { key: "today", label: "Today" },
  { key: "week", label: "This Week" },
  { key: "month", label: "This Month" },
  { key: "custom", label: "Custom Range" },
];

export const SERIES: Record<PeriodFilter, SalesPoint[]> = {
  today: [
    { label: "8 AM", revenue: 42000, units: 320 },
    { label: "9 AM", revenue: 38600, units: 305 },
    { label: "10 AM", revenue: 31400, units: 248 },
    { label: "11 AM", revenue: 29200, units: 231 },
    { label: "12 PM", revenue: 36800, units: 286 },
    { label: "1 PM", revenue: 52800, units: 402 },
    { label: "2 PM", revenue: 74400, units: 541 },
    { label: "3 PM", revenue: 88600, units: 632 },
    { label: "4 PM", revenue: 96400, units: 689 },
    { label: "5 PM", revenue: 84600, units: 603 },
    { label: "6 PM", revenue: 66200, units: 487 },
    { label: "7 PM", revenue: 51800, units: 391 },
    { label: "8 PM", revenue: 44800, units: 342 },
  ],
  week: [
    { label: "Mon", revenue: 182000, units: 1240 },
    { label: "Tue", revenue: 224000, units: 1510 },
    { label: "Wed", revenue: 198000, units: 1380 },
    { label: "Thu", revenue: 251000, units: 1690 },
    { label: "Fri", revenue: 286000, units: 1930 },
    { label: "Sat", revenue: 342000, units: 2260 },
    { label: "Sun", revenue: 315000, units: 2090 },
  ],
  month: [
    { label: "Sep", revenue: 1820000, units: 11800 },
    { label: "Oct", revenue: 2050000, units: 13200 },
    { label: "Nov", revenue: 1980000, units: 12900 },
    { label: "Dec", revenue: 2240000, units: 14500 },
    { label: "Jan", revenue: 2460000, units: 15800 },
    { label: "Feb", revenue: 2380000, units: 15400 },
    { label: "Mar", revenue: 2610000, units: 16900 },
    { label: "Apr", revenue: 2740000, units: 17700 },
    { label: "May", revenue: 2580000, units: 16800 },
    { label: "Jun", revenue: 2890000, units: 18600 },
    { label: "Jul", revenue: 3020000, units: 19400 },
    { label: "Aug", revenue: 3170000, units: 20300 },
  ],
  custom: [
    { label: "3 Aug", revenue: 198000, units: 1340 },
    { label: "4 Aug", revenue: 246000, units: 1620 },
    { label: "5 Aug", revenue: 221000, units: 1470 },
    { label: "6 Aug", revenue: 268000, units: 1750 },
    { label: "7 Aug", revenue: 254000, units: 1660 },
    { label: "8 Aug", revenue: 312000, units: 2010 },
    { label: "9 Aug", revenue: 294000, units: 1890 },
    { label: "10 Aug", revenue: 332000, units: 2150 },
    { label: "11 Aug", revenue: 305000, units: 1990 },
    { label: "12 Aug", revenue: 348000, units: 2240 },
    { label: "13 Aug", revenue: 326000, units: 2110 },
    { label: "14 Aug", revenue: 371000, units: 2380 },
    { label: "15 Aug", revenue: 355000, units: 2290 },
    { label: "16 Aug", revenue: 384000, units: 2460 },
  ],
};

/* ------------------------------------------------------------------ */
/* KPI cards                                                            */
/* ------------------------------------------------------------------ */

const sparkRevenue = [62, 58, 66, 61, 70, 74, 71, 79, 84, 81, 90, 96];
const sparkOrders = [55, 61, 58, 64, 62, 69, 73, 71, 78, 76, 82, 88];
const sparkOutlets = [40, 41, 40, 42, 43, 42, 44, 45, 44, 46, 47, 48];
const sparkStock = [88, 86, 87, 84, 82, 80, 78, 75, 73, 71, 69, 66];

export const KPIS: Record<PeriodFilter, KpiSet> = {
  today: {
    revenue: {
      value: 842390,
      delta: 18.2,
      compare: "vs ৳7,12,400 yesterday",
      spark: sparkRevenue,
    },
    orders: {
      value: 2341,
      items: 6108,
      delta: 11.4,
      compare: "vs 2,102 yesterday",
      spark: sparkOrders,
    },
    outlets: {
      active: 46,
      total: 52,
      online: 46,
      offline: 6,
      delta: 6.5,
      compare: "3 more than yesterday",
      spark: sparkOutlets,
    },
    stock: {
      value: 1248500,
      delta: -2.3,
      lowStock: 23,
      compare: "3 SKUs out of stock",
      spark: sparkStock,
    },
  },
  week: {
    revenue: {
      value: 2847392,
      delta: 12.4,
      compare: "vs ৳25,33,120 last week",
      spark: sparkRevenue,
    },
    orders: {
      value: 8942,
      items: 24316,
      delta: 8.1,
      compare: "vs 8,268 last week",
      spark: sparkOrders,
    },
    outlets: {
      active: 48,
      total: 52,
      online: 48,
      offline: 4,
      delta: 6.5,
      compare: "4 outlets offline",
      spark: sparkOutlets,
    },
    stock: {
      value: 1248500,
      delta: -2.3,
      lowStock: 23,
      compare: "3 SKUs out of stock",
      spark: sparkStock,
    },
  },
  month: {
    revenue: {
      value: 10254730,
      delta: 9.8,
      compare: "vs ৳93,41,200 last month",
      spark: sparkRevenue,
    },
    orders: {
      value: 31208,
      items: 84920,
      delta: 6.2,
      compare: "vs 29,386 last month",
      spark: sparkOrders,
    },
    outlets: {
      active: 49,
      total: 52,
      online: 49,
      offline: 3,
      delta: 4.2,
      compare: "3 outlets offline",
      spark: sparkOutlets,
    },
    stock: {
      value: 1248500,
      delta: -2.3,
      lowStock: 23,
      compare: "3 SKUs out of stock",
      spark: sparkStock,
    },
  },
  custom: {
    revenue: {
      value: 4162950,
      delta: 7.6,
      compare: "vs ৳38,68,400 previous range",
      spark: sparkRevenue,
    },
    orders: {
      value: 12904,
      items: 34480,
      delta: 5.9,
      compare: "vs 12,184 previous range",
      spark: sparkOrders,
    },
    outlets: {
      active: 47,
      total: 52,
      online: 47,
      offline: 5,
      delta: 2.2,
      compare: "5 outlets offline",
      spark: sparkOutlets,
    },
    stock: {
      value: 1248500,
      delta: -2.3,
      lowStock: 23,
      compare: "3 SKUs out of stock",
      spark: sparkStock,
    },
  },
};

/* ------------------------------------------------------------------ */
/* Top selling products (this month) — clothing brand                   */
/* ------------------------------------------------------------------ */

export const TOP_PRODUCTS: TopProduct[] = [
  {
    id: "p1",
    name: "Premium Panjabi",
    category: "Ethnic Wear",
    sku: "ETH-PJ01",
    unitsSold: 480,
    revenue: 1199520,
    trend: 24.6,
    color: "#2D5597",
    glyph: "P",
  },
  {
    id: "p2",
    name: "Classic Denim Jeans",
    category: "Men's Wear",
    sku: "MEN-DJ4",
    unitsSold: 642,
    revenue: 1219158,
    trend: 9.2,
    color: "#3AAFA9",
    glyph: "J",
  },
  {
    id: "p3",
    name: "Cotton Polo Shirt",
    category: "Men's Wear",
    sku: "MEN-PL3",
    unitsSold: 1184,
    revenue: 1064416,
    trend: 6.4,
    color: "#50B4D8",
    glyph: "T",
  },
  {
    id: "p4",
    name: "Embroidered Kurti",
    category: "Women's Wear",
    sku: "WOM-KU2",
    unitsSold: 386,
    revenue: 617214,
    trend: 18.9,
    color: "#E2BA48",
    glyph: "K",
  },
  {
    id: "p5",
    name: "Running Sneakers",
    category: "Footwear",
    sku: "FTW-RS7",
    unitsSold: 248,
    revenue: 743752,
    trend: -3.1,
    color: "#1E293B",
    glyph: "S",
  },
];

/* ------------------------------------------------------------------ */
/* Outlet performance (last week)                                       */
/* ------------------------------------------------------------------ */

export const OUTLETS: OutletRow[] = [
  {
    id: "o1",
    name: "Dhanmondi Flagship",
    location: "Dhaka",
    revenue: 642000,
    orders: 1284,
    status: "top",
  },
  {
    id: "o2",
    name: "Gulshan 2 Store",
    location: "Dhaka",
    revenue: 538000,
    orders: 1102,
    status: "top",
  },
  {
    id: "o3",
    name: "Chittagong EPZ",
    location: "Chattogram",
    revenue: 471000,
    orders: 986,
    status: "solid",
  },
  {
    id: "o4",
    name: "Uttara Branch",
    location: "Dhaka",
    revenue: 396000,
    orders: 874,
    status: "solid",
  },
  {
    id: "o5",
    name: "Sylhet City Center",
    location: "Sylhet",
    revenue: 274000,
    orders: 621,
    status: "solid",
  },
  {
    id: "o6",
    name: "Khulna Outlet",
    location: "Khulna",
    revenue: 198000,
    orders: 438,
    status: "attention",
  },
];

/* ------------------------------------------------------------------ */
/* Monthly best-selling outlets (this month)                            */
/* ------------------------------------------------------------------ */

export const TOP_OUTLETS_MONTHLY: OutletMonthly[] = [
  {
    id: "m1",
    name: "Dhanmondi Flagship",
    location: "Dhaka",
    revenue: 2146000,
    orders: 5180,
    growth: 11.2,
  },
  {
    id: "m2",
    name: "Gulshan 2 Store",
    location: "Dhaka",
    revenue: 1892000,
    orders: 4620,
    growth: 6.8,
  },
  {
    id: "m3",
    name: "Chittagong EPZ",
    location: "Chattogram",
    revenue: 1563000,
    orders: 3940,
    growth: 4.1,
  },
  {
    id: "m4",
    name: "Uttara Branch",
    location: "Dhaka",
    revenue: 1384000,
    orders: 3410,
    growth: 9.5,
  },
  {
    id: "m5",
    name: "Sylhet City Center",
    location: "Sylhet",
    revenue: 924000,
    orders: 2180,
    growth: -2.4,
  },
  {
    id: "m6",
    name: "Khulna Outlet",
    location: "Khulna",
    revenue: 741000,
    orders: 1640,
    growth: -5.1,
  },
];

/* ------------------------------------------------------------------ */
/* Category distribution (this month)                                   */
/* ------------------------------------------------------------------ */

export const CATEGORIES: CategorySlice[] = [
  { label: "Men's Wear", value: 32, amount: 3282000, color: "#2D5597" },
  { label: "Women's Wear", value: 28, amount: 2871000, color: "#3AAFA9" },
  { label: "Ethnic Wear", value: 18, amount: 1846000, color: "#50B4D8" },
  { label: "Kids & Infants", value: 12, amount: 1231000, color: "#E2BA48" },
  { label: "Footwear", value: 10, amount: 1025000, color: "#1E293B" },
];

export const CATEGORY_TOTAL = 10254730;

/* ------------------------------------------------------------------ */
/* Monthly revenue vs last year (grouped bars)                          */
/* ------------------------------------------------------------------ */

export const MONTHLY_COMPARISON: ComparisonPoint[] = [
  { label: "Mar", current: 2460000, previous: 2120000 },
  { label: "Apr", current: 2740000, previous: 2300000 },
  { label: "May", current: 2580000, previous: 2410000 },
  { label: "Jun", current: 2890000, previous: 2540000 },
  { label: "Jul", current: 3020000, previous: 2680000 },
  { label: "Aug", current: 3170000, previous: 2790000 },
];

/* ------------------------------------------------------------------ */
/* Sales by hour × day heatmap                                          */
/* ------------------------------------------------------------------ */

export const HEATMAP: HeatmapData = {
  days: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
  hours: [
    "10 AM",
    "11 AM",
    "12 PM",
    "1 PM",
    "2 PM",
    "3 PM",
    "4 PM",
    "5 PM",
    "6 PM",
    "7 PM",
    "8 PM",
    "9 PM",
  ],
  values: [
    [22000, 31000, 36000, 28000, 24000, 26000, 34000, 52000, 61000, 54000, 38000, 26000],
    [24000, 34000, 38000, 30000, 26000, 29000, 38000, 56000, 64000, 58000, 42000, 29000],
    [21000, 32000, 35000, 29000, 25000, 28000, 36000, 54000, 63000, 56000, 40000, 27000],
    [26000, 36000, 41000, 32000, 28000, 31000, 41000, 60000, 69000, 62000, 45000, 31000],
    [38000, 52000, 64000, 58000, 47000, 43000, 49000, 66000, 74000, 70000, 55000, 42000],
    [42000, 58000, 72000, 66000, 54000, 50000, 56000, 73000, 82000, 78000, 61000, 46000],
    [31000, 42000, 49000, 43000, 35000, 32000, 40000, 57000, 66000, 60000, 44000, 30000],
  ],
};

/* ------------------------------------------------------------------ */
/* Payment method split                                                 */
/* ------------------------------------------------------------------ */

export const PAYMENTS: PaymentSlice[] = [
  { label: "bKash", value: 42, amount: 4307000, color: "#E2136E" },
  { label: "Card", value: 24, amount: 2461000, color: "#1E293B" },
  { label: "Nagad", value: 18, amount: 1846000, color: "#F6921E" },
  { label: "Cash", value: 16, amount: 1641000, color: "#3AAFA9" },
];

/* ------------------------------------------------------------------ */
/* Size distribution (sold units this month)                            */
/* ------------------------------------------------------------------ */

export const SIZE_DISTRIBUTION: SizeDatum[] = [
  { label: "XS", value: 420 },
  { label: "S", value: 1840 },
  { label: "M", value: 3120 },
  { label: "L", value: 2740 },
  { label: "XL", value: 1380 },
  { label: "XXL", value: 610 },
];

/* ------------------------------------------------------------------ */
/* Monthly sales target                                                 */
/* ------------------------------------------------------------------ */

export const MONTHLY_TARGET = {
  target: 12500000,
  achieved: 10254730,
};

/* ------------------------------------------------------------------ */
/* Live inventory feed                                                  */
/* ------------------------------------------------------------------ */

export const FEED: FeedEvent[] = [
  {
    id: "f1",
    type: "restock",
    text: "1,200 × Cotton Polo Shirt received",
    outlet: "Dhanmondi Flagship",
    time: "2m ago",
  },
  {
    id: "f2",
    type: "low-stock",
    text: "Premium Panjabi below reorder point",
    outlet: "Gulshan 2 Store",
    time: "8m ago",
  },
  {
    id: "f3",
    type: "transfer",
    text: "240 × Classic Denim Jeans → Uttara",
    outlet: "Uttara Branch",
    time: "14m ago",
  },
  {
    id: "f4",
    type: "receive",
    text: "PO-2201 confirmed · 48 line items",
    outlet: "Chittagong EPZ",
    time: "22m ago",
  },
  {
    id: "f5",
    type: "stockout",
    text: "Polo Shirt (Size XL) out of stock",
    outlet: "Sylhet City Center",
    time: "31m ago",
  },
  {
    id: "f6",
    type: "low-stock",
    text: "V-Neck Tee (White) · 9 units left",
    outlet: "Khulna Outlet",
    time: "47m ago",
  },
  {
    id: "f7",
    type: "transfer",
    text: "180 × Running Sneakers → Central Warehouse",
    outlet: "Central Warehouse",
    time: "1h ago",
  },
];

/* ------------------------------------------------------------------ */
/* Recent orders                                                        */
/* ------------------------------------------------------------------ */

export const RECENT_ORDERS: RecentOrder[] = [
  {
    id: "ORD-28431",
    customer: "Farhan Ahmed",
    outlet: "Dhanmondi",
    items: 3,
    total: 7497,
    status: "completed",
    time: "4m ago",
  },
  {
    id: "ORD-28430",
    customer: "Nusrat Jahan",
    outlet: "Gulshan 2",
    items: 5,
    total: 18740,
    status: "processing",
    time: "9m ago",
  },
  {
    id: "ORD-28429",
    customer: "Rafiqul Islam",
    outlet: "Uttara",
    items: 1,
    total: 2499,
    status: "completed",
    time: "12m ago",
  },
  {
    id: "ORD-28428",
    customer: "Tanvir Hasan",
    outlet: "Chittagong EPZ",
    items: 2,
    total: 9798,
    status: "returned",
    time: "18m ago",
  },
  {
    id: "ORD-28427",
    customer: "Sadia Rahman",
    outlet: "Sylhet",
    items: 4,
    total: 12196,
    status: "completed",
    time: "25m ago",
  },
  {
    id: "ORD-28426",
    customer: "Mahbub Alam",
    outlet: "Khulna",
    items: 1,
    total: 2999,
    status: "processing",
    time: "33m ago",
  },
];

/* ------------------------------------------------------------------ */
/* Notifications                                                        */
/* ------------------------------------------------------------------ */

export const NOTIFICATIONS: NotificationItem[] = [
  {
    id: "n1",
    text: "Low stock alert: Premium Panjabi",
    meta: "Gulshan 2 Store · 8m ago",
    tone: "gold",
  },
  {
    id: "n2",
    text: "New sale ৳18,740 at Gulshan 2 Store",
    meta: "ORD-28430 · 9m ago",
    tone: "mint",
  },
  {
    id: "n3",
    text: "Stock transfer #TR-4412 completed",
    meta: "240 units to Uttara Branch · 14m ago",
    tone: "cyan",
  },
  {
    id: "n4",
    text: "Polo Shirt (Size XL) out of stock",
    meta: "Sylhet City Center · 31m ago",
    tone: "danger",
  },
];

export const STORES = [
  "All Stores",
  "Dhanmondi Flagship",
  "Gulshan 2 Store",
  "Chittagong EPZ",
  "Uttara Branch",
  "Sylhet City Center",
  "Khulna Outlet",
];

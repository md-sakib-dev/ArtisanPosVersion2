import { useState, useEffect, useRef } from "react";
import {
  User,
  Building2,
  Monitor,
  TrendingUp,
  TrendingDown,
  ShoppingCart,
  Package,
  Warehouse,
  BarChart3,
  Receipt,
  FileText,
  Clock,
  CalendarDays,
  Activity,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/* Live clock                                                           */
/* ------------------------------------------------------------------ */

function LiveClock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(t);
  }, []);
  const time = new Intl.DateTimeFormat("en-GB", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(now);
  const date = new Intl.DateTimeFormat("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(now);
  return (
    <span className="tabular-nums">
      {date} · {time}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* Sample data                                                          */
/* ------------------------------------------------------------------ */

const TODAY_SALE = 842390;
const YESTERDAY_SALE = 712400;
const TODAY_DELTA = ((TODAY_SALE - YESTERDAY_SALE) / YESTERDAY_SALE) * 100;

const WEEK_SALE = 2847392;
const PREV_WEEK_SALE = 2533120;
const WEEK_DELTA = ((WEEK_SALE - PREV_WEEK_SALE) / PREV_WEEK_SALE) * 100;

const MONTH_SALE = 10254730;
const PREV_MONTH_SALE = 9341200;
const MONTH_DELTA = ((MONTH_SALE - PREV_MONTH_SALE) / PREV_MONTH_SALE) * 100;

const TOTAL_STOCK_VALUE = 1248500;
const TOTAL_ITEMS = 8492;

const fmt = (n: number) =>
  `৳${new Intl.NumberFormat("en-IN").format(n)}`;

const fmtK = (n: number) =>
  `৳${new Intl.NumberFormat("en-IN", { notation: "compact", maximumFractionDigits: 1 }).format(n)}`;

/* Weekly sales for the bar chart */
const WEEKLY_SALES = [
  { day: "Mon", amount: 182000 },
  { day: "Tue", amount: 224000 },
  { day: "Wed", amount: 198000 },
  { day: "Thu", amount: 251000 },
  { day: "Fri", amount: 286000 },
  { day: "Sat", amount: 342000 },
  { day: "Sun", amount: 315000 },
];

const QUICK_ACTIONS = [
  { label: "New Sale", icon: ShoppingCart, path: "/saleentry", color: "bg-[#10673E] text-white", desc: "Open POS terminal" },
  { label: "Search Product", icon: BarChart3, path: "/products", color: "bg-[#2D5597] text-white", desc: "View daily reports" },
  { label: "Search Invoice", icon: Warehouse, path: "/stock", color: "bg-[#3AAFA9] text-white", desc: "Inventory status" },
  { label: "Search Customer", icon: Receipt, path: "/salesrefund", color: "bg-[#E2BA48] text-white", desc: "Process returns" },
  { label: "Get Product Info", icon: FileText, path: "/products", color: "bg-[#1E293B] text-white", desc: "Financial summary" },
  { label: "Stock In Report", icon: Package, path: "/productreceive", color: "bg-[#50B4D8] text-white", desc: "Receive stock" },
];

/* ------------------------------------------------------------------ */
/* SVG Bar chart                                                        */
/* ------------------------------------------------------------------ */

function WeeklySalesChart() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const padding = { top: 20, right: 16, bottom: 32, left: 56 };
  const chartW = Math.max(0, width - padding.left - padding.right);
  const chartH = 200;
  const maxVal = Math.max(...WEEKLY_SALES.map((d) => d.amount));
  const barGap = 12;
  const barW = chartW > 0 ? (chartW - barGap * (WEEKLY_SALES.length - 1)) / WEEKLY_SALES.length : 0;

  /* Y-axis ticks */
  const yTicks = 5;
  const yStep = maxVal / yTicks;

  return (
    <div ref={containerRef} className="w-full">
      <svg width={width} height={chartH + padding.top + padding.bottom} className="block">
        {/* Y grid lines + labels */}
        {Array.from({ length: yTicks + 1 }, (_, i) => {
          const val = yStep * i;
          const y = padding.top + chartH - (val / maxVal) * chartH;
          return (
            <g key={i}>
              <line
                x1={padding.left}
                y1={y}
                x2={padding.left + chartW}
                y2={y}
                stroke="#E5E7EB"
                strokeDasharray="3,3"
              />
              <text
                x={padding.left - 8}
                y={y + 4}
                textAnchor="end"
                className="fill-[#94A3B8]"
                fontSize={10}
              >
                {fmtK(val)}
              </text>
            </g>
          );
        })}

        {/* Bars */}
        {WEEKLY_SALES.map((d, i) => {
          const barH = (d.amount / maxVal) * chartH;
          const x = padding.left + i * (barW + barGap);
          const y = padding.top + chartH - barH;
          const isMax = d.amount === maxVal;
          return (
            <g key={d.day}>
              <rect
                x={x}
                y={y}
                width={barW}
                height={barH}
                rx={4}
                fill={isMax ? "#10673E" : "#D1FAE5"}
                className="transition-all duration-300"
              />
              {/* Value on top */}
              <text
                x={x + barW / 2}
                y={y - 6}
                textAnchor="middle"
                className="fill-[#374151]"
                fontSize={10}
                fontWeight={600}
              >
                {fmtK(d.amount)}
              </text>
              {/* Day label */}
              <text
                x={x + barW / 2}
                y={padding.top + chartH + 18}
                textAnchor="middle"
                className="fill-[#94A3B8]"
                fontSize={11}
                fontWeight={500}
              >
                {d.day}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Page                                                                 */
/* ------------------------------------------------------------------ */

export default function PosDashboard() {
  return (
    <div className="h-full overflow-y-auto bg-[#F5F7F3]">
      <div
        className="mx-auto max-w-[1440px] space-y-5 p-4 lg:p-6"
        style={{ animation: "fade-up 0.4s ease both" }}
      >
        {/* -------- Header -------- */}
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-[#1F2937] md:text-2xl">
              POS Dashboard
            </h1>
            <p className="mt-1 flex items-center gap-2 text-[12.5px] text-[#6B7280]">
              <Clock size={13} />
              <LiveClock />
              <span className="text-[#D1D5DB]">|</span>
              <span>Welcome back, <span className="font-medium text-[#374151]">Admin</span></span>
            </p>
          </div>
        </header>

        {/* -------- Info Cards (3-col) -------- */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {/* User Info */}
          <div className="rounded-xl border border-[#E5E7EB] bg-white p-4 shadow-xs transition-all duration-200 hover:-translate-y-px hover:shadow-sm">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#10673E]/10 text-[#10673E]">
                <User size={20} />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-[13px] font-semibold text-[#1F2937]">User Information</h3>
                <div className="mt-2 space-y-1.5">
                  <div className="flex items-center justify-between text-[12.5px]">
                    <span className="text-[#6B7280]">Name</span>
                    <span className="font-medium text-[#1F2937]">Admin User</span>
                  </div>
                  <div className="flex items-center justify-between text-[12.5px]">
                    <span className="text-[#6B7280]">Designation</span>
                    <span className="font-medium text-[#1F2937]">Manager</span>
                  </div>
                  <div className="flex items-center justify-between text-[12.5px]">
                    <span className="text-[#6B7280]">Contact</span>
                    <span className="font-medium text-[#1F2937]">+880 1712-345678</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Branch Info */}
          <div className="rounded-xl border border-[#E5E7EB] bg-white p-4 shadow-xs transition-all duration-200 hover:-translate-y-px hover:shadow-sm">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#2D5597]/10 text-[#2D5597]">
                <Building2 size={20} />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-[13px] font-semibold text-[#1F2937]">Branch Information</h3>
                <div className="mt-2 space-y-1.5">
                  <div className="flex items-center justify-between text-[12.5px]">
                    <span className="text-[#6B7280]">Outlet</span>
                    <span className="font-medium text-[#1F2937]">Dhanmondi Flagship</span>
                  </div>
                  <div className="flex items-center justify-between text-[12.5px]">
                    <span className="text-[#6B7280]">Address</span>
                    <span className="text-right font-medium text-[#1F2937]">Road 27, Dhanmondi, Dhaka</span>
                  </div>
                  <div className="flex items-center justify-between text-[12.5px]">
                    <span className="text-[#6B7280]">VAT Reg.</span>
                    <span className="font-medium text-[#1F2937]">123456789-0101</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Software Info */}
          <div className="rounded-xl border border-[#E5E7EB] bg-white p-4 shadow-xs transition-all duration-200 hover:-translate-y-px hover:shadow-sm">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#1E293B]/10 text-[#1E293B]">
                <Monitor size={20} />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-[13px] font-semibold text-[#1F2937]">Software Information</h3>
                <div className="mt-2 space-y-1.5">
                  <div className="flex items-center justify-between text-[12.5px]">
                    <span className="text-[#6B7280]">Software</span>
                    <span className="font-medium text-[#1F2937]">Point of Sales (POS)</span>
                  </div>
                  <div className="flex items-center justify-between text-[12.5px]">
                    <span className="text-[#6B7280]">Model</span>
                    <span className="font-medium text-[#1F2937]">Wstech POS</span>
                  </div>
                  <div className="flex items-center justify-between text-[12.5px]">
                    <span className="text-[#6B7280]">Version</span>
                    <span className="inline-flex items-center rounded-md bg-[#10673E]/10 px-2 py-0.5 text-[11px] font-semibold text-[#10673E]">
                      v1.1.1.9
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* -------- Sales KPIs (3-col) -------- */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <SalesCard
            label="Today's Sale"
            value={fmt(TODAY_SALE)}
            compare={`Yesterday: ${fmt(YESTERDAY_SALE)}`}
            delta={TODAY_DELTA}
            icon={CalendarDays}
            iconClass="bg-[#10673E]/10 text-[#10673E]"
          />
          <SalesCard
            label="This Week's Sale"
            value={fmt(WEEK_SALE)}
            compare={`Last Week: ${fmt(PREV_WEEK_SALE)}`}
            delta={WEEK_DELTA}
            icon={Activity}
            iconClass="bg-[#2D5597]/10 text-[#2D5597]"
          />
          <SalesCard
            label="This Month's Sale"
            value={fmt(MONTH_SALE)}
            compare={`Last Month: ${fmt(PREV_MONTH_SALE)}`}
            delta={MONTH_DELTA}
            icon={BarChart3}
            iconClass="bg-[#3AAFA9]/10 text-[#3AAFA9]"
          />
        </div>

        {/* -------- Sales Chart + Inventory -------- */}
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
          {/* Sales Trend Chart (bigger — 2 cols) */}
          <div className="rounded-xl border border-[#E5E7EB] bg-white p-5 shadow-xs xl:col-span-2">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-[14px] font-bold text-[#1F2937]">Weekly Sales Trend</h2>
                <p className="mt-0.5 text-[11.5px] text-[#94A3B8]">Revenue breakdown · this week</p>
              </div>
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#10673E]/10 text-[#10673E]">
                <BarChart3 size={18} />
              </div>
            </div>
            <div className="mt-4">
              <WeeklySalesChart />
            </div>
          </div>

          {/* Inventory Valuation (smaller — 1 col, no low stock) */}
          <div className="rounded-xl border border-[#E5E7EB] bg-white p-5 shadow-xs">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-[14px] font-bold text-[#1F2937]">Inventory</h2>
                <p className="mt-0.5 text-[11.5px] text-[#94A3B8]">Stock overview</p>
              </div>
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#E2BA48]/15 text-[#C9A02E]">
                <Warehouse size={18} />
              </div>
            </div>

            <div className="mt-5 space-y-3">
              <div className="rounded-lg bg-[#F8FAFC] px-3 py-3">
                <p className="text-[11px] text-[#94A3B8]">Total Value</p>
                <p className="mt-0.5 text-[18px] font-bold text-[#1F2937] tabular-nums">{fmtK(TOTAL_STOCK_VALUE)}</p>
              </div>
              <div className="rounded-lg bg-[#F8FAFC] px-3 py-3">
                <p className="text-[11px] text-[#94A3B8]">Total Items in Stock</p>
                <p className="mt-0.5 text-[18px] font-bold text-[#1F2937] tabular-nums">{new Intl.NumberFormat("en-IN").format(TOTAL_ITEMS)}</p>
              </div>
            </div>

            {/* Stock bar */}
            {/* <div className="mt-4">
              <div className="flex items-center justify-between text-[11.5px]">
                <span className="text-[#6B7280]">Stock Health</span>
                <span className="font-medium text-[#10673E]">82% healthy</span>
              </div>
              <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-[#E5E7EB]">
                <div className="h-full rounded-full bg-[#10673E]" style={{ width: "82%" }} />
              </div>
              <div className="mt-1.5 flex items-center gap-4 text-[10.5px] text-[#94A3B8]">
                <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-[#10673E]" /> In Stock</span>
                <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-[#E2BA48]" /> Low</span>
                <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-red-500" /> Out</span>
              </div>
            </div> */}
          </div>
        </div>

        {/* -------- Quick Actions (full width) -------- */}
        <div className="rounded-xl border border-[#E5E7EB] bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-[14px] font-bold text-[#1F2937]">Quick Actions</h2>
              <p className="mt-0.5 text-[11.5px] text-[#94A3B8]">Navigate to key modules</p>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {QUICK_ACTIONS.map((a) => (
              <a
                key={a.label}
                href={a.path}
                className={`group flex flex-col items-center gap-2.5 rounded-xl p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${a.color}`}
              >
                <a.icon size={22} />
                <div className="text-center">
                  <p className="text-[12px] font-semibold leading-tight">{a.label}</p>
                  <p className="mt-0.5 text-[10px] opacity-75">{a.desc}</p>
                </div>
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Sales comparison card                                                */
/* ------------------------------------------------------------------ */

function SalesCard({
  label,
  value,
  compare,
  delta,
  icon: Icon,
  iconClass,
}: {
  label: string;
  value: string;
  compare: string;
  delta: number;
  icon: typeof TrendingUp;
  iconClass: string;
}) {
  const positive = delta >= 0;
  return (
    <div className="rounded-xl border border-[#E5E7EB] bg-white p-4 shadow-xs transition-all duration-200 hover:-translate-y-px hover:shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${iconClass}`}>
            <Icon size={18} />
          </div>
          <span className="text-[13px] font-medium text-[#6B7280]">{label}</span>
        </div>
        <span
          className={`inline-flex shrink-0 items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-semibold tabular-nums ${
            positive ? "bg-[#E8F5ED] text-[#10673E]" : "bg-red-50 text-red-600"
          }`}
        >
          {positive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
          {Math.abs(delta).toFixed(1)}%
        </span>
      </div>
      <div className="mt-3">
        <p className="text-[22px] font-bold leading-7 tracking-tight text-[#1F2937] tabular-nums">{value}</p>
        <p className="mt-1 text-[11.5px] text-[#94A3B8]">{compare}</p>
      </div>
    </div>
  );
}

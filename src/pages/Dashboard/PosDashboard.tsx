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
  AlertTriangle,
} from "lucide-react";
import {
  getDashboard,
  type DashboardData,
  type WeeklySalesTrendDto,
} from "../../api/dashboardApi";
import { classifyApiError } from "../../api/apiError";

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
/* Formatting helpers                                                   */
/* ------------------------------------------------------------------ */

const fmt = (n: number) =>
  `৳${new Intl.NumberFormat("en-IN").format(n)}`;

const fmtK = (n: number) =>
  `৳${new Intl.NumberFormat("en-IN", { notation: "compact", maximumFractionDigits: 1 }).format(n)}`;

/* Quantities are doubles (11078.00) — up to two decimals, thousands grouped. */
const fmtQty = (n: number) =>
  new Intl.NumberFormat("en-IN", { maximumFractionDigits: 2 }).format(n);

/* API text can carry embedded line breaks and padding — e.g. the branch
   address "204/B, - Road\n\r\nDhaka-1212 " — so collapse it to one line. */
const text = (value: string | null | undefined) =>
  (value ?? "").replace(/\s+/g, " ").trim();

/* Missing/blank values render as an em dash instead of an empty cell. */
const shown = (value: string | null | undefined) => {
  const cleaned = text(value);

  return cleaned === "" ? "—" : cleaned;
};

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

function WeeklySalesChart({ data }: { data: WeeklySalesTrendDto[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  if (data.length === 0) {
    return (
      <div ref={containerRef} className="flex h-[232px] items-center justify-center text-[12px] text-[#94A3B8]">
        No sales in this period
      </div>
    );
  }

  const padding = { top: 20, right: 16, bottom: 32, left: 56 };
  const chartW = Math.max(0, width - padding.left - padding.right);
  const chartH = 200;
  /* Falls back to 1 so an all-zero week cannot divide by zero. */
  const maxVal = Math.max(...data.map((d) => d.amount), 1);
  const barGap = 12;
  const barW = chartW > 0 ? (chartW - barGap * (data.length - 1)) / data.length : 0;

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
        {data.map((d, i) => {
          const barH = (d.amount / maxVal) * chartH;
          const x = padding.left + i * (barW + barGap);
          const y = padding.top + chartH - barH;
          const isMax = d.amount === maxVal;
          return (
            <g key={d.date ?? d.label ?? i}>
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
                {d.label ?? d.date ?? ""}
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
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  /* Bumped by Retry to re-run the load effect. */
  const [reloadKey, setReloadKey] = useState(0);

  /* GET /api/Dashboards fills the whole page: user + branch info, the
     today/week/month sales summaries, the weekly trend and inventory. */
  useEffect(() => {
    let cancelled = false;

    getDashboard()
      .then((res) => {
        if (cancelled) return;

        if (res.success === false) {
          setError(res.message || "Unable to load the dashboard.");
          return;
        }

        setDashboard(res.data);
        setError(res.data ? null : "The dashboard returned no data.");
      })
      .catch((err) => {
        if (cancelled) return;

        console.error("Dashboard error:", err);
        setError(
          classifyApiError(err)?.message ?? "Unable to load the dashboard.",
        );
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  const user = dashboard?.userInfoDto ?? null;
  const branch = dashboard?.branchInfoDto ?? null;
  const inventory = dashboard?.inventorySummaryDto ?? null;
  const trend = dashboard?.weeklySalesTrend ?? [];

  /* Placeholder while the first load is in flight. */
  const pending = isLoading ? "…" : "—";

  const handleRetry = () => {
    setIsLoading(true);
    setError(null);
    setReloadKey((key) => key + 1);
  };

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
              <span>
                Welcome back,{" "}
                <span className="font-medium text-[#374151]">
                  {isLoading ? "…" : shown(user?.userName)}
                </span>
              </span>
            </p>
          </div>
        </header>

        {/* -------- Load error -------- */}
        {error && (
          <div className="flex items-center gap-2 rounded-xl border border-[#F3C2C2] bg-[#FCECEC] px-4 py-3 text-[12.5px] text-[#B84A4A]">
            <AlertTriangle size={15} className="shrink-0" />
            <span className="min-w-0 flex-1">{error}</span>
            <button
              type="button"
              onClick={handleRetry}
              className="shrink-0 rounded-md border border-[#E5B4B4] bg-white px-2.5 py-1 text-[11.5px] font-semibold transition hover:bg-[#FFF5F5]"
            >
              Retry
            </button>
          </div>
        )}

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
                    <span className="font-medium text-[#1F2937]">
                      {isLoading ? "…" : shown(user?.userName)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[12.5px]">
                    <span className="text-[#6B7280]">Designation</span>
                    <span className="font-medium text-[#1F2937]">
                      {isLoading ? "…" : shown(user?.designation)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[12.5px]">
                    <span className="text-[#6B7280]">Contact</span>
                    <span className="font-medium text-[#1F2937]">
                      {isLoading ? "…" : shown(user?.contact)}
                    </span>
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
                    <span className="font-medium text-[#1F2937]">
                      {isLoading ? "…" : shown(branch?.branchName)}
                    </span>
                  </div>
                  <div className="flex items-start justify-between gap-3 text-[12.5px]">
                    <span className="shrink-0 text-[#6B7280]">Address</span>
                    <span className="text-right font-medium text-[#1F2937]">
                      {isLoading ? "…" : shown(branch?.address)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[12.5px]">
                    <span className="text-[#6B7280]">VAT Reg.</span>
                    <span className="font-medium text-[#1F2937]">
                      {isLoading ? "…" : shown(branch?.vatReg)}
                    </span>
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
            value={dashboard?.todaySales ? fmt(dashboard.todaySales.amount) : pending}
            compare={
              dashboard?.todaySales
                ? `Yesterday: ${fmt(dashboard.todaySales.previousAmount)}`
                : "Yesterday: —"
            }
            delta={dashboard?.todaySales?.percentageChange ?? null}
            icon={CalendarDays}
            iconClass="bg-[#10673E]/10 text-[#10673E]"
          />
          <SalesCard
            label="This Week's Sale"
            value={dashboard?.weekSales ? fmt(dashboard.weekSales.amount) : pending}
            compare={
              dashboard?.weekSales
                ? `Last Week: ${fmt(dashboard.weekSales.previousAmount)}`
                : "Last Week: —"
            }
            delta={dashboard?.weekSales?.percentageChange ?? null}
            icon={Activity}
            iconClass="bg-[#2D5597]/10 text-[#2D5597]"
          />
          <SalesCard
            label="This Month's Sale"
            value={dashboard?.monthSales ? fmt(dashboard.monthSales.amount) : pending}
            compare={
              dashboard?.monthSales
                ? `Last Month: ${fmt(dashboard.monthSales.previousAmount)}`
                : "Last Month: —"
            }
            delta={dashboard?.monthSales?.percentageChange ?? null}
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
              {isLoading ? (
                <div className="flex h-[232px] items-center justify-center text-[12px] text-[#94A3B8]">
                  Loading sales trend…
                </div>
              ) : (
                <WeeklySalesChart data={trend} />
              )}
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
                <p className="mt-0.5 text-[18px] font-bold text-[#1F2937] tabular-nums">
                  {isLoading ? "…" : fmt(inventory?.totalValue ?? 0)}
                </p>
              </div>
              <div className="rounded-lg bg-[#F8FAFC] px-3 py-3">
                <p className="text-[11px] text-[#94A3B8]">Total Items in Stock</p>
                <p className="mt-0.5 text-[18px] font-bold text-[#1F2937] tabular-nums">
                  {isLoading ? "…" : fmtQty(inventory?.totalQuantity ?? 0)}
                </p>
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
  /** Backend percentageChange; null while the dashboard has no figure. */
  delta: number | null;
  icon: typeof TrendingUp;
  iconClass: string;
}) {
  const positive = (delta ?? 0) >= 0;
  return (
    <div className="rounded-xl border border-[#E5E7EB] bg-white p-4 shadow-xs transition-all duration-200 hover:-translate-y-px hover:shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${iconClass}`}>
            <Icon size={18} />
          </div>
          <span className="text-[13px] font-medium text-[#6B7280]">{label}</span>
        </div>
        {delta !== null && (
          <span
            className={`inline-flex shrink-0 items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-semibold tabular-nums ${
              positive ? "bg-[#E8F5ED] text-[#10673E]" : "bg-red-50 text-red-600"
            }`}
          >
            {positive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            {Math.abs(delta).toFixed(1)}%
          </span>
        )}
      </div>
      <div className="mt-3">
        <p className="text-[22px] font-bold leading-7 tracking-tight text-[#1F2937] tabular-nums">{value}</p>
        <p className="mt-1 text-[11.5px] text-[#94A3B8]">{compare}</p>
      </div>
    </div>
  );
}

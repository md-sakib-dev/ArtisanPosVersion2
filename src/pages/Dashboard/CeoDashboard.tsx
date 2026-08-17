import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
  ArrowRight,
  CalendarRange,
  CheckCircle2,
  ChevronDown,
  CircleDollarSign,
  Crown,
  Flame,
  MapPin,
  ShoppingCart,
  Store,
  TrendingDown,
  TrendingUp,
  TriangleAlert,
  Warehouse,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import {
  DonutChart,
  GroupedBarChart,
  RadialGauge,
  Sparkline,
  TrendChart,
} from "./ceo/charts";
import {
  CATEGORIES,
  CATEGORY_TOTAL,
  KPIS,
  MONTHLY_COMPARISON,
  MONTHLY_TARGET,
  OUTLETS,
  PAYMENTS,
  PERIOD_OPTIONS,
  SERIES,
  TOP_OUTLETS_MONTHLY,
  TOP_PRODUCTS,
  fmtBDT,
  fmtBDTShort,
  fmtCompact,
  fmtNum,
} from "./ceo/data";
import type {
  OutletMonthly,
  OutletRow,
  OutletStatus,
  PeriodFilter,
  ProductSort,
  RevenueMetric,
  TopProduct,
} from "./ceo/types";

/* ------------------------------------------------------------------ */
/* Small building blocks                                                */
/* ------------------------------------------------------------------ */

function LiveClock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(t);
  }, []);
  const date = new Intl.DateTimeFormat("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(now);
  const time = new Intl.DateTimeFormat("en-GB", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(now);
  return (
    <span className="tabular-nums">
      {date} · {time}
    </span>
  );
}

function SectionCard({
  title,
  subtitle,
  action,
  children,
  className = "",
}: {
  title: string;
  subtitle?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`flex flex-col rounded-md border border-line bg-white shadow-xs ${className}`}
    >
      <header className="flex items-start justify-between gap-3 border-b border-line/70 px-4 py-3">
        <div className="min-w-0">
          <h2 className="truncate text-[14px] font-bold tracking-tight text-ink">{title}</h2>
          {subtitle && <div className="mt-0.5 text-[11.5px] text-faint">{subtitle}</div>}
        </div>
        {action}
      </header>
      <div className="flex-1 p-4">{children}</div>
    </section>
  );
}

const DELTA_TONES = {
  mint: "bg-mint/10 text-mint-deep",
  gold: "bg-gold/15 text-gold-deep",
  danger: "bg-danger/10 text-danger",
} as const;

function KpiCard({
  icon: Icon,
  iconClass,
  label,
  value,
  footer,
  delta,
  deltaTone = "mint",
  spark,
  sparkColor,
}: {
  icon: LucideIcon;
  iconClass: string;
  label: string;
  value: string;
  footer?: ReactNode;
  delta?: number;
  deltaTone?: keyof typeof DELTA_TONES;
  spark: number[];
  sparkColor: string;
}) {
  const ArrowIcon = delta !== undefined && delta < 0 ? TrendingDown : TrendingUp;
  return (
    <article className="rounded-md border border-line bg-white p-4 shadow-xs transition-all duration-200 hover:-translate-y-px hover:shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <span
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-md ${iconClass}`}
          >
            <Icon size={17} />
          </span>
          <span className="truncate text-[13px] font-medium text-soft">{label}</span>
        </div>
        {delta !== undefined && (
          <span
            className={`inline-flex shrink-0 items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-semibold tabular-nums ${DELTA_TONES[deltaTone]}`}
          >
            <ArrowIcon size={12} />
            {Math.abs(delta).toFixed(1)}%
          </span>
        )}
      </div>

      <div className="mt-3 flex items-end justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-[22px] font-bold leading-7 tracking-tight text-ink tabular-nums">
            {value}
          </p>
          {footer}
        </div>
        <Sparkline data={spark} color={sparkColor} />
      </div>
    </article>
  );
}

/* ------------------------------------------------------------------ */
/* Top selling products                                                 */
/* ------------------------------------------------------------------ */

function TopProducts({
  products,
  sortBy,
  onChange,
}: {
  products: TopProduct[];
  sortBy: ProductSort;
  onChange: (v: ProductSort) => void;
}) {
  const sorted = useMemo(
    () =>
      [...products].sort((a, b) =>
        sortBy === "revenue" ? b.revenue - a.revenue : b.unitsSold - a.unitsSold,
      ),
    [products, sortBy],
  );
  const maxRev = Math.max(...products.map((p) => p.revenue));

  return (
    <SectionCard
      title="Top Selling Products"
      subtitle="This month · all outlets"
      action={
        <div className="relative">
          <select
            value={sortBy}
            onChange={(e) => onChange(e.target.value as ProductSort)}
            className="h-8 cursor-pointer appearance-none rounded-md border border-line bg-white pl-2.5 pr-7 text-[12px] font-medium text-soft outline-none transition-colors focus:border-cyan"
          >
            <option value="revenue">By Revenue</option>
            <option value="volume">By Volume</option>
          </select>
          <ChevronDown
            size={13}
            className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-faint"
          />
        </div>
      }
    >
      <ol className="divide-y divide-line/70">
        {sorted.map((p, i) => (
          <li key={p.id} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
            <span className="w-4 shrink-0 text-center text-[12px] font-bold text-faint tabular-nums">
              {i + 1}
            </span>
            <span
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-[13px] font-bold text-white"
              style={{ background: p.color }}
            >
              {p.glyph}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline justify-between gap-2">
                <p className="truncate text-[13px] font-semibold text-ink">{p.name}</p>
                <p className="shrink-0 text-[11px] text-faint tabular-nums">
                  {fmtNum(p.unitsSold)} units
                </p>
              </div>
              <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-line/70">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${Math.max(6, (p.revenue / maxRev) * 100)}%`, background: p.color }}
                />
              </div>
              <p className="mt-0.5 text-[10.5px] text-faint">
                {p.sku} · {p.category}
              </p>
            </div>
            <div className="shrink-0 text-right">
              <p className="text-[13px] font-bold text-ink tabular-nums">{fmtBDT(p.revenue)}</p>
              <p
                className={`text-[11px] font-medium tabular-nums ${p.trend >= 0 ? "text-mint-deep" : "text-danger"}`}
              >
                {p.trend >= 0 ? "+" : ""}
                {p.trend.toFixed(1)}%
              </p>
            </div>
          </li>
        ))}
      </ol>
    </SectionCard>
  );
}

/* ------------------------------------------------------------------ */
/* Outlet performance (weekly)                                          */
/* ------------------------------------------------------------------ */

const OUTLET_STATUS: Record<OutletStatus, { label: string; cls: string; bar: string; Icon: LucideIcon }> = {
  top: { label: "Top Seller", cls: "bg-mint/10 text-mint-deep", bar: "bg-mint", Icon: Flame },
  solid: { label: "Solid", cls: "bg-cyan/10 text-cyan-deep", bar: "bg-cyan", Icon: CheckCircle2 },
  attention: {
    label: "Needs Attention",
    cls: "bg-danger/10 text-danger",
    bar: "bg-danger",
    Icon: TriangleAlert,
  },
};

function OutletPerformance({ outlets }: { outlets: OutletRow[] }) {
  const maxRev = Math.max(...outlets.map((o) => o.revenue));
  return (
    <SectionCard
      title="Outlet Performance"
      subtitle="Weekly revenue comparison · last 7 days"
      action={
        <button className="flex items-center gap-1 text-[12px] font-semibold text-brand transition-colors hover:text-brand-deep">
          View all outlets <ArrowRight size={13} />
        </button>
      }
    >
      <ul className="divide-y divide-line/60">
        {outlets.map((o) => {
          const s = OUTLET_STATUS[o.status];
          return (
            <li
              key={o.id}
              className="grid grid-cols-[minmax(0,1.4fr)_auto] items-center gap-x-3 gap-y-1.5 py-2.5 first:pt-0 last:pb-0 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_auto_auto]"
            >
              <div className="flex min-w-0 items-center gap-2.5">
                <span
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md ${s.cls}`}
                >
                  <Store size={14} />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-[13px] font-semibold text-ink">{o.name}</p>
                  <p className="flex items-center gap-1 text-[11px] text-faint">
                    <MapPin size={10} /> {o.location}
                  </p>
                </div>
              </div>

              <div className="hidden items-center gap-2 md:flex">
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-line/70">
                  <div
                    className={`h-full rounded-full ${s.bar}`}
                    style={{ width: `${Math.max(8, (o.revenue / maxRev) * 100)}%` }}
                  />
                </div>
              </div>

              <div className="text-right">
                <p className="text-[13px] font-bold text-ink tabular-nums">{fmtBDT(o.revenue)}</p>
                <p className="text-[11px] text-faint tabular-nums">{fmtNum(o.orders)} orders</p>
              </div>

              <span
                className={`inline-flex items-center gap-1 whitespace-nowrap rounded-md px-1.5 py-0.5 text-[10.5px] font-semibold ${s.cls}`}
              >
                <s.Icon size={11} />
                {s.label}
              </span>
            </li>
          );
        })}
      </ul>
    </SectionCard>
  );
}

/* ------------------------------------------------------------------ */
/* Monthly best-selling outlets                                         */
/* ------------------------------------------------------------------ */

function MonthlyTopOutlets({ outlets }: { outlets: OutletMonthly[] }) {
  const maxRev = Math.max(...outlets.map((o) => o.revenue));
  return (
    <SectionCard
      title="Monthly Best-Selling Outlets"
      subtitle="Revenue ranking · this month"
      action={
        <button className="flex items-center gap-1 text-[12px] font-semibold text-brand transition-colors hover:text-brand-deep">
          View all <ArrowRight size={13} />
        </button>
      }
    >
      <ol className="divide-y divide-line/60">
        {outlets.map((o, i) => (
          <li key={o.id} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
            <span
              className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-[11px] font-bold tabular-nums ${
                i === 0 ? "bg-gold/15 text-gold-deep" : "bg-canvas text-soft"
              }`}
            >
              {i === 0 ? <Crown size={13} /> : i + 1}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline justify-between gap-2">
                <p className="truncate text-[13px] font-semibold text-ink">{o.name}</p>
                <p className="shrink-0 text-[13px] font-bold text-ink tabular-nums">
                  {fmtBDT(o.revenue)}
                </p>
              </div>
              <div className="mt-0.5 flex items-center justify-between gap-2 text-[11px] text-faint">
                <span className="flex min-w-0 items-center gap-1">
                  <MapPin size={10} className="shrink-0" />
                  <span className="truncate">
                    {o.location} · {fmtNum(o.orders)} orders
                  </span>
                </span>
                <span
                  className={`flex shrink-0 items-center gap-0.5 font-semibold tabular-nums ${
                    o.growth >= 0 ? "text-mint-deep" : "text-danger"
                  }`}
                >
                  {o.growth >= 0 ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                  {o.growth >= 0 ? "+" : ""}
                  {o.growth.toFixed(1)}%
                </span>
              </div>
              <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-line/70">
                <div
                  className="h-full rounded-full bg-brand"
                  style={{ width: `${Math.max(6, (o.revenue / maxRev) * 100)}%` }}
                />
              </div>
            </div>
          </li>
        ))}
      </ol>
    </SectionCard>
  );
}

/* ------------------------------------------------------------------ */
/* Monthly comparison + category donut                                  */
/* ------------------------------------------------------------------ */

function MonthlyComparison() {
  const yoy = useMemo(() => {
    const cur = MONTHLY_COMPARISON.reduce((s, d) => s + d.current, 0);
    const prev = MONTHLY_COMPARISON.reduce((s, d) => s + d.previous, 0);
    return ((cur - prev) / prev) * 100;
  }, []);
  return (
    <SectionCard
      title="Monthly Revenue vs Last Year"
      subtitle="Last 6 months · all outlets"
      className="xl:col-span-2"
      action={
        <div className="flex items-center gap-3 text-[11.5px] text-soft">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-[2px] bg-mint" /> 2026
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-[2px] bg-[#CBD5E1]" /> 2025
          </span>
        </div>
      }
    >
      <GroupedBarChart data={MONTHLY_COMPARISON} />

      <div className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-line/70 pt-3 text-[12px]">
        <span className="text-soft">
          Total 2026
          <b className="ml-1 text-ink tabular-nums">
            {fmtBDTShort(MONTHLY_COMPARISON.reduce((s, d) => s + d.current, 0))}
          </b>
        </span>
        <span className="text-soft">
          Total 2025
          <b className="ml-1 text-ink tabular-nums">
            {fmtBDTShort(MONTHLY_COMPARISON.reduce((s, d) => s + d.previous, 0))}
          </b>
        </span>
        <span className="ml-auto inline-flex items-center gap-1 rounded-md bg-mint/10 px-2 py-1 font-semibold text-mint-deep tabular-nums">
          <TrendingUp size={12} />+{yoy.toFixed(1)}% year on year
        </span>
      </div>
    </SectionCard>
  );
}

function CategoryDistribution() {
  return (
    <SectionCard title="Sales by Category" subtitle="Share of revenue · this month">
      <div className="flex flex-col items-center gap-5 sm:flex-row sm:gap-6">
        <div className="relative shrink-0">
          <DonutChart slices={CATEGORIES} />
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <p className="text-[15px] font-bold text-ink tabular-nums">
              ৳{(CATEGORY_TOTAL / 10_000_000).toFixed(1)}Cr
            </p>
            <p className="text-[10px] text-faint">total revenue</p>
          </div>
        </div>

        <ul className="w-full flex-1 space-y-2.5">
          {CATEGORIES.map((c) => (
            <li key={c.label} className="flex items-center justify-between gap-2">
              <span className="flex min-w-0 items-center gap-2 text-[12.5px] text-soft">
                <span className="h-2.5 w-2.5 shrink-0 rounded-[3px]" style={{ background: c.color }} />
                <span className="truncate">{c.label}</span>
              </span>
              <span className="shrink-0 text-right">
                <span className="font-semibold text-ink tabular-nums">{c.value}%</span>
                <span className="ml-2 text-[11px] text-faint tabular-nums">{fmtBDTShort(c.amount)}</span>
              </span>
            </li>
          ))}
        </ul>
      </div>
    </SectionCard>
  );
}

/* ------------------------------------------------------------------ */
/* Target progress                                                      */
/* ------------------------------------------------------------------ */

function TargetProgress() {
  const pct = Math.round((MONTHLY_TARGET.achieved / MONTHLY_TARGET.target) * 100);
  return (
    <SectionCard title="Monthly Target" subtitle="August 2026">
      <div className="flex flex-col items-center">
        <div className="relative">
          <RadialGauge value={MONTHLY_TARGET.achieved} max={MONTHLY_TARGET.target} />
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <p className="text-xl font-bold text-ink tabular-nums">{pct}%</p>
            <p className="text-[10px] text-faint">of target</p>
          </div>
        </div>
        <div className="mt-3 grid w-full grid-cols-2 gap-2 text-center">
          <div className="rounded-md bg-canvas px-2 py-1.5">
            <p className="text-[10px] text-faint">Achieved</p>
            <p className="text-[12.5px] font-bold text-ink tabular-nums">
              {fmtBDTShort(MONTHLY_TARGET.achieved)}
            </p>
          </div>
          <div className="rounded-md bg-canvas px-2 py-1.5">
            <p className="text-[10px] text-faint">Target</p>
            <p className="text-[12.5px] font-bold text-ink tabular-nums">
              {fmtBDTShort(MONTHLY_TARGET.target)}
            </p>
          </div>
        </div>
        <p className="mt-2.5 text-center text-[11px] leading-snug text-faint">
          On pace to beat the target by ~8% at the current run-rate.
        </p>
      </div>
    </SectionCard>
  );
}

/* ------------------------------------------------------------------ */
/* Payment methods                                                      */
/* ------------------------------------------------------------------ */

function PaymentMethods() {
  const collected = PAYMENTS.reduce((s, p) => s + p.amount, 0);
  return (
    <SectionCard title="Payment Methods" subtitle="Share of collections · this month">
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <DonutChart slices={PAYMENTS} size={132} thickness={16} />
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <p className="text-[12px] font-bold text-ink tabular-nums">
              ৳{(collected / 10_000_000).toFixed(1)}Cr
            </p>
            <p className="text-[9px] text-faint">collected</p>
          </div>
        </div>
        <ul className="w-full space-y-2">
          {PAYMENTS.map((p) => (
            <li key={p.label} className="flex items-center justify-between gap-2 text-[12px]">
              <span className="flex items-center gap-2 text-soft">
                <span className="h-2.5 w-2.5 rounded-[3px]" style={{ background: p.color }} />
                {p.label}
              </span>
              <span className="font-semibold text-ink tabular-nums">{p.value}%</span>
            </li>
          ))}
        </ul>
      </div>
    </SectionCard>
  );
}

/* ------------------------------------------------------------------ */
/* Page                                                                 */
/* ------------------------------------------------------------------ */

export default function CeoDashboard() {
  const [period] = useState<PeriodFilter>("week");
  const [metric, setMetric] = useState<RevenueMetric>("revenue");
  const [sortBy, setSortBy] = useState<ProductSort>("revenue");
  const [store] = useState("All Stores");
  const [rangeStart, setRangeStart] = useState("2026-08-03");
  const [rangeEnd, setRangeEnd] = useState("2026-08-16");
  const [customRange, setCustomRange] = useState("3 Aug – 16 Aug");

  const kpi = KPIS[period];
  const series = SERIES[period];
  const chartColor = metric === "revenue" ? "#3AAFA9" : "#50B4D8";

  const periodLabel =
    period === "custom"
      ? customRange
      : (PERIOD_OPTIONS.find((p) => p.key === period)?.label ?? "this week").toLowerCase();

  const chartStats = useMemo(() => {
    const vals = series.map((d) => (metric === "revenue" ? d.revenue : d.units));
    const total = vals.reduce((s, v) => s + v, 0);
    const peak = Math.max(...vals);
    const peakLabel = series[vals.indexOf(peak)].label;
    return { total, peak, peakLabel, avg: total / vals.length };
  }, [series, metric]);

  const applyCustom = () => {
    const fmt = (iso: string) =>
      new Date(`${iso}T00:00:00`).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
    setCustomRange(`${fmt(rangeStart)} – ${fmt(rangeEnd)}`);
  };

  const storeContext = store === "All Stores" ? "across all 52 outlets" : `at ${store}`;
  const growth = metric === "revenue" ? kpi.revenue.delta : kpi.orders.delta;

  return (
    <div className="h-full overflow-y-auto bg-canvas">
      <div
        className="mx-auto max-w-[1440px] space-y-4 p-4 lg:p-6"
        style={{ animation: "fade-up 0.4s ease both" }}
      >
        {/* ---------- Executive header ---------- */}
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
           
            <h1 className="mt-1 text-xl font-bold tracking-tight text-ink md:text-2xl">
              Dashboard
            </h1>
            <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[12.5px] text-faint">
              <LiveClock />
              <span className="hidden text-line sm:inline">|</span>
              <span>Welcome back — here's your business {storeContext}.</span>
            </p>
          </div>

          
        </header>

        {/* ---------- Filter pills ---------- */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* <div className="inline-flex items-center gap-0.5 rounded-md border border-line bg-white p-1 shadow-xs">
            {PERIOD_OPTIONS.map((p) => (
              <button
                key={p.key}
                onClick={() => setPeriod(p.key)}
                className={`rounded px-3 py-1.5 text-[13px] font-medium transition-colors ${
                  period === p.key
                    ? "bg-navy text-white shadow-xs"
                    : "text-soft hover:bg-canvas hover:text-ink"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div> */}

         
        </div>

        {period === "custom" && (
          <div className="flex flex-wrap items-center gap-2 rounded-md border border-dashed border-line bg-white/70 px-3 py-2 text-[13px]">
            <CalendarRange size={14} className="text-soft" />
            <span className="text-soft">From</span>
            <input
              type="date"
              value={rangeStart}
              onChange={(e) => setRangeStart(e.target.value)}
              className="h-8 rounded-md border border-line bg-white px-2 text-[13px] text-ink outline-none focus:border-cyan"
            />
            <span className="text-soft">to</span>
            <input
              type="date"
              value={rangeEnd}
              onChange={(e) => setRangeEnd(e.target.value)}
              className="h-8 rounded-md border border-line bg-white px-2 text-[13px] text-ink outline-none focus:border-cyan"
            />
            <button
              onClick={applyCustom}
              className="h-8 rounded-md bg-brand px-3 text-[13px] font-medium text-white transition-colors hover:bg-brand-deep"
            >
              Apply
            </button>
          </div>
        )}

        {/* ---------- KPI summary grid ---------- */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <KpiCard
            icon={CircleDollarSign}
            iconClass="bg-brand/10 text-brand"
            label="Total Sales Revenue"
            value={fmtBDT(kpi.revenue.value)}
            footer={<p className="mt-1 text-[11.5px] text-faint">{kpi.revenue.compare}</p>}
            delta={kpi.revenue.delta}
            deltaTone="mint"
            spark={kpi.revenue.spark}
            sparkColor="#3AAFA9"
          />
          <KpiCard
            icon={ShoppingCart}
            iconClass="bg-cyan/10 text-cyan-deep"
            label="Total Orders & Items"
            value={fmtNum(kpi.orders.value)}
            footer={
              <>
                <p className="mt-1 text-[11.5px] text-soft">{fmtNum(kpi.orders.items)} items sold</p>
                <p className="text-[11px] text-faint">{kpi.orders.compare}</p>
              </>
            }
            delta={kpi.orders.delta}
            deltaTone="mint"
            spark={kpi.orders.spark}
            sparkColor="#50B4D8"
          />
          <KpiCard
            icon={Store}
            iconClass="bg-mint/10 text-mint-deep"
            label="Total Outlets Active"
            value={`${kpi.outlets.active} / ${kpi.outlets.total}`}
            footer={
              <>
                <div className="mt-1.5 flex items-center gap-2.5 text-[11px] font-medium">
                  <span className="flex items-center gap-1 text-mint-deep">
                    <span className="h-1.5 w-1.5 rounded-full bg-mint" />
                    {kpi.outlets.online} Active
                  </span>
                  {/* <span className="flex items-center gap-1 text-danger">
                    <span className="h-1.5 w-1.5 rounded-full bg-danger" />
                    {kpi.outlets.offline} offline
                  </span> */}
                </div>
                <p className="text-[11px] text-faint">
                  All over in Bangladesh
                  </p>
              </>
            }
            delta={kpi.outlets.delta}
            deltaTone="mint"
            spark={kpi.outlets.spark}
            sparkColor="#2D5597"
          />
          <KpiCard
            icon={Warehouse}
            iconClass="bg-gold/15 text-gold-deep"
            label="Stock / Inventory Value"
            value={fmtBDT(kpi.stock.value)}
            footer={
              <>
                <p className="mt-1 flex items-center gap-1.5 text-[11.5px] font-medium text-gold-deep">
                  <TriangleAlert size={12} />
                   All inventory stocks
                </p>
                <p className="text-[11px] text-faint">{kpi.stock.compare}</p>
              </>
            }
            delta={kpi.stock.delta}
            deltaTone="gold"
            spark={kpi.stock.spark}
            sparkColor="#E2BA48"
          />
        </div>

        {/* ---------- Analytics + top products ---------- */}
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
          <SectionCard
            className="xl:col-span-2"
            title="Sales & Revenue Analytics"
            subtitle={
              metric === "revenue"
                ? `Revenue over time · ${periodLabel}`
                : `Units sold over time · ${periodLabel}`
            }
            action={
              <div className="inline-flex rounded-md border border-line bg-canvas p-0.5">
                {(
                  [
                    { key: "revenue", label: "Revenue" },
                    { key: "units", label: "Units" },
                  ] as const
                ).map((m) => (
                  <button
                    key={m.key}
                    onClick={() => setMetric(m.key)}
                    className={`rounded px-2.5 py-1 text-[12px] font-medium transition-colors ${
                      metric === m.key
                        ? "bg-white text-ink shadow-xs"
                        : "text-soft hover:text-ink"
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            }
          >
            <TrendChart
              key={`${period}-${metric}`}
              id="sales-trend"
              data={series}
              metric={metric}
              color={chartColor}
            />

            <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-line/70 pt-3 text-[12px]">
              <span className="flex items-center gap-1.5 text-soft">
                <span className="h-2 w-2 rounded-full" style={{ background: chartColor }} />
                Total
                <b className="text-ink tabular-nums">
                  {metric === "revenue" ? fmtBDT(chartStats.total) : fmtNum(chartStats.total)}
                </b>
              </span>
              <span className="text-soft">
                Peak
                <b className="ml-1 text-ink tabular-nums">{fmtBDTShort(chartStats.peak)}</b>
                <span className="text-faint"> · {chartStats.peakLabel}</span>
              </span>
              <span className="text-soft">
                Avg / day
                <b className="ml-1 text-ink tabular-nums">
                  {metric === "revenue" ? fmtBDTShort(chartStats.avg) : fmtCompact(chartStats.avg)}
                </b>
              </span>
              <span className="ml-auto inline-flex items-center gap-1 rounded-md bg-mint/10 px-2 py-1 font-semibold text-mint-deep tabular-nums">
                <TrendingUp size={12} />
                {growth > 0 ? "+" : ""}
                {growth.toFixed(1)}% vs prev period
              </span>
            </div>
          </SectionCard>

          <TopProducts products={TOP_PRODUCTS} sortBy={sortBy} onChange={setSortBy} />
        </div>

        {/* ---------- Monthly comparison + categories ---------- */}
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
          <MonthlyComparison />
          <CategoryDistribution />
        </div>

        {/* ---------- Target + payments ---------- */}
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          <TargetProgress />
          <PaymentMethods />
        </div>

        {/* ---------- Outlet rankings ---------- */}
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          <OutletPerformance outlets={OUTLETS} />
          <MonthlyTopOutlets outlets={TOP_OUTLETS_MONTHLY} />
        </div>

        {/* ---------- Footer ---------- */}
        <footer className="flex flex-wrap items-center justify-between gap-2 px-1 pb-2 text-[11px] text-faint">
          {/* <p>All figures in BDT · Data refreshes automatically every 30 seconds</p>
          <p className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-mint" />
            Last synced 2 minutes ago
          </p> */}
        </footer>
      </div>
    </div>
  );
}

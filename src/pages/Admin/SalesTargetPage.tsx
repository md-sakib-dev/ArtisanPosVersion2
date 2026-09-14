import { useState, useMemo } from "react";
import {
  Target,
  Save,
  Check,
  X,
  ChevronDown,
  Search,
  //RotateCcw,
  CalendarDays,
  Calendar,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import {
  SALES_PERSONS,
  //type SalesPersonTarget,
} from "../Dashboard/ceo/salesTargetData";

/* ------------------------------------------------------------------ */
/* Types                                                                */
/* ------------------------------------------------------------------ */

type TargetMode = "daily" | "monthly";

interface DailyTarget {
  [personId: string]: Record<string, number>; // personId -> { "Mon": 5000, "Tue": 8000, ... }
}

interface MonthlyTarget {
  [personId: string]: number;
}

const DAYS_OF_WEEK = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const DAY_FULL: Record<string, string> = {
  Mon: "Monday",
  Tue: "Tuesday",
  Wed: "Wednesday",
  Thu: "Thursday",
  Fri: "Friday",
  Sat: "Saturday",
  Sun: "Sunday",
};

/* ------------------------------------------------------------------ */
/* Helpers                                                              */
/* ------------------------------------------------------------------ */

/** Get the week range label (e.g. "Aug 25 – Aug 31, 2026") */
function getWeekLabel(offset: number): string {
  const now = new Date();
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((now.getDay() + 6) % 7) + offset * 7);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  const fmt = (d: Date) =>
    d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
  const yearFmt = (d: Date) =>
    d.toLocaleDateString("en-GB", { year: "numeric" });

  return `${fmt(monday)} – ${fmt(sunday)}, ${yearFmt(sunday)}`;
}

/** Get current month label */
function getMonthLabel(): string {
  return new Date().toLocaleDateString("en-GB", {
    month: "long",
    year: "numeric",
  });
}

/* ------------------------------------------------------------------ */
/* Toast                                                                */
/* ------------------------------------------------------------------ */

function Toast({
  message,
  type,
  onClose,
}: {
  message: string;
  type: "success" | "error";
  onClose: () => void;
}) {
  useState(() => setTimeout(onClose, 3000));
  return (
    <div
      className={`fixed top-5 right-5 z-50 flex items-center gap-3 rounded-xl border px-4 py-3 shadow-lg transition-all duration-300 ${
        type === "success"
          ? "border-[#10673E]/20 bg-white text-[#10673E]"
          : "border-red-200 bg-white text-red-600"
      }`}
      style={{ animation: "fade-up 0.3s ease both" }}
    >
      {type === "success" ? <Check size={18} /> : <X size={18} />}
      <span className="text-sm font-medium">{message}</span>
      <button
        onClick={onClose}
        className="ml-2 text-[#94A3B8] hover:text-[#64748B]"
      >
        <X size={14} />
      </button>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Mode Toggle                                                          */
/* ------------------------------------------------------------------ */

function ModeToggle({
  mode,
  onChange,
}: {
  mode: TargetMode;
  onChange: (m: TargetMode) => void;
}) {
  return (
    <div className="inline-flex items-center gap-0.5 rounded-lg border border-[#E5E7EB] bg-white p-1 shadow-xs">
      <button
        onClick={() => onChange("daily")}
        className={`flex items-center gap-1.5 rounded-md px-4 py-2 text-[13px] font-medium transition-all ${
          mode === "daily"
            ? "bg-[#10673E] text-white shadow-sm"
            : "text-[#6B7280] hover:bg-[#F1F5F9] hover:text-[#374151]"
        }`}
      >
        <CalendarDays size={14} />
        Daily Target
      </button>
      <button
        onClick={() => onChange("monthly")}
        className={`flex items-center gap-1.5 rounded-md px-4 py-2 text-[13px] font-medium transition-all ${
          mode === "monthly"
            ? "bg-[#10673E] text-white shadow-sm"
            : "text-[#6B7280] hover:bg-[#F1F5F9] hover:text-[#374151]"
        }`}
      >
        <Calendar size={14} />
        Monthly Target
      </button>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Page                                                                 */
/* ------------------------------------------------------------------ */

export default function SalesTargetPage() {
  const [mode, setMode] = useState<TargetMode>("monthly");
  const [search, setSearch] = useState("");
  const [outletFilter, setOutletFilter] = useState("All Outlets");
  const [outletDropdownOpen, setOutletDropdownOpen] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);
  const [dirty, setDirty] = useState(false);

  // Daily targets state
  const [weekOffset, setWeekOffset] = useState(0);
  const [dailyTargets, setDailyTargets] = useState<DailyTarget>(() => {
    const init: DailyTarget = {};
    for (const sp of SALES_PERSONS) {
      const base = Math.round(sp.monthlyTarget / 30);
      init[sp.id] = {
        Mon: base,
        Tue: Math.round(base * 1.1),
        Wed: Math.round(base * 0.95),
        Thu: Math.round(base * 1.05),
        Fri: Math.round(base * 1.3),
        Sat: Math.round(base * 1.4),
        Sun: Math.round(base * 0.6),
      };
    }
    return init;
  });

  // Monthly targets state
  const [monthlyTargets, setMonthlyTargets] = useState<MonthlyTarget>(() =>
    Object.fromEntries(
      SALES_PERSONS.map((sp) => [sp.id, sp.monthlyTarget])
    )
  );

  const outlets = useMemo(
    () => [
      "All Outlets",
      ...Array.from(new Set(SALES_PERSONS.map((sp) => sp.outlet))).sort(),
    ],
    []
  );

  const filteredPersons = useMemo(() => {
    return SALES_PERSONS.filter((sp) => {
      const matchesSearch =
        sp.name.toLowerCase().includes(search.toLowerCase()) ||
        sp.outlet.toLowerCase().includes(search.toLowerCase());
      const matchesOutlet =
        outletFilter === "All Outlets" || sp.outlet === outletFilter;
      return matchesSearch && matchesOutlet;
    });
  }, [search, outletFilter]);

  /* ---- Daily handlers ---- */

  const handleDailyChange = (
    personId: string,
    day: string,
    value: string
  ) => {
    const num = parseInt(value.replace(/[^0-9]/g, ""), 10);
    if (isNaN(num)) return;
    setDailyTargets((prev) => ({
      ...prev,
      [personId]: { ...prev[personId], [day]: num },
    }));
    setDirty(true);
  };

  const dailyTotal = (personId: string) => {
    const dt = dailyTargets[personId];
    if (!dt) return 0;
    return DAYS_OF_WEEK.reduce((s, d) => s + (dt[d] ?? 0), 0);
  };

  const dailyDayTotal = (day: string) =>
    filteredPersons.reduce(
      (s, sp) => s + (dailyTargets[sp.id]?.[day] ?? 0),
      0
    );

  const grandDailyTotal = filteredPersons.reduce(
    (s, sp) => s + dailyTotal(sp.id),
    0
  );

  /* ---- Monthly handlers ---- */

  const handleMonthlyChange = (personId: string, value: string) => {
    const num = parseInt(value.replace(/[^0-9]/g, ""), 10);
    if (isNaN(num)) return;
    setMonthlyTargets((prev) => ({ ...prev, [personId]: num }));
    setDirty(true);
  };

  const monthlyGrandTarget = filteredPersons.reduce(
    (s, sp) => s + (monthlyTargets[sp.id] ?? sp.monthlyTarget),
    0
  );

  const monthlyGrandAchieved = filteredPersons.reduce(
    (s, sp) => s + sp.achieved,
    0
  );

  /* ---- Reset / Save ---- */

  // const handleReset = () => {
  //   if (mode === "daily") {
  //     const init: DailyTarget = {};
  //     for (const sp of SALES_PERSONS) {
  //       const base = Math.round(sp.monthlyTarget / 30);
  //       init[sp.id] = {
  //         Mon: base,
  //         Tue: Math.round(base * 1.1),
  //         Wed: Math.round(base * 0.95),
  //         Thu: Math.round(base * 1.05),
  //         Fri: Math.round(base * 1.3),
  //         Sat: Math.round(base * 1.4),
  //         Sun: Math.round(base * 0.6),
  //       };
  //     }
  //     setDailyTargets(init);
  //   } else {
  //     setMonthlyTargets(
  //       Object.fromEntries(
  //         SALES_PERSONS.map((sp) => [sp.id, sp.monthlyTarget])
  //       )
  //     );
  //   }
  //   setDirty(false);
  //   setToast({ message: "Targets reset to default", type: "success" });
  // };

  const handleSave = () => {
    setDirty(false);
    setToast({
      message: `${mode === "daily" ? "Daily" : "Monthly"} targets saved successfully!`,
      type: "success",
    });
  };

  const statusColor = (pct: number) =>
    pct >= 100
      ? "bg-[#10673E]/10 text-[#10673E]"
      : pct >= 80
        ? "bg-[#3AAFA9]/10 text-[#3AAFA9]"
        : pct >= 60
          ? "bg-[#E2BA48]/15 text-[#B8941E]"
          : "bg-[#E53E3E]/10 text-[#E53E3E]";

  const statusLabel = (pct: number) =>
    pct >= 100 ? "Exceeded" : pct >= 80 ? "On Track" : pct >= 60 ? "At Risk" : "Behind";

  return (
    <div className="h-full overflow-y-auto bg-[#F5F7F3]">
      <div
        className="mx-auto max-w-[1440px] space-y-5 p-4 lg:p-6"
        style={{ animation: "fade-up 0.4s ease both" }}
      >
        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        )}

        {/* Header */}
        <header>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#10673E]/10 text-[#10673E]">
              <Target size={20} />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-[#1F2937] md:text-2xl">
                Sales Target Management
              </h1>
              <p className="mt-0.5 text-[12.5px] text-[#6B7280]">
                Set daily or monthly sales targets for each sales person
              </p>
            </div>
            <span className="ml-auto rounded-lg bg-[#10673E]/10 px-3 py-1.5 text-[12px] font-semibold text-[#10673E]">
              {SALES_PERSONS.length} Sales Persons
            </span>
          </div>
        </header>

        {/* Mode Toggle + Summary */}
        <div className="flex flex-wrap items-center gap-4">
          <ModeToggle mode={mode} onChange={setMode} />

          {/* Summary cards inline */}
          <div className="flex flex-1 flex-wrap items-center gap-3 ml-auto">
            {mode === "monthly" ? (
              <>
                <div className="rounded-lg border border-[#E5E7EB] bg-white px-4 py-2.5 shadow-xs">
                  <p className="text-[11px] text-[#94A3B8]">Total Target</p>
                  <p className="text-[16px] font-bold text-[#1F2937]">
                    ৳{monthlyGrandTarget.toLocaleString("en-IN")}
                  </p>
                </div>
                <div className="rounded-lg border border-[#E5E7EB] bg-white px-4 py-2.5 shadow-xs">
                  <p className="text-[11px] text-[#94A3B8]">Achieved</p>
                  <p className="text-[16px] font-bold text-[#10673E]">
                    ৳{monthlyGrandAchieved.toLocaleString("en-IN")}
                  </p>
                </div>
                <div className="rounded-lg border border-[#E5E7EB] bg-white px-4 py-2.5 shadow-xs">
                  <p className="text-[11px] text-[#94A3B8]">Achievement</p>
                  <p className="text-[16px] font-bold text-[#1F2937]">
                    {monthlyGrandTarget > 0
                      ? Math.round(
                          (monthlyGrandAchieved / monthlyGrandTarget) * 100
                        )
                      : 0}
                    %
                  </p>
                </div>
              </>
            ) : (
              <>
                <div className="rounded-lg border border-[#E5E7EB] bg-white px-4 py-2.5 shadow-xs">
                  <p className="text-[11px] text-[#94A3B8]">
                    Weekly Target Total
                  </p>
                  <p className="text-[16px] font-bold text-[#1F2937]">
                    ৳{grandDailyTotal.toLocaleString("en-IN")}
                  </p>
                </div>
                <div className="rounded-lg border border-[#E5E7EB] bg-white px-4 py-2.5 shadow-xs">
                  <p className="text-[11px] text-[#94A3B8]">
                    Daily Average
                  </p>
                  <p className="text-[16px] font-bold text-[#1F2937]">
                    ৳{Math.round(grandDailyTotal / 7).toLocaleString("en-IN")}
                  </p>
                </div>
                <div className="rounded-lg border border-[#E5E7EB] bg-white px-4 py-2.5 shadow-xs">
                  <p className="text-[11px] text-[#94A3B8]">Persons</p>
                  <p className="text-[16px] font-bold text-[#1F2937]">
                    {filteredPersons.length}
                  </p>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-[#E5E7EB] bg-white p-3 shadow-xs">
          <div className="flex items-center gap-2 rounded-lg border border-[#E5E7EB] bg-white px-3 py-2 text-[13px]">
            <Search size={14} className="text-[#94A3B8]" />
            <input
              type="text"
              placeholder="Search by name or outlet..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-48 bg-transparent text-[13px] text-[#1F2937] outline-none placeholder:text-[#94A3B8]"
            />
          </div>

          <div className="relative">
            <button
              onClick={() => setOutletDropdownOpen(!outletDropdownOpen)}
              className="flex items-center gap-2 rounded-lg border border-[#E5E7EB] bg-white px-3 py-2 text-[13px] font-medium text-[#374151] shadow-xs transition-colors hover:border-[#10673E]/40"
            >
              <span>{outletFilter}</span>
              <ChevronDown
                size={13}
                className={`text-[#94A3B8] transition-transform ${outletDropdownOpen ? "rotate-180" : ""}`}
              />
            </button>
            {outletDropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setOutletDropdownOpen(false)}
                />
                <div className="absolute left-0 top-full z-50 mt-1 min-w-[180px] rounded-xl border border-[#E5E7EB] bg-white py-1.5 shadow-lg">
                  {outlets.map((o) => (
                    <button
                      key={o}
                      onClick={() => {
                        setOutletFilter(o);
                        setOutletDropdownOpen(false);
                      }}
                      className={`flex w-full items-center px-3.5 py-2 text-[13px] transition-colors hover:bg-[#F1F8F3] ${
                        outletFilter === o
                          ? "font-semibold text-[#10673E] bg-[#F1F8F3]"
                          : "text-[#374151]"
                      }`}
                    >
                      {outletFilter === o && (
                        <span className="mr-2 h-1.5 w-1.5 rounded-full bg-[#10673E]" />
                      )}
                      {o}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Week navigator for daily mode */}
          {mode === "daily" && (
            <>
              <div className="h-5 w-px bg-[#E5E7EB]" />
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setWeekOffset((w) => w - 1)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#E5E7EB] bg-white text-[#6B7280] transition-colors hover:bg-[#F1F5F9]"
                >
                  <ChevronLeft size={14} />
                </button>
                <span className="min-w-[180px] text-center text-[13px] font-medium text-[#374151]">
                  {getWeekLabel(weekOffset)}
                </span>
                <button
                  onClick={() => setWeekOffset((w) => w + 1)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#E5E7EB] bg-white text-[#6B7280] transition-colors hover:bg-[#F1F5F9]"
                >
                  <ChevronRight size={14} />
                </button>
                {weekOffset !== 0 && (
                  <button
                    onClick={() => setWeekOffset(0)}
                    className="rounded-lg bg-[#10673E]/10 px-2.5 py-1.5 text-[11px] font-semibold text-[#10673E] transition-colors hover:bg-[#10673E]/20"
                  >
                    Current Week
                  </button>
                )}
              </div>
            </>
          )}

          {mode === "monthly" && (
            <>
              <div className="h-5 w-px bg-[#E5E7EB]" />
              <span className="text-[13px] font-medium text-[#374151]">
                {getMonthLabel()}
              </span>
            </>
          )}

          <div className="ml-auto flex items-center gap-2">
            {/* <button
              onClick={handleReset}
              className="flex items-center gap-1.5 rounded-lg border border-[#D1D5DB] bg-white px-3 py-2 text-[12px] font-medium text-[#6B7280] transition-colors hover:bg-[#F9FAFB]"
            >
              <RotateCcw size={13} />
              Reset
            </button> */}
            <button
              onClick={handleSave}
              className="flex items-center gap-1.5 rounded-lg bg-[#10673E] px-4 py-2 text-[12px] font-semibold text-white shadow-sm transition-all hover:-translate-y-0.5 hover:bg-[#0D5A35]"
            >
              <Save size={14} />
              Save {mode === "daily" ? "Daily" : "Monthly"} Targets
            </button>
          </div>
        </div>

        {/* ===== DAILY MODE TABLE ===== */}
        {mode === "daily" && (
          <div className="rounded-xl border border-[#E5E7EB] bg-white shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-[13px]">
                <thead>
                  <tr className="border-b border-[#E5E7EB] bg-[#FAFBFC] text-[12px] font-semibold text-[#64748B]">
                    <th className="sticky left-0 z-10 bg-[#FAFBFC] px-5 py-3">
                      Sales Person
                    </th>
                    <th className="sticky left-0 z-10 bg-[#FAFBFC] px-5 py-3">
                      Outlet
                    </th>
                    {DAYS_OF_WEEK.map((d) => (
                      <th
                        key={d}
                        className="px-4 py-3 text-right min-w-[110px]"
                      >
                        <div className="flex flex-col items-end">
                          <span>{d}</span>
                          <span className="text-[10px] font-normal text-[#D1D5DB]">
                            {DAY_FULL[d]}
                          </span>
                        </div>
                      </th>
                    ))}
                    {/* <th className="px-5 py-3 text-right">Weekly Total</th> */}
                    {/* <th className="px-5 py-3 text-center">Status</th> */}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E7EB]">
                  {filteredPersons.map((sp) => {
                    // const total = dailyTotal(sp.id);
                    // const monthlyEst = sp.monthlyTarget;
                    // const pct =
                    //   monthlyEst > 0
                    //     ? Math.round((total / monthlyEst) * 100 * 4.3)
                    //     : 0;

                    return (
                      <tr
                        key={sp.id}
                        className="transition-colors hover:bg-[#F9FAFB]"
                      >
                        <td className="sticky left-0 z-10 bg-white hover:bg-[#F9FAFB] px-5 py-3">
                          <div className="flex items-center gap-2.5">
                            <span
                              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[11px] font-bold text-white"
                              style={{ background: sp.color }}
                            >
                              {sp.avatar}
                            </span>
                            <span className="font-semibold text-[#1F2937] whitespace-nowrap">
                              {sp.name}
                            </span>
                          </div>
                        </td>
                        <td className="sticky left-0 z-10 bg-white hover:bg-[#F9FAFB] px-5 py-3 text-[#64748B] whitespace-nowrap">
                          {sp.outlet}
                        </td>
                        {DAYS_OF_WEEK.map((d) => (
                          <td key={d} className="px-2 py-3">
                            <input
                              type="text"
                              value={(
                                dailyTargets[sp.id]?.[d] ?? 0
                              ).toLocaleString("en-IN")}
                              onChange={(e) =>
                                handleDailyChange(sp.id, d, e.target.value)
                              }
                              className="w-full rounded-lg border border-[#E5E7EB] bg-white px-2.5 py-1.5 text-right text-[12px] font-medium text-[#1F2937] outline-none transition-colors focus:border-[#10673E] focus:ring-1 focus:ring-[#10673E]/20"
                            />
                          </td>
                        ))}
                        {/* <td className="px-5 py-3 text-right tabular-nums font-bold text-[#1F2937]">
                          ৳{total.toLocaleString("en-IN")}
                        </td>
                        <td className="px-5 py-3 text-center">
                          <span
                            className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${statusColor(pct)}`}
                          >
                            {statusLabel(pct)}
                          </span>
                        </td> */}
                      </tr>
                    );
                  })}
                </tbody>
                {/* Totals row */}
                <tfoot>
                  <tr className="border-t-2 border-[#E5E7EB] bg-[#FAFBFC] font-semibold">
                    <td className="sticky left-0 z-10 bg-[#FAFBFC] px-5 py-3 text-[#64748B]">
                      Daily Totals
                    </td>
                    <td className="sticky left-0 z-10 bg-[#FAFBFC] px-5 py-3" />
                    {DAYS_OF_WEEK.map((d) => (
                      <td
                        key={d}
                        className="px-2 py-3 text-right text-[12px] tabular-nums text-[#1F2937]"
                      >
                        ৳{dailyDayTotal(d).toLocaleString("en-IN")}
                      </td>
                    ))}
                    {/* <td className="px-5 py-3 text-right text-[13px] tabular-nums font-bold text-[#10673E]">
                      ৳{grandDailyTotal.toLocaleString("en-IN")}
                    </td> */}
                    <td />
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}

        {/* ===== MONTHLY MODE TABLE ===== */}
        {mode === "monthly" && (
          <div className="rounded-xl border border-[#E5E7EB] bg-white shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-[13px]">
                <thead>
                  <tr className="border-b border-[#E5E7EB] bg-[#FAFBFC] text-[12px] font-semibold text-[#64748B]">
                    <th className="px-5 py-3">Sales Person</th>
                    <th className="px-5 py-3">Outlet</th>
                    <th className="px-5 py-3 text-right">Last Month Target</th>
                    <th className="px-5 py-3 text-right">
                      Last Month Achieved
                    </th>
                    <th className="px-5 py-3 text-right">
                      This Month Target
                    </th>
                    <th className="px-5 py-3 text-right">Achieved</th>
                    <th className="px-5 py-3 text-right">Achievement %</th>
                    <th className="px-5 py-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E7EB]">
                  {filteredPersons.map((sp) => {
                    const target = monthlyTargets[sp.id] ?? sp.monthlyTarget;
                    const pct =
                      target > 0
                        ? Math.round((sp.achieved / target) * 100)
                        : 0;

                    return (
                      <tr
                        key={sp.id}
                        className="transition-colors hover:bg-[#F9FAFB]"
                      >
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-2.5">
                            <span
                              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[11px] font-bold text-white"
                              style={{ background: sp.color }}
                            >
                              {sp.avatar}
                            </span>
                            <span className="font-semibold text-[#1F2937]">
                              {sp.name}
                            </span>
                          </div>
                        </td>
                        <td className="px-5 py-3 text-[#64748B]">
                          {sp.outlet}
                        </td>
                        <td className="px-5 py-3 text-right tabular-nums text-[#64748B]">
                          ৳{sp.lastMonthTarget.toLocaleString("en-IN")}
                        </td>
                        <td className="px-5 py-3 text-right tabular-nums text-[#1F2937] font-medium">
                          ৳{sp.lastMonthAchieved.toLocaleString("en-IN")}
                        </td>
                        <td className="px-5 py-3 text-right">
                          <input
                            type="text"
                            value={target.toLocaleString("en-IN")}
                            onChange={(e) =>
                              handleMonthlyChange(sp.id, e.target.value)
                            }
                            className="w-32 rounded-lg border border-[#E5E7EB] bg-white px-3 py-1.5 text-right text-[13px] font-medium text-[#1F2937] outline-none transition-colors focus:border-[#10673E] focus:ring-1 focus:ring-[#10673E]/20"
                          />
                        </td>
                        <td className="px-5 py-3 text-right tabular-nums font-semibold text-[#1F2937]">
                          ৳{sp.achieved.toLocaleString("en-IN")}
                        </td>
                        <td className="px-5 py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <div className="h-1.5 w-16 overflow-hidden rounded-full bg-[#E5E7EB]">
                              <div
                                className={`h-full rounded-full transition-all ${
                                  pct >= 100
                                    ? "bg-[#10673E]"
                                    : pct >= 80
                                      ? "bg-[#3AAFA9]"
                                      : pct >= 60
                                        ? "bg-[#E2BA48]"
                                        : "bg-[#E53E3E]"
                                }`}
                                style={{ width: `${Math.min(100, pct)}%` }}
                              />
                            </div>
                            <span
                              className={`text-[12px] font-semibold tabular-nums ${
                                pct >= 100
                                  ? "text-[#10673E]"
                                  : pct >= 80
                                    ? "text-[#3AAFA9]"
                                    : pct >= 60
                                      ? "text-[#E2BA48]"
                                      : "text-[#E53E3E]"
                              }`}
                            >
                              {pct}%
                            </span>
                          </div>
                        </td>
                        <td className="px-5 py-3 text-center">
                          <span
                            className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${statusColor(pct)}`}
                          >
                            {statusLabel(pct)}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between px-1 text-[12px] text-[#94A3B8]">
          {/* <p>
            Showing {filteredPersons.length} of {SALES_PERSONS.length} sales
            persons
          </p> */}
          {dirty && (
            <span className="text-[11px] font-medium text-[#E2BA48]">
              ● Unsaved changes
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

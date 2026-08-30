import { Link } from "react-router-dom";
import { BarChart3 } from "lucide-react";
import { reportSections } from "../../data/reportSections";
import type { ReportSection, ReportItem } from "../../types/report";

/* ------------------------------------------------------------------ */
/* Report Card                                                          */
/* ------------------------------------------------------------------ */

function ReportCard({ report }: { report: ReportItem }) {
  const Icon = report.icon;
  return (
    <Link
      to={report.path}
      className="group flex items-center gap-3 rounded-xl border border-[#E5E7EB] bg-white px-4 py-3 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:border-[#10673E]/30 hover:shadow-md hover:bg-[#F1F8F3]"
    >
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#F1F5F9] text-[#64748B] transition-colors group-hover:bg-[#10673E]/10 group-hover:text-[#10673E]">
        <Icon size={18} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px] font-semibold text-[#1F2937] group-hover:text-[#10673E]">
          {report.label}
        </p>
        {report.description && (
          <p className="truncate text-[11px] text-[#94A3B8]">
            {report.description}
          </p>
        )}
      </div>
    </Link>
  );
}

/* ------------------------------------------------------------------ */
/* Report Section                                                       */
/* ------------------------------------------------------------------ */

function ReportSectionCard({ section }: { section: ReportSection }) {
  const SectionIcon = section.icon;
  return (
    <div className="rounded-xl border border-[#E5E7EB] bg-white shadow-xs overflow-hidden">
      {/* Section Header */}
      <div className="flex items-center gap-3 border-b border-[#E5E7EB] px-5 py-3.5 bg-[#FAFBFC]">
        <div
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${section.color}`}
        >
          <SectionIcon size={16} />
        </div>
        <div>
          <h2 className="text-[14px] font-bold text-[#1F2937]">
            {section.title}
          </h2>
          <p className="text-[11px] text-[#94A3B8]">
            {section.reports.length} report{section.reports.length !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {/* Report Grid */}
      <div className="p-4">
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-3 xl:grid-cols-4">
          {section.reports.map((report) => (
            <ReportCard key={report.id} report={report} />
          ))}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Page                                                                 */
/* ------------------------------------------------------------------ */

export default function ReportDashboard() {
  const totalReports = reportSections.reduce(
    (sum, s) => sum + s.reports.length,
    0
  );

  return (
    <div className="h-full overflow-y-auto bg-[#F5F7F3]">
      <div
        className="mx-auto max-w-[1440px] space-y-5 p-4 lg:p-6"
        style={{ animation: "fade-up 0.4s ease both" }}
      >
        {/* Header */}
        <header>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#10673E]/10 text-[#10673E]">
              <BarChart3 size={20} />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-[#1F2937] md:text-2xl">
                Report Dashboard
              </h1>
              <p className="mt-0.5 text-[12.5px] text-[#6B7280]">
                Access and analyze operational, sales, inventory and financial reports
              </p>
            </div>
            <span className="ml-auto rounded-lg bg-[#10673E]/10 px-3 py-1.5 text-[12px] font-semibold text-[#10673E]">
              {totalReports} Reports
            </span>
          </div>
        </header>

        {/* Sections */}
        <div className="space-y-5">
          {reportSections.map((section) => (
            <ReportSectionCard key={section.id} section={section} />
          ))}
        </div>
      </div>
    </div>
  );
}

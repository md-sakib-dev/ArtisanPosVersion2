import { Link } from "react-router-dom";
import { Wrench, RefreshCw, ArrowRight } from "lucide-react";

/**
 * Full-screen maintenance page shown when the system is temporarily
 * unavailable for upkeep (e.g. backend answers 503 or a maintenance
 * flag is on).
 *
 * Route: /maintenance?message=<opt>
 */
const MaintenancePage = () => {
  const params = new URLSearchParams(window.location.search);
  const message = params.get("message");

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F5F7F3] p-4">
      <div
        className="w-full max-w-lg rounded-2xl border border-[#E5E7EB] bg-white px-8 py-10 text-center shadow-sm"
        style={{ animation: "fade-up 0.4s ease both" }}
      >
        {/* Icon with orbiting gear accent */}
        <div className="relative mx-auto flex h-20 w-20 items-center justify-center">
          <span className="absolute inset-0 animate-ping rounded-full bg-[#E2BA48]/20" />
          <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-[#E2BA48]/15 text-[#C9A02E]">
            <Wrench size={30} strokeWidth={1.75} />
          </div>
        </div>

        <h1 className="mt-6 text-3xl font-bold tracking-tight text-[#1F2937]">
          Under Maintenance
        </h1>

        <p className="mt-2 text-[13.5px] leading-relaxed text-[#6B7280]">
          {message
            ? message
            : "The system is temporarily offline for scheduled maintenance. We're working to get everything back up as soon as possible."}
        </p>

        <p className="mt-4 inline-block rounded-lg bg-[#F1F5F9] px-3 py-1.5 text-[12px] font-medium text-[#64748B]">
          Please check back in a little while
        </p>

        {/* Actions */}
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#10673E] px-5 py-2.5 text-[13.5px] font-semibold text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#0D5A35] hover:shadow-md sm:w-auto"
          >
            <RefreshCw size={15} />
            Retry Now
          </button>

          <Link
            to="/login"
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-[#D1D5DB] bg-white px-5 py-2.5 text-[13.5px] font-medium text-[#6B7280] transition-all hover:bg-[#F9FAFB] hover:text-[#374151] sm:w-auto"
          >
            Back to Sign In
            <ArrowRight size={15} />
          </Link>
        </div>

        <p className="mt-8 text-[11px] text-[#94A3B8]">
          Thank you for your patience — Wstech POS team
        </p>
      </div>
    </div>
  );
};

export default MaintenancePage;

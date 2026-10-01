import { Link } from "react-router-dom";
import {
  ServerCrash,
  RefreshCw,
  ArrowRight,
  WifiOff,
  Clock,
} from "lucide-react";

/**
 * Full-screen error page for server-side problems: server unreachable,
 * timeouts and 5xx responses (e.g. failed login attempts).
 *
 * Route: /server-error?reason=<timeout|unreachable|server>&message=<opt>
 */
const ServerErrorPage = () => {
  const params = new URLSearchParams(window.location.search);
  const reason = params.get("reason") ?? "server";
  const message = params.get("message");

  const isTimeout = reason === "timeout";
  const isUnreachable = reason === "unreachable";

  const detail = message
    ? message
    : isTimeout
      ? "The server took too long to respond."
      : isUnreachable
        ? "We couldn't reach the server. It may be offline or your connection may be down."
        : "The server encountered an unexpected problem while processing your request.";

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F5F7F3] p-4">
      <div
        className="w-full max-w-lg rounded-2xl border border-[#E5E7EB] bg-white px-8 py-10 text-center shadow-sm"
        style={{ animation: "fade-up 0.4s ease both" }}
      >
        {/* Icon */}
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 text-red-500">
          {isTimeout ? (
            <Clock size={30} strokeWidth={1.75} />
          ) : isUnreachable ? (
            <WifiOff size={30} strokeWidth={1.75} />
          ) : (
            <ServerCrash size={30} strokeWidth={1.75} />
          )}
        </div>

        <h1 className="mt-6 text-3xl font-bold tracking-tight text-[#1F2937]">
          {isTimeout
            ? "Request Timed Out"
            : isUnreachable
              ? "Server Unreachable"
              : "Server Error"}
        </h1>

        <p className="mt-2 text-[13.5px] leading-relaxed text-[#6B7280]">
          {detail}
        </p>

        <p className="mt-1 text-[12px] text-[#94A3B8]">
          Your data is safe — nothing was changed.
        </p>

        {/* Actions */}
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#10673E] px-5 py-2.5 text-[13.5px] font-semibold text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#0D5A35] hover:shadow-md sm:w-auto"
          >
            <RefreshCw size={15} />
            Try Again
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
          If the problem persists, contact your system administrator.
        </p>
      </div>
    </div>
  );
};

export default ServerErrorPage;

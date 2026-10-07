import { Download, Loader2 } from "lucide-react";

interface ExportButtonProps {
  onClick: () => void;
  disabled?: boolean;
  loading?: boolean;
  label?: string;
}

/** Green "Export" pill used in report header bars. */
const ExportButton = ({
  onClick,
  disabled = false,
  loading = false,
  label = "Export",
}: ExportButtonProps) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled || loading}
    className="flex h-8 items-center gap-1.5 rounded-lg bg-[#10673E] px-3.5 text-[12.5px] font-semibold text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#0D5A35] hover:shadow-md active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-sm"
    title="Export report to Excel"
  >
    {loading ? (
      <Loader2 size={14} className="animate-spin" />
    ) : (
      <Download size={14} />
    )}
    {label}
  </button>
);

export default ExportButton;

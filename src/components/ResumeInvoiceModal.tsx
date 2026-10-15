import { useEffect, useState } from "react";
import {
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Play,
  RefreshCw,
  Trash2,
  X,
} from "lucide-react";
import {
  getPausedInvoiceDetails,
  getPausedInvoices,
  type PausedInvoiceDetailDto,
  type PausedInvoiceListItemDto,
} from "../api/regularSaleApi";
import { classifyApiError } from "../api/apiError";

// ======================================================
// TYPES
// ======================================================

interface ResumeInvoiceModalProps {
  open: boolean;
  onClose: () => void;
  /**
   * Fired with the fetched lines once a paused invoice is loaded. The
   * parent maps them into the sale table and closes the modal.
   */
  onLoad: (
    items: PausedInvoiceDetailDto[],
    invoice: PausedInvoiceListItemDto,
  ) => void;
}

/* Rows shown per page in the modal list. */
const PAGE_SIZE = 10;

// ======================================================
// HELPERS
// ======================================================

/* Human-readable date-time, falling back to the raw server string. */
const formatCreatedAt = (value: string): string => {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString();
};

// ======================================================
// RESUME INVOICE MODAL
// ======================================================

export default function ResumeInvoiceModal({
  open,
  onClose,
  onLoad,
}: ResumeInvoiceModalProps) {
  /* Unmount the content when closed so every open starts from a clean
     slate (list, page, errors and confirmation dialog all reset). */
  if (!open) {
    return null;
  }

  return <ResumeInvoiceContent onClose={onClose} onLoad={onLoad} />;
}

// ======================================================
// RESUME INVOICE CONTENT (mounted only while open)
// ======================================================

interface ResumeInvoiceContentProps {
  onClose: () => void;
  onLoad: ResumeInvoiceModalProps["onLoad"];
}

function ResumeInvoiceContent({
  onClose,
  onLoad,
}: ResumeInvoiceContentProps) {
  // ====================================================
  // STATE
  // ====================================================

  const [invoices, setInvoices] = useState<PausedInvoiceListItemDto[]>([]);
  /* Starts true: the modal mounts already fetching its first page. */
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  /* Invoice No currently being fetched by its Load button. */
  const [loadingInvoiceNo, setLoadingInvoiceNo] = useState<string | null>(null);

  /* Invoice queued for the Cancel confirmation dialog. */
  const [confirmInvoice, setConfirmInvoice] =
    useState<PausedInvoiceListItemDto | null>(null);

  // ====================================================
  // FETCH LIST
  // ====================================================

  /*
   * Every state update here happens after the await, so calling this
   * from the mount effect performs no synchronous setState.
   */
  const loadInvoices = async () => {
    try {
      const result = await getPausedInvoices();

      if (result.success === false) {
        setError(result.message || "Unable to load paused invoices.");
        setInvoices([]);
        return;
      }

      setInvoices(result.data);
      setError(null);
      setPage(1);
    } catch (err) {
      console.error("Load paused invoices error:", err);
      setError(
        classifyApiError(err)?.message ?? "Unable to load paused invoices.",
      );
      setInvoices([]);
    } finally {
      setIsLoading(false);
    }
  };

  /* Manual refresh from the header button. */
  const handleRefresh = () => {
    setIsLoading(true);
    setError(null);
    loadInvoices();
  };

  /* Fetch once when the modal mounts (i.e. each time it is opened).
     Deferred a tick so the first render commits before the request
     resolves its state, avoiding a cascading render in the effect. */
  useEffect(() => {
    const timerId = window.setTimeout(() => {
      void loadInvoices();
    }, 0);

    return () => window.clearTimeout(timerId);
  }, []);

  // ====================================================
  // LOAD / RESUME
  // ====================================================

  const handleLoad = async (invoice: PausedInvoiceListItemDto) => {
    if (!invoice.invoiceNo || loadingInvoiceNo) return;

    setLoadingInvoiceNo(invoice.invoiceNo);
    setError(null);

    try {
      const result = await getPausedInvoiceDetails(invoice.invoiceNo);

      if (result.success === false) {
        setError(result.message || "Unable to load this paused invoice.");
        return;
      }

      onLoad(result.data, invoice);
    } catch (err) {
      console.error("Load paused invoice details error:", err);
      setError(
        classifyApiError(err)?.message ??
          "Unable to load this paused invoice.",
      );
    } finally {
      setLoadingInvoiceNo(null);
    }
  };

  // ====================================================
  // CANCEL / DELETE
  // ====================================================

  /*
   * Frontend-only removal for now: the row is dropped from the modal
   * list. Wire a backend delete here when the cancel endpoint is ready.
   */
  const handleConfirmCancel = () => {
    if (!confirmInvoice) return;

    setInvoices((previous) =>
      previous.filter(
        (invoice) => invoice.invoiceNo !== confirmInvoice.invoiceNo,
      ),
    );
    setConfirmInvoice(null);
  };

  // ====================================================
  // PAGINATION (client-side over the fetched rows)
  // ====================================================

  const totalPages = Math.max(1, Math.ceil(invoices.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pagedInvoices = invoices.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  // ====================================================
  // RENDER
  // ====================================================

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-[3px]"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="w-full max-w-2xl overflow-hidden rounded-2xl border border-[#DDE5DF] bg-white shadow-2xl">
        {/* ================================================= */}
        {/* HEADER */}
        {/* ================================================= */}

        <div className="flex items-center justify-between border-b border-[#E6EAE3] bg-gradient-to-r from-[#10673E] to-[#0D5A35] px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20">
              <Play size={20} className="text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Resume Invoice</h2>
              <p className="mt-0.5 text-xs text-white/70">
                Load a paused invoice back into the sale
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handleRefresh}
              disabled={isLoading}
              className="rounded-lg p-2 text-white/80 transition-all hover:bg-white/20 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
              title="Refresh"
            >
              <RefreshCw size={18} />
            </button>

            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-2 text-white/80 transition-all hover:bg-white/20 hover:text-white"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* ================================================= */}
        {/* BODY */}
        {/* ================================================= */}

        <div className="max-h-[60vh] overflow-auto">
          {error && (
            <div className="m-4 flex items-center gap-2 rounded-lg border border-[#F3C2C2] bg-[#FCECEC] px-4 py-3 text-sm text-[#B84A4A]">
              <AlertTriangle size={16} className="shrink-0" />
              <span className="min-w-0 flex-1">{error}</span>
            </div>
          )}

          {isLoading ? (
            <div className="flex flex-col items-center justify-center gap-2 px-6 py-14 text-[#66736B]">
              <Loader2 size={22} className="animate-spin text-[#0E9351]" />
              <span className="text-sm">Loading paused invoices...</span>
            </div>
          ) : invoices.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 px-6 py-14 text-center text-[#66736B]">
              <Play size={22} className="text-[#9AA29C]" />
              <span className="text-sm">No paused invoices found.</span>
            </div>
          ) : (
            <table className="w-full border-collapse text-sm">
              <thead className="sticky top-0 z-10 bg-[#F1F8F3] text-[#10673E]">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold">
                    Invoice No
                  </th>
                  <th className="px-4 py-3 text-left font-semibold">
                    Created Time
                  </th>
                  <th className="px-4 py-3 text-left font-semibold">
                    Customer Phone No
                  </th>
                  <th className="px-4 py-3 text-center font-semibold">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody>
                {pagedInvoices.map((invoice) => {
                  const isRowLoading =
                    loadingInvoiceNo === invoice.invoiceNo;

                  return (
                    <tr
                      key={invoice.invoiceNo}
                      className="border-t border-[#E6EAE3] transition hover:bg-[#FAFBF9]"
                    >
                      <td className="px-4 py-3 font-semibold text-[#17231D]">
                        {invoice.invoiceNo || "-"}
                      </td>

                      <td className="px-4 py-3 text-[#66736B]">
                        {formatCreatedAt(invoice.createdAt)}
                      </td>

                      <td className="px-4 py-3 text-[#66736B]">
                        {invoice.customerContact || "-"}
                      </td>

                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleLoad(invoice)}
                            disabled={isRowLoading || !!loadingInvoiceNo}
                            className="inline-flex h-8 items-center justify-center gap-1.5 rounded-md bg-[#0E9351] px-3 text-sm font-semibold text-white transition hover:bg-[#10673E] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {isRowLoading ? (
                              <Loader2 size={14} className="animate-spin" />
                            ) : (
                              <Play size={13} />
                            )}
                            Load
                          </button>

                          <button
                            type="button"
                            onClick={() => setConfirmInvoice(invoice)}
                            disabled={!!loadingInvoiceNo}
                            className="inline-flex h-8 items-center justify-center gap-1.5 rounded-md border border-[#F3C2C2] bg-white px-3 text-sm font-semibold text-[#B84A4A] transition hover:bg-[#FCECEC] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            <Trash2 size={13} />
                            Cancel
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* ================================================= */}
        {/* FOOTER / PAGINATION */}
        {/* ================================================= */}

        <div className="flex items-center justify-between border-t border-[#E6EAE3] bg-[#FAFBF9] px-6 py-3">
          <span className="text-sm text-[#66736B]">
            {invoices.length} paused invoice{invoices.length === 1 ? "" : "s"}
          </span>

          {totalPages > 1 && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage <= 1}
                className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-[#DDE5DF] bg-white text-[#10673E] transition hover:border-[#0E9351] hover:bg-[#F1F8F3] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <ChevronLeft size={16} />
              </button>

              <span className="text-sm text-[#66736B]">
                Page {currentPage} of {totalPages}
              </span>

              <button
                type="button"
                onClick={() =>
                  setPage((prev) => Math.min(totalPages, prev + 1))
                }
                disabled={currentPage >= totalPages}
                className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-[#DDE5DF] bg-white text-[#10673E] transition hover:border-[#0E9351] hover:bg-[#F1F8F3] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ================================================= */}
      {/* CANCEL CONFIRMATION */}
      {/* ================================================= */}

      {confirmInvoice && (
        <div
          className="absolute inset-0 z-10 flex items-center justify-center bg-black/40 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setConfirmInvoice(null);
            }
          }}
        >
          <div className="w-full max-w-sm overflow-hidden rounded-xl border border-[#DDE5DF] bg-white shadow-2xl">
            <div className="p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#FCECEC]">
                  <AlertTriangle size={20} className="text-[#B84A4A]" />
                </div>

                <div>
                  <h3 className="text-base font-semibold text-[#17231D]">
                    Delete paused invoice?
                  </h3>
                  <p className="mt-0.5 text-sm text-[#66736B]">
                    Are you sure you want to delete this paused invoice?
                  </p>
                </div>
              </div>

              <p className="mt-3 rounded-md bg-[#F1F8F3] px-3 py-2 text-sm text-[#10673E]">
                Invoice No:{" "}
                <b className="text-[#17231D]">{confirmInvoice.invoiceNo}</b>
              </p>
            </div>

            <div className="flex justify-end gap-2 border-t border-[#E6EAE3] bg-[#FAFBF9] px-5 py-3">
              <button
                type="button"
                onClick={() => setConfirmInvoice(null)}
                className="inline-flex h-9 items-center justify-center rounded-md border border-[#DDE5DF] bg-white px-4 text-sm font-medium text-[#66736B] transition hover:border-[#0E9351] hover:bg-[#F1F8F3] hover:text-[#10673E] active:scale-[0.98]"
              >
                No, Keep It
              </button>

              <button
                type="button"
                onClick={handleConfirmCancel}
                className="inline-flex h-9 items-center justify-center gap-1.5 rounded-md bg-[#B84A4A] px-4 text-sm font-semibold text-white transition hover:bg-[#9C3B3B] active:scale-[0.98]"
              >
                <Trash2 size={14} />
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

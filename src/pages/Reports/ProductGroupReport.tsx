import { useEffect, useMemo, useState } from "react";
import {
  AllCommunityModule,
  themeBalham,
  type ColDef,
} from "ag-grid-community";
import { AgGridProvider, AgGridReact } from "ag-grid-react";
import { Layers, Loader2, X } from "lucide-react";
import {
  getProductGroupReport,
  type ProductGroup,
} from "../../api/productGroupApi";
import ExportButton from "../../components/ExportButton";
import { useExcelExport } from "../../hooks/useExcelExport";

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
  useEffect(() => {
    const t = setTimeout(onClose, 3000);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div
      className={`fixed top-5 right-5 z-[60] flex items-center gap-3 rounded-xl border px-4 py-3 shadow-lg transition-all duration-300 ${
        type === "success"
          ? "border-[#10673E]/20 bg-white text-[#10673E]"
          : "border-red-200 bg-white text-red-600"
      }`}
      style={{ animation: "fade-up 0.3s ease both" }}
    >
      {type === "success" ? <Layers size={18} /> : <X size={18} />}
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
/* Page                                                                 */
/* ------------------------------------------------------------------ */

const ProductGroupReport = () => {
  const [groups, setGroups] = useState<ProductGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const { exportToExcel, isExporting } = useExcelExport();
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);

      try {
        const response = await getProductGroupReport();

        if (cancelled) return;

        if (!response.success) {
          setToast({
            message: response.message || "Failed to load product groups",
            type: "error",
          });
          setGroups([]);
        } else {
          setGroups(response.data);
        }
      } catch (error) {
        if (cancelled) return;
        setToast({
          message:
            error instanceof Error
              ? error.message
              : "Failed to load product groups",
          type: "error",
        });
        setGroups([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  /* Grid layout: card looks odd, so anchor it at the left */
  const sortedGroups = useMemo(
    () => [...groups].sort((a, b) => a.productGroupId - b.productGroupId),
    [groups]
  );

  const columnDefs = useMemo<ColDef<ProductGroup>[]>(
    () => [
      {
        field: "groupName",
        headerName: "Group Name",
        minWidth: 300,
        flex: 1,
        filter: "agTextColumnFilter",
        floatingFilter: true,
      },
    ],
    []
  );

  const defaultColDef = useMemo<ColDef<ProductGroup>>(
    () => ({
      sortable: true,
      resizable: true,
      filter: true,
    }),
    []
  );

  return (
    /* Full-height flex column — the grid gets a definite height via
       flex-1, otherwise it collapses to the pagination bar only */
    <div className="flex h-full min-h-0 flex-col bg-[#F5F7F3]">
      <div
        className="flex min-h-0 flex-1 flex-col gap-5 p-4 lg:p-6"
        style={{ animation: "fade-up 0.4s ease both" }}
      >
        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        )}

        {/* -------- Header -------- */}
        <header className="shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#10673E]/10 text-[#10673E]">
              <Layers size={20} />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-[#1F2937] md:text-2xl">
                Product Group Report
              </h1>
              <p className="mt-0.5 text-[12.5px] text-[#6B7280]">
                View all product groups
              </p>
            </div>
          </div>
        </header>

        {/* -------- Report Card -------- */}
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-[#E5E7EB] bg-white shadow-xs">
          {/* Card Header Bar */}
          <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-[#E5E7EB] bg-[#FAFBFC] px-5 py-3">
            <div className="flex items-center gap-2">
              <Layers size={16} className="text-[#10673E]" />
              <h2 className="text-[14px] font-bold text-[#1F2937]">
                Product Groups
              </h2>
              {!loading && (
                <span className="rounded-md bg-[#10673E]/10 px-2.5 py-1 text-[11px] font-semibold text-[#10673E]">
                  {sortedGroups.length} records
                </span>
              )}
            </div>

            {!loading && sortedGroups.length > 0 && (
              <ExportButton
                onClick={() =>
                  exportToExcel({
                    sheetName: "Product Groups",
                    fileName: `Product-Group-Report-${new Date().toISOString().slice(0, 10)}`,
                    headers: ["Group Name"],
                    rows: sortedGroups.map((g) => [g.groupName]),
                  })
                }
                loading={isExporting}
              />
            )}
          </div>

          {/* Grid — flex-1 gives the grid its full available height */}
          <div className="min-h-0 flex-1 p-4">
            {loading ? (
              <div className="flex h-full flex-col items-center justify-center text-[#94A3B8]">
                <Loader2
                  size={28}
                  className="animate-spin text-[#10673E]/60"
                />
                <p className="mt-3 text-[13px] font-medium">
                  Loading product groups...
                </p>
              </div>
            ) : (
              <AgGridProvider modules={[AllCommunityModule]}>
                <AgGridReact<ProductGroup>
                  className="h-full w-full"
                  theme={themeBalham}
                  rowData={sortedGroups}
                  columnDefs={columnDefs}
                  defaultColDef={defaultColDef}
                  animateRows={true}
                  pagination={true}
                  paginationPageSize={10}
                  paginationPageSizeSelector={[10, 20, 50, 100]}
                />
              </AgGridProvider>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductGroupReport;

import { useCallback, useState } from "react";

/*
 * Minimal SpreadsheetML 2003 (.xls) generator — opens natively in Excel,
 * WPS and LibreOffice without any external library. Each report page
 * passes sheet name, header row and data rows.
 */
interface SheetSpec {
  sheetName: string;
  /** First row: column headers. */
  headers: string[];
  /** Data rows in the same order as headers. */
  rows: (string | number | null | undefined)[][];
  /** Optional filename without extension. */
  fileName: string;
}

const xmlEscape = (value: string): string =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");

const buildSheetXml = (spec: SheetSpec): string => {
  const cell = (value: string | number | null | undefined): string => {
    if (value === null || value === undefined || value === "") {
      return "<Cell/>";
    }
    if (typeof value === "number" && Number.isFinite(value)) {
      return `<Cell><Data ss:Type="Number">${value}</Data></Cell>`;
    }
    return `<Cell><Data ss:Type="String">${xmlEscape(String(value))}</Data></Cell>`;
  };

  const row = (values: (string | number | null | undefined)[]): string =>
    `<Row>${values.map(cell).join("")}</Row>`;

  //const headerRow = row(spec.headers.map((h) => h));

  /* Bold header style + alternating fill for data rows */
  return `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
 <Styles>
  <Style ss:ID="header">
   <Font ss:Bold="1" ss:Color="#FFFFFF"/>
   <Interior ss:Color="#10673E" ss:Pattern="Solid"/>
  </Style>
 </Styles>
 <Worksheet ss:Name="${xmlEscape(spec.sheetName).slice(0, 31)}">
  <Table>
   ${row(spec.headers.map((h) => h)).replace("<Row>", '<Row ss:StyleID="header">')}
   ${spec.rows.map(row).join("\n   ")}
  </Table>
 </Worksheet>
</Workbook>`;
};

export const downloadExcel = (spec: SheetSpec): void => {
  const xml = buildSheetXml(spec);
  const blob = new Blob(["\ufeff", xml], {
    type: "application/vnd.ms-excel;charset=utf-8",
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${spec.fileName}.xls`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Export helper with busy state for report pages.
 * Usage: const { exportToExcel, isExporting } = useExcelExport();
 */
export const useExcelExport = () => {
  const [isExporting, setIsExporting] = useState(false);

  const exportToExcel = useCallback((spec: SheetSpec) => {
    setIsExporting(true);
    try {
      downloadExcel(spec);
    } finally {
      /* Give the browser a tick to start the download */
      setTimeout(() => setIsExporting(false), 300);
    }
  }, []);

  return { exportToExcel, isExporting };
};

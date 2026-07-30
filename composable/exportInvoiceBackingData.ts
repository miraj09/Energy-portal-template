import {
  formatCommissionMonthLabel,
  formatCommissionWeekLabel,
  formatCurrencyValue,
  formatInvoiceDate,
  formatInvoiceDateTime,
  type InvoiceDetailsItemViewModel,
} from "@/composable/invoiceDisplay";

/** Column headers — keep in sync with the backing data table UI. */
export const INVOICE_BACKING_DATA_HEADERS = [
  "Agent",
  "Company Name",
  "Supplier",
  "MPAN/MPRN",
  "Meter Type",
  "Contract Term",
  "Uplift",
  "Sale Type",
  "Contract Start",
  "Contract End",
  "COT Loss",
  "Sold Consumption",
  "Sales Date",
  "Year",
  "Month",
  "Week",
  "Invoice Date",
  "Total Received",
  "Office",
  "Agent Amount",
  "VAT",
  "Total",
] as const;

const displayOrNa = (value?: string | number | null): string => {
  if (value == null) return "N/A";
  const asString = String(value).trim();
  return asString.length > 0 ? asString : "N/A";
};

/** Builds one export row using the same display formatting as the backing data table. */
export const mapInvoiceBackingItemToExportRow = (
  item: InvoiceDetailsItemViewModel
): string[] => [
  displayOrNa(item.agent_name),
  displayOrNa(item.company_name),
  displayOrNa(item.supplier_name),
  displayOrNa(item.mpan_mprn),
  displayOrNa(item.meter_type),
  displayOrNa(item.contract_term),
  displayOrNa(item.uplift),
  displayOrNa(item.sale_type),
  formatInvoiceDate(item.contract_start_date),
  formatInvoiceDate(item.contract_end_date),
  formatInvoiceDate(item.cot_loss_date),
  displayOrNa(item.sold_consumption),
  formatInvoiceDate(item.sales_date),
  displayOrNa(item.year),
  formatCommissionMonthLabel(item.month),
  formatCommissionWeekLabel(item.week),
  formatInvoiceDateTime(item.invoice_datetime),
  formatCurrencyValue(item.total_received),
  formatCurrencyValue(item.office),
  formatCurrencyValue(item.agent),
  formatCurrencyValue(item.vat),
  formatCurrencyValue(item.total),
];

const escapeCsvCell = (cellValue: string): string => {
  if (/[",\n\r]/.test(cellValue)) {
    return `"${cellValue.replace(/"/g, '""')}"`;
  }
  return cellValue;
};

const escapeHtmlCell = (cellValue: string): string =>
  cellValue
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const triggerBrowserDownload = (blob: Blob, filename: string): void => {
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = objectUrl;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(objectUrl);
};

const buildSafeExportBasename = (invoiceId: string, reference?: string): string => {
  const referencePart = reference?.trim() || invoiceId.split("-")[0] || "invoice";
  return `Invoice-Backing-Data-${referencePart}`
    .replace(/[/\\?%*:|"<>]/g, "-")
    .slice(0, 120);
};

/** Downloads backing data as UTF-8 CSV (Excel-friendly BOM). */
export const downloadInvoiceBackingDataCsv = (
  items: InvoiceDetailsItemViewModel[],
  options: { invoiceId: string; reference?: string }
): void => {
  const rows = [
    [...INVOICE_BACKING_DATA_HEADERS],
    ...items.map(mapInvoiceBackingItemToExportRow),
  ];
  const csvBody = rows.map((row) => row.map(escapeCsvCell).join(",")).join("\r\n");
  // BOM helps Excel open UTF-8 CSV correctly (e.g. £ currency symbol).
  const blob = new Blob(["\uFEFF" + csvBody], { type: "text/csv;charset=utf-8;" });
  triggerBrowserDownload(blob, `${buildSafeExportBasename(options.invoiceId, options.reference)}.csv`);
};

/**
 * Downloads backing data as a simple Excel-compatible `.xls` (HTML table).
 * Avoids adding an xlsx dependency while matching the app's CSV/Excel export UX.
 */
export const downloadInvoiceBackingDataExcel = (
  items: InvoiceDetailsItemViewModel[],
  options: { invoiceId: string; reference?: string }
): void => {
  const headerCells = INVOICE_BACKING_DATA_HEADERS.map(
    (header) => `<th>${escapeHtmlCell(header)}</th>`
  ).join("");
  const bodyRows = items
    .map((item) => {
      const cells = mapInvoiceBackingItemToExportRow(item)
        .map((cell) => `<td>${escapeHtmlCell(cell)}</td>`)
        .join("");
      return `<tr>${cells}</tr>`;
    })
    .join("");

  const htmlDocument = `
<html xmlns:o="urn:schemas-microsoft-com:office:office"
      xmlns:x="urn:schemas-microsoft-com:office:excel"
      xmlns="http://www.w3.org/TR/REC-html40">
<head><meta charset="UTF-8" /></head>
<body>
<table>
  <thead><tr>${headerCells}</tr></thead>
  <tbody>${bodyRows}</tbody>
</table>
</body>
</html>`.trim();

  const blob = new Blob([htmlDocument], {
    type: "application/vnd.ms-excel;charset=utf-8;",
  });
  triggerBrowserDownload(blob, `${buildSafeExportBasename(options.invoiceId, options.reference)}.xls`);
};

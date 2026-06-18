"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { FileDown, Printer } from "lucide-react";
import {
  getGroupedInvoiceByCompanyId,
  getInvoiceBackingDataByCompanyId,
  handleAuthError,
} from "@/lib/auth";
import { exportReports } from "@/lib/actions/exportReport";
import { Button } from "@/ui/button";
import { toast } from "sonner";
import { branding } from "@/lib/config/branding";

/**
 * Invoice surface: keep a white “paper” document when the user prefers dark mode.
 * Tailwind utilities here read `var(--background)`, `var(--primary)`, etc.; we mirror
 * light-theme values from `app/globals.css` :root so children inherit correct colors.
 *
 * Print: isolate the invoice card so nav/sidebar do not appear on paper or PDF.
 */
const INVOICE_STYLES = `
#invoice-printable {
  color-scheme: light;
  --background: #ffffff;
  --foreground: #171717;
  --primary: #346fb6;
  --primary-foreground: #ffffff;
  --primary-soft: #e7f1fd;
  --secondary: #f3f4f6;
  --secondary-foreground: #111827;
  --accent: #f3f4f6;
  --accent-foreground: #111827;
  --muted: #f3f4f6;
  --muted-foreground: #6b7280;
  --destructive: #ef4444;
  --destructive-foreground: #ffffff;
  --border: #e5e7eb;
  --input: #d1d5db;
  --ring: #346fb6;
}
@media print {
  @page {
    margin: 14mm;
    size: A4;
  }
  body * {
    visibility: hidden !important;
  }
  #invoice-printable,
  #invoice-printable * {
    visibility: visible !important;
  }
  /* Must beat #invoice-printable * so toolbar stays off the printed page */
  #invoice-printable .invoice-no-print {
    visibility: hidden !important;
    display: none !important;
  }
  #invoice-printable {
    position: absolute !important;
    left: 0 !important;
    top: 0 !important;
    width: 100% !important;
    max-width: none !important;
    margin: 0 !important;
    padding: 0 !important;
    box-shadow: none !important;
    border: none !important;
    background: #fff !important;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
}
`;

interface InvoiceDetails {
  company_name?: string;
  /** Company registered / current address lines from API (when company is an object). */
  current_address_line1?: string;
  current_address_line2?: string;
  current_address_line3?: string;
  current_address_line4?: string;
  current_postcode?: string;
  invoice_datetime?: string;
  total_received?: string;
  office?: string;
  agent?: string;
  vat?: string;
  total?: string;
  reference?: string;
  notes?: string;
  invoice_count?: number;
  invoices: GroupedInvoiceItem[];
}

type InvoiceCompanyApiShape = {
  company_name?: string;
  current_postcode?: string;
  current_address_line1?: string;
  current_address_line2?: string;
  current_address_line3?: string;
  current_address_line4?: string;
  registration_no?: string;
};

interface GroupedInvoiceItem {
  id: string;
  invoice_datetime?: string;
  total_received?: string;
  vat?: string;
  total?: string;
  reference?: string;
  notes?: string;
}

interface GroupedInvoiceCompanyRecord {
  company_id: string;
  company_name?: string;
  company?: InvoiceCompanyApiShape | null;
  invoice_count?: number;
  sum_total_received?: string;
  sum_vat?: string;
  sum_total?: string;
  latest_invoice_datetime?: string;
  invoices?: GroupedInvoiceItem[];
}

interface InvoiceBackingDataRecord {
  id?: string;
  old_internal_id?: string | number | null;
  plt_customer_contract_id?: string | number | null;
  source?: string | null;
  date_sold?: string | null;
  supplier?: string | null;
  business_name?: string | null;
  postcode?: string | null;
  product?: string | null;
  term?: string | number | null;
  meter_number?: string | null;
  estimated_annual_usage?: string | number | null;
  proposed_start_date?: string | null;
  reg_status?: string | null;
  parent_status?: string | null;
  registration_note?: string | null;
  registration_status_date?: string | null;
  projected_live_commisssion?: string | number | null;
  projected_contract_value?: string | number | null;
  total_commission_received?: string | number | null;
  partner_payaway?: string | number | null;
  partner_net?: string | number | null;
  love_payaway?: string | number | null;
  love_net?: string | number | null;
  total_commision_paid_against?: string | number | null;
  amount_paid?: string | number | null;
  date_paid?: string | null;
  current_supplier?: string | null;
  partner_payment_due?: string | number | null;
  uplift?: string | number | null;
  contract_start_date?: string | null;
  contract_end_date?: string | null;
}

const getNonEmptyText = (...values: Array<string | undefined>): string | undefined => {
  return values.find((value) => typeof value === "string" && value.trim().length > 0);
};

const asOptionalTrimmedString = (value: unknown): string | undefined => {
  if (value == null) {
    return undefined;
  }
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  }
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  return undefined;
};

const formatInvoiceDateTime = (dateTimeValue?: string): string => {
  if (!dateTimeValue) {
    return "N/A";
  }

  const parsedDate = new Date(dateTimeValue);
  if (Number.isNaN(parsedDate.getTime())) {
    return dateTimeValue;
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(parsedDate);
};

const formatCurrencyValue = (currencyValue?: string): string => {
  if (!currencyValue) {
    return "N/A";
  }

  const parsedNumericValue = Number(currencyValue);
  if (Number.isNaN(parsedNumericValue)) {
    return currencyValue;
  }

  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(parsedNumericValue);
};

const formatTableCellValue = (value: unknown): string => {
  if (value == null) {
    return "N/A";
  }
  if (typeof value === "string") {
    const trimmedValue = value.trim();
    return trimmedValue.length > 0 ? trimmedValue : "N/A";
  }
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  return "N/A";
};

const resolveInvoiceBackingDataResults = (apiPayload: unknown): InvoiceBackingDataRecord[] => {
  if (!apiPayload || typeof apiPayload !== "object") {
    return [];
  }

  const payloadRecord = apiPayload as Record<string, unknown>;
  // Support both payload shapes:
  // 1) { data: { results: [...] } } and 2) { results: [...] }
  const nestedData = payloadRecord.data;
  const resultsSource =
    nestedData && typeof nestedData === "object" && !Array.isArray(nestedData)
      ? (nestedData as Record<string, unknown>)
      : payloadRecord;
  const results = resultsSource.results;
  if (!Array.isArray(results)) {
    return [];
  }

  return results.filter(
    (result): result is InvoiceBackingDataRecord =>
      typeof result === "object" && result !== null && !Array.isArray(result)
  );
};

const mapGroupedCompanyToInvoiceDetails = (
  groupedCompanyRecord: GroupedInvoiceCompanyRecord
): InvoiceDetails => {
  const companyRecord = groupedCompanyRecord.company ?? undefined;
  const groupedInvoices = groupedCompanyRecord.invoices ?? [];
  const latestInvoice = groupedInvoices[0];

  return {
    company_name: getNonEmptyText(
      groupedCompanyRecord.company_name,
      companyRecord?.company_name
    ),
    current_address_line1: asOptionalTrimmedString(companyRecord?.current_address_line1),
    current_address_line2: asOptionalTrimmedString(companyRecord?.current_address_line2),
    current_address_line3: asOptionalTrimmedString(companyRecord?.current_address_line3),
    current_address_line4: asOptionalTrimmedString(companyRecord?.current_address_line4),
    current_postcode: asOptionalTrimmedString(companyRecord?.current_postcode),
    invoice_datetime: asOptionalTrimmedString(
      groupedCompanyRecord.latest_invoice_datetime ?? latestInvoice?.invoice_datetime
    ),
    total_received: asOptionalTrimmedString(groupedCompanyRecord.sum_total_received),
    vat: asOptionalTrimmedString(groupedCompanyRecord.sum_vat),
    total: asOptionalTrimmedString(groupedCompanyRecord.sum_total),
    reference: asOptionalTrimmedString(latestInvoice?.reference),
    notes: asOptionalTrimmedString(latestInvoice?.notes),
    invoice_count: groupedCompanyRecord.invoice_count,
    invoices: groupedInvoices,
  };
};

const resolveGroupedInvoiceDetailsPayload = (
  apiPayload: unknown
): GroupedInvoiceCompanyRecord | null => {
  if (!apiPayload || typeof apiPayload !== "object" || Array.isArray(apiPayload)) {
    return null;
  }

  const payloadRecord = apiPayload as Record<string, unknown>;
  const nestedData = payloadRecord.data;

  if (
    nestedData &&
    typeof nestedData === "object" &&
    !Array.isArray(nestedData) &&
    typeof (nestedData as Record<string, unknown>).company_id === "string"
  ) {
    return nestedData as GroupedInvoiceCompanyRecord;
  }

  if (typeof payloadRecord.company_id === "string") {
    return payloadRecord as unknown as GroupedInvoiceCompanyRecord;
  }

  return null;
};

/** Builds a list of non-empty address lines for display. */
const getInvoiceAddressLines = (details: InvoiceDetails): string[] => {
  return [
    details.current_address_line1,
    details.current_address_line2,
    details.current_address_line3,
    details.current_address_line4,
  ].filter((line): line is string => typeof line === "string" && line.length > 0);
};

const InvoiceDetailsPage = () => {
  const params = useParams<{ id: string }>();
  const companyId = params?.id ?? "";
  const [invoiceDetails, setInvoiceDetails] = useState<InvoiceDetails | null>(null);
  const [invoiceBackingRows, setInvoiceBackingRows] = useState<InvoiceBackingDataRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isExportingBackingData, setIsExportingBackingData] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Static recipient details requested for the Bill To block.
  const staticBillToDetails = {
    companyName: branding.companyName,
    addressLine1: "123 Example Street",
    addressLine2: "Example Town",
    city: "London",
    postCode: "AB1 2CD",
    companyNumber: "00000000",
    vatNumber: "000 0000 00",
    email: branding.companyEmail,
  };

  useEffect(() => {
    const fetchInvoiceDetails = async () => {
      if (!companyId) {
        setErrorMessage("Invoice ID is missing.");
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setErrorMessage("");

      try {
        const [groupedInvoiceResult, invoiceBackingResult] = await Promise.all([
          getGroupedInvoiceByCompanyId(companyId),
          getInvoiceBackingDataByCompanyId(companyId),
        ]);

        if (groupedInvoiceResult.success && groupedInvoiceResult.data) {
          const groupedCompanyDetails = resolveGroupedInvoiceDetailsPayload(groupedInvoiceResult.data);
          if (!groupedCompanyDetails) {
            const message = "Invalid invoice details payload received.";
            setErrorMessage(message);
            toast.error(message);
            return;
          }

          const normalizedInvoiceDetails = mapGroupedCompanyToInvoiceDetails(
            groupedCompanyDetails
          );
          setInvoiceDetails(normalizedInvoiceDetails);
        } else {
          if (handleAuthError(groupedInvoiceResult)) {
            return;
          }

          const message = groupedInvoiceResult.message || "Failed to fetch grouped invoice details.";
          setErrorMessage(message);
          toast.error(message);
        }
        console.log("📄 Invoice backing result:", invoiceBackingResult);
        if (invoiceBackingResult.success && invoiceBackingResult.data) {
          const backingRows = resolveInvoiceBackingDataResults(invoiceBackingResult.data);
          setInvoiceBackingRows(backingRows);
        } else if (handleAuthError(invoiceBackingResult)) {
          return;
        } else {
          setInvoiceBackingRows([]);
        }
      } catch (error) {
        console.error("Error fetching invoice details:", error);
        const message = "An error occurred while fetching grouped invoice details.";
        setErrorMessage(message);
        toast.error(message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchInvoiceDetails();
  }, [companyId]);

  /** From-block address lines (derived when invoice details are loaded). */
  const fromAddressLines = invoiceDetails ? getInvoiceAddressLines(invoiceDetails) : [];

  /** Opens the system print dialog (users can choose “Save as PDF” as the destination). */
  const handlePrintOrSavePdf = useCallback(() => {
    if (!invoiceDetails) {
      toast.error("Invoice is still loading.");
      return;
    }
    const referencePart =
      invoiceDetails.reference?.trim() || companyId?.split("-")[0] || "invoice";
    const safeFileTitle = `Invoice-${referencePart}`.replace(/[/\\?%*:|"<>]/g, "-").slice(0, 120);
    const previousTitle = document.title;
    document.title = safeFileTitle;
    window.print();
    document.title = previousTitle;
  }, [invoiceDetails, companyId]);

  const handleExportBackingData = useCallback(async () => {
    if (!companyId) {
      toast.error("Company ID is missing.");
      return;
    }

    const loadingToastId = toast.loading("Preparing backing data export...");
    setIsExportingBackingData(true);

    try {
      const endpoint = `/api/v1/auth/web/core/invoice_backing_data/?company_id=${encodeURIComponent(
        companyId
      )}&export=true`;
      const exportResponse = await exportReports(endpoint);

      if (!exportResponse.success || !exportResponse.data) {
        if (handleAuthError(exportResponse)) {
          return;
        }
        toast.error(exportResponse.message || "Failed to export invoice backing data.", {
          id: loadingToastId,
        });
        return;
      }

      const { base64, contentType, filename } = exportResponse.data;
      const binaryText = atob(base64);
      const binaryValues = new Array(binaryText.length);
      for (let characterIndex = 0; characterIndex < binaryText.length; characterIndex += 1) {
        binaryValues[characterIndex] = binaryText.charCodeAt(characterIndex);
      }

      const exportBlob = new Blob([new Uint8Array(binaryValues)], { type: contentType });
      const downloadUrl = URL.createObjectURL(exportBlob);
      const downloadAnchor = document.createElement("a");
      downloadAnchor.href = downloadUrl;
      downloadAnchor.download = filename || `invoice-backing-data-${companyId}.csv`;
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      URL.revokeObjectURL(downloadUrl);

      toast.success("Invoice backing data export started.", { id: loadingToastId });
    } catch (exportError) {
      console.error("Invoice backing data export failed:", exportError);
      toast.error("An error occurred while exporting backing data.", { id: loadingToastId });
    } finally {
      setIsExportingBackingData(false);
    }
  }, [companyId]);

  return (
    <section className="mx-auto my-8 w-full max-w-5xl px-4 sm:px-6 lg:px-8">
      <style>{INVOICE_STYLES}</style>
      <div
        id="invoice-printable"
        className="rounded-xl border border-border bg-background p-5 shadow-sm sm:p-8"
      >
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-border pb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-wide text-foreground">INVOICE</h1>
                <p className="mt-2 text-sm text-muted-foreground">
              Company ID: <span className="font-medium text-foreground">{companyId || "N/A"}</span>
            </p>
          </div>
          <div className="flex flex-col items-stretch gap-3 sm:items-end">
            {!isLoading && !errorMessage && invoiceDetails ? (
              <div className="invoice-no-print flex flex-wrap justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handlePrintOrSavePdf}
                >
                  <Printer className="size-4" aria-hidden />
                  Print
                </Button>
                <Button
                  type="button"
                  variant="default"
                  size="sm"
                  onClick={handlePrintOrSavePdf}
                  title="Opens the print dialog — choose “Save as PDF” or “Microsoft Print to PDF” as the printer to download."
                >
                  <FileDown className="size-4" aria-hidden />
                  Download
                </Button>
              </div>
            ) : null}
            <div className="text-right sm:text-right">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Invoice Date
              </p>
              <p className="text-sm text-foreground">
                {formatInvoiceDateTime(invoiceDetails?.invoice_datetime)}
              </p>
            </div>
          </div>
        </div>

        {isLoading && (
          <p className="mt-6 text-sm text-muted-foreground">Loading invoice details...</p>
        )}
        {!isLoading && errorMessage && (
          <p className="mt-6 text-sm text-destructive">{errorMessage}</p>
        )}

        {!isLoading && !errorMessage && invoiceDetails && (
          <>
            <div className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-2">
              <div className="rounded-lg border border-border bg-primary-soft p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  From
                </p>
                <p className="mt-2 text-base font-semibold text-foreground">
                  {invoiceDetails.company_name || "N/A"}
                </p>
                {fromAddressLines.length > 0 ? (
                  fromAddressLines.map((addressLine, lineIndex) => (
                    <p
                      key={`invoice-from-address-${lineIndex}`}
                      className={`text-sm text-muted-foreground ${lineIndex === 0 ? "mt-1" : ""}`}
                    >
                      {addressLine}
                    </p>
                  ))
                ) : (
                  <p className="mt-1 text-sm text-muted-foreground">Address: N/A</p>
                )}
                <p className="mt-1 text-sm text-muted-foreground">
                  {invoiceDetails.current_postcode?.trim()
                    ? invoiceDetails.current_postcode
                    : "Postcode: N/A"}
                </p>
              </div>

              <div className="rounded-lg border border-border bg-primary-soft p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Bill To
                </p>
                <p className="mt-2 text-base font-semibold text-foreground">
                  {staticBillToDetails.companyName}
                </p>
                <p className="text-sm text-muted-foreground">{staticBillToDetails.addressLine1}</p>
                <p className="text-sm text-muted-foreground">{staticBillToDetails.addressLine2}</p>
                <p className="text-sm text-muted-foreground">{staticBillToDetails.city}</p>
                <p className="mt-2 text-sm text-muted-foreground">{staticBillToDetails.postCode}</p>
                <p className="text-sm text-muted-foreground">
                  Company Number: {staticBillToDetails.companyNumber}
                </p>
                <p className="text-sm text-muted-foreground">VAT No: {staticBillToDetails.vatNumber}</p>
                <p className="text-sm text-muted-foreground">Email: {staticBillToDetails.email}</p>
              </div>
            </div>

            <div className="mt-6 rounded-lg border border-border bg-muted/50 p-4">
              <p className="text-sm font-semibold uppercase tracking-wider text-foreground">
                Tariff Commission
              </p>
              <div className="mt-3 space-y-2 text-sm text-foreground">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-muted-foreground">amount excl. vat</span>
                  <span className="text-right font-medium">
                    {formatCurrencyValue(invoiceDetails.total_received)}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-muted-foreground">vat</span>
                  <span className="text-right font-medium">
                    {formatCurrencyValue(invoiceDetails.vat)}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-4 border-t border-border pt-2">
                  <span className="text-muted-foreground">Invoice total incl. vat</span>
                  <span className="text-right font-semibold">
                    {formatCurrencyValue(invoiceDetails.total)}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-6 rounded-lg border border-border bg-primary-soft p-4">
              <p className="text-base font-semibold text-foreground">
                The VAT shown is your output tax due to HMRC.
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Reference: {invoiceDetails.reference || "N/A"}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Additional note: {invoiceDetails.notes || "N/A"}
              </p>
            </div>

          </>
        )}
      </div>

      {!isLoading && !errorMessage && invoiceDetails && (
        <div className="invoice-no-print mt-8">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-slate-900">Invoice Backing Data</h2>
            <Button
              type="button"
              variant="default"
              size="sm"
              onClick={handleExportBackingData}
              disabled={isExportingBackingData || invoiceBackingRows.length === 0}
              className="bg-blue-600 text-white hover:bg-blue-700 disabled:bg-slate-300 disabled:text-slate-500"
            >
              <FileDown className="size-4" aria-hidden />
              {isExportingBackingData ? "Exporting..." : "Export"}
            </Button>
          </div>
          <div className="overflow-x-auto rounded-lg border border-slate-300 bg-white">
            <table className="w-full min-w-[3200px] border-collapse bg-white text-left text-xs text-slate-900">
              <thead>
                <tr className="bg-blue-100 uppercase tracking-wider text-slate-900">
                  <th className="px-3 py-2">Old Internal ID</th>
                  <th className="px-3 py-2">PLT Customer Contract ID</th>
                  <th className="px-3 py-2">Source</th>
                  <th className="px-3 py-2">Date Sold</th>
                  <th className="px-3 py-2">Supplier</th>
                  <th className="px-3 py-2">Business Name</th>
                  <th className="px-3 py-2">Postcode</th>
                  <th className="px-3 py-2">Product</th>
                  <th className="px-3 py-2">Term</th>
                  <th className="px-3 py-2">Meter Number</th>
                  <th className="px-3 py-2">Estimated Annual Usage</th>
                  <th className="px-3 py-2">Proposed Start Date</th>
                  <th className="px-3 py-2">Reg Status</th>
                  <th className="px-3 py-2">Parent Status</th>
                  <th className="px-3 py-2">Registration Note</th>
                  <th className="px-3 py-2">Registration Status Date</th>
                  <th className="px-3 py-2">Projected Live Commisssion</th>
                  <th className="px-3 py-2">Projected Contract Value</th>
                  <th className="px-3 py-2">Total Commission Received</th>
                  <th className="px-3 py-2">Partner Payaway</th>
                  <th className="px-3 py-2">Partner Net</th>
                  <th className="px-3 py-2">Love Payaway</th>
                  <th className="px-3 py-2">Love Net</th>
                  <th className="px-3 py-2">Total Commision Paid Against</th>
                  <th className="px-3 py-2">Amount Paid</th>
                  <th className="px-3 py-2">Date Paid</th>
                  <th className="px-3 py-2">Current Supplier</th>
                  <th className="px-3 py-2">Partner Payment Due</th>
                  <th className="px-3 py-2">Uplift</th>
                  <th className="px-3 py-2">Contract Start Date</th>
                  <th className="px-3 py-2">Contract End Date</th>
                </tr>
              </thead>
              <tbody>
                {invoiceBackingRows.length > 0 ? (
                  invoiceBackingRows.map((backingRecord, backingRecordIndex) => (
                    <tr
                      key={backingRecord.id || `invoice-backing-${backingRecordIndex}`}
                      className="border-t border-slate-200 bg-white text-slate-900"
                    >
                      <td className="px-3 py-2">{formatTableCellValue(backingRecord.old_internal_id)}</td>
                      <td className="px-3 py-2">
                        {formatTableCellValue(backingRecord.plt_customer_contract_id)}
                      </td>
                      <td className="px-3 py-2">{formatTableCellValue(backingRecord.source)}</td>
                      <td className="px-3 py-2">{formatTableCellValue(backingRecord.date_sold)}</td>
                      <td className="px-3 py-2">{formatTableCellValue(backingRecord.supplier)}</td>
                      <td className="px-3 py-2">{formatTableCellValue(backingRecord.business_name)}</td>
                      <td className="px-3 py-2">{formatTableCellValue(backingRecord.postcode)}</td>
                      <td className="px-3 py-2">{formatTableCellValue(backingRecord.product)}</td>
                      <td className="px-3 py-2">{formatTableCellValue(backingRecord.term)}</td>
                      <td className="px-3 py-2">{formatTableCellValue(backingRecord.meter_number)}</td>
                      <td className="px-3 py-2">
                        {formatTableCellValue(backingRecord.estimated_annual_usage)}
                      </td>
                      <td className="px-3 py-2">
                        {formatTableCellValue(backingRecord.proposed_start_date)}
                      </td>
                      <td className="px-3 py-2">{formatTableCellValue(backingRecord.reg_status)}</td>
                      <td className="px-3 py-2">{formatTableCellValue(backingRecord.parent_status)}</td>
                      <td className="px-3 py-2">{formatTableCellValue(backingRecord.registration_note)}</td>
                      <td className="px-3 py-2">
                        {formatTableCellValue(backingRecord.registration_status_date)}
                      </td>
                      <td className="px-3 py-2">
                        {formatTableCellValue(backingRecord.projected_live_commisssion)}
                      </td>
                      <td className="px-3 py-2">
                        {formatTableCellValue(backingRecord.projected_contract_value)}
                      </td>
                      <td className="px-3 py-2">
                        {formatTableCellValue(backingRecord.total_commission_received)}
                      </td>
                      <td className="px-3 py-2">{formatTableCellValue(backingRecord.partner_payaway)}</td>
                      <td className="px-3 py-2">{formatTableCellValue(backingRecord.partner_net)}</td>
                      <td className="px-3 py-2">{formatTableCellValue(backingRecord.love_payaway)}</td>
                      <td className="px-3 py-2">{formatTableCellValue(backingRecord.love_net)}</td>
                      <td className="px-3 py-2">
                        {formatTableCellValue(backingRecord.total_commision_paid_against)}
                      </td>
                      <td className="px-3 py-2">{formatTableCellValue(backingRecord.amount_paid)}</td>
                      <td className="px-3 py-2">{formatTableCellValue(backingRecord.date_paid)}</td>
                      <td className="px-3 py-2">{formatTableCellValue(backingRecord.current_supplier)}</td>
                      <td className="px-3 py-2">
                        {formatTableCellValue(backingRecord.partner_payment_due)}
                      </td>
                      <td className="px-3 py-2">{formatTableCellValue(backingRecord.uplift)}</td>
                      <td className="px-3 py-2">
                        {formatTableCellValue(backingRecord.contract_start_date)}
                      </td>
                      <td className="px-3 py-2">{formatTableCellValue(backingRecord.contract_end_date)}</td>
                    </tr>
                  ))
                ) : (
                  <tr className="border-t border-slate-200 bg-white text-slate-900">
                    <td className="px-3 py-3 text-sm" colSpan={31}>
                      No invoice backing data available.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* <Link
        href="/invoices"
        className="mt-6 inline-block text-sm font-medium text-primary underline-offset-2 hover:underline"
      >
        Back to invoices
      </Link> */}
    </section>
  );
};

export default InvoiceDetailsPage;

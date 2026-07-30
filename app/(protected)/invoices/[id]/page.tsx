"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { FileDown, Printer } from "lucide-react";
import { getInvoiceById, handleAuthError } from "@/lib/auth";
import { Button } from "@/ui/button";
import { toast } from "sonner";
import {
  formatCommissionMonthLabel,
  formatCommissionWeekLabel,
  formatCurrencyValue,
  formatInvoiceDate,
  formatInvoiceDateTime,
  getInvoiceAddressLines,
  mapInvoiceApiToDetailsViewModel,
  resolveInvoiceDetailPayload,
  type InvoiceApiRow,
} from "@/composable/invoiceDisplay";
import { downloadElementAsPdf } from "@/composable/downloadInvoicePdf";
import {
  downloadInvoiceBackingDataCsv,
  downloadInvoiceBackingDataExcel,
} from "@/composable/exportInvoiceBackingData";
import { branding } from "@/lib/config/branding";

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

/** Unique agent names from commission line items for the invoice "From" block. */
const resolveAgentNamesLabel = (
  invoiceItems: ReturnType<typeof mapInvoiceApiToDetailsViewModel>["items"]
): string => {
  const agentNames = [
    ...new Set(
      invoiceItems
        .map((item) => item.agent_name?.trim())
        .filter((name): name is string => Boolean(name))
    ),
  ];
  if (agentNames.length === 0) return "N/A";
  return agentNames.join(", ");
};

const InvoiceDetailsPage = () => {
  const params = useParams<{ id: string }>();
  const invoiceId = params?.id ?? "";
  // Keep the raw API row so view-model mapping stays up to date across HMR / mapper changes.
  const [invoiceRecord, setInvoiceRecord] = useState<InvoiceApiRow | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDownloadingInvoice, setIsDownloadingInvoice] = useState(false);
  const [isExportingBackingData, setIsExportingBackingData] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const invoiceDetails = invoiceRecord
    ? mapInvoiceApiToDetailsViewModel(invoiceRecord)
    : null;

  const staticBillToDetails = {
    companyName: branding.companyName,
    addressLine1: branding.addressLine1,
    addressLine2: branding.addressLine2,
    city: branding.city,
    postCode: branding.postCode,
    companyNumber: branding.companyNumber,
    vatNumber: branding.vatNumber,
    email: branding.companyEmail,
  };

  useEffect(() => {
    const fetchInvoiceDetails = async () => {
      if (!invoiceId) {
        setErrorMessage("Invoice ID is missing.");
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setErrorMessage("");
      setInvoiceRecord(null);

      try {
        const invoiceResult = await getInvoiceById(invoiceId);
        if (invoiceResult.success && invoiceResult.data) {
          const resolvedInvoiceRecord = resolveInvoiceDetailPayload(invoiceResult.data);
          if (!resolvedInvoiceRecord) {
            const message = "Invalid invoice payload received.";
            setErrorMessage(message);
            toast.error(message);
            return;
          }

          setInvoiceRecord(resolvedInvoiceRecord);
        } else {
          if (handleAuthError(invoiceResult)) {
            return;
          }

          const message = invoiceResult.message || "Failed to fetch invoice details.";
          setErrorMessage(message);
          toast.error(message);
        }
      } catch (error) {
        console.error("Error fetching invoice details:", error);
        const message = "An error occurred while fetching invoice details.";
        setErrorMessage(message);
        toast.error(message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchInvoiceDetails();
  }, [invoiceId]);

  const fromAddressLines = invoiceDetails ? getInvoiceAddressLines(invoiceDetails) : [];

  const handlePrint = useCallback(() => {
    if (!invoiceDetails) {
      toast.error("Invoice is still loading.");
      return;
    }
    const referencePart =
      invoiceDetails.reference?.trim() || invoiceId?.split("-")[0] || "invoice";
    const safeFileTitle = `Invoice-${referencePart}`.replace(/[/\\?%*:|"<>]/g, "-").slice(0, 120);
    const previousTitle = document.title;
    document.title = safeFileTitle;
    window.print();
    document.title = previousTitle;
  }, [invoiceDetails, invoiceId]);

  const handleDownloadInvoice = useCallback(async () => {
    if (!invoiceDetails) {
      toast.error("Invoice is still loading.");
      return;
    }

    const referencePart =
      invoiceDetails.reference?.trim() || invoiceId?.split("-")[0] || "invoice";
    const safeFileName = `Invoice-${referencePart}`.replace(/[/\\?%*:|"<>]/g, "-").slice(0, 120);
    const loadingToastId = toast.loading("Preparing invoice download...");

    setIsDownloadingInvoice(true);
    try {
      await downloadElementAsPdf("invoice-printable", safeFileName);
      toast.success("Invoice downloaded.", { id: loadingToastId });
    } catch (downloadError) {
      console.error("Invoice PDF download failed:", downloadError);
      toast.error("Failed to download invoice PDF.", { id: loadingToastId });
    } finally {
      setIsDownloadingInvoice(false);
    }
  }, [invoiceDetails, invoiceId]);

  const handleExportBackingData = useCallback(
    (format: "csv" | "excel") => {
      if (!invoiceDetails) {
        toast.error("Invoice is still loading.");
        return;
      }
      if (invoiceDetails.items.length === 0) {
        toast.error("No backing data available to export.");
        return;
      }

      setIsExportingBackingData(true);
      try {
        const exportOptions = {
          invoiceId,
          reference: invoiceDetails.reference,
        };
        if (format === "csv") {
          downloadInvoiceBackingDataCsv(invoiceDetails.items, exportOptions);
        } else {
          downloadInvoiceBackingDataExcel(invoiceDetails.items, exportOptions);
        }
        toast.success(format === "csv" ? "CSV export started." : "Excel export started.");
      } catch (exportError) {
        console.error("Backing data export failed:", exportError);
        toast.error("Failed to export backing data.");
      } finally {
        setIsExportingBackingData(false);
      }
    },
    [invoiceDetails, invoiceId]
  );

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
              Invoice ID: <span className="font-medium text-foreground">{invoiceId || "N/A"}</span>
            </p>
          </div>
          <div className="flex flex-col items-stretch gap-3 sm:items-end">
            {!isLoading && !errorMessage && invoiceDetails ? (
              <div className="invoice-no-print flex flex-wrap justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handlePrint}
                  disabled={isDownloadingInvoice}
                >
                  <Printer className="size-4" aria-hidden />
                  Print
                </Button>
                <Button
                  type="button"
                  variant="default"
                  size="sm"
                  onClick={() => void handleDownloadInvoice()}
                  disabled={isDownloadingInvoice}
                >
                  <FileDown className="size-4" aria-hidden />
                  {isDownloadingInvoice ? "Downloading..." : "Download"}
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
                {invoiceDetails.company_name ? (
                  <>
                    <p className="mt-2 text-base font-semibold text-foreground">
                      {invoiceDetails.company_name}
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
                  </>
                ) : (
                  <>
                    <p className="mt-2 text-base font-semibold text-foreground">
                      {resolveAgentNamesLabel(invoiceDetails.items)}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Agent{invoiceDetails.items.length !== 1 ? "s" : ""} on this invoice
                    </p>
                  </>
                )}
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
                  <span className="text-muted-foreground">Amount excl. VAT</span>
                  <span className="text-right font-medium">
                    {formatCurrencyValue(invoiceDetails.amount_excluding_vat)}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-muted-foreground">Clawback</span>
                  <span className="text-right font-medium">
                    {formatCurrencyValue(invoiceDetails.clawback_amount)}
                  </span>
                </div>
                {invoiceDetails.add_vat ? (
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-muted-foreground">VAT</span>
                    <span className="text-right font-medium">
                      {formatCurrencyValue(invoiceDetails.vat_amount)}
                    </span>
                  </div>
                ) : null}
                <div className="flex items-center justify-between gap-4 border-t border-border pt-2">
                  <span className="text-muted-foreground">
                    {invoiceDetails.add_vat
                      ? "Invoice total (incl. VAT)"
                      : "Invoice total (excl. VAT)"}
                  </span>
                  <span className="text-right font-semibold">
                    {formatCurrencyValue(invoiceDetails.final_total)}
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
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="default"
                size="sm"
                onClick={() => handleExportBackingData("csv")}
                disabled={isExportingBackingData || invoiceDetails.items.length === 0}
              >
                <FileDown className="size-4" aria-hidden />
                CSV
              </Button>
              <Button
                type="button"
                variant="default"
                size="sm"
                onClick={() => handleExportBackingData("excel")}
                disabled={isExportingBackingData || invoiceDetails.items.length === 0}
              >
                <FileDown className="size-4" aria-hidden />
                Excel
              </Button>
            </div>
          </div>
          <div className="overflow-x-auto rounded-lg border border-slate-300 bg-white">
            <table className="w-full min-w-[2200px] border-collapse bg-white text-left text-xs text-slate-900">
              <thead>
                <tr className="bg-blue-100 uppercase tracking-wider text-slate-900">
                  <th className="px-3 py-2">Agent</th>
                  <th className="px-3 py-2">Company Name</th>
                  <th className="px-3 py-2">Supplier</th>
                  <th className="px-3 py-2">MPAN/MPRN</th>
                  <th className="px-3 py-2">Meter Type</th>
                  <th className="px-3 py-2">Cont. Term</th>
                  <th className="px-3 py-2">Uplift</th>
                  <th className="px-3 py-2">Sale Type</th>
                  <th className="px-3 py-2">Cont. Start</th>
                  <th className="px-3 py-2">Cont. End</th>
                  <th className="px-3 py-2">COT Loss</th>
                  <th className="px-3 py-2 text-right">Sold Consumption</th>
                  <th className="px-3 py-2">Sales Date</th>
                  <th className="px-3 py-2">Year</th>
                  <th className="px-3 py-2">Month</th>
                  <th className="px-3 py-2">Week</th>
                  <th className="px-3 py-2">Invoice Date</th>
                  <th className="px-3 py-2 text-right">Total Received</th>
                  <th className="px-3 py-2 text-right">Office</th>
                  <th className="px-3 py-2 text-right">Agent</th>
                  <th className="px-3 py-2 text-right">VAT</th>
                  <th className="px-3 py-2 text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {invoiceDetails.items.length > 0 ? (
                  invoiceDetails.items.map((item, itemIndex) => {
                    const isMinusItem = item.is_minus === true;
                    const minusItemClass = isMinusItem ? "text-red-500" : undefined;

                    return (
                      <tr
                        key={item.id ?? `invoice-backing-item-${itemIndex}`}
                        className="border-t border-slate-200 bg-white text-slate-900"
                      >
                        <td className={`px-3 py-2 ${minusItemClass ?? ""}`}>
                          {item.agent_name || "N/A"}
                        </td>
                        <td className={`px-3 py-2 ${minusItemClass ?? ""}`}>
                          {item.company_name || "N/A"}
                        </td>
                        <td className={`px-3 py-2 ${minusItemClass ?? ""}`}>
                          {item.supplier_name || "N/A"}
                        </td>
                        <td className={`px-3 py-2 font-mono ${minusItemClass ?? ""}`}>
                          {item.mpan_mprn || "N/A"}
                        </td>
                        <td className={`px-3 py-2 ${minusItemClass ?? ""}`}>
                          {item.meter_type || "N/A"}
                        </td>
                        <td className={`px-3 py-2 ${minusItemClass ?? ""}`}>
                          {item.contract_term || "N/A"}
                        </td>
                        <td className={`px-3 py-2 ${minusItemClass ?? ""}`}>
                          {item.uplift || "N/A"}
                        </td>
                        <td className={`px-3 py-2 ${minusItemClass ?? ""}`}>
                          {item.sale_type || "N/A"}
                        </td>
                        <td className={`px-3 py-2 ${minusItemClass ?? ""}`}>
                          {formatInvoiceDate(item.contract_start_date)}
                        </td>
                        <td className={`px-3 py-2 ${minusItemClass ?? ""}`}>
                          {formatInvoiceDate(item.contract_end_date)}
                        </td>
                        <td className={`px-3 py-2 ${minusItemClass ?? ""}`}>
                          {formatInvoiceDate(item.cot_loss_date)}
                        </td>
                        <td className={`px-3 py-2 text-right tabular-nums ${minusItemClass ?? ""}`}>
                          {item.sold_consumption || "N/A"}
                        </td>
                        <td className={`px-3 py-2 ${minusItemClass ?? ""}`}>
                          {formatInvoiceDate(item.sales_date)}
                        </td>
                        <td className={`px-3 py-2 ${minusItemClass ?? ""}`}>
                          {item.year ?? "N/A"}
                        </td>
                        <td className={`px-3 py-2 ${minusItemClass ?? ""}`}>
                          {formatCommissionMonthLabel(item.month)}
                        </td>
                        <td className={`px-3 py-2 ${minusItemClass ?? ""}`}>
                          {formatCommissionWeekLabel(item.week)}
                        </td>
                        <td className={`px-3 py-2 ${minusItemClass ?? ""}`}>
                          {formatInvoiceDateTime(item.invoice_datetime)}
                        </td>
                        <td className={`px-3 py-2 text-right tabular-nums ${minusItemClass ?? ""}`}>
                          {formatCurrencyValue(item.total_received)}
                        </td>
                        <td className={`px-3 py-2 text-right tabular-nums ${minusItemClass ?? ""}`}>
                          {formatCurrencyValue(item.office)}
                        </td>
                        <td className={`px-3 py-2 text-right tabular-nums ${minusItemClass ?? ""}`}>
                          {formatCurrencyValue(item.agent)}
                        </td>
                        <td className={`px-3 py-2 text-right tabular-nums ${minusItemClass ?? ""}`}>
                          {formatCurrencyValue(item.vat)}
                        </td>
                        <td className={`px-3 py-2 text-right font-semibold tabular-nums ${minusItemClass ?? ""}`}>
                          {formatCurrencyValue(item.total)}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr className="border-t border-slate-200 bg-white text-slate-900">
                    <td className="px-3 py-3 text-sm" colSpan={22}>
                      No invoice backing data available.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  );
};

export default InvoiceDetailsPage;

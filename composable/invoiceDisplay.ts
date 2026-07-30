import { Invoice } from "@/lib/types";

export type InvoiceCompanyShape = {
  id?: string;
  company_name?: string;
  current_postcode?: string;
  current_address_line1?: string;
  current_address_line2?: string;
  current_address_line3?: string;
  current_address_line4?: string;
  registration_no?: string;
};

export type InvoiceApiItemUserDetail = {
  id?: number;
  name?: string;
  username?: string | null;
};

export type InvoiceItemMpanMrpnDetails = {
  bottomline?: string | null;
  mpan_mrpn_text?: string | null;
  is_mpan?: boolean | null;
  is_mrpn?: boolean | null;
};

export type InvoiceItemCompanyDetail = {
  id?: string;
  company_name?: string;
  current_postcode?: string;
  mpan_mrpn_details?: InvoiceItemMpanMrpnDetails | null;
};

export type InvoiceApiItemRow = {
  id?: string | number;
  company_id?: string | null;
  company_detail?: InvoiceItemCompanyDetail | null;
  contact_id?: string | null;
  user_id?: number | null;
  user_detail?: InvoiceApiItemUserDetail | null;
  invoice_datetime?: string | null;
  month?: string | null;
  year?: number | null;
  week?: string | null;
  is_minus?: boolean | null;
  total_received?: string | null;
  office?: string | null;
  agent?: string | null;
  vat?: string | null;
  total?: string | null;
  supplier_name?: string | null;
  contract_term?: string | number | null;
  uplift?: string | number | null;
  sale_type?: string | null;
  contract_start_date?: string | null;
  cot_loss_date?: string | null;
  contract_end_date?: string | null;
  sold_consumption?: string | number | null;
  sales_date?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

/** Top-level invoice row from GET /api/v1/auth/web/core/invoice/ list/detail. */
export type InvoiceApiRow = {
  id: string;
  amount_excluding_vat?: string | null;
  vat_amount?: string | null;
  amount_including_vat?: string | null;
  clawback_amount?: string | null;
  final_total?: string | null;
  /** When true, `final_total` includes VAT; when false, it excludes VAT. */
  add_vat?: boolean | null;
  reference?: string | null;
  notes?: string | null;
  total_amount?: string | null;
  items?: InvoiceApiItemRow[] | null;
  created_at?: string | null;
  updated_at?: string | null;
  is_active?: boolean | null;
  is_deleted?: boolean | null;
  /** Legacy flat fields — may appear on older rows or detail payloads. */
  invoice_datetime?: string | null;
  month?: string | null;
  week?: string | null;
  total_received?: string | null;
  office?: string | null;
  agent?: string | null;
  vat?: string | null;
  total?: string | null;
  is_minus?: boolean | null;
  company?: string | InvoiceCompanyShape | null;
};

export type InvoiceDetailsItemViewModel = {
  id?: string;
  company_id?: string;
  company_name?: string;
  /** MPAN/MPRN bottomline from `company_detail.mpan_mrpn_details.bottomline`. */
  mpan_mprn?: string;
  /** `Electric` when `is_mpan`, `Gas` when `is_mrpn`. */
  meter_type?: string;
  agent_name?: string;
  invoice_datetime?: string;
  month?: string;
  week?: string;
  year?: number;
  is_minus?: boolean;
  total_received?: string;
  office?: string;
  agent?: string;
  vat?: string;
  total?: string;
  supplier_name?: string;
  contract_term?: string;
  uplift?: string;
  sale_type?: string;
  contract_start_date?: string;
  cot_loss_date?: string;
  contract_end_date?: string;
  sold_consumption?: string;
  sales_date?: string;
};

export type InvoiceDetailsViewModel = {
  company_name?: string;
  current_address_line1?: string;
  current_address_line2?: string;
  current_address_line3?: string;
  current_address_line4?: string;
  current_postcode?: string;
  invoice_datetime?: string;
  amount_excluding_vat?: string;
  vat_amount?: string;
  amount_including_vat?: string;
  clawback_amount?: string;
  final_total?: string;
  add_vat?: boolean;
  total_amount?: string;
  reference?: string;
  notes?: string;
  items: InvoiceDetailsItemViewModel[];
  /** @deprecated Use amount_excluding_vat — kept for legacy callers */
  total_received?: string;
  office?: string;
  agent?: string;
  vat?: string;
};

export const COMMISSION_MONTH_LABELS: Record<string, string> = {
  JANUARY: "January",
  FEBRUARY: "February",
  MARCH: "March",
  APRIL: "April",
  MAY: "May",
  JUNE: "June",
  JULY: "July",
  AUGUST: "August",
  SEPTEMBER: "September",
  OCTOBER: "October",
  NOVEMBER: "November",
  DECEMBER: "December",
};

export const COMMISSION_WEEK_LABELS: Record<string, string> = {
  WEEK_1: "Week 1",
  WEEK_2: "Week 2",
  WEEK_3: "Week 3",
  WEEK_4: "Week 4",
};

export const COMMISSION_MONTH_OPTIONS = Object.entries(COMMISSION_MONTH_LABELS).map(
  ([value, label]) => ({ value, label })
);

export const COMMISSION_WEEK_OPTIONS = Object.entries(COMMISSION_WEEK_LABELS).map(
  ([value, label]) => ({ value, label })
);

export const INVOICE_FILTER_SELECT_CLASSNAME =
  "rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500";

export const asOptionalTrimmedString = (value: unknown): string | undefined => {
  if (value == null) return undefined;
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  }
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return undefined;
};

export const formatCurrencyValue = (currencyValue?: string): string => {
  if (!currencyValue) return "N/A";
  const parsedNumericValue = Number(currencyValue);
  if (Number.isNaN(parsedNumericValue)) return currencyValue;
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(parsedNumericValue);
};

export const formatAgentPlusVatTotal = (agentValue?: string, vatValue?: string): string => {
  if (!agentValue && !vatValue) return "N/A";
  const agentAmount = agentValue ? Number(agentValue) : 0;
  const vatAmount = vatValue ? Number(vatValue) : 0;
  if (Number.isNaN(agentAmount) || Number.isNaN(vatAmount)) return "N/A";
  return formatCurrencyValue(String(agentAmount + vatAmount));
};

export const formatTableCellValue = (value: unknown): string => {
  if (value == null) return "N/A";
  if (typeof value === "string") {
    const trimmedValue = value.trim();
    return trimmedValue.length > 0 ? trimmedValue : "N/A";
  }
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return "N/A";
};

export const formatCommissionMonthLabel = (monthValue?: string | null): string => {
  const normalizedMonth = asOptionalTrimmedString(monthValue)?.toUpperCase();
  if (!normalizedMonth) return "N/A";
  return COMMISSION_MONTH_LABELS[normalizedMonth] ?? formatTableCellValue(monthValue);
};

export const formatCommissionWeekLabel = (weekValue?: string | null): string => {
  const normalizedWeek = asOptionalTrimmedString(weekValue)?.toUpperCase();
  if (!normalizedWeek) return "N/A";
  return COMMISSION_WEEK_LABELS[normalizedWeek] ?? formatTableCellValue(weekValue);
};

export const formatInvoiceDateTime = (dateTimeValue?: string): string => {
  if (!dateTimeValue) return "N/A";
  const parsedDate = new Date(dateTimeValue);
  if (Number.isNaN(parsedDate.getTime())) return dateTimeValue;
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(parsedDate);
};

/** Date-only display for contract/sale dates (e.g. `2026-07-14`). */
export const formatInvoiceDate = (dateValue?: string): string => {
  if (!dateValue) return "N/A";
  const parsedDate = new Date(dateValue);
  if (Number.isNaN(parsedDate.getTime())) return dateValue;
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(parsedDate);
};

export type PaginatedApiPayload<T> = {
  results: T[];
  count: number;
  next: string | null;
  previous: string | null;
};

/** Parses Django-style paginated list metadata (`count`, `next`, `previous`). */
export const parsePaginatedCount = (count: unknown, fallback: number): number => {
  if (typeof count === "number" && Number.isFinite(count)) {
    return count;
  }
  if (typeof count === "string") {
    const parsedCount = Number.parseInt(count, 10);
    if (Number.isFinite(parsedCount)) {
      return parsedCount;
    }
  }
  return fallback;
};

/**
 * Normalizes paginated API payloads (`results`, `count`, `next`, `previous`)
 * whether the list is at the top level or nested under `data`.
 */
export const resolvePaginatedApiPayload = <T>(
  apiPayload: unknown,
  resolveResults: (payload: unknown) => T[]
): PaginatedApiPayload<T> => {
  const results = resolveResults(apiPayload);
  if (!apiPayload || typeof apiPayload !== "object") {
    return { results, count: results.length, next: null, previous: null };
  }

  const payloadRecord = apiPayload as Record<string, unknown>;
  const nestedPayload =
    payloadRecord.data &&
    typeof payloadRecord.data === "object" &&
    !Array.isArray(payloadRecord.data)
      ? (payloadRecord.data as Record<string, unknown>)
      : payloadRecord;

  const next =
    typeof nestedPayload.next === "string" ? nestedPayload.next : null;
  const previous =
    typeof nestedPayload.previous === "string" ? nestedPayload.previous : null;

  return {
    results,
    count: parsePaginatedCount(nestedPayload.count, results.length),
    next,
    previous,
  };
};

export const resolvePaginatedInvoiceListPayload = (
  apiPayload: unknown
): PaginatedApiPayload<InvoiceApiRow> =>
  resolvePaginatedApiPayload(apiPayload, resolveInvoiceListFromPayload);

export const resolveInvoiceListFromPayload = (apiPayload: unknown): InvoiceApiRow[] => {
  if (!apiPayload || typeof apiPayload !== "object") return [];
  const payloadRecord = apiPayload as Record<string, unknown>;
  const nestedData = payloadRecord.data;
  const resultsSource =
    nestedData && typeof nestedData === "object" && !Array.isArray(nestedData)
      ? (nestedData as Record<string, unknown>)
      : payloadRecord;
  const results = resultsSource.results;
  if (!Array.isArray(results)) return [];
  return results.filter(
    (result): result is InvoiceApiRow =>
      typeof result === "object" &&
      result !== null &&
      !Array.isArray(result) &&
      typeof (result as InvoiceApiRow).id === "string"
  );
};

export const resolveInvoiceDetailPayload = (apiPayload: unknown): InvoiceApiRow | null => {
  if (!apiPayload || typeof apiPayload !== "object" || Array.isArray(apiPayload)) return null;
  const payloadRecord = apiPayload as Record<string, unknown>;
  const nestedData = payloadRecord.data;
  if (nestedData && typeof nestedData === "object" && !Array.isArray(nestedData)) {
    const candidate = nestedData as InvoiceApiRow;
    if (typeof candidate.id === "string") return candidate;
  }
  if (typeof payloadRecord.id === "string") return payloadRecord as unknown as InvoiceApiRow;
  return null;
};

export const resolveCompanyFromInvoice = (
  invoice: InvoiceApiRow | null | undefined
): InvoiceCompanyShape | null => {
  if (!invoice?.company || typeof invoice.company !== "object") return null;
  return invoice.company;
};

export const resolveCompanyIdFromInvoice = (
  invoice: InvoiceApiRow | null | undefined
): string | null => {
  if (!invoice) return null;
  if (typeof invoice.company === "string" && invoice.company.trim()) return invoice.company.trim();
  const companyRecord = resolveCompanyFromInvoice(invoice);
  if (companyRecord?.id && String(companyRecord.id).trim()) return String(companyRecord.id).trim();

  const invoiceItems = Array.isArray(invoice.items) ? invoice.items : [];
  for (const item of invoiceItems) {
    const companyId = asOptionalTrimmedString(item.company_id);
    if (companyId) return companyId;
  }

  return null;
};

/** Resolves MPAN/MPRN bottomline from an invoice item's nested `company_detail`. */
export const resolveMpanMprnBottomlineFromItemCompany = (
  companyDetail: InvoiceItemCompanyDetail | null | undefined
): string | undefined => {
  if (!companyDetail?.mpan_mrpn_details || typeof companyDetail.mpan_mrpn_details !== "object") {
    return undefined;
  }
  return asOptionalTrimmedString(companyDetail.mpan_mrpn_details.bottomline);
};

/** Resolves meter fuel type from `company_detail.mpan_mrpn_details` flags. */
export const resolveMeterTypeFromItemCompany = (
  companyDetail: InvoiceItemCompanyDetail | null | undefined
): string | undefined => {
  const mpanMrpnDetails = companyDetail?.mpan_mrpn_details;
  if (!mpanMrpnDetails || typeof mpanMrpnDetails !== "object") {
    return undefined;
  }
  if (mpanMrpnDetails.is_mpan === true) {
    return "Electric";
  }
  if (mpanMrpnDetails.is_mrpn === true) {
    return "Gas";
  }
  return undefined;
};

const mapInvoiceItemToDetailsViewModel = (
  item: InvoiceApiItemRow
): InvoiceDetailsItemViewModel => ({
  id: item.id != null ? String(item.id) : undefined,
  company_id: asOptionalTrimmedString(item.company_id),
  company_name: asOptionalTrimmedString(item.company_detail?.company_name),
  mpan_mprn: resolveMpanMprnBottomlineFromItemCompany(item.company_detail),
  meter_type: resolveMeterTypeFromItemCompany(item.company_detail),
  agent_name: asOptionalTrimmedString(item.user_detail?.name),
  invoice_datetime: asOptionalTrimmedString(item.invoice_datetime),
  month: asOptionalTrimmedString(item.month),
  week: asOptionalTrimmedString(item.week),
  year: typeof item.year === "number" ? item.year : undefined,
  is_minus: item.is_minus === true,
  total_received: asOptionalTrimmedString(item.total_received),
  office: asOptionalTrimmedString(item.office),
  agent: asOptionalTrimmedString(item.agent),
  vat: asOptionalTrimmedString(item.vat),
  total: asOptionalTrimmedString(item.total),
  supplier_name: asOptionalTrimmedString(item.supplier_name),
  contract_term: asOptionalTrimmedString(item.contract_term),
  uplift: asOptionalTrimmedString(item.uplift),
  sale_type: asOptionalTrimmedString(item.sale_type),
  contract_start_date: asOptionalTrimmedString(item.contract_start_date),
  cot_loss_date: asOptionalTrimmedString(item.cot_loss_date),
  contract_end_date: asOptionalTrimmedString(item.contract_end_date),
  sold_consumption: asOptionalTrimmedString(item.sold_consumption),
  sales_date: asOptionalTrimmedString(item.sales_date),
});

export const mapInvoiceApiToDetailsViewModel = (invoice: InvoiceApiRow): InvoiceDetailsViewModel => {
  const companyRecord = resolveCompanyFromInvoice(invoice);
  const invoiceItems = Array.isArray(invoice.items) ? invoice.items : [];
  const amountExcludingVat = asOptionalTrimmedString(invoice.amount_excluding_vat);
  const vatAmount = asOptionalTrimmedString(invoice.vat_amount);
  const amountIncludingVat = asOptionalTrimmedString(invoice.amount_including_vat);

  return {
    company_name: asOptionalTrimmedString(companyRecord?.company_name),
    current_address_line1: asOptionalTrimmedString(companyRecord?.current_address_line1),
    current_address_line2: asOptionalTrimmedString(companyRecord?.current_address_line2),
    current_address_line3: asOptionalTrimmedString(companyRecord?.current_address_line3),
    current_address_line4: asOptionalTrimmedString(companyRecord?.current_address_line4),
    current_postcode: asOptionalTrimmedString(companyRecord?.current_postcode),
    invoice_datetime: asOptionalTrimmedString(invoice.created_at ?? invoice.invoice_datetime),
    amount_excluding_vat: amountExcludingVat,
    vat_amount: vatAmount,
    amount_including_vat: amountIncludingVat,
    clawback_amount: asOptionalTrimmedString(invoice.clawback_amount),
    final_total: asOptionalTrimmedString(invoice.final_total),
    add_vat: invoice.add_vat !== false,
    total_amount: asOptionalTrimmedString(invoice.total_amount),
    reference: asOptionalTrimmedString(invoice.reference),
    notes: asOptionalTrimmedString(invoice.notes),
    items: invoiceItems.map(mapInvoiceItemToDetailsViewModel),
    total_received: asOptionalTrimmedString(invoice.total_received),
    office: asOptionalTrimmedString(invoice.office),
    agent: amountExcludingVat ?? asOptionalTrimmedString(invoice.agent),
    vat: vatAmount ?? asOptionalTrimmedString(invoice.vat),
  };
};

export const mapInvoiceApiRowToTableInvoice = (invoiceRow: InvoiceApiRow): Invoice => {
  const companyRecord = resolveCompanyFromInvoice(invoiceRow);
  const companyId = resolveCompanyIdFromInvoice(invoiceRow) ?? undefined;
  const invoiceItems = Array.isArray(invoiceRow.items) ? invoiceRow.items : [];
  const itemCount = invoiceItems.length;
  const hasMinusItem = invoiceItems.some((item) => item.is_minus === true);
  const totalAmountNumeric = Number(invoiceRow.total_amount);
  const isMinus =
    invoiceRow.is_minus === true ||
    hasMinusItem ||
    (Number.isFinite(totalAmountNumeric) && totalAmountNumeric < 0);

  const amountExcludingVat = asOptionalTrimmedString(invoiceRow.amount_excluding_vat);
  const vatAmount = asOptionalTrimmedString(invoiceRow.vat_amount);
  const amountIncludingVat = asOptionalTrimmedString(invoiceRow.amount_including_vat);

  return {
    id: invoiceRow.id,
    company_id: companyId,
    exported_on_date: asOptionalTrimmedString(
      invoiceRow.created_at ?? invoiceRow.invoice_datetime
    ),
    company_name: asOptionalTrimmedString(companyRecord?.company_name),
    reference: asOptionalTrimmedString(invoiceRow.reference),
    notes: asOptionalTrimmedString(invoiceRow.notes),
    item_count: itemCount,
    amount_excluding_vat: amountExcludingVat,
    vat_amount: vatAmount,
    amount_including_vat: amountIncludingVat,
    clawback_amount: asOptionalTrimmedString(invoiceRow.clawback_amount),
    final_total: asOptionalTrimmedString(invoiceRow.final_total),
    add_vat: invoiceRow.add_vat !== false,
    total_amount: asOptionalTrimmedString(invoiceRow.total_amount),
    agent: amountExcludingVat,
    vat: vatAmount,
    net_payment_due: formatCurrencyValue(amountIncludingVat ?? invoiceRow.total_amount ?? undefined),
    is_minus: isMinus,
    created_at: asOptionalTrimmedString(invoiceRow.created_at),
    updated_at: asOptionalTrimmedString(invoiceRow.updated_at),
  };
};

export const getInvoiceAddressLines = (details: InvoiceDetailsViewModel): string[] => {
  return [
    details.current_address_line1,
    details.current_address_line2,
    details.current_address_line3,
    details.current_address_line4,
  ].filter((line): line is string => typeof line === "string" && line.length > 0);
};

/** Flat row for paid-history tables (one row per invoice line item). */
export type PaidHistoryTableRow = {
  id: string;
  company_name?: string;
  invoice_datetime?: string;
  total_received?: string;
  vat?: string;
  total?: string;
  notes?: string;
  reference?: string;
};

/**
 * Flattens paginated invoice list API rows into paid-history table rows.
 * Line-item fields come from `items[]`; `notes` and `reference` come from the parent invoice.
 */
export const mapInvoiceListToPaidHistoryRows = (
  invoices: InvoiceApiRow[]
): PaidHistoryTableRow[] => {
  const rows: PaidHistoryTableRow[] = [];

  for (const invoice of invoices) {
    const reference = asOptionalTrimmedString(invoice.reference);
    const notes = asOptionalTrimmedString(invoice.notes);
    const invoiceItems = Array.isArray(invoice.items) ? invoice.items : [];

    if (invoiceItems.length === 0) {
      rows.push({
        id: invoice.id,
        company_name: asOptionalTrimmedString(resolveCompanyFromInvoice(invoice)?.company_name),
        invoice_datetime: asOptionalTrimmedString(
          invoice.created_at ?? invoice.invoice_datetime
        ),
        total_received: asOptionalTrimmedString(
          invoice.total_received ?? invoice.total_amount
        ),
        vat: asOptionalTrimmedString(invoice.vat ?? invoice.vat_amount),
        total: asOptionalTrimmedString(invoice.total ?? invoice.amount_including_vat),
        notes,
        reference,
      });
      continue;
    }

    for (const item of invoiceItems) {
      const itemId = item.id != null ? String(item.id) : String(rows.length);
      rows.push({
        id: `${invoice.id}-${itemId}`,
        company_name: asOptionalTrimmedString(item.company_detail?.company_name),
        invoice_datetime: asOptionalTrimmedString(item.invoice_datetime),
        total_received: asOptionalTrimmedString(item.total_received),
        vat: asOptionalTrimmedString(item.vat),
        total: asOptionalTrimmedString(item.total),
        notes,
        reference,
      });
    }
  }

  return rows;
};

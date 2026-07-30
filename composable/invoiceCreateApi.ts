/** API enum values for commission invoice period fields on invoice create. */
export type CommissionMonthApiValue =
  | "JANUARY"
  | "FEBRUARY"
  | "MARCH"
  | "APRIL"
  | "MAY"
  | "JUNE"
  | "JULY"
  | "AUGUST"
  | "SEPTEMBER"
  | "OCTOBER"
  | "NOVEMBER"
  | "DECEMBER";

export type CommissionWeekApiValue = "WEEK_1" | "WEEK_2" | "WEEK_3" | "WEEK_4";

export const COMMISSION_MONTH_API_VALUES: CommissionMonthApiValue[] = [
  "JANUARY",
  "FEBRUARY",
  "MARCH",
  "APRIL",
  "MAY",
  "JUNE",
  "JULY",
  "AUGUST",
  "SEPTEMBER",
  "OCTOBER",
  "NOVEMBER",
  "DECEMBER",
];

export const COMMISSION_MONTH_API_OPTIONS: {
  value: CommissionMonthApiValue;
  label: string;
}[] = [
  { value: "JANUARY", label: "January" },
  { value: "FEBRUARY", label: "February" },
  { value: "MARCH", label: "March" },
  { value: "APRIL", label: "April" },
  { value: "MAY", label: "May" },
  { value: "JUNE", label: "June" },
  { value: "JULY", label: "July" },
  { value: "AUGUST", label: "August" },
  { value: "SEPTEMBER", label: "September" },
  { value: "OCTOBER", label: "October" },
  { value: "NOVEMBER", label: "November" },
  { value: "DECEMBER", label: "December" },
];

export const COMMISSION_WEEK_API_OPTIONS: {
  value: CommissionWeekApiValue;
  label: string;
}[] = [
  { value: "WEEK_1", label: "Week 1" },
  { value: "WEEK_2", label: "Week 2" },
  { value: "WEEK_3", label: "Week 3" },
  { value: "WEEK_4", label: "Week 4" },
];

/** Fixed split of `total_received`: office 15%, agent 85%. */
export const COMMISSION_OFFICE_PCT = 15;
export const COMMISSION_AGENT_PCT = 85;
/** VAT rate applied to agent commission after invoice-level clawback is deducted. */
export const COMMISSION_VAT_PCT = 20;

export const INVOICE_CREATE_ENDPOINT = "/api/v1/auth/web/core/invoice/";

export interface InvoiceCreateItemPayload {
  company_id: string;
  user_id: number;
  invoice_datetime: string;
  month: CommissionMonthApiValue;
  year: number;
  week: CommissionWeekApiValue;
  is_minus: boolean;
  total_received: string;
  office: string;
  agent: string;
  vat: string;
  total: string;
}

export interface InvoiceCreatePayload {
  amount_excluding_vat: string;
  vat_amount: string;
  amount_including_vat: string;
  clawback_amount: string;
  reference: string;
  notes: string;
  total_amount: string;
  /** Agent total minus clawback, optionally including VAT when `add_vat` is true. */
  final_total: string;
  /** Whether VAT is included in `final_total` (from "Include VAT in total" toggle). */
  add_vat: boolean;
  items: InvoiceCreateItemPayload[];
  is_active: true;
  is_deleted: false;
}

export interface InvoiceFormState {
  reference: string;
  notes: string;
  hasPreviousWeekClawback: boolean;
  clawbackAmount: string;
  /** Invoice-level "Include VAT in total" toggle — sent as `add_vat` on create. */
  addVat: boolean;
}

export interface CommissionSectionState {
  sectionId: string;
  selectedAgentOption: { value: string; label: string } | null;
  selectedMpanMprnOption: { value: string; label: string } | null;
  totalReceived: string;
  /** When true, amounts are treated as a negative calculation (`is_minus` on the API). */
  isMinus: boolean;
  selectedMonth: CommissionMonthApiValue;
  selectedWeek: CommissionWeekApiValue;
}

export const getCurrentCommissionMonthValue = (): CommissionMonthApiValue =>
  COMMISSION_MONTH_API_VALUES[new Date().getMonth()];

export const getCurrentCommissionWeekValue = (): CommissionWeekApiValue => {
  const weekIndex = Math.min(Math.ceil(new Date().getDate() / 7), 4) - 1;
  return COMMISSION_WEEK_API_OPTIONS[weekIndex].value;
};

export const getCurrentCommissionYear = (): number => new Date().getFullYear();

/** Monetary fields are sent as decimal strings to match the core invoice API. */
export function formatAmountForInvoiceApi(amount: number): string {
  if (!Number.isFinite(amount)) {
    return "0.00";
  }
  return amount.toFixed(2);
}

/**
 * Invoice-level VAT on agent commission after clawback.
 * Example: agent £100, clawback £10 → taxable £90 → VAT £18 at 20%.
 */
export function computeVatAfterClawback(
  amountExcludingVat: number,
  clawbackAmount: number
): number {
  const taxableBase = amountExcludingVat - clawbackAmount;
  if (!Number.isFinite(taxableBase)) {
    return 0;
  }
  return taxableBase * (COMMISSION_VAT_PCT / 100);
}

/** Agent share after clawback, optionally plus post-clawback VAT. */
export function computeCommissionTotalAmount(
  agentAmount: number,
  vatAmount: number,
  includeVatInTotal: boolean,
  clawbackAmount: number
): number {
  const amountAfterClawback = agentAmount - clawbackAmount;
  return amountAfterClawback + (includeVatInTotal ? vatAmount : 0);
}

/**
 * Per-commission-row split. Line VAT is an estimate on the agent share only;
 * invoice totals recalculate VAT after clawback via {@link computeVatAfterClawback}.
 */
export function computeCommissionLineAmounts(
  totalReceivedAmount: number,
  includeVatInTotal: boolean
): {
  officeAmount: number;
  agentAmount: number;
  vatAmount: number;
  lineTotal: number;
} {
  const officeAmount = totalReceivedAmount * (COMMISSION_OFFICE_PCT / 100);
  const agentAmount = totalReceivedAmount * (COMMISSION_AGENT_PCT / 100);
  // Provisional line VAT (no clawback at row level). Invoice summary/payload override this.
  const vatAmount = agentAmount * (COMMISSION_VAT_PCT / 100);
  const lineTotal = computeCommissionTotalAmount(
    agentAmount,
    vatAmount,
    includeVatInTotal,
    0
  );
  return { officeAmount, agentAmount, vatAmount, lineTotal };
}

export const createInvoiceFormState = (): InvoiceFormState => ({
  reference: "",
  notes: "",
  hasPreviousWeekClawback: false,
  clawbackAmount: "",
  addVat: true,
});

export const createCommissionSectionState = (): CommissionSectionState => ({
  sectionId: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  selectedAgentOption: null,
  selectedMpanMprnOption: null,
  totalReceived: "",
  isMinus: false,
  selectedMonth: getCurrentCommissionMonthValue(),
  selectedWeek: getCurrentCommissionWeekValue(),
});

/** Sum numeric API amount strings (e.g. `"12.34"`) safely. */
function sumFormattedAmounts(amountStrings: string[]): number {
  return amountStrings.reduce((runningTotal, amountString) => {
    const parsedAmount = Number(amountString);
    return runningTotal + (Number.isFinite(parsedAmount) ? parsedAmount : 0);
  }, 0);
}

/**
 * Builds the nested POST body for `/api/v1/auth/web/core/invoice/`.
 * Each commission section becomes one entry in `items[]`; top-level totals are aggregated.
 */
export function buildInvoiceCreatePayload(
  invoiceForm: InvoiceFormState,
  commissionSections: CommissionSectionState[],
  parseAmount: (value: string) => number
): InvoiceCreatePayload {
  const items: InvoiceCreateItemPayload[] = commissionSections.map(
    (commissionSection) => {
      const totalReceivedAmount = parseAmount(commissionSection.totalReceived);
      const { officeAmount, agentAmount, vatAmount, lineTotal } =
        computeCommissionLineAmounts(totalReceivedAmount, invoiceForm.addVat);

      const agentIdString = commissionSection.selectedAgentOption!.value.trim();
      const parsedUserId = Number.parseInt(agentIdString, 10);
      const companyId = commissionSection.selectedMpanMprnOption!.value.trim();

      return {
        company_id: companyId,
        user_id: Number.isFinite(parsedUserId) ? parsedUserId : 0,
        invoice_datetime: new Date().toISOString(),
        month: commissionSection.selectedMonth,
        year: getCurrentCommissionYear(),
        week: commissionSection.selectedWeek,
        is_minus: commissionSection.isMinus,
        total_received: formatAmountForInvoiceApi(totalReceivedAmount),
        office: formatAmountForInvoiceApi(officeAmount),
        agent: formatAmountForInvoiceApi(agentAmount),
        vat: formatAmountForInvoiceApi(vatAmount),
        total: formatAmountForInvoiceApi(lineTotal),
      };
    }
  );

  const amountExcludingVat = sumFormattedAmounts(items.map((item) => item.agent));
  const clawbackAmountValue = invoiceForm.hasPreviousWeekClawback
    ? parseAmount(invoiceForm.clawbackAmount)
    : 0;

  // VAT is on (agent total − clawback), not on full agent before clawback.
  const amountAfterClawback = amountExcludingVat - clawbackAmountValue;
  const vatAmount = computeVatAfterClawback(amountExcludingVat, clawbackAmountValue);

  const addVat = invoiceForm.addVat;
  const finalTotal = amountAfterClawback + (addVat ? vatAmount : 0);

  // Spread post-clawback VAT across rows so item.vat sums to invoice vat_amount.
  const itemsWithVatAfterClawback = items.map((item) => {
    const itemAgentAmount = Number(item.agent);
    const itemVatAmount =
      amountExcludingVat > 0 && Number.isFinite(itemAgentAmount)
        ? (itemAgentAmount / amountExcludingVat) * vatAmount
        : 0;
    const itemTotalAmount =
      itemAgentAmount + (addVat ? itemVatAmount : 0);

    return {
      ...item,
      vat: formatAmountForInvoiceApi(itemVatAmount),
      total: formatAmountForInvoiceApi(itemTotalAmount),
    };
  });

  const totalAmount = sumFormattedAmounts(
    itemsWithVatAfterClawback.map((item) => item.total)
  );

  return {
    amount_excluding_vat: formatAmountForInvoiceApi(amountExcludingVat),
    vat_amount: formatAmountForInvoiceApi(vatAmount),
    amount_including_vat: formatAmountForInvoiceApi(amountAfterClawback + vatAmount),
    clawback_amount: formatAmountForInvoiceApi(clawbackAmountValue),
    reference: invoiceForm.reference.trim(),
    notes: invoiceForm.notes.trim(),
    total_amount: formatAmountForInvoiceApi(totalAmount),
    final_total: formatAmountForInvoiceApi(finalTotal),
    add_vat: addVat,
    items: itemsWithVatAfterClawback,
    is_active: true,
    is_deleted: false,
  };
}

/** Invoice-level preview totals for the commission form UI. */
export function computeInvoiceSummary(
  commissionSections: CommissionSectionState[],
  invoiceForm: InvoiceFormState,
  parseAmount: (value: string) => number
): { lineSubtotal: number; clawbackAmount: number; netTotal: number } {
  // Agent share only — VAT is applied after clawback at invoice level.
  const amountExcludingVat = commissionSections.reduce(
    (runningTotal, commissionSection) => {
      const { agentAmount } = computeCommissionLineAmounts(
        parseAmount(commissionSection.totalReceived),
        false
      );
      return runningTotal + agentAmount;
    },
    0
  );

  const clawbackAmount = invoiceForm.hasPreviousWeekClawback
    ? parseAmount(invoiceForm.clawbackAmount)
    : 0;

  const amountAfterClawback = amountExcludingVat - clawbackAmount;
  const vatAmount = computeVatAfterClawback(amountExcludingVat, clawbackAmount);
  const netTotal =
    amountAfterClawback + (invoiceForm.addVat ? vatAmount : 0);

  return {
    lineSubtotal: amountExcludingVat,
    clawbackAmount,
    netTotal,
  };
}

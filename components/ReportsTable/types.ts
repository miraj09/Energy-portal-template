/**
 * Denormalized fields on `/api/v1/auth/web/utility/report/` rows (contact-shaped).
 * The reports table uses `ContactRecord` from ExportContractTable for fetching;
 * this type documents the extra flat fields returned on each result.
 */
export interface UtilityReportRowFields {
  submitted_by?: string | null;
  company_name?: string | null;
  post_code?: string | null;
  aq_eac?: string | null;
  mpan_mrpn_text?: string | null;
  cl?: string | number | null;
  lead_status?: string | { id?: number; name?: string } | null;
  reminder_date?: string | null;
  window_open?: string | null;
  con_end_date?: string | null;
  submitted_datetime?: string | null;
}




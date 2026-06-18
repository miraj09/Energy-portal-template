export type SubmittedSale = {
  id: number;
  created_at?: string | null;
  updated_at?: string | null;
  is_deleted?: boolean | null;
  deleted_at?: string | null;
  is_active?: boolean | null;
  reference?: string | null;
  submitted_datetime?: string | null;
  submitted_by?: string | null;
  lead_id?: number | null;
  partner_action_required?: boolean | null;
  not_interested_reason?: string | null;
  last_modified_datetime?: string | null;
  selected_partner_action?: string | null;
  lead_status_revised?: string | null;
  created_by?: unknown;
  deleted_by?: unknown;
  company?: string | null; // id
  lead_status?: number | null;
};

export type Company = {
  id: string;
  submitted_sales?: SubmittedSale[] | null;
  business_type_name?: string | null;
  created_by_name?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  deleted_at?: string | null;
  is_active?: boolean | null;
  lead_id?: number | null;
  company_status_id?: number | null;
  agent_user_id?: number | null;
  company_name?: string | null;
  registration_no?: string | null;
  is_micro_business?: boolean | null;
  number_of_employees?: string | null;
  estimated_turnover?: string | null;
  current_address_line1?: string | null;
  current_address_line2?: string | null;
  current_address_line3?: string | null;
  current_address_line4?: string | null;
  current_postcode?: string | null;
  // Flattened fields used by submitted sales filters / display
  company__company_name?: string | null;
  company__current_postcode?: string | null;
  sold_supplier_name?: string | null;
  contract_type?: string | null;
  [key: string]: unknown;
};

export type ContactRecord = {
  id: string;
  company?: Company | null;
  created_at?: string | null;
  updated_at?: string | null;
  deleted_at?: string | null;
  is_active?: boolean | null;
  job_title?: string | null;
  title?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  email_address?: string | null;
  telephone1?: string | null;
  telephone2?: string | null;
  telephone3?: string | null;
  preferred_number_id?: number | null;
  is_primary?: boolean | null;
  is_deleted?: boolean | null;
  created_by?: unknown;
  deleted_by?: unknown;
  [key: string]: unknown;
};

export interface SelectOption {
  value: string ;
  label: string;
}

export const genderOptions: SelectOption[] = [
  { value: "0", label: "Male" },
  { value: "1", label: "Female" },
  { value: "2", label: "Other" },
];

// Invoice interface based on API response structure
export interface Invoice {
  id: string;
  // New API fields for invoice columns
  latest_invoice_id?: string;
  exported_on_date?: string;
  invoice_number?: string;
  partner_name?: string;
  contract_count?: number;
  net_payment_due?: string;
  /** When true, row amounts represent a negative / clawback invoice. */
  is_minus?: boolean;
  invoice_url?: string; // URL for downloading the invoice
  mpan_mprn?: string; // MPAN / MPRN identifier for filtering
  
  // Legacy fields (keeping for backward compatibility)
  order_number?: string;
  company_name?: string;
  company_id?: string;
  month?: string;
  week?: string;
  agent?: string;
  vat?: string;
  reference?: string;
  notes?: string;
  order_date?: string;
  bill_to?: string;
  total_amount?: string;
  /** Number of commission line items on this invoice (list API only). */
  item_count?: number;
  amount_excluding_vat?: string;
  vat_amount?: string;
  amount_including_vat?: string;
  clawback_amount?: string;
  final_total?: string;
  /** When true, `final_total` includes VAT; when false, it excludes VAT. */
  add_vat?: boolean;
  payment_status?: string;
  created_at?: string;
  updated_at?: string;
  
  // Additional fields for invoice details
  due_date?: string;
  company_address?: string;
  company_city?: string;
  company_country?: string;
  company_phone?: string;
  company_postal_code?: string;
  supplier_name?: string;
  supplier_address?: string;
  supplier_city?: string;
  supplier_state?: string;
  supplier_country?: string;
  supplier_postal_code?: string;
  supplier_tax_id?: string;
  // Add more fields as needed based on actual API response
}

// Message interface for ticket messages
export interface TicketMessage {
  id: number;
  ticket: number;
  author_name: string;
  body: string;
  is_internal: boolean;
  created_at: string;
  attachments: Array<{
    id: number;
    url: string;
    uploaded_at: string;
    uploaded_by: number;
  }>;
}

// Ticket interface based on API response structure
export interface Ticket {
  public_id: string;
  created_at: string;
  updated_at: string;
  closed_at: string | null;
  query_type: string;
  contact_preference: string;
  subject: string;
  description: string;
  status: string;
  created_by: number;
  created_by_name: string;
  assigned_to: number | null;
  tracking_id: string;
  attachments?: Array<{
    id: number;
    url: string;
    uploaded_at: string;
    uploaded_by: number;
  }>;
  messages?: TicketMessage[];
}


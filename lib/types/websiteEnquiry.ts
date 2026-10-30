/** Website contact form origin. */
export type WebsiteEnquiryFormType = "quote" | "partner";

/** CRM pipeline status for a website enquiry. */
export type WebsiteEnquiryStatus =
  | "new"
  | "contacted"
  | "quoted"
  | "closed";

/**
 * Authenticated website-enquiry record from
 * GET /api/v1/auth/web/core/website-enquiry/
 */
export interface WebsiteEnquiry {
  id: number | string;
  form_type: WebsiteEnquiryFormType;
  name: string;
  business_name: string | null;
  email: string;
  phone: string | null;
  postcode: string | null;
  street_address: string | null;
  town_city: string | null;
  county: string | null;
  message: string | null;
  status: WebsiteEnquiryStatus;
  created_at: string;
  updated_at: string;
  /** Soft-delete timestamp when present. */
  deleted_at?: string | null;
  created_by?: string | number | null;
  updated_by?: string | number | null;
}

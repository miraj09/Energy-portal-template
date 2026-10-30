import type {
  WebsiteEnquiryFormType,
  WebsiteEnquiryStatus,
} from "@/lib/types/websiteEnquiry";

export const WEBSITE_ENQUIRY_STATUSES: WebsiteEnquiryStatus[] = [
  "new",
  "contacted",
  "quoted",
  "closed",
];

/** Default human-readable labels (quote form terminology). */
export const WEBSITE_ENQUIRY_STATUS_LABELS: Record<
  WebsiteEnquiryStatus,
  string
> = {
  new: "New",
  contacted: "Contacted",
  quoted: "Quoted",
  closed: "Closed",
};

/**
 * Partner form uses "quoted" as onboarding/agreed in the UI;
 * API value stays `quoted`.
 */
export function getWebsiteEnquiryStatusLabel(
  status: WebsiteEnquiryStatus,
  formType?: WebsiteEnquiryFormType | null
): string {
  if (status === "quoted" && formType === "partner") {
    return "Onboarding/Agreed";
  }
  return WEBSITE_ENQUIRY_STATUS_LABELS[status] ?? status;
}

/** Tailwind classes for status badge chips. */
export const WEBSITE_ENQUIRY_STATUS_BADGE_CLASSES: Record<
  WebsiteEnquiryStatus,
  string
> = {
  new: "bg-blue-100 text-blue-800 border-blue-200",
  contacted: "bg-amber-100 text-amber-800 border-amber-200",
  quoted: "bg-purple-100 text-purple-800 border-purple-200",
  closed: "bg-gray-100 text-gray-600 border-gray-200",
};

export const WEBSITE_ENQUIRY_FORM_TYPE_LABELS: Record<
  WebsiteEnquiryFormType,
  string
> = {
  quote: "Quote Request",
  partner: "Partner Request",
};

export const WEBSITE_ENQUIRY_ENDPOINT =
  "/api/v1/auth/web/core/website-enquiry/";

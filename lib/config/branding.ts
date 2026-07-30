/**
 * Central branding configuration for the template.
 * Replace these values when customizing for a specific company.
 * Keep logos under /public and point logoSrc at the file path.
 */
export const branding = {
  appName: "Energy Portal",
  appDescription: "Energy management portal template",
  logoSrc: "/placeholder-logo.svg",
  logoAlt: "Company logo",
  companyName: "YOUR COMPANY LIMITED",
  companyEmail: "payments@example.com",
  /** Invoice "Bill To" / letterhead placeholders — not real company data. */
  addressLine1: "Address line 1",
  addressLine2: "Address line 2",
  city: "City",
  postCode: "POST CODE",
  companyNumber: "00000000",
  vatNumber: "000 0000 00",
} as const;

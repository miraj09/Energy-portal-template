/**
 * Central branding configuration for the template.
 *
 * All values below are FICTIONAL placeholders ("Acme Energy") and are not
 * real company data. Replace them when customizing for a specific company.
 * Keep logos under /public and point logoSrc at the file path.
 */
export const branding = {
  /** Browser tab title and <meta> description. */
  appName: "Acme Energy Portal",
  appDescription: "Energy sales and account management portal",

  /** Logo shown in the sidebar, header and public auth pages. */
  logoSrc: "/placeholder-logo.svg",
  logoAlt: "Acme Energy logo",

  /** Public-facing portal name (used in the public page footer). */
  portalName: "Acme Energy Portal",

  /** Legal entity details used in the invoice "Bill To" block and footer. */
  companyName: "ACME ENERGY LIMITED",
  addressLine1: "1 Example Street",
  addressLine2: "Example Park",
  city: "London",
  postCode: "EC1A 1AA",
  companyNumber: "12345678",
  vatNumber: "GB 123 4567 89",
  companyEmail: "billing@acme-energy.example",
} as const;

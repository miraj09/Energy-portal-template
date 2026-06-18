/**
 * Reads `bottomline` from the first electricity meter under
 * `company_detail.sites[].meters[].mpan_mrpn_details` (API shape for contacts / submitted sales).
 */
export function getBottomlineFromCompanyDetail(
  companyDetail: unknown
): string | null {
  if (!companyDetail || typeof companyDetail !== "object") return null;

  const detailRecord = companyDetail as Record<string, unknown>;
  const sites = detailRecord.sites;
  if (!Array.isArray(sites)) return null;

  for (const site of sites) {
    if (!site || typeof site !== "object") continue;
    const siteRecord = site as Record<string, unknown>;
    const meters = siteRecord.meters;
    if (!Array.isArray(meters)) continue;

    for (const meter of meters) {
      if (!meter || typeof meter !== "object") continue;
      const meterRecord = meter as Record<string, unknown>;
      const mpanMrpnDetails = meterRecord.mpan_mrpn_details;
      if (!mpanMrpnDetails || typeof mpanMrpnDetails !== "object") continue;

      const detailsRecord = mpanMrpnDetails as Record<string, unknown>;
      const bottomlineValue = detailsRecord.bottomline;
      if (typeof bottomlineValue === "string" && bottomlineValue.trim().length > 0) {
        return bottomlineValue.trim();
      }
      if (typeof bottomlineValue === "number") {
        return String(bottomlineValue);
      }
    }
  }

  return null;
}

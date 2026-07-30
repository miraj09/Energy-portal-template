/** Coerce API scalar values into a trimmed display string. */
function coerceBottomlineValue(value: unknown): string | null {
  if (typeof value === "string") {
    const trimmedValue = value.trim();
    return trimmedValue.length > 0 ? trimmedValue : null;
  }
  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }
  return null;
}

/**
 * Prefer `mpan_mrpn_details.bottomline`, then quote `bottomline`, then `meter_reference`.
 * Company list rows often omit `mpan_mrpn_details` and only expose quote / meter_reference.
 */
function extractBottomlineFromMeter(meterRecord: Record<string, unknown>): string | null {
  const mpanMrpnDetails = meterRecord.mpan_mrpn_details;
  if (mpanMrpnDetails && typeof mpanMrpnDetails === "object") {
    const detailsRecord = mpanMrpnDetails as Record<string, unknown>;
    const fromDetails = coerceBottomlineValue(detailsRecord.bottomline);
    if (fromDetails) {
      return fromDetails;
    }
  }

  const quote = meterRecord.quote;
  if (quote && typeof quote === "object") {
    const quoteRecord = quote as Record<string, unknown>;
    const fromQuoteBottomline = coerceBottomlineValue(quoteRecord.bottomline);
    if (fromQuoteBottomline) {
      return fromQuoteBottomline;
    }
  }

  return coerceBottomlineValue(meterRecord.meter_reference);
}

/**
 * Reads meter bottomline from company / company_detail payloads.
 *
 * Checks, in order:
 * 1. Flat `mpan_mrpn_details.bottomline` (invoice item embeds)
 * 2. `sites[].meters[]` → `mpan_mrpn_details.bottomline` / `quote.bottomline` / `meter_reference`
 * 3. Root `meterstring` (company list API when sites are omitted)
 */
export function getBottomlineFromCompanyDetail(
  companyDetail: unknown
): string | null {
  if (!companyDetail || typeof companyDetail !== "object") return null;

  const detailRecord = companyDetail as Record<string, unknown>;

  const rootMpanMrpnDetails = detailRecord.mpan_mrpn_details;
  if (rootMpanMrpnDetails && typeof rootMpanMrpnDetails === "object") {
    const rootDetailsRecord = rootMpanMrpnDetails as Record<string, unknown>;
    const flatBottomline = coerceBottomlineValue(rootDetailsRecord.bottomline);
    if (flatBottomline) {
      return flatBottomline;
    }
  }

  const sites = detailRecord.sites;
  if (Array.isArray(sites)) {
    for (const site of sites) {
      if (!site || typeof site !== "object") continue;
      const siteRecord = site as Record<string, unknown>;
      const meters = siteRecord.meters;
      if (!Array.isArray(meters)) continue;

      for (const meter of meters) {
        if (!meter || typeof meter !== "object") continue;
        const meterBottomline = extractBottomlineFromMeter(
          meter as Record<string, unknown>
        );
        if (meterBottomline) {
          return meterBottomline;
        }
      }
    }
  }

  return coerceBottomlineValue(detailRecord.meterstring);
}

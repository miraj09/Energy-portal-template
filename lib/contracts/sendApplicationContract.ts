/**
 * Payload + response helpers for send-application-contract
 * (and download-contract-pdf, which accepts the same optional fields).
 */

export type SendContractScope = "all" | "site" | "meters";

export type SendApplicationContractPayload = {
  company_id: string;
  site_id?: number;
  meter_ids?: number[];
};

export type SendContractEnvelope = {
  supplier_name: string;
  envelope_id: string;
  bottomline?: string | null;
  meters: string[];
};

export type SendApplicationContractResponse = {
  status?: string;
  envelopes?: SendContractEnvelope[];
};

export type BuildSendContractPayloadInput = {
  companyId: string;
  scope: SendContractScope;
  siteId?: number | null;
  meterIds?: number[];
};

/**
 * Build the POST body for send-application-contract / download-contract-pdf.
 * - all → company_id only
 * - site → company_id + site_id
 * - meters → company_id + meter_ids (site_id only if provided)
 */
export function buildSendApplicationContractPayload(
  input: BuildSendContractPayloadInput
): SendApplicationContractPayload {
  const { companyId, scope, siteId, meterIds = [] } = input;
  const payload: SendApplicationContractPayload = {
    company_id: companyId,
  };

  if (scope === "site") {
    if (siteId == null) {
      throw new Error("A site is required when sending for a specific site.");
    }
    payload.site_id = siteId;
    return payload;
  }

  if (scope === "meters") {
    if (meterIds.length === 0) {
      throw new Error("Select at least one meter to send.");
    }
    payload.meter_ids = meterIds;
    if (siteId != null) {
      payload.site_id = siteId;
    }
    return payload;
  }

  return payload;
}

/** One toast-friendly line per envelope (supplier + meters). */
export function formatSendContractEnvelopeLines(
  envelopes: SendContractEnvelope[] | undefined | null
): string[] {
  if (!envelopes?.length) return [];
  return envelopes.map((envelope) => {
    const metersLabel =
      envelope.meters?.length > 0
        ? envelope.meters.join(", ")
        : "no meters listed";
    const supplier = envelope.supplier_name?.trim() || "Unknown supplier";
    return `${supplier}: ${metersLabel}`;
  });
}

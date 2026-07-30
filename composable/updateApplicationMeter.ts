import { patchMethod } from "@/lib/actions/patchMethod";
import { Meter } from "@/components/ApplicationDetails/types";
import { CreateApplicationMeterPayload } from "@/composable/createApplicationMeter";
import { patchQuoteHeader } from "@/composable/quoteHeaderApi";

const UPDATE_METER_ENDPOINT = "/api/v1/auth/web/core/meter";

export interface UpdateApplicationMeterResponse {
  success: boolean;
  data?: Meter;
  message?: string;
  errors?: unknown;
  quoteId?: number;
}

function mapApiResponseToMeter(data: unknown): Meter | undefined {
  if (data && typeof data === "object" && "meterid" in data) {
    return data as Meter;
  }
  return undefined;
}

function resolveMeterTypeId(meterType: "Electricity" | "Gas"): number {
  return meterType === "Gas" ? 1 : 2;
}

/**
 * Update meter reference/type/site, then PATCH quote-header with flat rate fields.
 */
export async function updateApplicationMeter(
  meterId: number,
  payload: CreateApplicationMeterPayload
): Promise<UpdateApplicationMeterResponse> {
  const meterResponse = await patchMethod(
    {
      site: payload.site_id,
      meter_type: resolveMeterTypeId(payload.meter_type),
      meter_reference: payload.meter_reference,
    },
    `${UPDATE_METER_ENDPOINT}/${meterId}/`
  );

  if (!meterResponse.success) {
    return {
      success: false,
      message: meterResponse.message || "Failed to update meter",
      errors: meterResponse.errors,
    };
  }

  const quoteId = payload.quote_id;
  if (!quoteId) {
    return {
      success: true,
      data: mapApiResponseToMeter(meterResponse.data),
      message: meterResponse.message || "Meter updated successfully",
    };
  }

  const quoteResponse = await patchQuoteHeader(quoteId, payload.quote_payload);

  if (!quoteResponse.success) {
    return {
      success: false,
      message:
        quoteResponse.message ||
        "Meter updated but quote rates could not be saved.",
      data: mapApiResponseToMeter(meterResponse.data),
      errors: quoteResponse.errors,
      quoteId,
    };
  }

  return {
    success: true,
    data: mapApiResponseToMeter(meterResponse.data),
    quoteId,
    message: quoteResponse.message || "Meter and quote updated successfully",
  };
}

import { patchMethod } from "@/lib/actions/patchMethod";
import { Meter } from "@/components/ApplicationDetails/types";
import { CreateApplicationMeterPayload } from "@/composable/createApplicationMeter";

const UPDATE_METER_ENDPOINT = "/api/v1/auth/web/core/meter";

export interface UpdateApplicationMeterResponse {
  success: boolean;
  data?: Meter;
  message?: string;
  errors?: unknown;
}

function mapApiResponseToMeter(data: unknown): Meter | undefined {
  if (data && typeof data === "object" && "meterid" in data) {
    return data as Meter;
  }
  return undefined;
}

/**
 * Update a meter via PATCH /api/v1/auth/web/core/meter/{meterid}/.
 */
export async function updateApplicationMeter(
  meterId: number,
  payload: CreateApplicationMeterPayload
): Promise<UpdateApplicationMeterResponse> {
  const response = await patchMethod(
    {
      company: payload.company_id,
      site: payload.site_id,
      meter_type: payload.meter_type,
      meter_reference: payload.meter_reference,
      ...payload.quote_payload,
    },
    `${UPDATE_METER_ENDPOINT}/${meterId}/`
  );

  if (!response.success) {
    return {
      success: false,
      message: response.message || "Failed to update meter",
      errors: response.errors,
    };
  }

  const meter = mapApiResponseToMeter(response.data);

  return {
    success: true,
    data: meter,
    message: response.message || "Meter updated successfully",
  };
}

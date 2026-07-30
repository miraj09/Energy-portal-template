import { getDropdown } from "@/lib/actions/getDropdown";
import {
  ApplicationMeterApiResponse,
  mapMeterApiToQuoteFormValues,
  MeterQuoteFormValues,
} from "@/composable/meterQuoteForm";
import { extractQuoteIdFromApiResponse } from "@/composable/quoteHeaderApi";

const GET_METER_ENDPOINT = "/api/v1/auth/web/core/meter";

export interface GetApplicationMeterResponse {
  success: boolean;
  data?: ApplicationMeterApiResponse;
  formValues?: MeterQuoteFormValues;
  quoteId?: number;
  message?: string;
  errors?: unknown;
}

/**
 * Fetch meter details via GET /api/v1/auth/web/core/meter/{meterid}/.
 */
export async function getApplicationMeter(
  meterId: number
): Promise<GetApplicationMeterResponse> {
  const response = await getDropdown(`${GET_METER_ENDPOINT}/${meterId}/`);

  if (!response.success) {
    return {
      success: false,
      message: response.message || "Failed to load meter",
      errors: response.errors,
    };
  }

  const data = response.data as ApplicationMeterApiResponse | undefined;

  if (!data) {
    return {
      success: false,
      message: "Meter data not found",
    };
  }

  return {
    success: true,
    data,
    formValues: mapMeterApiToQuoteFormValues(data),
    quoteId: extractQuoteIdFromApiResponse(data) ?? undefined,
  };
}

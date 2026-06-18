import { deleteMethod } from "@/lib/actions/deleteMethod";

const DELETE_METER_ENDPOINT = "/api/v1/auth/web/core/meter";

export interface DeleteApplicationMeterResponse {
  success: boolean;
  data?: unknown;
  message?: string;
  errors?: unknown;
}

/**
 * Delete a meter via DELETE /api/v1/auth/web/core/meter/{meterid}/.
 */
export async function deleteApplicationMeter(
  meterId: number
): Promise<DeleteApplicationMeterResponse> {
  const response = await deleteMethod(
    `${DELETE_METER_ENDPOINT}/${meterId}/`
  );

  if (!response.success) {
    return {
      success: false,
      message: response.message || "Failed to delete meter",
      errors: response.errors,
    };
  }

  return {
    success: true,
    data: response.data,
    message: response.message || "Meter deleted successfully",
  };
}

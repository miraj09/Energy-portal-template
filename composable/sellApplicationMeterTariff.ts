import { patchMethod } from "@/lib/actions/patchMethod";

const UPDATE_METER_ENDPOINT = "/api/v1/auth/web/core/meter";

/** Input from a quote list row when confirming sold tariff for an application meter. */
export interface SellMeterTariffInput {
  supplierName: string;
  tariffName: string;
  term?: string;
  standingCharge?: string;
  dayRate?: string;
}

export interface SellMeterTariffPayload {
  latest_issold: boolean;
  latestsoldsuppliername: string;
  latesttariffname: string;
  latestterm?: number;
  latestSoldStandingCharge?: string;
  latestSoldDayRate?: string;
}

export interface SellApplicationMeterTariffResponse {
  success: boolean;
  message?: string;
  errors?: unknown;
}

/** Parse display strings like "12 months" into a month count. */
export function parseTermMonths(term: string): number | undefined {
  const match = term.match(/(\d+)/);
  if (!match) return undefined;
  const parsed = Number.parseInt(match[1], 10);
  return Number.isFinite(parsed) ? parsed : undefined;
}

/** Strip currency/rate suffixes from display values (e.g. "45.50p", "1,234.56"). */
export function parseRateDisplay(value: string): string {
  return value.replace(/p$/i, "").replace(/,/g, "").trim();
}

function buildSellPayload(input: SellMeterTariffInput): SellMeterTariffPayload {
  const payload: SellMeterTariffPayload = {
    latest_issold: true,
    latestsoldsuppliername: input.supplierName,
    latesttariffname: input.tariffName,
  };

  const termMonths = input.term ? parseTermMonths(input.term) : undefined;
  if (termMonths != null) {
    payload.latestterm = termMonths;
  }

  if (input.standingCharge) {
    payload.latestSoldStandingCharge = parseRateDisplay(input.standingCharge);
  }

  if (input.dayRate) {
    payload.latestSoldDayRate = parseRateDisplay(input.dayRate);
  }

  return payload;
}

/**
 * Mark an application meter as sold with the selected tariff from the quote list.
 */
export async function sellApplicationMeterTariff(
  meterId: number,
  input: SellMeterTariffInput
): Promise<SellApplicationMeterTariffResponse> {
  const response = await patchMethod(
    buildSellPayload(input),
    `${UPDATE_METER_ENDPOINT}/${meterId}/`
  );

  if (!response.success) {
    return {
      success: false,
      message: response.message || "Failed to sell tariff on meter",
      errors: response.errors,
    };
  }

  return {
    success: true,
    message: response.message || "Tariff sold successfully",
  };
}

import { Meter } from "@/components/ApplicationDetails/types";

export interface MeterContractRate {
  rate: number;
  usage: number | null;
  rate_type: number;
  rate_required?: boolean;
  usage_required?: boolean;
}

export interface MeterQuoteHeaderFields {
  profileclass?: string | null;
  MTC?: string | null;
  LLF?: string | null;
  Region?: string | null;
  bottomline?: string | null;
  postcode?: string | null;
  Supplier?: number;
  supplier?: number;
  Number_of_Days?: number;
  Contract_Start_Date?: string;
  Contract_Rates?: MeterContractRate[];
  is_mpan?: boolean;
  is_mrpn?: boolean;
}

export interface MpanMrpnDetails {
  profileclass?: string | null;
  MTC?: string | null;
  LLF?: string | null;
  Region?: string | null;
  bottomline?: string | null;
  is_mpan?: boolean;
  is_mrpn?: boolean;
  mpan_mrpn_text?: string | null;
}

export type ApplicationMeterApiResponse = Meter & {
  meter_type_name?: string;
  meter_type?: string;
  mpan_mrpn_details?: MpanMrpnDetails | null;
  quote?: MeterQuoteHeaderFields | null;
  quote_header?: MeterQuoteHeaderFields | null;
  aq?: string | null;
};

export interface MeterQuoteFormValues {
  mprn?: string;
  mpanTopValues?: string[];
  mpanBottomValues?: string[];
  postcode?: string;
  supplierId?: number;
  contractStartDate?: string;
  numberOfDays?: string;
  currentStandingCharge?: string;
  dayRate?: string;
  dayKwh?: string;
  nightRate?: string;
  nightKwh?: string;
  ewRate?: string;
  ewKwh?: string;
  winterRate?: string;
  winterKwh?: string;
}

function formatDateForInput(dateString: string): string {
  if (!dateString) return "";
  try {
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return "";
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  } catch {
    return "";
  }
}

function hasValue(value: string | null | undefined): value is string {
  return value != null && value !== "" && value !== "None";
}

/** Merge quote, legacy quote_header, and mpan_mrpn_details into one field set. */
function extractQuoteFields(
  data: ApplicationMeterApiResponse
): MeterQuoteHeaderFields {
  const mpanDetails = data.mpan_mrpn_details ?? {};
  const quote = data.quote ?? data.quote_header ?? {};

  return {
    profileclass: quote.profileclass ?? mpanDetails.profileclass ?? null,
    MTC: quote.MTC ?? mpanDetails.MTC ?? null,
    LLF: quote.LLF ?? mpanDetails.LLF ?? null,
    Region: quote.Region ?? mpanDetails.Region ?? null,
    bottomline:
      quote.bottomline ??
      mpanDetails.bottomline ??
      data.meter_reference ??
      null,
    postcode: quote.postcode ?? null,
    Supplier: quote.Supplier ?? quote.supplier,
    Number_of_Days: quote.Number_of_Days,
    Contract_Start_Date: quote.Contract_Start_Date,
    Contract_Rates: quote.Contract_Rates,
    is_mpan: quote.is_mpan ?? mpanDetails.is_mpan,
    is_mrpn: quote.is_mrpn ?? mpanDetails.is_mrpn,
  };
}

function extractRatesFromContractRates(
  contractRates?: MeterContractRate[],
  aqFallback?: string | null
) {
  const rates = {
    currentStandingCharge: "",
    dayRate: "",
    dayKwh: "",
    nightRate: "",
    nightKwh: "",
    ewRate: "",
    ewKwh: "",
    winterRate: "",
    winterKwh: "",
  };

  if (contractRates?.length) {
    contractRates.forEach((rate) => {
      switch (rate.rate_type) {
        case 1:
          rates.currentStandingCharge = rate.rate?.toString() ?? "";
          break;
        case 2:
          rates.dayRate = rate.rate?.toString() ?? "";
          rates.dayKwh = rate.usage?.toString() ?? "";
          break;
        case 3:
          rates.nightRate = rate.rate?.toString() ?? "";
          rates.nightKwh = rate.usage?.toString() ?? "";
          break;
        case 4:
          rates.ewRate = rate.rate?.toString() ?? "";
          rates.ewKwh = rate.usage?.toString() ?? "";
          break;
        case 5:
          rates.winterRate = rate.rate?.toString() ?? "";
          rates.winterKwh = rate.usage?.toString() ?? "";
          break;
        default:
          break;
      }
    });
  }

  if (!rates.dayKwh && aqFallback) {
    const parsedAq = parseFloat(aqFallback);
    if (!Number.isNaN(parsedAq)) {
      rates.dayKwh = String(Math.round(parsedAq));
    }
  }

  return rates;
}

/** Parse full MPAN reference string into grid rows. */
export function parseMeterReferenceToGrid(meterRef: string) {
  const chars = meterRef.split("");
  let currentIndex = 0;

  const parts = [1, 2, 3, 3, 2, 4, 4, 3].map((count) => {
    const part = chars.slice(currentIndex, currentIndex + count).join("");
    currentIndex += count;
    return part || "0".repeat(count);
  });

  return {
    topRow: [parts[1] || "00", parts[2] || "000", parts[3] || "000"],
    bottomRow: [
      parts[4] || "00",
      parts[5] || "0000",
      parts[6] || "0000",
      parts[7] || "000",
    ],
  };
}

/** Reverse of bottomline = mpanBottomValues.slice(1).join("") */
function bottomlineToBottomRow(region: string, bottomline: string): string[] {
  return [
    region,
    bottomline.slice(0, 4).padEnd(4, "0"),
    bottomline.slice(4, 8).padEnd(4, "0"),
    bottomline.slice(8, 11).padEnd(3, "0"),
  ];
}

function isGasMeter(data: ApplicationMeterApiResponse): boolean {
  const typeLabel = (
    data.meter_type_name ??
    data.meter_type ??
    ""
  ).toLowerCase();

  if (typeLabel.includes("gas")) return true;
  if (typeLabel.includes("electric")) return false;
  if (data.meter_type_id === 2) return true;
  if (data.meter_type_id === 1) return false;

  // Avoid misclassifying when both is_mpan and is_mrpn are true — rely on type first.
  if (data.mpan_mrpn_details?.is_mrpn && !data.mpan_mrpn_details?.is_mpan) {
    return true;
  }

  return false;
}

/** Map GET /api/v1/auth/web/core/meter/{id}/ response to quote form values. */
export function mapMeterApiToQuoteFormValues(
  data: ApplicationMeterApiResponse
): MeterQuoteFormValues {
  const quoteFields = extractQuoteFields(data);
  const rates = extractRatesFromContractRates(
    quoteFields.Contract_Rates,
    data.aq
  );

  const baseValues: MeterQuoteFormValues = {
    postcode: quoteFields.postcode ?? "",
    supplierId: quoteFields.Supplier,
    contractStartDate: formatDateForInput(quoteFields.Contract_Start_Date ?? ""),
    numberOfDays: quoteFields.Number_of_Days?.toString() ?? "365",
    ...rates,
  };

  if (isGasMeter(data)) {
    return {
      ...baseValues,
      mprn:
        quoteFields.bottomline ||
        data.meter_reference ||
        data.mpan_mrpn_details?.bottomline ||
        "",
    };
  }

  if (
    hasValue(quoteFields.profileclass) &&
    hasValue(quoteFields.MTC) &&
    hasValue(quoteFields.LLF) &&
    hasValue(quoteFields.Region) &&
    hasValue(quoteFields.bottomline)
  ) {
    return {
      ...baseValues,
      mpanTopValues: [
        quoteFields.profileclass,
        quoteFields.MTC,
        quoteFields.LLF,
      ],
      mpanBottomValues: bottomlineToBottomRow(
        quoteFields.Region,
        quoteFields.bottomline
      ),
    };
  }

  const parsedReference = parseMeterReferenceToGrid(data.meter_reference);
  return {
    ...baseValues,
    mpanTopValues: parsedReference.topRow,
    mpanBottomValues: parsedReference.bottomRow,
  };
}

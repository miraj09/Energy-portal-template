"use client";
import React, { JSX, useState, useEffect, useCallback } from "react";
import { Button } from "@/ui/button";
import { Card, CardContent } from "@/ui/card";
import { Input } from "@/ui/input";
import { CustomSelect, type SelectOption } from "@/ui/select";
import { Switch } from "@/ui/switch";
import { Slider } from "@/ui/slider";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { QuoteDetailsModal } from "./QuoteDetailsModal";
import { GasQuoteDetailsModal } from "./GasQuoteDetailsModal";
import { CostBreakdownModal } from "./CostBreakdownModal";
import { branding } from "@/lib/config/branding";
// import { getQuoteHeader } from "@/lib/actions/getQuoteHeader";

interface GasQuoteDetailsData {
  mprn: string;
  postcode: string;
  currentSupplier: string;
  contractStartDate: string;
  numberOfDays: string;
  currentStandingCharge: string;
  unitRate: string;
  unitKwh: string;
}

interface CostBreakdownData {
  standingCharge: string;
  dayRate: string;
  dayKwh: string;
  totalCost: string;
  cclRate: string;
  cclCost: string;
  vatRate: string;
  vatCost: string;
  monthlyCost: string;
  savings1: string;
  savings2: string;
}

interface QuoteHeaderData {
  id: number;
  profileclass: string;
  MTC: string;
  LLF: string;
  Region: string;
  bottomline: string;
  postcode: string | null;
  Supplier: number;
  Number_of_Days: number;
  PartnerUserID: string | null;
  isCOT: boolean;
  isRIsk: boolean;
  useUplift: boolean;
  MeterType: number;
  Term: string | null;
  Contract_Start_Date: string;
  Contract_Rates: Array<{
    rate: number;
    usage: number | null;
    rate_type: number;
    rate_required?: boolean;
    usage_required?: boolean;
  }>;
  created_at: string;
  updated_at: string;
}

interface QuoteDataItem {
  id: number;
  term: string;
  supplier: string;
  standingCharge: string;
  dayRate: string;
  totalCost: string;
  monthlyCost: string;
  savings: string;
  supplierLogo: string;
  costBreakdown: CostBreakdownData;
  supplier_name: string;
  latesttariffname: string;
  meterstring: string;
}

interface QuoteTableProps {
  quoteType?: "electricity" | "gas";
  quoteId?: string | null;
}

/** Parse display strings like "1,234.56" into a number for commission math. */
function parseTotalCostPounds(totalCostDisplay: string): number {
  const cleaned = totalCostDisplay.replace(/,/g, "").trim();
  const parsed = Number.parseFloat(cleaned);
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatCommissionPounds(amount: number): string {
  return amount.toLocaleString("en-GB", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export const QuoteTable = ({
  quoteType = "electricity",
  quoteId,
}: QuoteTableProps): JSX.Element => {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isGasModalOpen, setIsGasModalOpen] = useState(false);
  const [isCostBreakdownModalOpen, setIsCostBreakdownModalOpen] =
    useState(false);
  const [selectedGasQuote, setSelectedGasQuote] =
    useState<GasQuoteDetailsData | null>(null);
  const [selectedCostBreakdown, setSelectedCostBreakdown] =
    useState<CostBreakdownData | null>(null);
  const [isCustomerView, setIsCustomerView] = useState(true);
  /** Commission rate (0–3%, step 0.1): row commission = totalCost × rate / 100. */
  const [commissionPercent, setCommissionPercent] = useState(1);
  const [quoteHeaderData, setQuoteHeaderData] =
    useState<QuoteHeaderData | null>(null);
  const [isHeaderLoading, setIsHeaderLoading] = useState(false);

  // Fetch quote header data when quoteId changes
  const fetchQuoteHeaderData = useCallback(async () => {
    if (!quoteId) return;

    try {
      setIsHeaderLoading(true);
      console.log(quoteId, "quoteId");
      // Call local API route to leverage server cookies
      const res = await fetch(
        `/api/quote-header/${encodeURIComponent(quoteId)}`,
        { cache: "no-store" },
      );
      const data = await res.json();
      console.log(data, "data");
      if (!res.ok || data?.success === false) {
        console.error(
          "Failed to fetch quote header:",
          data?.message || res.statusText,
        );
        return;
      }
      // Normalize potential upstream shapes
      const normalized =
        data && typeof data === "object" && "data" in data && data.data
          ? data.data
          : data;
      setQuoteHeaderData(normalized as QuoteHeaderData);
      console.log("Quote header data fetched:", normalized);
    } catch (error) {
      console.error("Error fetching quote header:", error);
    } finally {
      setIsHeaderLoading(false);
    }
  }, [quoteId]);

  useEffect(() => {
    fetchQuoteHeaderData();
  }, [fetchQuoteHeaderData]);

  // Quote data from API
  const [quoteData, setQuoteData] = useState<QuoteDataItem[]>([
    {
      id: 1,
      term: "12 months",
      supplier: "British Gas Lite",
      standingCharge: "45.50p",
      dayRate: "28.45p",
      totalCost: "1,234.56",
      monthlyCost: "102.88",
      savings: "156.78",
      supplierLogo: branding.logoSrc,
      costBreakdown: {
        standingCharge: "45.50p",
        dayRate: "28.45p",
        dayKwh: "4,200",
        totalCost: "1,234.56",
        cclRate: "0.847p",
        cclCost: "35.57",
        vatRate: "20%",
        vatCost: "246.91",
        monthlyCost: "102.88",
        savings1: "156.78",
        savings2: "12.7%",
      },
      supplier_name: "British Gas Lite",
      latesttariffname: "BP SmartFix - 1 Year Level1",
      meterstring: quoteHeaderData?.bottomline || "",
    },
    {
      id: 2,
      term: "24 months",
      supplier: "EDF Energy",
      standingCharge: "42.30p",
      dayRate: "26.80p",
      totalCost: "1,189.45",
      monthlyCost: "99.12",
      savings: "201.89",
      supplierLogo: branding.logoSrc,
      costBreakdown: {
        standingCharge: "42.30p",
        dayRate: "26.80p",
        dayKwh: "4,200",
        totalCost: "1,189.45",
        cclRate: "0.847p",
        cclCost: "35.57",
        vatRate: "20%",
        vatCost: "237.89",
        monthlyCost: "99.12",
        savings1: "201.89",
        savings2: "14.5%",
      },
      supplier_name: "EDF",
      latesttariffname: "SmartFix - 1 Year Level1",
      meterstring: quoteHeaderData?.bottomline || "",
    },
    {
      id: 3,
      term: "24 months",
      supplier: "Scottish Power",
      standingCharge: "34.50p",
      dayRate: "22.30p",
      totalCost: "1,000.00",
      monthlyCost: "83.33",
      savings: "201.89",
      supplierLogo: branding.logoSrc,
      costBreakdown: {
        standingCharge: "34.50p",
        dayRate: "22.30p",
        dayKwh: "4,200",
        totalCost: "1,000.00",
        cclRate: "0.847p",
        cclCost: "35.57",
        vatRate: "20%",
        vatCost: "237.89",
        monthlyCost: "83.33",
        savings1: "201.89",
        savings2: "14.5%",
      },
      supplier_name: "ScottishPower",
      latesttariffname: "Scottish Power - 1 Year Level1",
      meterstring: quoteHeaderData?.bottomline || "",
    },
    {
      id: 4,
      term: "24 months",
      supplier: "Smartest Energy",
      standingCharge: "34.50p",
      dayRate: "22.30p",
      totalCost: "1,000.00",
      monthlyCost: "83.33",
      savings: "201.89",
      supplierLogo: branding.logoSrc,
      costBreakdown: {
        standingCharge: "34.50p",
        dayRate: "22.30p",
        dayKwh: "4,200",
        totalCost: "1,000.00",
        cclRate: "0.847p",
        cclCost: "35.57",
        vatRate: "20%",
        vatCost: "237.89",
        monthlyCost: "83.33",
        savings1: "201.89",
        savings2: "14.5%",
      },
      supplier_name: "SmartestEnergy",
      latesttariffname: "Smartest Energy - 1 Year Level1",
      meterstring: quoteHeaderData?.bottomline || "",
    },
    {
      id: 5,
      term: "24 months",
      supplier: "E On Next",
      standingCharge: "34.50p",
      dayRate: "17.30p",
      totalCost: "900.00",
      monthlyCost: "75.00",
      savings: "201.89",
      supplierLogo: branding.logoSrc,
      costBreakdown: {
        standingCharge: "34.50p",
        dayRate: "17.30p",
        dayKwh: "4,200",
        totalCost: "900.00",
        cclRate: "0.847p",
        cclCost: "35.57",
        vatRate: "20%",
        vatCost: "237.89",
        monthlyCost: "75.00",
        savings1: "201.89",
        savings2: "14.5%",
      },
      supplier_name: "E On Next",
      latesttariffname: "E On Next - 1 Year Level1",
      meterstring: quoteHeaderData?.bottomline || "",
    },
  ]);

  // Sync meterstring from quote header into all existing quote rows when header loads
  useEffect(() => {
    const bottomline = quoteHeaderData?.bottomline ?? "";
    setQuoteData((current) =>
      current.map((item) => ({ ...item, meterstring: bottomline })),
    );
  }, [quoteHeaderData]);

  // Gas quote details from API
  const [gasQuoteDetails] = useState<GasQuoteDetailsData | null>(null);

  // Supplier options from API
  const [supplierOptions] = useState<SelectOption[]>([]);

  const sortOptions = [
    { value: "high", label: "Price: High to Low" },
    { value: "low", label: "Price: Low to High" },
  ];

  const handleShowDetails = async () => {
    if (quoteType === "gas") {
      setSelectedGasQuote(gasQuoteDetails);
      setIsGasModalOpen(true);
      return;
    }
    // Ensure header data is loaded before opening modal
    if (!quoteHeaderData && quoteId) {
      await fetchQuoteHeaderData();
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    // setSelectedQuote(null); // This line is removed
  };

  const handleCloseGasModal = () => {
    setIsGasModalOpen(false);
    setSelectedGasQuote(null);
  };

  const handleShowCostBreakdown = (quote: QuoteDataItem) => {
    setSelectedCostBreakdown(quote.costBreakdown);
    setIsCostBreakdownModalOpen(true);
  };

  const handleCloseCostBreakdownModal = () => {
    setIsCostBreakdownModalOpen(false);
    setSelectedCostBreakdown(null);
  };

  return (
    <section className="w-full max-w-[1106px] mx-auto my-4 lg:my-8 px-4 lg:px-0 bg-white">
      <Card className="w-full shadow-[0px_4px_10px_rgba(0,0,0,0.25)] rounded-lg">
        <CardContent className="p-6">
          {/* Top Action Buttons */}
          <div className="flex flex-wrap gap-4 mb-6">
            <Button
              variant="default"
              className="bg-[#346fb6] text-white cursor-pointer select-none"
              onClick={handleShowDetails}
              disabled={!quoteId || isHeaderLoading}
            >
              {isHeaderLoading ? "Loading..." : "Show Details"}
            </Button>

            <div className="flex items-center gap-2">
              <span className="font-medium text-[#48505e] text-sm">
                Save Quote Reference:
              </span>
              <Input
                className="w-[155px] h-[35px] border-neutral-500 shadow-shadow-xs"
                placeholder="Enter quote reference"
              />
            </div>

            <Button
              variant="default"
              className="bg-[#346fb6] text-white ml-auto"
            >
              Export to PDF
            </Button>

            <Button variant="default" className="bg-[#346fb6] text-white">
              Save Selected Uplifts
            </Button>

            <Button variant="default" className="bg-[#346fb6] text-white">
              Attach Quote to Company
            </Button>
          </div>

          {/* Filter Controls */}
          <div className="flex items-center gap-4 mb-6">
            <div className="flex items-center gap-2">
              <span className="font-medium text-[#48505e] text-sm">
                Supplier
              </span>
              <CustomSelect
                options={supplierOptions}
                placeholder="Select supplier"
                className="w-48"
              />
            </div>

            <div className="flex items-center gap-2 ml-auto">
              <span className="font-medium text-[#48505e] text-sm">
                Sort By
              </span>
              <CustomSelect
                options={sortOptions}
                placeholder="Select sort by"
              />
            </div>
          </div>

          {/* Partner view: commission 0–3%; row amount = totalCost × (slider / 100) */}
          {!isCustomerView && (
            <div className="mb-6 rounded-lg border border-[#bbbbbb] bg-[#f5f8fc] px-4 py-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-6">
                <div className="shrink-0">
                  <span className="font-medium text-[#48505e] text-sm block">
                    Commission on total cost
                  </span>
                  <span className="text-xs text-[#48505e]/80">
                    Applied to each quote&apos;s total cost (0–3p)
                  </span>
                </div>
                <div className="flex flex-1 flex-col gap-2 min-w-0 rounded-full bg-[#346fb6] px-2 py-2.5">
                  <Slider
                    className="w-full"
                    min={0}
                    max={3}
                    step={0.1}
                    value={[commissionPercent]}
                    onValueChange={(values) =>
                      setCommissionPercent(values[0] ?? 0)
                    }
                  />
                  <div className="flex justify-between text-xs text-white">
                    <span>0p</span>
                    <span className="font-semibold text-white">
                      {commissionPercent.toFixed(1)}p
                    </span>
                    <span>3p</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Responsive Table/Header Wrapper */}
          <div className="w-full overflow-x-auto">
            {/* Header Row */}
            <div
              className={`flex items-center justify-between px-4 md:px-2 sm:px-1 py-3 md:py-2 sm:py-1 bg-[#346fb6] text-white rounded-t-lg font-medium text-sm md:text-xs sm:text-[11px] ${
                isCustomerView
                  ? "min-w-[900px] md:min-w-[700px] sm:min-w-[500px]"
                  : "min-w-[1040px] md:min-w-[820px] sm:min-w-[580px]"
              }`}
            >
              <div className="flex-1 min-w-[140px] md:min-w-[80px] sm:min-w-[50px] text-center">
                Supplier
              </div>
              <div className="flex-1 min-w-[100px] md:min-w-[60px] sm:min-w-[40px] text-center">
                Terms
              </div>
              <div className="flex-1 min-w-[180px] md:min-w-[100px] sm:min-w-[60px] text-center">
                Total Cost / Rates
              </div>
              <div className="flex-1 min-w-[140px] md:min-w-[80px] sm:min-w-[50px] text-center">
                Monthly Cost
              </div>
              <div className="flex-1 min-w-[140px] md:min-w-[80px] sm:min-w-[50px] text-center">
                Savings
              </div>
              {!isCustomerView && (
                <div className="flex-1 min-w-[110px] md:min-w-[90px] sm:min-w-[72px] text-center">
                  Commission
                </div>
              )}
              <div className="flex-1 min-w-[120px] md:min-w-[70px] sm:min-w-[40px] text-center">
                Details
              </div>
              <div className="flex-1 min-w-[120px] md:min-w-[70px] sm:min-w-[40px] text-center">
                Actions
              </div>
            </div>

            {/* Card List (replaces Table) */}
            <div
              className={`mb-6 mt-3 flex flex-col gap-4 ${
                isCustomerView
                  ? "min-w-[900px] md:min-w-[700px] sm:min-w-[500px]"
                  : "min-w-[1040px] md:min-w-[820px] sm:min-w-[580px]"
              }`}
            >
              {quoteData.map((quote) => {
                const totalCostPounds = parseTotalCostPounds(quote.totalCost);
                const commissionPounds =
                  (totalCostPounds * commissionPercent) / 100;

                return (
                <Card
                  key={quote.id}
                  className="w-full border border-[#bbbbbb] rounded-[10px] shadow-sm"
                >
                  <CardContent className="flex items-center justify-between px-4 md:px-2 sm:px-1 py-3 md:py-2 sm:py-1 gap-0">
                    {/* Supplier */}
                    <div className="flex-1 min-w-[140px] md:min-w-[80px] sm:min-w-[50px] flex flex-col items-center text-center">
                      <div className="w-[94px] h-[42px] md:w-[60px] md:h-[28px] sm:w-[36px] sm:h-[18px] rounded border-[0.5px] border-[#346fb6] flex items-center justify-center mb-1">
                        <Image
                          width={81}
                          height={20}
                          className="w-[81px] h-5 md:w-[50px] md:h-4 sm:w-[30px] sm:h-3"
                          alt="Supplier logo"
                          src={quote.supplierLogo}
                        />
                      </div>
                      <div className="flex flex-col items-center text-[8px] md:text-[7px] sm:text-[6px] font-semibold text-[#48505e] text-center leading-[12px]">
                        <span>{quote.supplier}</span>
                        <span>Level1</span>
                      </div>
                    </div>

                    {/* Term */}
                    <div className="flex-1 min-w-[100px] md:min-w-[60px] sm:min-w-[40px] font-medium text-[#48505e] text-sm md:text-xs sm:text-[11px] text-center flex items-center justify-center">
                      {quote.term}
                    </div>

                    {/* Total Cost / Rates */}
                    <div className="flex-1 min-w-[180px] md:min-w-[100px] sm:min-w-[60px] flex flex-col text-center items-center justify-center">
                      <span className="font-medium text-[#48505e] text-sm md:text-xs sm:text-[11px]">
                        £{quote.totalCost}
                      </span>
                      <span className="font-medium text-[#48505e] text-sm md:text-xs sm:text-[11px]">
                        SC: {quote.standingCharge}
                      </span>
                      <span className="font-medium text-[#48505e] text-sm md:text-xs sm:text-[11px]">
                        Day: {quote.dayRate}p
                      </span>
                    </div>

                    {/* Monthly Cost */}
                    <div className="flex-1 min-w-[140px] md:min-w-[80px] sm:min-w-[50px] font-medium text-[#48505e] text-sm md:text-xs sm:text-[11px] text-center flex items-center justify-center">
                      £{quote.monthlyCost}
                    </div>

                    {/* Savings */}
                    <div className="flex-1 min-w-[140px] md:min-w-[80px] sm:min-w-[50px] font-medium text-[#48505e] text-sm md:text-xs sm:text-[11px] text-center flex items-center justify-center">
                      £{quote.savings}
                    </div>

                    {/* Commission (partner view): total cost × slider % */}
                    {!isCustomerView && (
                      <div className="flex-1 min-w-[110px] md:min-w-[90px] sm:min-w-[72px] font-medium text-[#346fb6] text-sm md:text-xs sm:text-[11px] text-center flex items-center justify-center">
                        £{formatCommissionPounds(commissionPounds)}
                      </div>
                    )}

                    {/* Details Button */}
                    <div className="flex-1 min-w-[120px] md:min-w-[70px] sm:min-w-[40px] flex items-center justify-center">
                      <Button
                        variant="default"
                        className="bg-[#2db9eb] text-white h-[36px] md:h-[28px] sm:h-[22px] px-4 md:px-2 sm:px-1 py-2 sm:py-1 flex items-center justify-center text-sm md:text-xs sm:text-[11px]"
                        onClick={() => handleShowCostBreakdown(quote)}
                      >
                        Details
                      </Button>
                    </div>

                    {/* Actions */}
                    <div className="flex-1 min-w-[120px] md:min-w-[70px] sm:min-w-[40px] flex flex-col items-center justify-center">
                      <Button
                        variant="default"
                        className="bg-[#346fb6] text-white h-[36px] md:h-[28px] sm:h-[22px] px-4 md:px-2 sm:px-1 py-2 sm:py-1 mb-2 text-sm md:text-xs sm:text-[11px]"
                        onClick={() => {
                          const basePath =
                            quoteType === "gas"
                              ? `/generate-quote/gas-quote/quote-list/sold-tariff/${quoteId}`
                              : `/generate-quote/electricity-quote/quote-list/sold-tariff/${quoteId}`;
                          try {
                            if (typeof window !== "undefined") {
                              // sessionStorage.setItem(
                              //   "sold_supplier_id",
                              //   (quoteHeaderData as any)?.supplier_id ||
                              //     quoteData.find((q) => q.id === quote.id)
                              //       ?.supplier ||
                              //     "",
                              // );
                              // sessionStorage.setItem(
                              //   "sold_supplier_name",
                              //   (quoteHeaderData as any)?.supplier_name ||
                              //     quoteData.find((q) => q.id === quote.id)
                              //       ?.supplier_name ||
                              //     "",
                              // );
                              // sessionStorage.setItem(
                              //   "sold_latesttariffname",
                              //   (quoteHeaderData as any)?.latesttariffname ||
                              //     quoteData.find((q) => q.id === quote.id)
                              //       ?.latesttariffname ||
                              //     "",
                              // );
                              // sessionStorage.setItem(
                              //   "sold_meterstring",
                              //   quoteHeaderData?.bottomline || "",
                              // );
                              sessionStorage.setItem(
                                "sold_supplier_id",
                                quote.id.toString(),
                              );
                              sessionStorage.setItem(
                                "sold_supplier_name",
                                quote.supplier_name,
                              );
                              sessionStorage.setItem(
                                "sold_latesttariffname",
                                quote.latesttariffname,
                              );
                              sessionStorage.setItem(
                                "sold_meterstring",
                                quote.meterstring,
                              );
                            }
                          } catch (err) {
                            console.error(
                              "Failed to write sold tariff data to sessionStorage",
                              err,
                            );
                          }
                          router.push(basePath);
                        }}
                      >
                        Sold Tariff
                      </Button>
                      <div className="flex items-center">
                        <span className="font-medium text-[#48505e] text-sm md:text-xs sm:text-[11px] mr-2">
                          Export
                        </span>
                        <div className="relative">
                          <Switch className="bg-[#346fb6] rounded-[10px]" />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                );
              })}
            </div>
          </div>

          {/* Pagination */}
        </CardContent>
      </Card>

      {/* Quote Details Modal */}
      <QuoteDetailsModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        isCustomerView={isCustomerView}
        onCustomerViewChange={setIsCustomerView}
        quoteHeaderData={quoteHeaderData}
        onSaveSuccess={() => {
          // Refresh quote header data after successful save
          if (quoteId) {
            fetchQuoteHeaderData();
          }
        }}
      />

      {/* Gas Quote Details Modal */}
      <GasQuoteDetailsModal
        isOpen={isGasModalOpen}
        onClose={handleCloseGasModal}
        quoteData={selectedGasQuote || undefined}
        isCustomerView={isCustomerView}
        onCustomerViewChange={setIsCustomerView}
        quoteHeaderData={quoteHeaderData}
      />

      {/* Cost Breakdown Modal */}
      <CostBreakdownModal
        isOpen={isCostBreakdownModalOpen}
        onClose={handleCloseCostBreakdownModal}
        quoteData={selectedCostBreakdown || undefined}
        isCustomerView={isCustomerView}
      />
    </section>
  );
};

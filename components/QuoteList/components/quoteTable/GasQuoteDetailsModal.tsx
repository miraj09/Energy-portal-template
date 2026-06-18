"use client";
import React, { JSX, useState, useEffect, useCallback } from "react";
import Select, { StylesConfig } from "react-select";
import { Button } from "@/ui/button";
import { Card, CardContent } from "@/ui/card";
import { Input } from "@/ui/input";
import CustomDateInput from "@/ui/customDateInput";
import { Dialog, DialogContent } from "@/ui/modal";
import { Switch } from "@/ui/switch";
import { SupplierOption } from "@/hooks/useSuppliers";
import { useSupplierContext } from "@/contexts/SupplierContext";

// Suppliers will be loaded from context

// Custom styles for react-select to match the design
const customSelectStyles: StylesConfig<SupplierOption> = {
  control: (provided, state) => ({
    ...provided,
    height: "35px",
    minHeight: "35px",
    border: "0.8px solid #363636",
    borderRadius: "6px",
    boxShadow: state.isFocused
      ? "0px 1px 2px rgba(16, 24, 40, 0.05), 0 0 0 2px rgba(52, 111, 182, 0.2)"
      : "0px 1px 2px rgba(16, 24, 40, 0.05)",
    "&:hover": {
      borderColor: "#363636",
    },
    fontSize: "12px",
    fontFamily: "Inter, Helvetica",
    "@media (min-width: 640px)": {
      fontSize: "13px",
    },
    "@media (min-width: 768px)": {
      fontSize: "14px",
    },
  }),
  valueContainer: (provided) => ({
    ...provided,
    height: "33px",
    padding: "0 8px",
  }),
  input: (provided) => ({
    ...provided,
    margin: "0px",
  }),
  indicatorSeparator: () => ({
    display: "none",
  }),
  indicatorsContainer: (provided) => ({
    ...provided,
    height: "33px",
  }),
  dropdownIndicator: (provided) => ({
    ...provided,
    color: "#666",
    "&:hover": {
      color: "#333",
    },
  }),
  menu: (provided) => ({
    ...provided,
    zIndex: 9999,
    border: "0.8px solid #363636",
    borderRadius: "6px",
    boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.1)",
  }),
  option: (provided, state) => ({
    ...provided,
    backgroundColor: state.isSelected
      ? "#346fb6"
      : state.isFocused
      ? "#f0f8ff"
      : "white",
    color: state.isSelected ? "white" : "#363636",
    fontSize: "12px",
    fontFamily: "Inter, Helvetica",
    "@media (min-width: 640px)": {
      fontSize: "13px",
    },
    "@media (min-width: 768px)": {
      fontSize: "14px",
    },
    "&:hover": {
      backgroundColor: state.isSelected ? "#346fb6" : "#f0f8ff",
    },
  }),
  singleValue: (provided) => ({
    ...provided,
    color: "#363636",
    fontSize: "12px",
    fontFamily: "Inter, Helvetica",
    "@media (min-width: 640px)": {
      fontSize: "13px",
    },
    "@media (min-width: 768px)": {
      fontSize: "14px",
    },
  }),
  placeholder: (provided) => ({
    ...provided,
    color: "#999",
    fontSize: "12px",
    fontFamily: "Inter, Helvetica",
    "@media (min-width: 640px)": {
      fontSize: "13px",
    },
    "@media (min-width: 768px)": {
      fontSize: "14px",
    },
  }),
};

interface GasQuoteDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  quoteData?: {
    mprn: string;
    postcode: string;
    currentSupplier: string;
    contractStartDate: string;
    numberOfDays: string;
    currentStandingCharge: string;
    unitRate: string;
    unitKwh: string;
  };
  isCustomerView?: boolean;
  onCustomerViewChange?: (value: boolean) => void;
  quoteHeaderData?: {
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
  } | null;
}

export const GasQuoteDetailsModal = ({
  isOpen,
  onClose,
  quoteData,
  isCustomerView = true,
  onCustomerViewChange,
  quoteHeaderData,
}: GasQuoteDetailsModalProps): JSX.Element => {
  // Suppliers from context
  const { supplierOptions, loading: suppliersLoading } = useSupplierContext();

  // State for form fields
  const [formData, setFormData] = useState({
    mprn: quoteData?.mprn || "",
    postcode: quoteData?.postcode || "",
    currentSupplier: quoteData?.currentSupplier || "",
    contractStartDate: quoteData?.contractStartDate || "",
    numberOfDays: quoteData?.numberOfDays || "",
    currentStandingCharge: quoteData?.currentStandingCharge || "",
    unitRate: quoteData?.unitRate || "",
    unitKwh: quoteData?.unitKwh || "",
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Helper: format date to YYYY-MM-DD for input
  const formatDateForInput = useCallback((dateString: string): string => {
    if (!dateString) return "";
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "";
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    } catch {
      return "";
    }
  }, []);

  // Helper: extract gas rates from Contract_Rates (1: standing, 2: unit)
  const extractGasRates = useCallback((qh: GasQuoteDetailsModalProps["quoteHeaderData"]) => {
    const empty = { currentStandingCharge: "", unitRate: "", unitKwh: "" };
    if (!qh?.Contract_Rates) return empty;
    const rates = { ...empty };
    qh.Contract_Rates.forEach((rate: { rate: number; usage: number | null; rate_type: number }) => {
      switch (rate.rate_type) {
        case 1:
          rates.currentStandingCharge = rate.rate?.toString?.() || "";
          break;
        case 2:
          rates.unitRate = rate.rate?.toString?.() || "";
          rates.unitKwh = rate.usage?.toString?.() || "";
          break;
      }
    });
    return rates;
  }, []);

  // Prefill from quoteHeaderData when available
  useEffect(() => {
    if (!quoteHeaderData) return;
    const rates = extractGasRates(quoteHeaderData);
    setFormData((prev) => ({
      ...prev,
      mprn: quoteHeaderData.bottomline || prev.mprn,
      postcode: quoteHeaderData.postcode || prev.postcode,
      currentSupplier: quoteHeaderData.Supplier?.toString?.() || prev.currentSupplier,
      contractStartDate: formatDateForInput(quoteHeaderData.Contract_Start_Date || "") || prev.contractStartDate,
      numberOfDays: quoteHeaderData.Number_of_Days?.toString?.() || prev.numberOfDays,
      currentStandingCharge: rates.currentStandingCharge || prev.currentStandingCharge,
      unitRate: rates.unitRate || prev.unitRate,
      unitKwh: rates.unitKwh || prev.unitKwh,
    }));
  }, [quoteHeaderData, extractGasRates, formatDateForInput]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto bg-white">
        <div className="p-4 lg:p-6">
          <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center mb-6 lg:mb-8 gap-4">
            <h2 className="font-['Plus_Jakarta_Sans'] font-semibold text-[#363636] text-lg sm:text-xl lg:text-2xl xl:text-3xl leading-5">
              Gas Quote
            </h2>
            <div className="flex items-center gap-2">
              <span className="font-['Inter'] font-medium text-gray-700 text-sm sm:text-base lg:text-lg xl:text-xl leading-6">
                Customer View:
              </span>
              <Switch
                checked={isCustomerView}
                onCheckedChange={onCustomerViewChange}
                className="data-[state=checked]:bg-[#2db9eb] data-[state=unchecked]:bg-gray-200"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left column - Current meter details */}
            <div>
              <h3 className="font-['Inter'] font-medium text-gray-700 text-sm sm:text-base lg:text-lg xl:text-xl leading-6 mb-4">
                <span className="text-[#48505e]">Current meter details</span>
                <span className="text-[#dc3739]">*</span>
              </h3>

              <Card className="border-[0.8px] border-solid border-gray-500 rounded-[10px]">
                <CardContent className="p-3 sm:p-4 lg:p-6 space-y-3 sm:space-y-4 lg:space-y-6">
                  {/* MPRN Section */}
                  <div className="space-y-1.5 sm:space-y-2">
                    <label className="font-['Inter'] font-medium text-gray-700 text-xs sm:text-sm lg:text-base leading-6">
                      MPRN:
                    </label>
                    <Input
                      value={formData.mprn}
                      onChange={(e) => handleInputChange("mprn", e.target.value)}
                      placeholder="Enter MPRN"
                      className="h-8.75 border-[0.8px] border-solid border-[#363636] shadow-[0px_1px_2px_rgba(16,24,40,0.05)] text-xs sm:text-sm lg:text-base text-[#858D9D]"
                    />
                  </div>

                  {/* Postcode */}
                  <div className="space-y-1.5 sm:space-y-2">
                    <label className="font-['Inter'] font-medium text-gray-700 text-xs sm:text-sm lg:text-base leading-6">
                      Postcode:
                    </label>
                    <Input
                      value={formData.postcode}
                      onChange={(e) => handleInputChange("postcode", e.target.value)}
                      placeholder="Enter postcode"
                      className="h-8.75 border-[0.8px] border-solid border-[#363636] shadow-[0px_1px_2px_rgba(16,24,40,0.05)] text-xs sm:text-sm lg:text-base text-[#858D9D]"
                    />
                  </div>

                  {/* Current Supplier */}
                  <div className="space-y-1.5 sm:space-y-2">
                    <label className="font-['Inter'] font-medium text-gray-700 text-xs sm:text-sm lg:text-base leading-6">
                      Current Supplier:
                    </label>
                    <Select<SupplierOption>
                      options={supplierOptions}
                      value={supplierOptions.find((opt) => opt.value === formData.currentSupplier) || null}
                      onChange={(option) => handleInputChange('currentSupplier', option?.value || '')}
                      styles={customSelectStyles}
                      placeholder={suppliersLoading ? "Loading suppliers..." : "Select supplier"}
                      isLoading={suppliersLoading}
                      isSearchable
                      className="react-select-container"
                      classNamePrefix="react-select"
                    />
                  </div>

                  {/* Contract Start Date */}
                  <div className="space-y-1.5 sm:space-y-2">
                    <label className="font-['Inter'] font-medium text-gray-700 text-xs sm:text-sm lg:text-base leading-6">
                      Contract Start Date:
                    </label>
                    <CustomDateInput 
                      value={formData.contractStartDate}
                      onChange={(value) => handleInputChange('contractStartDate', value)}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right column - Current rates & charges */}
            <div>
              <h3 className="font-['Inter'] font-medium text-gray-700 text-sm sm:text-base lg:text-lg xl:text-xl leading-6 mb-4">
                <span className="text-[#48505e]">
                  Current rates & charges
                </span>
                <span className="text-[#dc3739]">*</span>
              </h3>

              <Card className="border-[0.8px] border-solid border-gray-500 rounded-[10px]">
                <CardContent className="p-4 lg:p-6">
                  <div className="grid grid-cols-1 gap-4">
                    {/* Row 1: Number of Days */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex flex-col space-y-2">
                        <label className="font-['Inter'] font-medium text-gray-700 text-xs sm:text-sm lg:text-base leading-6">
                          Number of Days:
                        </label>
                        <Input
                          value={formData.numberOfDays}
                          onChange={(e) => handleInputChange("numberOfDays", e.target.value)}
                          placeholder="26"
                          className="h-8.75 border-[0.8px] border-solid border-[#363636] shadow-[0px_1px_2px_rgba(16,24,40,0.05)] text-xs sm:text-sm lg:text-base text-[#858D9D]"
                        />
                      </div>
                    </div>

                    {/* Row 2: Current Standing Charge */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex flex-col space-y-2">
                        <label className="font-['Inter'] font-medium text-gray-700 text-xs sm:text-sm lg:text-base leading-6">
                          Current Standing Charge:
                        </label>
                        <div className="relative">
                          <Input
                            value={formData.currentStandingCharge}
                            onChange={(e) => handleInputChange("currentStandingCharge", e.target.value)}
                            placeholder="1"
                            className="h-8.75 border-[0.8px] border-solid border-[#363636] shadow-[0px_1px_2px_rgba(16,24,40,0.05)] pr-[35px] text-xs sm:text-sm lg:text-base text-[#858D9D]"
                          />
                          <div className="absolute right-0 top-0 w-8.75 h-8.75 bg-[#346fb6] flex items-center justify-center rounded-r-md">
                            <span className="font-['Inter'] font-medium text-white text-base sm:text-lg lg:text-xl leading-6">
                              P
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Row 3: Unit Rate */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex flex-col space-y-2">
                        <label className="font-['Inter'] font-medium text-gray-700 text-xs sm:text-sm lg:text-base leading-6">
                          Unit Rate:
                        </label>
                        <div className="relative">
                          <Input
                            value={formData.unitRate}
                            onChange={(e) => handleInputChange("unitRate", e.target.value)}
                            placeholder="36"
                            className="h-8.75 border-[0.8px] border-solid border-[#363636] shadow-[0px_1px_2px_rgba(16,24,40,0.05)] pr-[35px] text-xs sm:text-sm lg:text-base text-[#858D9D]"
                          />
                          <div className="absolute right-0 top-0 w-8.75 h-8.75 bg-[#346fb6] flex items-center justify-center rounded-r-md">
                            <span className="font-['Inter'] font-medium text-white text-base sm:text-lg lg:text-xl leading-6">
                              P
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col space-y-2">
                        <label className="invisible">Kwh</label>
                        <div className="relative">
                          <Input
                            value={formData.unitKwh}
                            onChange={(e) => handleInputChange("unitKwh", e.target.value)}
                            placeholder="30000"
                            className="h-8.75 border-[0.8px] border-solid border-[#363636] shadow-[0px_1px_2px_rgba(16,24,40,0.05)] pr-[55px] text-xs sm:text-sm lg:text-base text-[#858D9D]"
                          />
                          <div className="absolute right-0 top-0 w-[55px] h-8.75 bg-[#346fb6] flex items-center justify-center rounded-r-md">
                            <span className="font-['Inter'] font-medium text-white text-base sm:text-lg lg:text-xl leading-6">
                              Kwh
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <Button 
              variant="outline" 
              onClick={onClose}
              className="border-[#346fb6] text-[#346fb6] hover:bg-[#346fb6] hover:text-white"
            >
              Close
            </Button>
            <Button 
              className="bg-[#2db9eb] hover:bg-[#2db9eb]/90 text-white"
              onClick={() => {
                // Handle save logic here
                console.log('Saving gas quote details:', formData);
                onClose();
              }}
            >
              Save Changes
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}; 
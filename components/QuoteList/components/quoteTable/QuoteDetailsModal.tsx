"use client";
import React, { JSX, useState, useRef, useEffect } from "react";
import Select, { StylesConfig } from "react-select";
import { Button } from "@/ui/button";
import { Card, CardContent } from "@/ui/card";
import { Input } from "@/ui/input";
import CustomDateInput from "@/ui/customDateInput";
import { Dialog, DialogContent } from "@/ui/modal";
import { Switch } from "@/ui/switch";
import { patchMethod } from "@/lib/actions/patchMethod";
import { toast } from "sonner";
import { buildFlatQuotePayload } from "@/composable/meterQuoteForm";

// Import supplier types and context from the hook
import { SupplierOption } from "@/hooks/useSuppliers";
import { useSupplierContext } from "@/contexts/SupplierContext";

// Interface for quote header data
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
  Contract_Start_Date: string;
  standing_charge?: string | number | null;
  day_rate?: string | number | null;
  day_kwh?: string | number | null;
  night_rate?: string | number | null;
  night_kwh?: string | number | null;
  ew_rate?: string | number | null;
  ew_kwh?: string | number | null;
  winter_rate?: string | number | null;
  winter_kwh?: string | number | null;
  /** Legacy — fallback read only */
  Contract_Rates?: Array<{
    rate: number;
    usage: number | null;
    rate_type: number;
    rate_required?: boolean;
    usage_required?: boolean;
  }>;
  created_at: string;
  updated_at: string;
}

// Data for MPAN grid with digit limits
const mpanTopRow = [
  { value: "03", maxLength: 2 },
  { value: "801", maxLength: 3 },
  { value: "444", maxLength: 3 },
];

const mpanBottomRow = [
  { value: "12", maxLength: 2 },
  { value: "0033", maxLength: 4 },
  { value: "4580", maxLength: 4 },
  { value: "324", maxLength: 3 },
];

// Dynamic suppliers will be fetched from API

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

interface QuoteDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  isCustomerView?: boolean;
  onCustomerViewChange?: (value: boolean) => void;
  quoteHeaderData?: QuoteHeaderData | null;
  onSaveSuccess?: () => void;
}

export const QuoteDetailsModal = ({
  isOpen,
  onClose,
  isCustomerView = true,
  onCustomerViewChange,
  quoteHeaderData,
  onSaveSuccess,
}: QuoteDetailsModalProps): JSX.Element => {
  console.log(quoteHeaderData, "quoteHeaderData");

  // Add state for save functionality
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Use supplier context instead of local state
  const { supplierOptions, loading: suppliersLoading, findSupplierById } = useSupplierContext();

  // Helper function to extract MPAN values from quoteHeaderData
  const extractMpanValues = React.useCallback(() => {
    if (!quoteHeaderData) return { top: ["", "", ""], bottom: ["", "", "", ""] };
    
    const top = [
      quoteHeaderData.profileclass || "",
      quoteHeaderData.MTC || "",
      quoteHeaderData.LLF || ""
    ];
    
    const bottom = [
      quoteHeaderData.Region || "",
      quoteHeaderData.bottomline?.substring(0, 4) || "",
      quoteHeaderData.bottomline?.substring(4, 8) || "",
      quoteHeaderData.bottomline?.substring(8, 11) || ""
    ];
    
    return { top, bottom };
  }, [quoteHeaderData]);

  // Helper function to format date for date input (YYYY-MM-DD)
  const formatDateForInput = React.useCallback((dateString: string): string => {
    if (!dateString) return "";
    try {
      // Handle ISO with time e.g. 2024-01-15T00:00:00Z
      if (dateString.includes('T')) {
        const isoDate = dateString.slice(0, 10);
        if (/^\d{4}-\d{2}-\d{2}$/.test(isoDate)) return isoDate;
      }
      // Already in YYYY-MM-DD
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) return dateString;
      // Handle DD/MM/YYYY
      if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateString)) {
        const [dd, mm, yyyy] = dateString.split('/');
        return `${yyyy}-${mm}-${dd}`;
      }
      // Fallback
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "";
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    } catch (error) {
      console.warn('Error formatting date:', error);
      return "";
    }
  }, []);

  // Read flat rate fields first; fall back to legacy Contract_Rates
  const extractRates = React.useCallback(() => {
    const empty = {
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

    if (!quoteHeaderData) return empty;

    const hasFlatRates =
      quoteHeaderData.standing_charge != null ||
      quoteHeaderData.day_rate != null ||
      quoteHeaderData.day_kwh != null;

    if (hasFlatRates) {
      const format = (value: string | number | null | undefined) =>
        value == null ? "" : String(value);

      return {
        currentStandingCharge: format(quoteHeaderData.standing_charge),
        dayRate: format(quoteHeaderData.day_rate),
        dayKwh: format(quoteHeaderData.day_kwh),
        nightRate: format(quoteHeaderData.night_rate),
        nightKwh: format(quoteHeaderData.night_kwh),
        ewRate: format(quoteHeaderData.ew_rate),
        ewKwh: format(quoteHeaderData.ew_kwh),
        winterRate: format(quoteHeaderData.winter_rate),
        winterKwh: format(quoteHeaderData.winter_kwh),
      };
    }

    if (!quoteHeaderData.Contract_Rates) {
      return empty;
    }

    const rates = { ...empty };

    quoteHeaderData.Contract_Rates.forEach((rate) => {
      switch (rate.rate_type) {
        case 1:
          rates.currentStandingCharge = rate.rate.toString();
          break;
        case 2:
          rates.dayRate = rate.rate.toString();
          rates.dayKwh = rate.usage?.toString() || "";
          break;
        case 3:
          rates.nightRate = rate.rate.toString();
          rates.nightKwh = rate.usage?.toString() || "";
          break;
        case 4:
          rates.ewRate = rate.rate.toString();
          rates.ewKwh = rate.usage?.toString() || "";
          break;
        case 5:
          rates.winterRate = rate.rate.toString();
          rates.winterKwh = rate.usage?.toString() || "";
          break;
      }
    });

    return rates;
  }, [quoteHeaderData]);

  // Initialize MPAN values from quoteHeaderData
  const initialMpanValues = extractMpanValues();

  // State for MPAN inputs - prefilled with quote data or empty
  const [mpanTopValues, setMpanTopValues] = useState<string[]>(
    initialMpanValues.top
  );
  const [mpanBottomValues, setMpanBottomValues] = useState<string[]>(
    initialMpanValues.bottom
  );

  // State for other form fields - initialize with empty values, will be populated by useEffect
  const [formData, setFormData] = useState({
    currentSupplier: "",
    contractStartDate: "",
    numberOfDays: "",
    currentStandingCharge: "",
    dayRate: "",
    dayKwh: "",
    nightRate: "",
    nightKwh: "",
    ewRate: "",
    ewKwh: "",
    winterRate: "",
    winterKwh: "",
  });

  // Update form data when quoteHeaderData arrives
  useEffect(() => {
    if (quoteHeaderData) {
      const mpanValues = extractMpanValues();
      const rates = extractRates();
      
      console.log('Updating form data:', {
        supplier: quoteHeaderData.Supplier,
        contractStartDate: quoteHeaderData.Contract_Start_Date,
        formattedDate: formatDateForInput(quoteHeaderData.Contract_Start_Date || ""),
        supplierOptions: supplierOptions.length
      });
      
      setMpanTopValues(mpanValues.top);
      setMpanBottomValues(mpanValues.bottom);
      
      setFormData({
        currentSupplier: quoteHeaderData.Supplier?.toString() || "",
        contractStartDate: formatDateForInput(quoteHeaderData.Contract_Start_Date || ""),
        numberOfDays: quoteHeaderData.Number_of_Days?.toString() || "",
        currentStandingCharge: rates.currentStandingCharge,
        dayRate: rates.dayRate,
        dayKwh: rates.dayKwh,
        nightRate: rates.nightRate,
        nightKwh: rates.nightKwh,
        ewRate: rates.ewRate,
        ewKwh: rates.ewKwh,
        winterRate: rates.winterRate,
        winterKwh: rates.winterKwh,
      });
    }
  }, [quoteHeaderData, supplierOptions, extractMpanValues, extractRates, formatDateForInput]);

  // Suppliers are now loaded from context, no need for local fetching
  const selectedSupplierOption = React.useMemo(() => {
    if (!formData.currentSupplier) return null;
    const found = supplierOptions.find((opt) => opt.value === formData.currentSupplier);
    if (found) return found;
    const fallbackName = findSupplierById(formData.currentSupplier)?.name || formData.currentSupplier;
    return { value: formData.currentSupplier, label: fallbackName };
  }, [formData.currentSupplier, supplierOptions, findSupplierById]);

  // Refs for MPAN inputs
  const mpanTopRefs = useRef<(HTMLInputElement | null)[]>([null, null, null]);
  const mpanBottomRefs = useRef<(HTMLInputElement | null)[]>([
    null,
    null,
    null,
    null,
  ]);

  // Handle MPAN input change with auto-focus
  const handleMpanTopChange = (index: number, value: string) => {
    const newValues = [...mpanTopValues];
    newValues[index] = value;
    setMpanTopValues(newValues);

    // Auto-focus to next input if current input is filled
    if (value.length === mpanTopRow[index].maxLength) {
      if (index < mpanTopRow.length - 1) {
        // Move to next input in top row
        mpanTopRefs.current[index + 1]?.focus();
      } else {
        // Move to first input in bottom row when top row is complete
        mpanBottomRefs.current[0]?.focus();
      }
    }
  };

  const handleMpanBottomChange = (index: number, value: string) => {
    const newValues = [...mpanBottomValues];
    newValues[index] = value;
    setMpanBottomValues(newValues);

    // Auto-focus to next input if current input is filled
    if (
      value.length === mpanBottomRow[index].maxLength &&
      index < mpanBottomRow.length - 1
    ) {
      mpanBottomRefs.current[index + 1]?.focus();
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Handle save functionality
  const handleSave = async () => {
    if (!quoteHeaderData?.id) {
      setSaveError("No quote ID available for saving");
      toast.error("No quote ID available for saving");
      return;
    }

    setIsSaving(true);
    setSaveError(null);
    setSaveSuccess(false);

    try {
      // Build the updated data structure for the API
      const updatedData = buildUpdatedQuoteData();
      
      console.log('Saving quote details:', updatedData);
      
      // Make API call to update the quote
      const response = await patchMethod(
        updatedData,
        `/api/v1/auth/web/core/quote-header/${quoteHeaderData.id}/`
      );
      
      if (response.success) {
        setSaveSuccess(true);
        console.log('Quote updated successfully:', response.data);
        toast.success('Quote updated successfully');
        
        // Call the success callback to refresh parent data
        if (onSaveSuccess) {
          onSaveSuccess();
        }
        
        // Show success message briefly before closing
        setTimeout(() => {
          onClose();
        }, 1500);
      } else {
        // Standardized validation error toast
        const errors = response.errors as Record<string, string[] | string> | undefined;
        if (errors && typeof errors === 'object') {
          const firstKey = Object.keys(errors)[0];
          if (firstKey) {
            const raw = Array.isArray(errors[firstKey]) ? (errors[firstKey] as string[])[0] : String(errors[firstKey]);
            const message = raw?.startsWith('This field')
              ? `${firstKey.charAt(0).toUpperCase()}${firstKey.slice(1)}${raw.replace('This field', '')}`.trim()
              : raw || response.message || 'Request failed';
            toast.error(message.replace(/\.$/, ''));
          } else {
            toast.error(response.message || 'Request failed');
          }
        } else {
          toast.error(response.message || 'Request failed');
        }
        setSaveError(response.message || 'Failed to update quote');
        console.error('Quote update failed:', response.message, response.errors);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      setSaveError(errorMessage);
      toast.error(errorMessage);
      console.error('Error saving quote:', error);
    } finally {
      setIsSaving(false);
    }
  };

  // Build flat quote-header PATCH payload (no Contract_Rates)
  const buildUpdatedQuoteData = () => {
    const profileclass = mpanTopValues[0] || "";
    const MTC = mpanTopValues[1] || "";
    const LLF = mpanTopValues[2] || "";
    const Region = mpanBottomValues[0] || "";
    const bottomline = mpanBottomValues.slice(1).join("") || "";

    return buildFlatQuotePayload({
      isGas: false,
      profileclass,
      MTC,
      LLF,
      Region,
      bottomline,
      postcode: quoteHeaderData?.postcode ?? null,
      supplierId:
        parseInt(formData.currentSupplier, 10) || quoteHeaderData?.Supplier,
      numberOfDays: formData.numberOfDays,
      contractStartDate:
        formData.contractStartDate || quoteHeaderData?.Contract_Start_Date || "",
      currentStandingCharge: formData.currentStandingCharge,
      dayRate: formData.dayRate,
      dayKwh: formData.dayKwh,
      nightRate: formData.nightRate,
      nightKwh: formData.nightKwh,
      ewRate: formData.ewRate,
      ewKwh: formData.ewKwh,
      winterRate: formData.winterRate,
      winterKwh: formData.winterKwh,
    });
  };

  // Reset save states when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setSaveError(null);
      setSaveSuccess(false);
      // Re-initialize fields from the latest quoteHeaderData on open
      if (quoteHeaderData) {
        const mpanValues = extractMpanValues();
        const rates = extractRates();
        setMpanTopValues(mpanValues.top);
        setMpanBottomValues(mpanValues.bottom);
        setFormData({
          currentSupplier: quoteHeaderData.Supplier?.toString() || "",
          contractStartDate: formatDateForInput(quoteHeaderData.Contract_Start_Date || ""),
          numberOfDays: quoteHeaderData.Number_of_Days?.toString() || "",
          currentStandingCharge: rates.currentStandingCharge,
          dayRate: rates.dayRate,
          dayKwh: rates.dayKwh,
          nightRate: rates.nightRate,
          nightKwh: rates.nightKwh,
          ewRate: rates.ewRate,
          ewKwh: rates.ewKwh,
          winterRate: rates.winterRate,
          winterKwh: rates.winterKwh,
        });
      }
    }
  }, [isOpen, quoteHeaderData, extractMpanValues, extractRates, formatDateForInput]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto bg-white">
        <div className="p-4 lg:p-6">
            <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center mb-6 lg:mb-8 gap-4">
              <h2 className="font-['Plus_Jakarta_Sans'] font-semibold text-[#363636] text-lg sm:text-xl lg:text-2xl xl:text-3xl leading-5">
                Edit Electricity Quote
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
                    {/* MPAN Section */}
                    <div className="space-y-1.5 sm:space-y-2">
                      <label className="font-['Inter'] font-medium text-gray-700 text-xs sm:text-sm lg:text-base leading-6">
                        MPAN:
                      </label>
                      <div className="flex flex-row space-y-0">
                        <div className="w-[40px] sm:w-[50px] xl:w-[55px] h-[40px] sm:h-[47px] lg:h-[54px] flex items-center justify-center bg-white border-[0.8px] border-r-0 border-solid border-[#363636] shadow-[0px_1px_2px_rgba(16,24,40,0.05)]">
                          <span className="font-['Inter'] font-medium text-[#363636] text-lg sm:text-xl lg:text-2xl xl:text-4xl leading-6">
                            S
                          </span>
                        </div>
                        <div className="flex flex-col flex-1">
                          <div className="flex">
                            <div className="flex-1 h-[20px] sm:h-[23.5px] lg:h-[27px] bg-white border-[0.8px] border-b-0 border-solid border-[#363636] shadow-[0px_1px_2px_rgba(16,24,40,0.05)] flex">
                              {mpanTopRow.map((item, index) => (
                                <div
                                  key={`top-${index}`}
                                  className={`flex-1 flex items-center justify-center ${
                                    index < mpanTopRow.length - 1
                                      ? "border-r border-[#363636]"
                                      : ""
                                  }`}
                                >
                                  <Input
                                    ref={(el) => {
                                      mpanTopRefs.current[index] = el;
                                    }}
                                    value={mpanTopValues[index]}
                                    onChange={(e) =>
                                      handleMpanTopChange(index, e.target.value)
                                    }
                                    maxLength={item.maxLength}
                                    placeholder={item.value}
                                    className="h-full border-0 rounded-none text-center font-['Inter'] font-medium text-gray-500 text-xs sm:text-sm lg:text-base leading-6 bg-transparent focus:ring-0 focus:border-0 p-0 placeholder:text-gray-200 placeholder:font-light"
                                  />
                                </div>
                              ))}
                            </div>
                          </div>
                          <div className="flex">
                            <div className="flex-1 h-[20px] sm:h-[23.5px] lg:h-[27px] bg-white border-[0.8px] border-solid border-[#363636] shadow-[0px_1px_2px_rgba(16,24,40,0.05)] flex">
                              {mpanBottomRow.map((item, index) => (
                                <div
                                  key={`bottom-${index}`}
                                  className={`flex-1 flex items-center justify-center ${
                                    index < mpanBottomRow.length - 1
                                      ? "border-r border-[#363636]"
                                      : ""
                                  }`}
                                >
                                  <Input
                                    ref={(el) => {
                                      mpanBottomRefs.current[index] = el;
                                    }}
                                    value={mpanBottomValues[index]}
                                    onChange={(e) =>
                                      handleMpanBottomChange(
                                        index,
                                        e.target.value
                                      )
                                    }
                                    maxLength={item.maxLength}
                                    placeholder={item.value}
                                    className="h-full border-0 rounded-none text-center font-['Inter'] font-medium text-xs sm:text-sm lg:text-base leading-6 bg-transparent focus:ring-0 focus:border-0 p-0 placeholder:text-gray-200 placeholder:font-light"
                                  />
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Current Supplier */}
                    <div className="space-y-1.5 sm:space-y-2">
                      <label className="font-['Inter'] font-medium text-gray-700 text-xs sm:text-sm lg:text-base leading-6">
                        Current Supplier:
                      </label>
                      <Select<SupplierOption>
                        options={supplierOptions}
                        value={selectedSupplierOption}
                        onChange={(option) => handleInputChange('currentSupplier', option?.value || '')}
                        styles={customSelectStyles}
                        placeholder={suppliersLoading ? "Loading suppliers..." : "Select supplier"}
                        isLoading={suppliersLoading}
                        isSearchable
                        className="react-select-container"
                        classNamePrefix="react-select"
                      />
                      {/* Debug info */}
                      {/* <div className="text-xs text-gray-500 mt-1">
                        Debug: Supplier ID: {formData.currentSupplier}, 
                        Available options: {supplierOptions.length}, 
                        Selected value: {supplierOptions.find((opt) => opt.value === formData.currentSupplier)?.label || 'Not found'}
                      </div> */}
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
                      {/* Debug info */}
                      {/* <div className="text-xs text-gray-500 mt-1">
                        Debug: Contract Start Date: {formData.contractStartDate}, 
                        Original: {quoteHeaderData?.Contract_Start_Date}
                      </div> */}
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
                      {/* Row 1: Number of Days (top), Current Standing Charge (bottom) */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col space-y-2">
                          <label className="font-['Inter'] font-medium text-gray-700 text-xs sm:text-sm lg:text-base leading-6">
                            Number of Days:
                          </label>
                          <Input
                            value={formData.numberOfDays}
                            placeholder="26"
                            className="h-8.75 border-[0.8px] border-solid border-[#363636] shadow-[0px_1px_2px_rgba(16,24,40,0.05)] text-xs sm:text-sm lg:text-base text-[#858D9D]"
                            onChange={(e) => handleInputChange("numberOfDays", e.target.value)}
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col space-y-2">
                          <label className="font-['Inter'] font-medium text-gray-700 text-xs sm:text-sm lg:text-base leading-6">
                            Current Standing Charge:
                          </label>
                          <div className="relative">
                            <Input
                              value={formData.currentStandingCharge}
                              placeholder="1"
                              className="h-8.75 border-[0.8px] border-solid border-[#363636] shadow-[0px_1px_2px_rgba(16,24,40,0.05)] pr-[35px] text-xs sm:text-sm lg:text-base text-[#858D9D]"
                              onChange={(e) => handleInputChange("currentStandingCharge", e.target.value)}
                            />
                            <div className="absolute right-0 top-0 w-8.75 h-8.75 bg-[#346fb6] flex items-center justify-center rounded-r-md">
                              <span className="font-['Inter'] font-medium text-white text-base sm:text-lg lg:text-xl leading-6">
                                P
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Row 2: Day */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col space-y-2">
                          <label className="font-['Inter'] font-medium text-gray-700 text-xs sm:text-sm lg:text-base leading-6">
                            Day:
                          </label>
                          <div className="relative">
                            <Input
                              value={formData.dayRate}
                              placeholder="36"
                              className="h-8.75 border-[0.8px] border-solid border-[#363636] shadow-[0px_1px_2px_rgba(16,24,40,0.05)] pr-[35px] text-xs sm:text-sm lg:text-base text-[#858D9D]"
                              onChange={(e) => handleInputChange("dayRate", e.target.value)}
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
                              value={formData.dayKwh}
                              placeholder="30000"
                              className="h-8.75 border-[0.8px] border-solid border-[#363636] shadow-[0px_1px_2px_rgba(16,24,40,0.05)] pr-[55px] text-xs sm:text-sm lg:text-base text-[#858D9D]"
                              onChange={(e) => handleInputChange("dayKwh", e.target.value)}
                            />
                            <div className="absolute right-0 top-0 w-[55px] h-8.75 bg-[#346fb6] flex items-center justify-center rounded-r-md">
                              <span className="font-['Inter'] font-medium text-white text-base sm:text-lg lg:text-xl leading-6">
                                Kwh
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Row 3: Night */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col space-y-2">
                          <label className="font-['Inter'] font-medium text-gray-700 text-xs sm:text-sm lg:text-base leading-6">
                            Night:
                          </label>
                          <div className="relative">
                            <Input
                              value={formData.nightRate}
                              placeholder=""
                              className="h-8.75 border-[0.8px] border-solid border-[#363636] shadow-[0px_1px_2px_rgba(16,24,40,0.05)] pr-[35px] text-xs sm:text-sm lg:text-base text-[#858D9D]"
                              onChange={(e) => handleInputChange("nightRate", e.target.value)}
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
                              value={formData.nightKwh}
                              placeholder=""
                              className="h-8.75 border-[0.8px] border-solid border-[#363636] shadow-[0px_1px_2px_rgba(16,24,40,0.05)] pr-[55px] text-xs sm:text-sm lg:text-base text-[#858D9D]"
                              onChange={(e) => handleInputChange("nightKwh", e.target.value)}
                            />
                            <div className="absolute right-0 top-0 w-[55px] h-8.75 bg-[#346fb6] flex items-center justify-center rounded-r-md">
                              <span className="font-['Inter'] font-medium text-white text-base sm:text-lg lg:text-xl leading-6">
                                Kwh
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Row 4: EW */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col space-y-2">
                          <label className="font-['Inter'] font-medium text-gray-700 text-xs sm:text-sm lg:text-base leading-6">
                            EW:
                          </label>
                          <div className="relative">
                            <Input
                              value={formData.ewRate}
                              placeholder=""
                              className="h-8.75 border-[0.8px] border-solid border-[#363636] shadow-[0px_1px_2px_rgba(16,24,40,0.05)] pr-[35px] text-xs sm:text-sm lg:text-base text-[#858D9D]"
                              onChange={(e) => handleInputChange("ewRate", e.target.value)}
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
                              value={formData.ewKwh}
                              placeholder=""
                              className="h-8.75 border-[0.8px] border-solid border-[#363636] shadow-[0px_1px_2px_rgba(16,24,40,0.05)] pr-[55px] text-xs sm:text-sm lg:text-base text-[#858D9D]"
                              onChange={(e) => handleInputChange("ewKwh", e.target.value)}
                            />
                            <div className="absolute right-0 top-0 w-[55px] h-8.75 bg-[#346fb6] flex items-center justify-center rounded-r-md">
                              <span className="font-['Inter'] font-medium text-white text-base sm:text-lg lg:text-xl leading-6">
                                Kwh
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Row 5: Winter */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col space-y-2">
                          <label className="font-['Inter'] font-medium text-gray-700 text-xs sm:text-sm lg:text-base leading-6">
                            Winter:
                          </label>
                          <div className="relative">
                            <Input
                              value={formData.winterRate}
                              placeholder=""
                              className="h-8.75 border-[0.8px] border-solid border-[#363636] shadow-[0px_1px_2px_rgba(16,24,40,0.05)] pr-[35px] text-xs sm:text-sm lg:text-base text-[#858D9D]"
                              onChange={(e) => handleInputChange("winterRate", e.target.value)}
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
                              value={formData.winterKwh}
                              placeholder=""
                              className="h-8.75 border-[0.8px] border-solid border-[#363636] shadow-[0px_1px_2px_rgba(16,24,40,0.05)] pr-[55px] text-xs sm:text-sm lg:text-base text-[#858D9D]"
                              onChange={(e) => handleInputChange("winterKwh", e.target.value)}
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
                disabled={isSaving}
              >
                Cancel
              </Button>
              <Button 
                className="bg-[#2db9eb] hover:bg-[#2db9eb]/90 text-white"
                onClick={handleSave}
                disabled={isSaving}
              >
                {isSaving ? "Saving..." : "Save Changes"}
              </Button>
            </div>

            {/* Save Status Messages */}
            {saveError && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-red-700 text-sm">{saveError}</p>
              </div>
            )}
            
            {saveSuccess && (
              <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-md">
                <p className="text-green-700 text-sm">Quote updated successfully!</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    );
  };

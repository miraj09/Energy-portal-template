"use client";
import React, { JSX, useState, useRef, useEffect } from "react";
import Select, { StylesConfig, GroupBase } from "react-select";
import { Button } from "@/ui/button";
import { Card, CardContent } from "@/ui/card";
import { Input } from "@/ui/input";
// import Image from "next/image";
import CustomDateInput from "@/ui/customDateInput";
import { useRouter } from "next/navigation";
import { postMethod } from "@/lib/actions/postMethod";
import { useSupplierContext } from "@/contexts/SupplierContext";
import { toast } from "sonner";
import {
  createApplicationMeter,
  CreateApplicationMeterPayload,
} from "@/composable/createApplicationMeter";
import { updateApplicationMeter } from "@/composable/updateApplicationMeter";
import { Meter } from "@/components/ApplicationDetails/types";
import { MeterQuoteFormValues } from "@/composable/meterQuoteForm";

// Interface for the quote header response
interface QuoteHeaderResponse {
  id?: string | number;
  Quote_Header_ID?: string | number;
  [key: string]: unknown;
}

// Import supplier types from the hook
import { Supplier, SupplierOption } from "@/hooks/useSuppliers";

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



// Custom styles for react-select to match the design
const customSelectStyles: StylesConfig<SupplierOption, false, GroupBase<SupplierOption>> = {
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

interface QuoteDetailsSectionProps {
  variant?: "page" | "modal";
  companyId?: string;
  siteId?: number;
  meterId?: number;
  defaultPostcode?: string;
  initialQuoteData?: MeterQuoteFormValues | null;
  onSuccess?: (meter?: Meter) => void;
}

export const QuoteDetailsSection = ({
  variant = "page",
  companyId,
  siteId,
  meterId,
  defaultPostcode = "",
  initialQuoteData = null,
  onSuccess,
}: QuoteDetailsSectionProps = {}): JSX.Element => {
  const router = useRouter();
  const isModal = variant === "modal";
  const isEditMode = isModal && meterId != null;

  // State for MPAN inputs
  const [mpanTopValues, setMpanTopValues] = useState<string[]>(["", "", ""]);
  const [mpanBottomValues, setMpanBottomValues] = useState<string[]>([
    "",
    "",
    "",
    "",
  ]);

  // State for form fields
  const [postcode, setPostcode] = useState<string>(defaultPostcode);
  const [contractStartDate, setContractStartDate] = useState<string>("");
  const [numberOfDays, setNumberOfDays] = useState<string>("365");
  const [currentStandingCharge, setCurrentStandingCharge] = useState<string>("");
  const [dayRate, setDayRate] = useState<string>("");
  const [dayKwh, setDayKwh] = useState<string>("");
  const [nightRate, setNightRate] = useState<string>("");
  const [nightKwh, setNightKwh] = useState<string>("");
  const [ewRate, setEwRate] = useState<string>("");
  const [ewKwh, setEwKwh] = useState<string>("");
  const [winterRate, setWinterRate] = useState<string>("");
  const [winterKwh, setWinterKwh] = useState<string>("");

  // Loading state
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  
  // State for third-party API response (available for future use)
  const [thirdPartyData, setThirdPartyData] = useState<unknown>(null);

  // Use supplier context instead of local state
  const { suppliers, supplierOptions, loading: suppliersLoading } = useSupplierContext();
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);

  // Sync postcode when site changes in modal mode
  useEffect(() => {
    if (isModal && defaultPostcode && !initialQuoteData) {
      setPostcode(defaultPostcode);
    }
  }, [isModal, defaultPostcode, initialQuoteData]);

  // Populate form when editing with fetched meter data
  useEffect(() => {
    if (!isEditMode || !initialQuoteData) return;

    if (initialQuoteData.mpanTopValues?.length === 3) {
      setMpanTopValues(initialQuoteData.mpanTopValues);
    }
    if (initialQuoteData.mpanBottomValues?.length === 4) {
      setMpanBottomValues(initialQuoteData.mpanBottomValues);
    }
    if (initialQuoteData.postcode != null) setPostcode(initialQuoteData.postcode);
    if (initialQuoteData.contractStartDate != null) {
      setContractStartDate(initialQuoteData.contractStartDate);
    }
    if (initialQuoteData.numberOfDays != null) {
      setNumberOfDays(initialQuoteData.numberOfDays);
    }
    if (initialQuoteData.currentStandingCharge != null) {
      setCurrentStandingCharge(initialQuoteData.currentStandingCharge);
    }
    if (initialQuoteData.dayRate != null) setDayRate(initialQuoteData.dayRate);
    if (initialQuoteData.dayKwh != null) setDayKwh(initialQuoteData.dayKwh);
    if (initialQuoteData.nightRate != null) setNightRate(initialQuoteData.nightRate);
    if (initialQuoteData.nightKwh != null) setNightKwh(initialQuoteData.nightKwh);
    if (initialQuoteData.ewRate != null) setEwRate(initialQuoteData.ewRate);
    if (initialQuoteData.ewKwh != null) setEwKwh(initialQuoteData.ewKwh);
    if (initialQuoteData.winterRate != null) setWinterRate(initialQuoteData.winterRate);
    if (initialQuoteData.winterKwh != null) setWinterKwh(initialQuoteData.winterKwh);
  }, [isEditMode, initialQuoteData, meterId]);

  useEffect(() => {
    if (!isEditMode || !initialQuoteData?.supplierId || suppliers.length === 0) {
      return;
    }

    const supplier = suppliers.find(
      (item) => item.id === initialQuoteData.supplierId
    );
    if (supplier) setSelectedSupplier(supplier);
  }, [isEditMode, initialQuoteData, suppliers, meterId]);

  // Error state for form validation
  const [fieldErrors, setFieldErrors] = useState<{
    mpan: string;
    postcode: string;
    contractStartDate: string;
    supplier: string;
    numberOfDays: string;
    currentStandingCharge: string;
    dayRate: string;
    dayKwh: string;
  }>({
    mpan: "",
    postcode: "",
    contractStartDate: "",
    supplier: "",
    numberOfDays: "",
    currentStandingCharge: "",
    dayRate: "",
    dayKwh: ""
  });

  // Refs for MPAN inputs
  const mpanTopRefs = useRef<(HTMLInputElement | null)[]>([null, null, null]);
  const mpanBottomRefs = useRef<(HTMLInputElement | null)[]>([
    null,
    null,
    null,
    null,
  ]);

  // Fetch suppliers when component mounts (guard against StrictMode double-invoke)
  const fetchedSuppliersRef = useRef(false);
  useEffect(() => {
    if (fetchedSuppliersRef.current) return;
    fetchedSuppliersRef.current = true;
    
    // Loading is now handled by context
    console.log("Fetching suppliers...");
    
    // Use a local Next.js route to avoid server re-renders invoking the server action repeatedly
    // and to keep credentials handling consistent. This also avoids dependency warnings.
    fetch("/api/supplier", { cache: "no-store" })
      .then((r) => {
        console.log("Supplier API response status:", r.status);
        if (!r.ok) {
          throw new Error(`HTTP error! status: ${r.status}`);
        }
        return r.json();
      })
      .then((data) => {
        console.log("Supplier API response data:", data);
        console.log("Data type:", typeof data);
        console.log("Is array:", Array.isArray(data));
        console.log("Has results property:", data && typeof data === "object" && 'results' in data);
        console.log("Results is array:", data && typeof data === "object" && Array.isArray((data as Record<string, unknown>).results));
        
        // Check if the response has an error
        if (data.success === false) {
          throw new Error(data.message || "API returned error");
        }
        
        // Manually call onSuccess normalization path
        let items: Array<{ id: number | string; name?: string; title?: string; description?: string }> = [];
        
        // Handle different response structures
        if (Array.isArray(data)) {
          console.log("Data is an array, using directly");
          items = data;
        } else if (data && typeof data === "object" && Array.isArray((data as Record<string, unknown>).results)) {
          console.log("Data has results array, using results");
          items = (data as Record<string, unknown>).results as Array<{ id: number | string; name?: string; title?: string; description?: string }>;
        } else if (data && typeof data === "object" && Array.isArray((data as Record<string, unknown>).data)) {
          console.log("Data has data array, using data");
          items = (data as Record<string, unknown>).data as Array<{ id: number | string; name?: string; title?: string; description?: string }>;
        } else if (data && typeof data === "object" && 
                   (data as Record<string, unknown>).data && 
                   typeof (data as Record<string, unknown>).data === "object" &&
                   Array.isArray(((data as Record<string, unknown>).data as Record<string, unknown>).results)) {
          console.log("Data has nested data.results array, using data.results");
          items = ((data as Record<string, unknown>).data as Record<string, unknown>).results as Array<{ id: number | string; name?: string; title?: string; description?: string }>;
        } else {
          console.log("Unknown data structure, logging full data:", JSON.stringify(data, null, 2));
          // Try to extract items from any nested structure
          const allKeys = Object.keys(data || {});
          console.log("Available keys:", allKeys);
          
          // Look for any array property that might contain suppliers
          for (const key of allKeys) {
            const value = (data as Record<string, unknown>)[key];
            if (Array.isArray(value) && value.length > 0) {
              console.log(`Found array in key '${key}':`, value);
              // Check if this looks like supplier data
              const firstItem = value[0] as Record<string, unknown>;
              if (firstItem && (firstItem.id !== undefined || firstItem.name !== undefined || firstItem.title !== undefined)) {
                console.log(`Using array from key '${key}' as suppliers`);
                items = value as Array<{ id: number | string; name?: string; title?: string; description?: string }>;
                break;
              }
            }
          }
        }

        console.log("Final items to process:", items);

        if (items.length === 0) {
          console.warn("No supplier items found in response");
          throw new Error("No suppliers found in response");
        }

        const normalizedSuppliers: Supplier[] = items.map((item) => {
          const supplier = {
            id: Number(item.id),
            name: String(item.name ?? item.title ?? item.description ?? item.id),
          };
          console.log("Normalized supplier:", supplier);
          return supplier;
        });
        
        console.log("Final normalized suppliers:", normalizedSuppliers);
        // Suppliers are now managed by context
        // Don't auto-select first supplier, let user choose
      })
      .catch((err) => {
        console.error("Failed to fetch suppliers:", err);
        // No fallback data - show empty state
        console.log("No suppliers available");
      })
      .finally(() => {
        // Loading is now handled by context
      });
  }, []);

  // Handle MPAN input change with auto-focus (numbers only for top row: Profile Class, MTC, LLF)
  const handleMpanTopChange = (index: number, value: string) => {
    // Allow only digits so MPAN top row stays numeric
    const digitsOnly = value.replace(/\D/g, "");
    const newValues = [...mpanTopValues];
    newValues[index] = digitsOnly;
    setMpanTopValues(newValues);

    // Clear MPAN error if user starts typing
    if (fieldErrors.mpan) {
      setFieldErrors(prev => ({ ...prev, mpan: "" }));
    }

    // Auto-focus to next input if current input is filled
    if (digitsOnly.length === mpanTopRow[index].maxLength) {
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

    // Clear MPAN error if user starts typing
    if (fieldErrors.mpan) {
      setFieldErrors(prev => ({ ...prev, mpan: "" }));
    }

    // Auto-focus to next input if current input is filled
    if (
      value.length === mpanBottomRow[index].maxLength &&
      index < mpanBottomRow.length - 1
    ) {
      mpanBottomRefs.current[index + 1]?.focus();
    }
  };

  // Build the payload according to the API specification
  const buildPayload = () => {
    // Concatenate bottom row values for bottomline
    const bottomline = mpanBottomValues.slice(1).join(""); // Skip first value (region)
    
    // Build contract rates array
    const contractRates = [];
    
    // Rate type 1: Standing charge
    if (currentStandingCharge) {
      contractRates.push({
        rate_type: 1,
        rate: parseFloat(currentStandingCharge),
        usage: null
      });
    }
    
    // Rate type 2: Day rate
    if (dayRate && dayKwh) {
      contractRates.push({
        rate_type: 2,
        rate: parseFloat(dayRate),
        usage: parseInt(dayKwh),
        rate_required: true,
        usage_required: true
      });
    }
    
    // Rate type 3: Night rate
    if (nightRate && nightKwh) {
      contractRates.push({
        rate_type: 3,
        rate: parseFloat(nightRate),
        usage: parseInt(nightKwh),
        rate_required: true,
        usage_required: true
      });
    }
    
    // Rate type 4: EW rate
    if (ewRate && ewKwh) {
      contractRates.push({
         
      });
    }
    
    // Rate type 5: Winter rate
    if (winterRate && winterKwh) {
      contractRates.push({
        rate_type: 5,
        rate: parseFloat(winterRate),
        usage: parseInt(winterKwh),
        rate_required: true,
        usage_required: true
      });
    }

    // aq_eac = total kWh across rate types 2–5 (Day, Night, EW, Winter)
    const parseKwhUsage = (value: string) =>
      value.trim() ? parseInt(value, 10) : 0;
    const aqEac =
      parseKwhUsage(dayKwh) +
      parseKwhUsage(nightKwh) +
      parseKwhUsage(ewKwh) +
      parseKwhUsage(winterKwh);

    return {
      profileclass: mpanTopValues[0],
      MTC: mpanTopValues[1],
      LLF: mpanTopValues[2],
      Region: mpanBottomValues[0],
      bottomline: bottomline,
      postcode: postcode || null,
      Supplier: selectedSupplier?.id, // Use selected supplier ID or fallback to default
      Number_of_Days: parseInt(numberOfDays) || 365,
      PartnerUserID: null,
      isCOT: false,
      isRIsk: false,
      useUplift: true,
      MeterType: 20, // Default value, you might want to make this dynamic
      Term: null,
      Contract_Start_Date: contractStartDate || new Date().toISOString(),
      Contract_Rates: contractRates,
      is_mpan: true,
      aq_eac: aqEac > 0 ? aqEac : null,
    };
  };

  // Validate required fields before submission
  const validateRequiredFields = () => {
    // Clear previous errors
    setFieldErrors({
      mpan: "",
      postcode: "",
      contractStartDate: "",
      supplier: "",
      numberOfDays: "",
      currentStandingCharge: "",
      dayRate: "",
      dayKwh: ""
    });

    let hasErrors = false;

    // Check MPAN fields
    const mpanTopComplete = mpanTopValues.every(value => value.trim() !== "");
    const mpanBottomComplete = mpanBottomValues.every(value => value.trim() !== "");
    
    if (!mpanTopComplete || !mpanBottomComplete) {
      setFieldErrors(prev => ({ ...prev, mpan: "MPAN information is required" }));
      hasErrors = true;
    }

    if (!postcode.trim()) {
      setFieldErrors(prev => ({ ...prev, postcode: "Postcode is required" }));
      hasErrors = true;
    }

    // Check contract start date
    if (!contractStartDate.trim()) {
      setFieldErrors(prev => ({ ...prev, contractStartDate: "Contract start date is required" }));
      hasErrors = true;
    }

    // Check supplier selection
    if (!selectedSupplier) {
      setFieldErrors(prev => ({ ...prev, supplier: "Supplier selection is required" }));
      hasErrors = true;
    }

    // Check number of days
    if (!numberOfDays.trim()) {
      setFieldErrors(prev => ({ ...prev, numberOfDays: "Number of days is required" }));
      hasErrors = true;
    }

    // Check standing charge
    if (!currentStandingCharge.trim()) {
      setFieldErrors(prev => ({ ...prev, currentStandingCharge: "Current standing charge is required" }));
      hasErrors = true;
    }

    // Check day rate and kwh
    if (!dayRate.trim()) {
      setFieldErrors(prev => ({ ...prev, dayRate: "Day rate is required" }));
      hasErrors = true;
    }
    if (!dayKwh.trim()) {
      setFieldErrors(prev => ({ ...prev, dayKwh: "Day kWh is required" }));
      hasErrors = true;
    }

    return hasErrors;
  };

  // Build full MPAN reference string from grid inputs
  const buildMeterReference = () => {
    return ["S", ...mpanTopValues, ...mpanBottomValues].join("");
  };

  // Handle form submission
  const handleSubmit = async () => {
    // Validate required fields first
    const hasErrors = validateRequiredFields();
    
    if (hasErrors) {
      return; // Return early if validation fails, errors are already displayed below inputs
    }

    try {
      setIsSubmitting(true);
      
      const payload = buildPayload();

      // Modal mode: create or update meter for application site
      if (isModal && companyId && siteId && onSuccess) {
        const meterPayload: CreateApplicationMeterPayload = {
          company_id: companyId,
          site_id: siteId,
          meter_type: "Electricity",
          meter_reference: buildMeterReference(),
          quote_payload: payload,
        };

        const response = isEditMode
          ? await updateApplicationMeter(meterId, meterPayload)
          : await createApplicationMeter(meterPayload);

        if (response.success) {
          toast.success(
            isEditMode ? "Meter updated successfully!" : "Meter added successfully!"
          );
          onSuccess(response.data);
        } else if (
          response.errors &&
          typeof response.errors === "object" &&
          "authError" in response.errors
        ) {
          toast.error("Token expired. Authentication required.");
          await new Promise((resolve) => setTimeout(resolve, 500));
          router.push("/login");
        } else {
          toast.error(response.message || "Failed to add meter");
        }
        return;
      }
      
      const response = await postMethod(
        payload,
        "/api/v1/auth/web/core/quote-header/"
      );
      
      if (response.success) {
        // Extract the Quote_Header_ID from the response
        const responseData = response.data as QuoteHeaderResponse;
        const quoteHeaderId = responseData?.id || responseData?.Quote_Header_ID;
        
        if (quoteHeaderId) {
          try {
            // Call third-party API with the Quote_Header_ID
            const thirdPartyResponse = await fetch(`/api/mock/third-party-quote?Quote_Header_ID=${quoteHeaderId}`, {
              method: 'GET',
              headers: {
                'Content-Type': 'application/json',
              },
            });
            
            if (thirdPartyResponse.ok) {
              const thirdPartyResponseData = await thirdPartyResponse.json();
              console.log('Third-party API response:', thirdPartyResponseData);
              
              // Store the third-party data in state
              setThirdPartyData(thirdPartyResponseData);
              console.log('Stored third-party data in state:', thirdPartyData);
            } else {
              console.warn('Third-party API call failed:', thirdPartyResponse.status);
            }
          } catch (thirdPartyError) {
            console.warn('Error calling third-party API:', thirdPartyError);
            // Continue with the flow even if third-party API fails
          }
        }
        
        // Navigate to quote list with the quote ID
        router.push(`electricity-quote/quote-list?quoteId=${quoteHeaderId}`);
      } else {
        // Show standardized validation error toast if available
        const errors = response.errors as Record<string, string[] | string> | undefined;
        if (errors && typeof errors === "object") {
          // pick first error entry
          const firstKey = Object.keys(errors)[0];
          if (firstKey) {
            const raw = Array.isArray(errors[firstKey]) ? (errors[firstKey] as string[])[0] : String(errors[firstKey]);
            const message = raw?.startsWith("This field")
              ? `${firstKey.charAt(0).toUpperCase()}${firstKey.slice(1)}${raw.replace("This field", "")}`.trim()
              : raw || response.message || "Request failed";
            toast.error(message.replace(/\.$/, ""));
          } else {
            toast.error(response.message || "Request failed");
          }
        } else {
          toast.error(response.message || "Request failed");
        }
        console.error("Quote submission failed:", response.message, response.errors);
      }
    } catch (error) {
      console.error("Error submitting quote:", error);
      toast.error("An error occurred while submitting the quote");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle date change
  const handleDateChange = (date: string) => {
    setContractStartDate(date);
    // Clear date error if user selects a date
    if (fieldErrors.contractStartDate) {
      setFieldErrors(prev => ({ ...prev, contractStartDate: "" }));
    }
  };

  return (
    <section
      className={
        isModal
          ? "w-full bg-white"
          : "w-full max-w-[1106px] mx-auto my-4 lg:my-8 px-4 lg:px-0 bg-white"
      }
    >
      <Card
        className={
          isModal
            ? "w-full border-0 shadow-none rounded-lg"
            : "w-full shadow-[0px_4px_10px_rgba(0,0,0,0.25)] rounded-lg"
        }
      >
        <CardContent className="p-4 lg:p-6">
          <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center mb-6 lg:mb-8 gap-4">
            <h2 className="font-['Plus_Jakarta_Sans'] font-semibold text-[#363636] text-lg sm:text-xl lg:text-2xl xl:text-3xl leading-5">
              Electricity Quote
            </h2>
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
                        <span className="font-['Inter'] font-medium text-[#222222] text-lg sm:text-xl lg:text-2xl xl:text-4xl leading-6">
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
                                  type="text"
                                  inputMode="numeric"
                                  autoComplete="off"
                                  value={mpanTopValues[index]}
                                  onChange={(e) =>
                                    handleMpanTopChange(index, e.target.value)
                                  }
                                  maxLength={item.maxLength}
                                  placeholder={item.value}
                                  className="h-full border-0 rounded-none text-center font-['Inter'] font-medium text-xs sm:text-sm lg:text-base leading-6 bg-transparent focus:ring-0 focus:border-0 p-0"
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
                                  className="h-full border-0 rounded-none text-center font-['Inter'] font-medium text-xs sm:text-sm lg:text-base leading-6 bg-transparent focus:ring-0 focus:border-0 p-0"
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                    {fieldErrors.mpan && (
                      <p className="text-red-500 text-xs mt-1">{fieldErrors.mpan}</p>
                    )}
                  </div>

                  {/* Postcode */}
                  <div className="space-y-1.5 sm:space-y-2">
                    <label className="font-['Inter'] font-medium text-gray-700 text-xs sm:text-sm lg:text-base leading-6">
                      Postcode:
                    </label>
                    <Input
                      placeholder="Enter postcode"
                      value={postcode}
                      onChange={(e) => {
                        setPostcode(e.target.value);
                        if (fieldErrors.postcode) {
                          setFieldErrors(prev => ({ ...prev, postcode: "" }));
                        }
                      }}
                      className="h-8.75 border-[0.8px] border-solid border-[#363636] shadow-[0px_1px_2px_rgba(16,24,40,0.05)] text-xs sm:text-sm lg:text-base"
                    />
                    {fieldErrors.postcode && (
                      <p className="text-red-500 text-xs mt-1">{fieldErrors.postcode}</p>
                    )}
                  </div>

                  {/* Current Supplier */}
                  <div className="space-y-1.5 sm:space-y-2">
                    <label className="font-['Inter'] font-medium text-gray-700 text-xs sm:text-sm lg:text-base leading-6">
                      Current Supplier:
                    </label>
                    <Select<SupplierOption>
                      options={supplierOptions}
                      value={selectedSupplier ? { 
                        value: selectedSupplier.id.toString(), 
                        label: selectedSupplier.name 
                      } : null}
                      onChange={(option) => {
                        const selected = option as SupplierOption | null;
                        if (selected) {
                          const supplier = suppliers.find((s) => s.id.toString() === selected.value);
                          setSelectedSupplier(supplier || null);
                          // Clear supplier error if user selects a supplier
                          if (fieldErrors.supplier) {
                            setFieldErrors(prev => ({ ...prev, supplier: "" }));
                          }
                        }
                      }}
                      styles={customSelectStyles}
                      placeholder={suppliersLoading ? "Loading suppliers..." : "Select supplier"}
                      isSearchable
                      isLoading={suppliersLoading}
                      className="react-select-container"
                      classNamePrefix="react-select"
                    />
                    {fieldErrors.supplier && (
                      <p className="text-red-500 text-xs mt-1">{fieldErrors.supplier}</p>
                    )}
                  </div>

                  {/* Contract Start Date */}
                  <div className="space-y-1.5 sm:space-y-2">
                    <label className="font-['Inter'] font-medium text-gray-700 text-xs sm:text-sm lg:text-base leading-6">
                      Contract Start Date:
                    </label>
                    <CustomDateInput 
                      value={contractStartDate} 
                      onChange={handleDateChange} 
                      placeholder="Select contract start date"
                    />
                    {fieldErrors.contractStartDate && (
                      <p className="text-red-500 text-xs mt-1">{fieldErrors.contractStartDate}</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right column - Current rates & charges */}
            <div>
              <h3 className="font-['Inter'] font-medium text-gray-700 text-sm sm:text-base lg:text-lg xl:text-xl leading-6 mb-4">
                <span className="text-[#48505e]">Current rates & charges</span>
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
                          placeholder="26"
                          value={numberOfDays}
                          onChange={(e) => {
                            setNumberOfDays(e.target.value);
                            // Clear error if user starts typing
                            if (fieldErrors.numberOfDays) {
                              setFieldErrors(prev => ({ ...prev, numberOfDays: "" }));
                            }
                          }}
                          className="h-8.75 border-[0.8px] border-solid border-[#363636] shadow-[0px_1px_2px_rgba(16,24,40,0.05)] text-xs sm:text-sm lg:text-base"
                        />
                        {fieldErrors.numberOfDays && (
                          <p className="text-red-500 text-xs mt-1">{fieldErrors.numberOfDays}</p>
                        )}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex flex-col space-y-2">
                        <label className="font-['Inter'] font-medium text-gray-700 text-xs sm:text-sm lg:text-base leading-6">
                          Current Standing Charge:
                        </label>
                        <div className="relative">
                          <Input
                            placeholder="1"
                            value={currentStandingCharge}
                            onChange={(e) => {
                              setCurrentStandingCharge(e.target.value);
                              // Clear error if user starts typing
                              if (fieldErrors.currentStandingCharge) {
                                setFieldErrors(prev => ({ ...prev, currentStandingCharge: "" }));
                              }
                            }}
                            className="h-8.75 border-[0.8px] border-solid border-[#363636] shadow-[0px_1px_2px_rgba(16,24,40,0.05)] pr-[35px] text-xs sm:text-sm lg:text-base"
                          />
                          <div className="absolute right-0 top-0 w-8.75 h-8.75 bg-[#346fb6] flex items-center justify-center rounded-r-md">
                            <span className="font-['Inter'] font-medium text-white text-base sm:text-lg lg:text-xl leading-6">
                              P
                            </span>
                          </div>
                        </div>
                        {fieldErrors.currentStandingCharge && (
                          <p className="text-red-500 text-xs mt-1">{fieldErrors.currentStandingCharge}</p>
                        )}
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
                            placeholder="36"
                            value={dayRate}
                            onChange={(e) => {
                              setDayRate(e.target.value);
                              // Clear error if user starts typing
                              if (fieldErrors.dayRate) {
                                setFieldErrors(prev => ({ ...prev, dayRate: "" }));
                              }
                            }}
                            className="h-8.75 border-[0.8px] border-solid border-[#363636] shadow-[0px_1px_2px_rgba(16,24,40,0.05)] pr-[35px] text-xs sm:text-sm lg:text-base"
                          />
                          <div className="absolute right-0 top-0 w-8.75 h-8.75 bg-[#346fb6] flex items-center justify-center rounded-r-md">
                            <span className="font-['Inter'] font-medium text-white text-base sm:text-lg lg:text-xl leading-6">
                              P
                            </span>
                          </div>
                        </div>
                        {fieldErrors.dayRate && (
                          <p className="text-red-500 text-xs mt-1">{fieldErrors.dayRate}</p>
                        )}
                      </div>
                      <div className="flex flex-col space-y-2">
                        <label className="invisible">Kwh</label>
                        <div className="relative">
                          <Input
                            placeholder="30000"
                            value={dayKwh}
                            onChange={(e) => {
                              setDayKwh(e.target.value);
                              // Clear error if user starts typing
                              if (fieldErrors.dayKwh) {
                                setFieldErrors(prev => ({ ...prev, dayKwh: "" }));
                              }
                            }}
                            className="h-8.75 border-[0.8px] border-solid border-[#363636] shadow-[0px_1px_2px_rgba(16,24,40,0.05)] pr-[55px] text-xs sm:text-sm lg:text-base"
                          />
                          <div className="absolute right-0 top-0 w-[55px] h-8.75 bg-[#346fb6] flex items-center justify-center rounded-r-md">
                            <span className="font-['Inter'] font-medium text-white text-base sm:text-lg lg:text-xl leading-6">
                              Kwh
                            </span>
                          </div>
                        </div>
                        {fieldErrors.dayKwh && (
                          <p className="text-red-500 text-xs mt-1">{fieldErrors.dayKwh}</p>
                        )}
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
                            placeholder=""
                            value={nightRate}
                            onChange={(e) => setNightRate(e.target.value)}
                            className="h-8.75 border-[0.8px] border-solid border-[#363636] shadow-[0px_1px_2px_rgba(16,24,40,0.05)] pr-[35px] text-xs sm:text-sm lg:text-base"
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
                            placeholder=""
                            value={nightKwh}
                            onChange={(e) => setNightKwh(e.target.value)}
                            className="h-8.75 border-[0.8px] border-solid border-[#363636] shadow-[0px_1px_2px_rgba(16,24,40,0.05)] pr-[55px] text-xs sm:text-sm lg:text-base"
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
                            placeholder=""
                            value={ewRate}
                            onChange={(e) => setEwRate(e.target.value)}
                            className="h-8.75 border-[0.8px] border-solid border-[#363636] shadow-[0px_1px_2px_rgba(16,24,40,0.05)] pr-[35px] text-xs sm:text-sm lg:text-base"
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
                            placeholder=""
                            value={ewKwh}
                            onChange={(e) => setEwKwh(e.target.value)}
                            className="h-8.75 border-[0.8px] border-solid border-[#363636] shadow-[0px_1px_2px_rgba(16,24,40,0.05)] pr-[55px] text-xs sm:text-sm lg:text-base"
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
                            placeholder=""
                            value={winterRate}
                            onChange={(e) => setWinterRate(e.target.value)}
                            className="h-8.75 border-[0.8px] border-solid border-[#363636] shadow-[0px_1px_2px_rgba(16,24,40,0.05)] pr-[35px] text-xs sm:text-sm lg:text-base"
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
                            placeholder=""
                            value={winterKwh}
                            onChange={(e) => setWinterKwh(e.target.value)}
                            className="h-8.75 border-[0.8px] border-solid border-[#363636] shadow-[0px_1px_2px_rgba(16,24,40,0.05)] pr-[55px] text-xs sm:text-sm lg:text-base"
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

          <div className="flex justify-center lg:justify-end mt-6">
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="bg-[#2db9eb] hover:bg-[#2db9eb]/90 text-white w-full sm:w-auto text-sm sm:text-base lg:text-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting
                ? "Submitting..."
                : isEditMode
                  ? "Update Meter"
                  : isModal
                    ? "Add Meter"
                    : "Get Quote"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </section>
  );
};

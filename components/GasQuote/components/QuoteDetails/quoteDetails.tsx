"use client";
import React, { JSX, useState, useRef, useEffect } from "react";
import Select, { StylesConfig, GroupBase } from "react-select";
import { Button } from "@/ui/button";
import { Card, CardContent } from "@/ui/card";
import { Input } from "@/ui/input";
// import Image from "next/image";
import CustomDateInput from "@/ui/customDateInput";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  createApplicationMeter,
  CreateApplicationMeterPayload,
  extractMeterIdFromApiResponse,
} from "@/composable/createApplicationMeter";
import {
  extractQuoteHeaderId,
  getQuoteApiErrorMessage,
  postQuoteHeader,
} from "@/composable/quoteHeaderApi";
import { updateApplicationMeter } from "@/composable/updateApplicationMeter";
import { Meter } from "@/components/ApplicationDetails/types";
import {
  buildFlatQuotePayload,
  MeterQuoteFormValues,
} from "@/composable/meterQuoteForm";

// Interface for supplier data
interface Supplier {
  id: number;
  name: string;
  [key: string]: unknown;
}

// Interface for supplier option in react-select
interface SupplierOption {
  value: string;
  label: string;
}



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
  variant?: "page" | "modal" | "applicationQuote";
  companyId?: string;
  siteId?: number;
  meterId?: number;
  quoteId?: number;
  defaultPostcode?: string;
  initialQuoteData?: MeterQuoteFormValues | null;
  onSuccess?: (meter?: Meter) => void;
}

export const QuoteDetailsSection = ({
  variant = "page",
  companyId,
  siteId,
  meterId,
  quoteId,
  defaultPostcode = "",
  initialQuoteData = null,
  onSuccess,
}: QuoteDetailsSectionProps = {}): JSX.Element => {
  const router = useRouter();
  const isModal = variant === "modal";
  const isApplicationQuote = variant === "applicationQuote";
  const isModalLike = isModal || isApplicationQuote;
  const isEditMode = isModal && meterId != null;

  // State for form fields
  const [mprn, setMprn] = useState<string>("");
  const [postcode, setPostcode] = useState<string>(defaultPostcode);
  const [contractStartDate, setContractStartDate] = useState<string>("");
  const [numberOfDays, setNumberOfDays] = useState<string>("365");
  const [currentStandingCharge, setCurrentStandingCharge] = useState<string>("");
  const [dayRate, setDayRate] = useState<string>("");
  const [dayKwh, setDayKwh] = useState<string>("");

  // Loading state
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  
  // State for suppliers
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [suppliersLoading, setSuppliersLoading] = useState<boolean>(true);

  // Sync postcode when site changes in modal / application quote mode
  useEffect(() => {
    if (isModalLike && defaultPostcode && !initialQuoteData) {
      setPostcode(defaultPostcode);
    }
  }, [isModalLike, defaultPostcode, initialQuoteData]);

  // Populate form when editing with fetched meter data
  useEffect(() => {
    if (!isEditMode || !initialQuoteData) return;

    if (initialQuoteData.mprn != null) setMprn(initialQuoteData.mprn);
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
    mprn: string;
    postcode: string;
    contractStartDate: string;
    supplier: string;
    numberOfDays: string;
    currentStandingCharge: string;
    dayRate: string;
    dayKwh: string;
  }>({
    mprn: "",
    postcode: "",
    contractStartDate: "",
    supplier: "",
    numberOfDays: "",
    currentStandingCharge: "",
    dayRate: "",
    dayKwh: ""
  });

  // Fetch suppliers when component mounts
  const fetchedSuppliersRef = useRef(false);
  useEffect(() => {
    if (fetchedSuppliersRef.current) return;
    fetchedSuppliersRef.current = true;
    
    setSuppliersLoading(true);
    console.log("Fetching suppliers...");
    
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
        
        // Check if the response has an error
        if (data.success === false) {
          throw new Error(data.message || "API returned error");
        }
        
        let items: Array<{ id: number | string; name?: string; title?: string; description?: string }> = [];
        
        // Handle different response structures
        if (Array.isArray(data)) {
          items = data;
        } else if (data && typeof data === "object" && Array.isArray((data as Record<string, unknown>).results)) {
          items = (data as Record<string, unknown>).results as Array<{ id: number | string; name?: string; title?: string; description?: string }>;
        } else if (data && typeof data === "object" && Array.isArray((data as Record<string, unknown>).data)) {
          items = (data as Record<string, unknown>).data as Array<{ id: number | string; name?: string; title?: string; description?: string }>;
        } else if (data && typeof data === "object" && 
                   (data as Record<string, unknown>).data && 
                   typeof (data as Record<string, unknown>).data === "object" &&
                   Array.isArray(((data as Record<string, unknown>).data as Record<string, unknown>).results)) {
          items = ((data as Record<string, unknown>).data as Record<string, unknown>).results as Array<{ id: number | string; name?: string; title?: string; description?: string }>;
        } else {
          // Try to extract items from any nested structure
          const allKeys = Object.keys(data || {});
          
          for (const key of allKeys) {
            const value = (data as Record<string, unknown>)[key];
            if (Array.isArray(value) && value.length > 0) {
              const firstItem = value[0] as Record<string, unknown>;
              if (firstItem && (firstItem.id !== undefined || firstItem.name !== undefined || firstItem.title !== undefined)) {
                items = value as Array<{ id: number | string; name?: string; title?: string; description?: string }>;
                break;
              }
            }
          }
        }

        if (items.length === 0) {
          throw new Error("No suppliers found in response");
        }

        const normalizedSuppliers: Supplier[] = items.map((item) => ({
          id: Number(item.id),
          name: String(item.name ?? item.title ?? item.description ?? item.id),
        }));
        
        setSuppliers(normalizedSuppliers);
      })
      .catch((err) => {
        console.error("Failed to fetch suppliers:", err);
        // No fallback data - show empty state
        setSuppliers([]);
      })
      .finally(() => {
        setSuppliersLoading(false);
      });
  }, []);

  // Build flat quote-header payload (new API — no Contract_Rates)
  const buildPayload = () => {
    return buildFlatQuotePayload({
      isGas: true,
      bottomline: mprn || "",
      postcode: postcode || null,
      supplierId: selectedSupplier?.id,
      numberOfDays,
      contractStartDate,
      currentStandingCharge,
      dayRate,
      dayKwh,
    });
  };

  // Validate required fields before submission
  const validateRequiredFields = () => {
    // Clear previous errors
    setFieldErrors({
      mprn: "",
      postcode: "",
      contractStartDate: "",
      supplier: "",
      numberOfDays: "",
      currentStandingCharge: "",
      dayRate: "",
      dayKwh: ""
    });

    let hasErrors = false;

    // Check MPRN
    if (!mprn.trim()) {
      setFieldErrors(prev => ({ ...prev, mprn: "MPRN is required" }));
      hasErrors = true;
    }

    // Check postcode
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

  // Handle form submission
  const handleSubmit = async () => {
    // Validate required fields first
    const hasErrors = validateRequiredFields();
    
    if (hasErrors) {
      toast.error("Please complete all required fields before continuing.");
      return;
    }

    try {
      setIsSubmitting(true);
      
      const payload = buildPayload();

      // Application quote flow: meter first (auto-creates quote), then patch rates
      if (isApplicationQuote && companyId && siteId) {
        const meterResponse = await createApplicationMeter({
          company_id: companyId,
          site_id: siteId,
          meter_type: "Gas",
          meter_reference: mprn,
          quote_payload: payload,
        });

        if (!meterResponse.success) {
          if (
            meterResponse.errors &&
            typeof meterResponse.errors === "object" &&
            "authError" in meterResponse.errors
          ) {
            toast.error("Token expired. Authentication required.");
            await new Promise((resolve) => setTimeout(resolve, 500));
            router.push("/login");
          } else {
            toast.error(
              meterResponse.message ||
                "Failed to create meter and quote. Please try again."
            );
          }
          return;
        }

        const createdMeterId =
          extractMeterIdFromApiResponse(meterResponse.data) ??
          meterResponse.data?.meterid ??
          null;
        const quoteHeaderId = meterResponse.quoteId ?? null;

        if (!createdMeterId || !quoteHeaderId) {
          toast.error("Meter created but required IDs were not returned.");
          return;
        }

        const params = new URLSearchParams({
          quoteId: String(quoteHeaderId),
          companyId,
          siteId: String(siteId),
          meterId: String(createdMeterId),
          source: "application",
        });

        router.push(
          `/generate-quote/gas-quote/quote-list?${params.toString()}`
        );
        return;
      }

      // Modal mode: create or update meter for application site
      if (isModal && companyId && siteId && onSuccess) {
        const meterPayload: CreateApplicationMeterPayload = {
          company_id: companyId,
          site_id: siteId,
          meter_type: "Gas",
          meter_reference: mprn,
          quote_payload: payload,
          quote_id: quoteId,
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

      const quoteResponse = await postQuoteHeader(payload);

      if (quoteResponse.success) {
        const quoteHeaderId =
          quoteResponse.quoteId ?? extractQuoteHeaderId(quoteResponse);

        if (quoteHeaderId) {
          router.push(`gas-quote/quote-list?quoteId=${quoteHeaderId}`);
        } else {
          router.push("gas-quote/quote-list");
        }
      } else {
        console.error("Quote submission failed:", quoteResponse.message);
        toast.error(getQuoteApiErrorMessage(quoteResponse));
      }
    } catch (error) {
      console.error("Error submitting quote:", error);
      if (isModalLike) {
        toast.error("An error occurred while adding the meter");
      } else {
        alert("An error occurred while submitting the quote");
      }
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
        isModalLike
          ? "w-full bg-white"
          : "w-full max-w-[1106px] mx-auto my-4 lg:my-8 px-4 lg:px-0 bg-white"
      }
    >
      <Card
        className={
          isModalLike
            ? "w-full border-0 shadow-none rounded-lg"
            : "w-full shadow-[0px_4px_10px_rgba(0,0,0,0.25)] rounded-lg"
        }
      >
        <CardContent className="p-4 lg:p-6">
          <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center mb-6 lg:mb-8 gap-4">
            <h2 className="font-['Plus_Jakarta_Sans'] font-semibold text-[#363636] text-lg sm:text-xl lg:text-2xl xl:text-3xl leading-5">
              Gas Quote
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
                  {/* MPRN Section */}
                  <div className="space-y-1.5 sm:space-y-2">
                    <label className="font-['Inter'] font-medium text-gray-700 text-xs sm:text-sm lg:text-base leading-6">
                      MPRN:
                    </label>
                    <Input
                      placeholder="26"
                      value={mprn}
                      onChange={(e) => {
                        setMprn(e.target.value);
                        // Clear error if user starts typing
                        if (fieldErrors.mprn) {
                          setFieldErrors(prev => ({ ...prev, mprn: "" }));
                        }
                      }}
                      className="h-8.75 border-[0.8px] border-solid border-[#363636] shadow-[0px_1px_2px_rgba(16,24,40,0.05)] text-xs sm:text-sm lg:text-base"
                    />
                    {fieldErrors.mprn && (
                      <p className="text-red-500 text-xs mt-1">{fieldErrors.mprn}</p>
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
                        // Clear error if user starts typing
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
                  <div className="space-y-1.5 sm:space-y-2">
                    <label className="font-['Inter'] font-medium text-gray-700 text-xs sm:text-sm lg:text-base leading-6">
                      Current Supplier:
                    </label>
                    <Select<SupplierOption>
                      options={suppliers.map(supplier => ({ 
                        value: supplier.id.toString(), 
                        label: supplier.name 
                      }))}
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
                  : isApplicationQuote
                    ? "Get Quote"
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

import React, { useState, useCallback, useEffect } from "react";
import { Card, CardContent } from "@/ui/card";
import { Input } from "@/ui/input";
import { Button } from "@/ui/button";
import { Label } from "@/ui/label";
import { CustomSelect, type SelectOption } from "@/ui/select";
import CustomDateInput from "@/ui/customDateInput";
import type { SoldTariffFormData, ValidationErrors } from "./SoldTariffForm";
import StepIndicator from "./StepIndicator";
import { useGetRequest } from "@/composable";
import { getLocationByPostcode } from "@/lib/actions/getLocationByPostcode";

// Types for location API response
interface LocationAddress {
  premises?: string;
  address_line_1?: string;
  locality?: string;
  postal_code?: string;
}

interface LocationItem {
  address: LocationAddress;
  address_snippet?: string;
  name?: string;
  title?: string;
}

interface LocationApiResponse {
  items?: LocationItem[];
  results?: LocationItem[];
  data?: LocationItem[];
  [key: string]: unknown;
}

interface SoldTariffFormPage2Props {
  form: SoldTariffFormData;
  handleInput: <K extends keyof SoldTariffFormData>(
    field: K,
    value: SoldTariffFormData[K]
  ) => void;
  handleAddressInput: (idx: number, value: string) => void;
  onPrev: () => void;
  onNext: () => void;
  currentStep: number;
  totalSteps: number;
  stepTitles: string[];
  validationErrors: ValidationErrors;
}

export type { SoldTariffFormPage2Props };

const titleOptions: SelectOption[] = [
  { value: "mr", label: "MR." },
  { value: "mrs", label: "MRS." },
  { value: "ms", label: "MS." },
  { value: "dr", label: "DR." },
];



const SoldTariffFormPage2: React.FC<SoldTariffFormPage2Props> = ({
  form,
  handleInput,
  handleAddressInput,
  onPrev,
  onNext,
  currentStep,
  totalSteps,
  stepTitles,
  validationErrors,
}) => {
  // State for dynamic location options from API
  const [locationOptions, setLocationOptions] = useState<SelectOption[]>([]);
  // State to track whether location dropdown should be shown
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  // Keep raw items to parse structured address on selection
  const [locationItems, setLocationItems] = useState<LocationItem[]>([]);
  // Local loading state to cover both direct API and fallback fetch
  const [isSearching, setIsSearching] = useState(false);
  const [businessTypeOptions, setBusinessTypeOptions] = useState<SelectOption[]>([]);

  const handleBusinessTypesSuccess = useCallback((data: unknown) => {
    if (
      data &&
      typeof data === "object" &&
      "results" in data &&
      Array.isArray((data as { results: unknown[] }).results)
    ) {
      const results = (data as { results: Array<{ id: number; title: string }> })
        .results;
      setBusinessTypeOptions(
        results.map((item) => ({
          value: item.id.toString(),
          label: item.title,
        })),
      );
    } else if (data && Array.isArray(data)) {
      setBusinessTypeOptions(
        (
          data as Array<{
            id?: number;
            title?: string;
            name?: string;
            value?: string;
            label?: string;
          }>
        ).map((item) => ({
          value: item.id?.toString() || item.value || item.name || "",
          label: item.title || item.name || item.label || item.value || "",
        })),
      );
    } else if (
      data &&
      typeof data === "object" &&
      "data" in data &&
      Array.isArray((data as { data: unknown[] }).data)
    ) {
      const dataArray = (
        data as {
          data: Array<{
            id?: number;
            title?: string;
            name?: string;
            value?: string;
            label?: string;
          }>;
        }
      ).data;
      setBusinessTypeOptions(
        dataArray.map((item) => ({
          value: item.id?.toString() || item.value || item.name || "",
          label: item.title || item.name || item.label || item.value || "",
        })),
      );
    } else {
      setBusinessTypeOptions([]);
    }
  }, []);

  const handleBusinessTypesError = useCallback((message: string) => {
    console.error("Failed to fetch business types:", message);
    setBusinessTypeOptions([]);
  }, []);

  const { executeGet: fetchBusinessTypes } = useGetRequest({
    onSuccess: handleBusinessTypesSuccess,
    onError: handleBusinessTypesError,
  });

  useEffect(() => {
    void fetchBusinessTypes("/api/v1/auth/web/core/business-type/");
  }, [fetchBusinessTypes]);

  // Callbacks for handling location API responses
  const handleLocationSuccess = useCallback((data: unknown) => {
    console.log("Location API response:", data);
    
    // Handle different possible response formats
    let items: LocationItem[] = [];
    
    if (Array.isArray(data)) {
      // Direct array response
      items = data as LocationItem[];
    } else if (data && typeof data === 'object') {
      const responseData = data as LocationApiResponse;
      // Check for common property names
      if (responseData.items && Array.isArray(responseData.items)) {
        items = responseData.items;
      } else if (responseData.results && Array.isArray(responseData.results)) {
        items = responseData.results;
      } else if (responseData.data && Array.isArray(responseData.data)) {
        items = responseData.data;
      } else {
        // Try to extract any array from the response
        for (const key in responseData) {
          const value = responseData[key];
          if (Array.isArray(value)) {
            items = value as LocationItem[];
            break;
          }
        }
      }
    }
    
    console.log("Extracted items:", items);
    
    if (items.length === 0) {
      setLocationOptions([]);
    } else {
      setLocationItems(items);
      const options = items.map((item, index) => {
        let label = '';
        
        // Try different ways to construct the label
        if (item.address_snippet) {
          label = item.address_snippet;
        } else if (item.address) {
          const addr = item.address;
          label = `${addr.premises || ''} ${addr.address_line_1 || ''} ${addr.locality || ''} ${addr.postal_code || ''}`.trim();
        } else if (item.name) {
          label = item.name;
        } else if (item.title) {
          label = item.title;
        } else {
          // Fallback: try to stringify the item
          label = JSON.stringify(item);
        }
        
        return {
          value: String(index),
          label: label
        };
      });
      
      console.log("Mapped location options:", options);
      setLocationOptions(options);
    }
  }, []);

  const handleLocationError = useCallback((message: string) => {
    console.error("Failed to fetch locations:", message);
    console.error("Error details:", { message, timestamp: new Date().toISOString() });
    
    // No fallback data - show empty state
    console.log("No location options available");
    setLocationOptions([]);
  }, []);

  // Hook for fetching locations
  const { executeGet: fetchLocations, loading: isLoadingLocations, error: locationError } = useGetRequest({
    onSuccess: handleLocationSuccess,
    onError: handleLocationError,
  });

  // Function to handle postcode search with fallback
  const handlePostcodeSearch = useCallback(async () => {
    if (form.homePostCode?.trim()) {
      console.log("Searching for postcode:", form.homePostCode.trim());
      setShowLocationDropdown(true);
      setIsSearching(true);
      
      try {
        // Try the direct API call first
        console.log("Attempting direct API call...");
        const response = await getLocationByPostcode(form.homePostCode.trim());
        console.log("Direct API response:", response);
        
        if (response.success && response.data) {
          handleLocationSuccess(response.data);
        } else {
          handleLocationError(response.message || "Failed to fetch locations");
        }
      } catch (error) {
        console.error("Direct API call failed, trying useGetRequest...", error);
        // Fallback to useGetRequest
        await fetchLocations(`/api/v1/auth/web/utility/location-by-postcode/${form.homePostCode.trim()}`);
      } finally {
        setIsSearching(false);
      }
    }
  }, [form.homePostCode, fetchLocations, handleLocationSuccess, handleLocationError]);

  // Clear location options and dropdown when postcode is cleared
  useEffect(() => {
    if (!form.homePostCode?.trim()) {
      setLocationOptions([]);
      setShowLocationDropdown(false);
      // Clear selected location when postcode is cleared
      if (form.homeLocation) {
        handleInput("homeLocation", undefined);
      }
    }
  }, [form.homePostCode, form.homeLocation, handleInput]);

  /**
   * When `homeLocation` is populated programmatically (e.g. from an existing
   * company or when returning to this page), ensure the structured address
   * inputs are also auto-filled so the UI stays in sync with the selected
   * location. We only do this when all address fields are currently empty,
   * to avoid overwriting any manual user edits.
   */
  useEffect(() => {
    if (!form.homeLocation || locationItems.length === 0) return;

    const [line1, line2, line3, line4] = form.homeAddress;
    const isAddressEmpty =
      !line1?.trim() && !line2?.trim() && !line3?.trim() && !line4?.trim();
    if (!isAddressEmpty) return;

    const index = Number.parseInt(form.homeLocation.value, 10);
    const selected = Number.isNaN(index) ? undefined : locationItems[index];
    if (selected && selected.address) {
      const addr = selected.address;
      handleAddressInput(0, addr.premises || "");
      handleAddressInput(1, addr.address_line_1 || "");
      handleAddressInput(2, addr.locality || "");
      handleAddressInput(3, addr.postal_code || "");
    }
  }, [form.homeLocation, form.homeAddress, locationItems, handleAddressInput]);

  // Restore location dropdown and options when navigating back if homePostCode exists
  useEffect(() => {
    if (form.homePostCode && form.homePostCode.trim()) {
      setShowLocationDropdown(true);
      if (locationOptions.length === 0) {
        void (async () => {
          await handlePostcodeSearch();
        })();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * Decide when to show the structured home address section.
   *
   * - For "new" companies, this should appear once the user has selected a
   *   location (i.e. `homeLocation` is set) via the postcode search.
   * - For "existing" companies, Page 1 may pre-populate `homeAddress` directly
   *   from the backend without ever setting `homeLocation`. In that case we
   *   still want to render this block so the user can review / edit the
   *   prefilled address.
   *
   * To keep this generic and future-proof, we show the section if either:
   * - a `homeLocation` is selected, OR
   * - any of the `homeAddress` fields already contain a non-empty value.
   */
  const shouldShowHomeAddressSection =
    !!form.homeLocation ||
    form.homeAddress.some((line) => Boolean(line && line.trim().length > 0));

  return (
    <section className="w-full max-w-[700px] xl:max-w-[1100px] mx-auto my-4 lg:my-8 px-4 lg:px-0 bg-white relative">
      <Card className="w-full shadow-[0px_4px_10px_rgba(0,0,0,0.25)] rounded-lg">
        <CardContent className="p-4 lg:p-6">
          <StepIndicator 
            currentStep={currentStep}
            totalSteps={totalSteps}
            stepTitles={stepTitles}
          />
          <div className="space-y-6 lg:space-y-8">
            {/* Contact Details */}
            <div>
              <h2 className="font-semibold text-[#363636] text-lg sm:text-xl tracking-[0] leading-5 font-['Plus_Jakarta_Sans',Helvetica] mb-4">
                Contact Details
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label className="block font-medium text-sm text-[#48505E] tracking-[0] leading-6 font-['Inter',Helvetica] mb-2">
                      Primary Contact Title <span className="text-red-500">*</span>
                    </Label>
                    <CustomSelect
                      options={titleOptions}
                      placeholder="Select title"
                      value={form.primaryContactTitle}
                      onChange={(option) =>
                        handleInput("primaryContactTitle", option || undefined)
                      }
                      className={`w-full h-[35px] ${validationErrors.primaryContactTitle ? 'border-red-500' : ''}`}
                    />
                    {validationErrors.primaryContactTitle && (
                      <p className="text-sm text-red-500 mt-1">{validationErrors.primaryContactTitle[0]}</p>
                    )}
                  </div>
                  <div>
                    <Label className="block font-medium text-sm text-[#48505E] tracking-[0] leading-6 font-['Inter',Helvetica] mb-2">
                      Primary Contact First Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      value={form.primaryContactFirstName}
                      onChange={(e) =>
                        handleInput("primaryContactFirstName", e.target.value)
                      }
                      className={`w-full h-[35px] bg-white rounded border-[0.8px] border-solid shadow-shadow-xs px-4 py-1.5 text-sm font-normal tracking-[0] leading-6 font-['Inter',Helvetica] ${validationErrors.primaryContactFirstName ? 'border-red-500' : 'border-neutral-500'}`}
                      placeholder="John"
                    />
                    {validationErrors.primaryContactFirstName && (
                      <p className="text-sm text-red-500 mt-1">{validationErrors.primaryContactFirstName[0]}</p>
                    )}
                  </div>
                  <div>
                    <Label className="block font-medium text-sm text-[#48505E] tracking-[0] leading-6 font-['Inter',Helvetica] mb-2">
                      Primary Contact Position <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      value={form.primaryContactPosition}
                      onChange={(e) =>
                        handleInput("primaryContactPosition", e.target.value)
                      }
                      className={`w-full h-[35px] bg-white rounded border-[0.8px] border-solid shadow-shadow-xs px-4 py-1.5 text-sm font-normal tracking-[0] leading-6 font-['Inter',Helvetica] ${validationErrors.primaryContactPosition ? 'border-red-500' : 'border-neutral-500'}`}
                      placeholder="Manager"
                    />
                    {validationErrors.primaryContactPosition && (
                      <p className="text-sm text-red-500 mt-1">{validationErrors.primaryContactPosition[0]}</p>
                    )}
                  </div>
                  <div>
                    <Label className="block font-medium text-sm text-[#48505E] tracking-[0] leading-6 font-['Inter',Helvetica] mb-2">
                      Primary Contact Email <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      value={form.primaryContactEmail}
                      onChange={(e) =>
                        handleInput("primaryContactEmail", e.target.value)
                      }
                      className={`w-full h-[35px] bg-white rounded border-[0.8px] border-solid shadow-shadow-xs px-4 py-1.5 text-sm font-normal tracking-[0] leading-6 font-['Inter',Helvetica] ${validationErrors.primaryContactEmail ? 'border-red-500' : 'border-neutral-500'}`}
                      placeholder="john@company.com"
                      type="email"
                    />
                    {validationErrors.primaryContactEmail && (
                      <p className="text-sm text-red-500 mt-1">{validationErrors.primaryContactEmail[0]}</p>
                    )}
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <Label className="block font-medium text-sm text-[#48505E] tracking-[0] leading-6 font-['Inter',Helvetica] mb-2">
                      Business Type <span className="text-red-500">*</span>
                    </Label>
                    <CustomSelect
                      options={businessTypeOptions}
                      placeholder="Select business type"
                      value={form.businessType}
                      onChange={(option) =>
                        handleInput("businessType", option || undefined)
                      }
                      className={`w-full h-[35px] ${validationErrors.businessType ? "border-red-500" : ""}`}
                    />
                    {validationErrors.businessType && (
                      <p className="text-sm text-red-500 mt-1">
                        {validationErrors.businessType[0]}
                      </p>
                    )}
                  </div>
                  <div>
                    <Label className="block font-medium text-sm text-[#48505E] tracking-[0] leading-6 font-['Inter',Helvetica] mb-2">
                      Primary Contact Last Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      value={form.primaryContactLastName}
                      onChange={(e) =>
                        handleInput("primaryContactLastName", e.target.value)
                      }
                      className={`w-full h-[35px] bg-white rounded border-[0.8px] border-solid shadow-shadow-xs px-4 py-1.5 text-sm font-normal tracking-[0] leading-6 font-['Inter',Helvetica] ${validationErrors.primaryContactLastName ? 'border-red-500' : 'border-neutral-500'}`}
                      placeholder="Doe"
                    />
                    {validationErrors.primaryContactLastName && (
                      <p className="text-sm text-red-500 mt-1">{validationErrors.primaryContactLastName[0]}</p>
                    )}
                  </div>
                  <div>
                    <Label className="block font-medium text-sm text-[#48505E] tracking-[0] leading-6 font-['Inter',Helvetica] mb-2">
                      Telephone Number <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      value={form.telephoneNumber}
                      onChange={(e) => {
                        const raw = e.target.value;
                        const sanitized = raw.replace(/[A-Za-z]/g, "");
                        handleInput("telephoneNumber", sanitized);
                      }}
                      className={`w-full h-[35px] bg-white rounded border-[0.8px] border-solid shadow-shadow-xs px-4 py-1.5 text-sm font-normal tracking-[0] leading-6 font-['Inter',Helvetica] ${validationErrors.telephoneNumber ? 'border-red-500' : 'border-neutral-500'}`}
                      placeholder="+44 20 1234 5678"
                      type="tel"
                      inputMode="tel"
                      pattern="^[0-9+()\- ]*$"
                    />
                    {validationErrors.telephoneNumber && (
                      <p className="text-sm text-red-500 mt-1">{validationErrors.telephoneNumber[0]}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Partner/Owner Info */}
            <div>
              <h2 className="font-semibold text-[#363636] text-lg sm:text-xl tracking-[0] leading-5 font-['Plus_Jakarta_Sans',Helvetica] mb-4">
                Partner/Owner Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label className="block font-medium text-sm text-[#48505E] tracking-[0] leading-6 font-['Inter',Helvetica] mb-2">
                      Owner/Partner Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      value={form.ownerPartnerName}
                      onChange={(e) =>
                        handleInput("ownerPartnerName", e.target.value)
                      }
                      className={`w-full h-[35px] bg-white rounded border-[0.8px] border-solid shadow-shadow-xs px-4 py-1.5 text-sm font-normal tracking-[0] leading-6 font-['Inter',Helvetica] ${validationErrors.ownerPartnerName ? 'border-red-500' : 'border-neutral-500'}`}
                      placeholder="Jane Smith"
                    />
                    {validationErrors.ownerPartnerName && (
                      <p className="text-sm text-red-500 mt-1">{validationErrors.ownerPartnerName[0]}</p>
                    )}
                  </div>
                  {/* Post Code */}
                  <div className="w-full lg:max-w-2/3">
                    <Label className="block font-medium text-sm text-[#48505E] tracking-[0] leading-6 font-['Inter',Helvetica] mb-2">
                      Home Post Code <span className="text-red-500">*</span>
                    </Label>
                    <div className="flex">
                      <Input
                        className={`flex-1 h-[35px] rounded-l rounded-r-none border-[0.8px] border-solid shadow-shadow-xs ${validationErrors.homePostCode ? 'border-red-500' : 'border-neutral-500'}`}
                        placeholder="E6 3BJ"
                        value={form.homePostCode}
                        onChange={(e) => handleInput("homePostCode", e.target.value.toUpperCase())}
                      />
                      <Button 
                        className="w-[83px] h-[35px] bg-[#346fb6] rounded-r rounded-l-none text-white text-lg font-medium ml-[-1px]"
                        onClick={handlePostcodeSearch}
                        disabled={isSearching || isLoadingLocations || !form.homePostCode?.trim()}
                      >
                        {isSearching || isLoadingLocations ? "..." : "Find"}
                      </Button>
                    </div>
                    {validationErrors.homePostCode && (
                      <p className="text-sm text-red-500 mt-1">{validationErrors.homePostCode[0]}</p>
                    )}
                  </div>
                  {/* 
                    Location List (Dropdown)
                    - Only show when postcode is provided, "Find" is clicked,
                      AND the company is marked as "new".
                    - For existing companies, the home address can be prefilled
                      from the backend, so we hide this manual selection UI.
                  */}
                  {showLocationDropdown && form.companyType === "new" && (
                    <div>
                      <Label className="block font-medium text-sm text-[#48505E] tracking-[0] leading-6 font-['Inter',Helvetica] mb-2">
                        Location List <span className="text-red-500">*</span>
                      </Label>
                      <CustomSelect
                        options={locationOptions}
                        placeholder={isLoadingLocations ? "Loading locations..." : "Select location"}
                        value={form.homeLocation}
                        onChange={(option) => {
                          handleInput("homeLocation", option || undefined);
                          if (option) {
                            const index = Number.parseInt(option.value, 10);
                            const selected = Number.isNaN(index) ? undefined : locationItems[index];
                            if (selected && selected.address) {
                              const addr = selected.address;
                              handleAddressInput(0, addr.premises || '');
                              handleAddressInput(1, addr.address_line_1 || '');
                              handleAddressInput(2, addr.locality || '');
                              handleAddressInput(3, addr.postal_code || '');
                            }
                          }
                        }}
                        className={`w-full h-[35px] ${validationErrors.homeLocation ? 'border-red-500' : ''}`}
                        isDisabled={isLoadingLocations}
                      />
                      {validationErrors.homeLocation && (
                        <p className="text-sm text-red-500 mt-1">{validationErrors.homeLocation[0]}</p>
                      )}
                      {locationError && (
                        <p className="text-sm text-red-500 mt-1">{locationError}</p>
                      )}
                    </div>
                  )}
                </div>
                <div className="space-y-4">
                  <div>
                    <Label className="block font-medium text-sm text-[#48505E] tracking-[0] leading-6 font-['Inter',Helvetica] mb-2">
                      Owner/Partner DOB <span className="text-red-500">*</span>
                    </Label>
                    <CustomDateInput
                      value={form.ownerPartnerDOB}
                      onChange={(date) => handleInput("ownerPartnerDOB", date)}
                      placeholder="Select date"
                    />
                    {validationErrors.ownerPartnerDOB && (
                      <p className="text-sm text-red-500 mt-1">{validationErrors.ownerPartnerDOB[0]}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Address Section - show when a location is selected or when a prefilled homeAddress exists (e.g. existing company) */}
              {shouldShowHomeAddressSection && (
                <div className="w-full lg:w-3/4 mt-6">
                  <Label className="block font-medium text-sm tracking-[0] leading-6 font-['Inter',Helvetica] mb-3">
                    Address <span className="text-red-500">*</span>
                  </Label>
                  <div className="bg-[#ffffff] rounded-lg border border-solid border-[#c4c4c4] p-4 lg:p-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
                      <Input
                        className="h-[35px] rounded-lg border border-solid border-[#cfd4dc] bg-white shadow-shadow-xs"
                        placeholder="45"
                        value={form.homeAddress[0]}
                        onChange={(e) => handleAddressInput(0, e.target.value)}
                      />
                      <Input
                        className="h-[35px] rounded-lg border border-solid border-[#cfd4dc] bg-white shadow-shadow-xs"
                        placeholder="Macaulay Road"
                        value={form.homeAddress[1]}
                        onChange={(e) => handleAddressInput(1, e.target.value)}
                      />
                      <Input
                        className="h-[35px] rounded-lg border border-solid border-[#cfd4dc] bg-white shadow-shadow-xs"
                        placeholder="London"
                        value={form.homeAddress[2]}
                        onChange={(e) => handleAddressInput(2, e.target.value)}
                      />
                      <Input
                        className="h-[35px] rounded-lg border border-solid border-[#cfd4dc] bg-white shadow-shadow-xs"
                        placeholder="England"
                        value={form.homeAddress[3]}
                        onChange={(e) => handleAddressInput(3, e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Time at Address Section */}
              <div className="w-1/2 mt-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="block font-medium text-sm text-[#48505E] tracking-[0] leading-6 font-['Inter',Helvetica] mb-2">
                      Time at Address (Years) <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      value={form.timeAtAddressYear}
                      onChange={(e) =>
                        handleInput("timeAtAddressYear", e.target.value)
                      }
                      className={`w-full h-[35px] bg-white rounded border-[0.8px] border-solid shadow-shadow-xs px-4 py-1.5 text-sm font-normal tracking-[0] leading-6 font-['Inter',Helvetica] ${validationErrors.timeAtAddressYear ? "border-red-500" : "border-neutral-500"}`}
                      placeholder="5"
                      type="number"
                    />
                    {validationErrors.timeAtAddressYear && (
                      <p className="text-sm text-red-500 mt-1">
                        {validationErrors.timeAtAddressYear[0]}
                      </p>
                    )}
                  </div>
                  <div>
                    <Label className="block font-medium text-sm text-[#48505E] tracking-[0] leading-6 font-['Inter',Helvetica] mb-2">
                      Time at Address (Months) <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      value={form.timeAtAddressMonth}
                      onChange={(e) =>
                        handleInput("timeAtAddressMonth", e.target.value)
                      }
                      className={`w-full h-[35px] bg-white rounded border-[0.8px] border-solid shadow-shadow-xs px-4 py-1.5 text-sm font-normal tracking-[0] leading-6 font-['Inter',Helvetica] ${validationErrors.timeAtAddressMonth ? "border-red-500" : "border-neutral-500"}`}
                      placeholder="6"
                      type="number"
                    />
                    {validationErrors.timeAtAddressMonth && (
                      <p className="text-sm text-red-500 mt-1">
                        {validationErrors.timeAtAddressMonth[0]}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Navigation Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-end pt-6">
              <Button
                className="w-full sm:w-[140px] h-10 bg-[#e5f6fb] text-[#2db9eb] border border-[#2db9eb] rounded font-body-2-medium"
                variant="outline"
                onClick={onPrev}
              >
                Previous Step
              </Button>
              <Button
                className="w-full sm:w-[140px] h-10 bg-[#2db9eb] rounded text-white font-body-2-medium"
                onClick={onNext}
              >
                Next Step
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </section>
  );
};

export default SoldTariffFormPage2;

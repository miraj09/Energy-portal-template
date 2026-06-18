import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/ui/card";
import { Input } from "@/ui/input";
import { Button } from "@/ui/button";
import { Label } from "@/ui/label";
import { CustomSelect, type SelectOption } from "@/ui/select";
import CustomDateInput from "@/ui/customDateInput";
import type { SoldTariffFormData, ValidationErrors } from "./SoldTariffForm";
import StepIndicator from "./StepIndicator";
import { useGetRequest } from "@/composable";

interface SoldTariffFormPage3Props {
  form: SoldTariffFormData;
  handleInput: <K extends keyof SoldTariffFormData>(
    field: K,
    value: SoldTariffFormData[K]
  ) => void;
  handleBillingAddressInput: (idx: number, value: string) => void;
  onPrev: () => void;
  onNext: () => void;
  currentStep: number;
  totalSteps: number;
  stepTitles: string[];
  validationErrors: ValidationErrors;
}

export type { SoldTariffFormPage3Props };

const locationOptions: SelectOption[] = [
  {
    value: "1E Macaulay Road London E6 3BJ",
    label: "1E Macaulay Road London E6 3BJ",
  },
  {
    value: "2A High Street Manchester M1 1AA",
    label: "2A High Street Manchester M1 1AA",
  },
  {
    value: "15 Queen Street Birmingham B1 1AA",
    label: "15 Queen Street Birmingham B1 1AA",
  },
  {
    value: "7 Market Place Leeds LS1 1AA",
    label: "7 Market Place Leeds LS1 1AA",
  },
  {
    value: "22 Church Street Liverpool L1 1AA",
    label: "22 Church Street Liverpool L1 1AA",
  },
];

const SoldTariffFormPage3: React.FC<SoldTariffFormPage3Props> = ({
  form,
  handleInput,
  handleBillingAddressInput,
  onPrev,
  onNext,
  currentStep,
  totalSteps,
  stepTitles,
  validationErrors,
}) => {
  // State for billing type options
  const [billingTypeOptions, setBillingTypeOptions] = useState<SelectOption[]>([]);
  
  // Stable handlers to prevent fetch loop
  const handleBillingTypesSuccess = useCallback((data: unknown) => {
    console.log("Billing types API response:", data);
    if (data && typeof data === 'object' && 'results' in data && Array.isArray((data as { results: unknown[] }).results)) {
      const results = (data as { results: Array<{ id: number; title: string }> }).results;
      const options = results.map((item) => ({ value: item.id.toString(), label: item.title }));
      console.log("Mapped billing type options:", options);
      setBillingTypeOptions(options);
    } else if (data && Array.isArray(data)) {
      const options = (data as Array<{ id?: number; title?: string; name?: string; value?: string; label?: string }>).map((item) => ({
        value: item.id?.toString() || item.value || item.name || '',
        label: item.title || item.name || item.label || item.value || ''
      }));
      console.log("Mapped billing type options from direct array:", options);
      setBillingTypeOptions(options);
    } else if (data && typeof data === 'object' && 'data' in data && Array.isArray((data as { data: unknown[] }).data)) {
      const dataArray = (data as { data: Array<{ id?: number; title?: string; name?: string; value?: string; label?: string }> }).data;
      const options = dataArray.map((item) => ({
        value: item.id?.toString() || item.value || item.name || '',
        label: item.title || item.name || item.label || item.value || ''
      }));
      console.log("Mapped billing type options from data property:", options);
      setBillingTypeOptions(options);
    } else {
      console.warn("Unexpected billing types data format:", data);
      setBillingTypeOptions([
        { value: "same-as-company", label: "Same as Company Address" },
        { value: "different", label: "Different Address" },
      ]);
    }
  }, []);

  const handleBillingTypesError = useCallback((message: string) => {
    console.error("Failed to fetch billing types:", message);
    setBillingTypeOptions([
      { value: "same-as-company", label: "Same as Company Address" },
      { value: "different", label: "Different Address" },
    ]);
  }, []);

  // Hook for fetching billing types
  const { executeGet: fetchBillingTypes, loading: billingTypesLoading } = useGetRequest({
    onSuccess: handleBillingTypesSuccess,
    onError: handleBillingTypesError,
  });
  
  // Fetch billing types on component mount
  useEffect(() => {
    console.log("Fetching billing types from API...");
    fetchBillingTypes("/api/v1/auth/web/core/billing-type/");
  }, [fetchBillingTypes]);

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
          {/* Billing Information */}
          <div>
            <h2 className="font-semibold text-[#363636] text-lg sm:text-xl tracking-[0] leading-5 font-['Plus_Jakarta_Sans',Helvetica] mb-4">
              Company Billing Details
            </h2>
            <div className="space-y-6">
              <div className="w-full lg:max-w-1/3">
                <Label className="block font-medium text-sm text-[#48505E] tracking-[0] leading-6 font-['Inter',Helvetica] mb-2">
                  Billing Type <span className="text-red-500">*</span>
                  {billingTypesLoading && (
                    <span className="ml-2 text-sm text-gray-500">(Loading...)</span>
                  )}
                </Label>
                <CustomSelect
                  options={billingTypeOptions}
                  placeholder={billingTypesLoading ? "Loading billing types..." : "Select billing type"}
                  value={form.billingType}
                  onChange={(option) =>
                    handleInput("billingType", option || undefined)
                  }
                  className={`w-full h-[35px] ${validationErrors.billingType ? 'border-red-500' : ''}`}
                  isDisabled={billingTypesLoading}
                />
                {validationErrors.billingType && (
                  <p className="text-sm text-red-500 mt-1">{validationErrors.billingType[0]}</p>
                )}
              </div>

              {form.billingType?.value === "different" && (
                <>
                  <div className="w-full lg:max-w-1/3">
                    <Label className="block font-medium text-sm text-[#48505E] tracking-[0] leading-6 font-['Inter',Helvetica] mb-2">
                      Billing Post Code
                    </Label>
                    <div className="flex">
                      <Input
                        className="flex-1 h-[35px] rounded-l rounded-r-none border-[0.8px] border-solid border-neutral-500 shadow-shadow-xs"
                        placeholder="E6 3BJ"
                        value={form.billingPostCode}
                        onChange={(e) =>
                          handleInput("billingPostCode", e.target.value)
                        }
                      />
                      <Button className="w-[83px] h-[35px] bg-[#346fb6] rounded-r rounded-l-none text-white text-lg font-medium ml-[-1px]">
                        Find
                      </Button>
                    </div>
                  </div>

                  <div className="w-full max-w-md">
                    <Label className="block font-medium text-sm text-[#48505E] tracking-[0] leading-6 font-['Inter',Helvetica] mb-2">
                      Billing Location List
                    </Label>
                    <CustomSelect
                      options={locationOptions}
                      placeholder="Select billing location"
                      value={form.billingLocation}
                      onChange={(option) =>
                        handleInput("billingLocation", option || undefined)
                      }
                      className="w-full h-[35px]"
                    />
                  </div>

                  <div className="w-full lg:w-3/4">
                    <Label className="block font-medium text-sm tracking-[0] leading-6 font-['Inter',Helvetica] mb-3">
                      Billing Address
                    </Label>
                    <div className="bg-[#ffffff] rounded-lg border border-solid border-[#c4c4c4] p-4 lg:p-6">
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
                        <Input
                          className="h-[35px] rounded-lg border border-solid border-[#cfd4dc] bg-white shadow-shadow-xs"
                          placeholder="1E"
                          value={form.billingAddress[0]}
                          onChange={(e) =>
                            handleBillingAddressInput(0, e.target.value)
                          }
                        />
                        <Input
                          className="h-[35px] rounded-lg border border-solid border-[#cfd4dc] bg-white shadow-shadow-xs"
                          placeholder="Macaulay Road"
                          value={form.billingAddress[1]}
                          onChange={(e) =>
                            handleBillingAddressInput(1, e.target.value)
                          }
                        />
                        <Input
                          className="h-[35px] rounded-lg border border-solid border-[#cfd4dc] bg-white shadow-shadow-xs"
                          placeholder="Newham"
                          value={form.billingAddress[2]}
                          onChange={(e) =>
                            handleBillingAddressInput(2, e.target.value)
                          }
                        />
                        <Input
                          className="h-[35px] rounded-lg border border-solid border-[#cfd4dc] bg-white shadow-shadow-xs"
                          placeholder="London"
                          value={form.billingAddress[3]}
                          onChange={(e) =>
                            handleBillingAddressInput(3, e.target.value)
                          }
                        />
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Time Trading and Incorporated Date */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-20">
            <div>
              <Label className="block font-medium text-sm text-[#48505E] tracking-[0] leading-6 font-['Inter',Helvetica] mb-2">
                Time Trading For
              </Label>
              <Input
                value={form.timeTradingFor}
                onChange={(e) =>
                  handleInput("timeTradingFor", e.target.value)
                }
                className="w-full h-[35px] bg-white rounded border-[0.8px] border-solid border-neutral-500 shadow-shadow-xs px-4 py-1.5 text-sm font-normal tracking-[0] leading-6 font-['Inter',Helvetica]"
                placeholder="5 years"
              />
            </div>
            <div>
              <Label className="block font-medium text-sm text-[#48505E] tracking-[0] leading-6 font-['Inter',Helvetica] mb-2">
                Incorporated Date
              </Label>
              <CustomDateInput
                value={form.incorporatedDate}
                onChange={(date) => handleInput("incorporatedDate", date)}
                placeholder="Select date"
              />
            </div>
          </div>

          {/* Company Details */}
          <div>
            <h2 className="font-semibold text-[#363636] text-lg sm:text-xl tracking-[0] leading-5 font-['Plus_Jakarta_Sans',Helvetica] mb-4">
              Company Details
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-20">
              <div>
                <Label className="block font-medium text-sm text-[#48505E] tracking-[0] leading-6 font-['Inter',Helvetica] mb-2">
                  Director First Name
                </Label>
                <Input
                  value={form.directorFirstName}
                  onChange={(e) =>
                    handleInput("directorFirstName", e.target.value)
                  }
                  className="w-full h-[35px] bg-white rounded border-[0.8px] border-solid border-neutral-500 shadow-shadow-xs px-4 py-1.5 text-sm font-normal tracking-[0] leading-6 font-['Inter',Helvetica]"
                  placeholder="John"
                />
              </div>
              <div>
                <Label className="block font-medium text-sm text-[#48505E] tracking-[0] leading-6 font-['Inter',Helvetica] mb-2">
                  Director Last Name
                </Label>
                <Input
                  value={form.directorLastName}
                  onChange={(e) =>
                    handleInput("directorLastName", e.target.value)
                  }
                  className="w-full h-[35px] bg-white rounded border-[0.8px] border-solid border-neutral-500 shadow-shadow-xs px-4 py-1.5 text-sm font-normal tracking-[0] leading-6 font-['Inter',Helvetica]"
                  placeholder="Smith"
                />
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
      </CardContent>
    </Card>
  </section>
  );
};

export default SoldTariffFormPage3;

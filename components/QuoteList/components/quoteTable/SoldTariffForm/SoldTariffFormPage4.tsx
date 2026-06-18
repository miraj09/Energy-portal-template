import React from "react";
import { Card, CardContent } from "@/ui/card";
import { Input } from "@/ui/input";
import { Button } from "@/ui/button";
import { Label } from "@/ui/label";
import type { SoldTariffFormData, ValidationErrors } from "./SoldTariffForm";
import StepIndicator from "./StepIndicator";

interface SoldTariffFormPage4Props {
  form: SoldTariffFormData;
  handleInput: <K extends keyof SoldTariffFormData>(field: K, value: SoldTariffFormData[K]) => void;
  onPrev: () => void;
  onSubmit: () => void;
  currentStep: number;
  totalSteps: number;
  stepTitles: string[];
  isSubmitting?: boolean;
  validationErrors: ValidationErrors;
}

const SoldTariffFormPage4: React.FC<SoldTariffFormPage4Props> = ({
  form,
  handleInput,
  onPrev,
  onSubmit,
  currentStep,
  totalSteps,
  stepTitles,
  isSubmitting = false,
  validationErrors: _validationErrors,
}) => (
  <section className="w-full max-w-[1106px] mx-auto my-4 lg:my-8 px-4 lg:px-0 bg-white">
    <Card className="w-full shadow-[0px_4px_10px_rgba(0,0,0,0.25)] rounded-lg">
      <CardContent className="p-6">
        <StepIndicator 
          currentStep={currentStep}
          totalSteps={totalSteps}
          stepTitles={stepTitles}
        />
        <h1 className="font-semibold text-[#363636] text-2xl mb-6">Bank Details</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-20">
          <div>
            <Label className="block font-medium text-sm text-[#48505E] mb-2">Account Number</Label>
            <Input
              className="w-full h-[35px] bg-white rounded border-[0.8px] border-solid border-neutral-500 shadow-shadow-xs px-4 py-1.5 text-sm font-normal"
              placeholder="123456789"
              value={form.accountNumber}
              onChange={e => handleInput("accountNumber", e.target.value)}
            />
          </div>
          <div>
            <Label className="block font-medium text-sm text-[#48505E] mb-2">Sort Code</Label>
            <Input
              className="w-full h-[35px] bg-white rounded border-[0.8px] border-solid border-neutral-500 shadow-shadow-xs px-4 py-1.5 text-sm font-normal"
              placeholder="264152"
              value={form.sortCode}
              onChange={e => handleInput("sortCode", e.target.value)}
            />
          </div>
          <div>
            <Label className="block font-medium text-sm text-[#48505E] mb-2">Bank Name</Label>
            <Input
              className="w-full h-[35px] bg-white rounded border-[0.8px] border-solid border-neutral-500 shadow-shadow-xs px-4 py-1.5 text-sm font-normal"
              placeholder="Lloyds Bank"
              value={form.bankName}
              onChange={e => handleInput("bankName", e.target.value)}
            />
          </div>
          <div>
            <Label className="block font-medium text-sm text-[#48505E] mb-2">Account Name</Label>
            <Input
              className="w-full h-[35px] bg-white rounded border-[0.8px] border-solid border-neutral-500 shadow-shadow-xs px-4 py-1.5 text-sm font-normal"
              placeholder="Shafin Ahmed"
              value={form.accountName}
              onChange={e => handleInput("accountName", e.target.value)}
            />
          </div>
        </div>
        <div className="flex flex-row justify-end gap-2 mt-6">
          <Button
            className="h-[35px] bg-[#e5f6fb] text-[#2db9eb] border border-[#2db9eb] rounded font-body-2-medium"
            variant="outline"
            onClick={onPrev}
            disabled={isSubmitting}
          >
            Previous Step
          </Button>
          <Button
            className="h-[35px] bg-[#22c55e] rounded text-white font-body-2-medium"
            onClick={onSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Creating Account..." : "Create Account"}
          </Button>
        </div>
      </CardContent>
    </Card>
  </section>
);

export default SoldTariffFormPage4; 
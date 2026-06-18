"use client";

import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/ui/modal";
import { Button } from "@/ui/button";
import { QuoteDetailsSection as ElectricityQuoteDetails } from "@/components/ElectricityQuote/components/QuoteDetails/quoteDetails";
import { QuoteDetailsSection as GasQuoteDetails } from "@/components/GasQuote/components/QuoteDetails/quoteDetails";
import { Meter } from "../types";

type MeterType = "Electricity" | "Gas";

interface AddMeterModalProps {
  isOpen: boolean;
  onClose: () => void;
  companyId: string;
  siteId: number;
  siteName: string;
  sitePostcode: string;
  onMeterAdded: (meter: Meter) => void;
}

const METER_TYPE_OPTIONS: { value: MeterType; label: string }[] = [
  { value: "Electricity", label: "Electricity" },
  { value: "Gas", label: "Gas" },
];

const AddMeterModal: React.FC<AddMeterModalProps> = ({
  isOpen,
  onClose,
  companyId,
  siteId,
  siteName,
  sitePostcode,
  onMeterAdded,
}) => {
  const [selectedType, setSelectedType] = useState<MeterType | null>(null);

  // Reset step when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSelectedType(null);
    }
  }, [isOpen]);

  const handleClose = () => {
    setSelectedType(null);
    onClose();
  };

  const handleMeterCreated = (meter?: Meter) => {
    if (!meter) return;
    onMeterAdded(meter);
    handleClose();
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) handleClose();
      }}
    >
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto bg-white">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold text-[#363636]">
            {selectedType ? `Add ${selectedType} Meter` : "Add Meter"}
            {siteName ? ` — ${siteName}` : ""}
          </DialogTitle>
        </DialogHeader>

        {!selectedType ? (
          <div className="py-4">
            <p className="text-sm text-gray-600 mb-4">
              Select the meter type you want to add:
            </p>
            <div className="grid grid-cols-2 gap-3">
              {METER_TYPE_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setSelectedType(option.value)}
                  className="px-4 py-3 rounded-lg border-2 border-gray-300 bg-white text-gray-700 font-medium hover:border-primary hover:bg-primary hover:text-primary-foreground transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div>
            <div className="mb-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setSelectedType(null)}
                className="text-sm"
              >
                ← Back to meter type
              </Button>
            </div>

            {selectedType === "Electricity" ? (
              <ElectricityQuoteDetails
                variant="modal"
                companyId={companyId}
                siteId={siteId}
                defaultPostcode={sitePostcode}
                onSuccess={handleMeterCreated}
              />
            ) : (
              <GasQuoteDetails
                variant="modal"
                companyId={companyId}
                siteId={siteId}
                defaultPostcode={sitePostcode}
                onSuccess={handleMeterCreated}
              />
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default AddMeterModal;

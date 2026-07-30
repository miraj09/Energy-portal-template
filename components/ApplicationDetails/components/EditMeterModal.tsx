"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/ui/modal";
import { toast } from "sonner";
import { QuoteDetailsSection as ElectricityQuoteDetails } from "@/components/ElectricityQuote/components/QuoteDetails/quoteDetails";
import { QuoteDetailsSection as GasQuoteDetails } from "@/components/GasQuote/components/QuoteDetails/quoteDetails";
import { getApplicationMeter } from "@/composable/getApplicationMeter";
import { MeterQuoteFormValues } from "@/composable/meterQuoteForm";
import { MeterDetail } from "../types";

interface EditMeterModalProps {
  isOpen: boolean;
  onClose: () => void;
  companyId: string;
  siteId: number;
  sitePostcode: string;
  meter: MeterDetail | null;
  onMeterUpdated: () => void | Promise<void>;
}

const EditMeterModal: React.FC<EditMeterModalProps> = ({
  isOpen,
  onClose,
  companyId,
  siteId,
  sitePostcode,
  meter,
  onMeterUpdated,
}) => {
  const router = useRouter();
  const isGas = meter?.type.toLowerCase() === "gas";
  const [initialQuoteData, setInitialQuoteData] =
    useState<MeterQuoteFormValues | null>(null);
  const [initialQuoteId, setInitialQuoteId] = useState<number | undefined>(
    undefined
  );
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !meter?.id) {
      setInitialQuoteData(null);
      setInitialQuoteId(undefined);
      setLoadError(null);
      setIsLoading(false);
      return;
    }

    const meterId = meter.id;
    let isCancelled = false;

    async function loadMeterDetails() {
      setIsLoading(true);
      setLoadError(null);
      setInitialQuoteData(null);
      setInitialQuoteId(undefined);

      const response = await getApplicationMeter(meterId);

      if (isCancelled) return;

      if (response.success && response.formValues) {
        setInitialQuoteData({
          ...response.formValues,
          postcode: response.formValues.postcode || sitePostcode,
        });
        setInitialQuoteId(response.quoteId);
        setIsLoading(false);
        return;
      }

      if (
        response.errors &&
        typeof response.errors === "object" &&
        "authError" in response.errors
      ) {
        toast.error("Token expired. Authentication required.");
        await new Promise((resolve) => setTimeout(resolve, 500));
        router.push("/login");
        setIsLoading(false);
        return;
      }

      setLoadError(response.message || "Failed to load meter details");
      setIsLoading(false);
    }

    loadMeterDetails();

    return () => {
      isCancelled = true;
    };
  }, [isOpen, meter?.id, sitePostcode, router]);

  async function handleMeterUpdated() {
    await onMeterUpdated();
    onClose();
  }

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto bg-white">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold text-[#363636]">
            Edit {meter?.type ?? ""} Meter
            {meter?.siteName ? ` — ${meter.siteName}` : ""}
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center min-h-[240px]">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4" />
              <p className="text-gray-600">Loading meter details...</p>
            </div>
          </div>
        ) : loadError ? (
          <div className="py-8 text-center text-red-500">{loadError}</div>
        ) : meter && initialQuoteData ? (
          isGas ? (
            <GasQuoteDetails
              key={`edit-gas-${meter.id}`}
              variant="modal"
              companyId={companyId}
              siteId={siteId}
              meterId={meter.id}
              quoteId={initialQuoteId}
              initialQuoteData={initialQuoteData}
              onSuccess={handleMeterUpdated}
            />
          ) : (
            <ElectricityQuoteDetails
              key={`edit-electricity-${meter.id}`}
              variant="modal"
              companyId={companyId}
              siteId={siteId}
              meterId={meter.id}
              quoteId={initialQuoteId}
              initialQuoteData={initialQuoteData}
              onSuccess={handleMeterUpdated}
            />
          )
        ) : null}
      </DialogContent>
    </Dialog>
  );
};

export default EditMeterModal;

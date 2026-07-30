"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/ui/modal";
import { Button } from "@/ui/button";
import { sellApplicationMeterTariff } from "@/composable/sellApplicationMeterTariff";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export interface ConfirmTariffQuoteRow {
  supplier_name: string;
  latesttariffname: string;
  term: string;
  totalCost: string;
  monthlyCost: string;
  standingCharge: string;
  dayRate: string;
}

interface ConfirmTariffModalProps {
  isOpen: boolean;
  onClose: () => void;
  quote: ConfirmTariffQuoteRow | null;
  meterId: number;
  companyId: string;
}

const ConfirmTariffModal: React.FC<ConfirmTariffModalProps> = ({
  isOpen,
  onClose,
  quote,
  meterId,
  companyId,
}) => {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleConfirm = async () => {
    if (!quote) return;

    setIsSubmitting(true);
    try {
      const response = await sellApplicationMeterTariff(meterId, {
        supplierName: quote.supplier_name,
        tariffName: quote.latesttariffname,
        term: quote.term,
        standingCharge: quote.standingCharge,
        dayRate: quote.dayRate,
      });

      if (response.success) {
        toast.success("Tariff sold successfully!");
        onClose();
        router.push(`/all-applications/${companyId}`);
      } else if (
        response.errors &&
        typeof response.errors === "object" &&
        "authError" in response.errors
      ) {
        toast.error("Token expired. Authentication required.");
        await new Promise((resolve) => setTimeout(resolve, 500));
        router.push("/login");
      } else {
        toast.error(response.message || "Failed to sell tariff");
      }
    } catch (error) {
      console.error("Error selling tariff:", error);
      toast.error("An error occurred while selling the tariff");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open && !isSubmitting) onClose();
      }}
    >
      <DialogContent className="max-w-md bg-white">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold text-[#363636]">
            Confirm Sold Tariff
          </DialogTitle>
        </DialogHeader>

        {quote ? (
          <div className="space-y-4 py-2">
            <p className="text-sm text-gray-600">
              Apply this tariff to the meter you added?
            </p>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-gray-500">Supplier</dt>
                <dd className="font-medium text-[#363636] text-right">
                  {quote.supplier_name}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-gray-500">Tariff</dt>
                <dd className="font-medium text-[#363636] text-right">
                  {quote.latesttariffname}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-gray-500">Term</dt>
                <dd className="font-medium text-[#363636]">{quote.term}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-gray-500">Total cost</dt>
                <dd className="font-medium text-[#363636]">
                  £{quote.totalCost}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-gray-500">Monthly cost</dt>
                <dd className="font-medium text-[#363636]">
                  £{quote.monthlyCost}
                </dd>
              </div>
            </dl>

            <div className="flex justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="button"
                className="bg-[#346fb6] hover:bg-[#346fb6]/90 text-white"
                onClick={handleConfirm}
                disabled={isSubmitting}
              >
                {isSubmitting ? "Confirming..." : "Confirm Sold Tariff"}
              </Button>
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
};

export default ConfirmTariffModal;

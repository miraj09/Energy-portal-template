"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Button,
  Switch,
  Label,
  Input,
} from "@/ui";
import { Checkbox } from "@/ui/checkbox";
import { toast } from "sonner";
import type { Meter, Site } from "@/components/ApplicationDetails/types";
import {
  buildMeterReferenceForDisplay,
  resolveMeterDisplayRates,
} from "@/composable/meterQuoteForm";
import {
  buildSendApplicationContractPayload,
  type SendApplicationContractPayload,
} from "@/lib/contracts/sendApplicationContract";
import { cn } from "@/lib/utils";

type SendContractModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sites: Site[];
  companyId: string;
  isSending?: boolean;
  onConfirm: (payload: SendApplicationContractPayload) => void | Promise<void>;
};

type MeterCardItem = {
  meter: Meter;
  siteName: string;
  sitePostcode: string;
};

/**
 * Placeholder shown when API data is missing.
 * TODO: remove / replace per-field once backend always returns real values.
 */
const DUMMY = {
  startDate: "01/01/2026",
  supplier: "Example Supplier",
  tariffName: "Example Tariff",
  term: "12",
  units: "1000 kWh",
  // TODO: wire real uplift value from API when available
  uplifts: "0.00",
  standingCharge: "0.00 p",
  dayRate: "0.00 p",
  nightRate: "0.00 p",
  ewRate: "0.00 p",
  winterRate: "0.00 p",
  sitePostcode: "N/A",
} as const;

/**
 * UI-only payment options for the layout mock.
 * TODO: replace with real payment-method list from API when wiring submit deals.
 */
const PAYMENT_METHOD_OPTIONS = [
  {
    value: "fixed_direct_debit_monthly",
    label: "Fixed Direct Debit - Monthly",
  },
  {
    value: "monthly_variable_direct_debit",
    label: "Monthly Variable Direct Debit",
  },
  {
    value: "quarterly_variable_direct_debit",
    label: "Quarterly Variable Direct Debit",
  },
  {
    value: "quarterly_on_demand_payment",
    label: "Quarterly on Demand Payment (quarterly cash/cheque)",
  },
  {
    value: "cash_cheque",
    label: "Cash/Cheque",
  },
  {
    value: "existing_supplier_direct_debit_fixed",
    label: "Existing Supplier Direct Debit – Fixed",
  },
  {
    value: "existing_supplier_direct_debit_variable",
    label: "Existing Supplier Direct Debit – Variable",
  },
] as const;

const selectClassName = cn(
  "flex h-9 w-full max-w-xs rounded-md border border-gray-300 bg-white px-3 py-1 text-sm text-gray-900 shadow-sm",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
);

/** Use API value when present; otherwise show a labelled dummy for layout/QA. */
function displayOrDummy(
  value: string | number | null | undefined,
  dummy: string
): string {
  if (value == null) return dummy;
  const normalized = String(value).trim();
  if (!normalized || normalized === "-" || normalized === "N/A") {
    return dummy;
  }
  return normalized;
}

function flattenActiveMeters(sites: Site[]): MeterCardItem[] {
  const items: MeterCardItem[] = [];
  for (const site of sites) {
    if (site.is_deleted || site.is_active === false) continue;
    for (const meter of site.meters || []) {
      if (meter.is_deleted || meter.is_active === false) continue;
      items.push({
        meter,
        siteName: site.sitename?.trim() || `Site ${site.id}`,
        sitePostcode: site.postcode?.trim() || "",
      });
    }
  }
  return items;
}

function MeterReferenceBadge({ meter }: { meter: Meter }) {
  const ref = buildMeterReferenceForDisplay(meter);
  return (
    <div className="flex items-center shrink-0">
      <div className="w-[40px] h-[40px] flex items-center justify-center bg-white border border-[#363636] border-r-0">
        <span className="font-medium text-[#363636] text-lg">{ref.indicator}</span>
      </div>
      <div className="flex flex-col">
        <div className="flex">
          <div className="w-[70px] h-[20px] bg-white border border-[#363636] border-b-0 border-r-0 flex items-center justify-center text-black">
            <span className="text-xs">{ref.topRow[0]}</span>
          </div>
          <div className="w-[90px] h-[20px] bg-white border border-[#363636] border-b-0 border-r-0 flex items-center justify-center text-black">
            <span className="text-xs">{ref.topRow[1]}</span>
          </div>
          <div className="w-[90px] h-[20px] bg-white border border-[#363636] border-b-0 flex items-center justify-center text-black">
            <span className="text-xs">{ref.topRow[2]}</span>
          </div>
        </div>
        <div className="flex">
          <div className="w-[50px] h-[20px] bg-white border border-[#363636] border-r-0 flex items-center justify-center text-black">
            <span className="text-xs">{ref.bottomRow[0]}</span>
          </div>
          <div className="w-[70px] h-[20px] bg-white border border-[#363636] border-r-0 flex items-center justify-center text-black">
            <span className="text-xs">{ref.bottomRow[1]}</span>
          </div>
          <div className="w-[70px] h-[20px] bg-white border border-[#363636] border-r-0 flex items-center justify-center text-black">
            <span className="text-xs">{ref.bottomRow[2]}</span>
          </div>
          <div className="w-[60px] h-[20px] bg-white border border-[#363636] flex items-center justify-center text-black">
            <span className="text-xs">{ref.bottomRow[3]}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SendContractModal({
  open,
  onOpenChange,
  sites,
  companyId,
  isSending = false,
  onConfirm,
}: SendContractModalProps) {
  const meterItems = useMemo(() => flattenActiveMeters(sites), [sites]);
  const [selectedMeterIds, setSelectedMeterIds] = useState<Set<number>>(
    () => new Set()
  );

  // --- UI-only form state (not sent to send-application-contract) ---
  // TODO: wire these into a real submit-deals payload when backend supports them.
  const [contractTypeVerbal, setContractTypeVerbal] = useState(false);
  const [contractTypeDocusign, setContractTypeDocusign] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("");
  const [hasConsent, setHasConsent] = useState(false);
  const [yourReference, setYourReference] = useState("");

  // Reset selection + UI-only fields when the modal opens.
  useEffect(() => {
    if (!open) return;
    setSelectedMeterIds(new Set());
    setContractTypeVerbal(false);
    setContractTypeDocusign(false);
    setPaymentMethod("");
    setHasConsent(false);
    setYourReference("");
  }, [open]);

  const toggleMeter = (meterid: number, checked: boolean) => {
    setSelectedMeterIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(meterid);
      else next.delete(meterid);
      return next;
    });
  };

  const handleConfirm = async () => {
    const meterIds = Array.from(selectedMeterIds);
    if (meterIds.length === 0) {
      toast.error("Select at least one meter to send.");
      return;
    }

    try {
      const payload = buildSendApplicationContractPayload({
        companyId,
        scope: "meters",
        meterIds,
      });
      await onConfirm(payload);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Invalid selection.";
      toast.error(message);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto bg-white">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold text-[#363636]">
            Send contract for
          </DialogTitle>
        </DialogHeader>

        {meterItems.length === 0 ? (
          <div className="py-8 text-center text-gray-500">
            No meters available to send.
          </div>
        ) : (
          <div className="space-y-4 pt-2">
            {meterItems.map(({ meter, siteName, sitePostcode }) => {
              const isSelected = selectedMeterIds.has(meter.meterid);
              const switchId = `submit-record-${meter.meterid}`;
              const rates = resolveMeterDisplayRates(meter);

              // Prefer API / quote rates; fall back to DUMMY.* until fields are reliably populated.
              const startDate = displayOrDummy(rates.startDate, DUMMY.startDate);
              const supplier = displayOrDummy(
                meter.latestsoldsuppliername,
                DUMMY.supplier
              );
              const tariffName = displayOrDummy(
                meter.latesttariffname,
                DUMMY.tariffName
              );
              const term = displayOrDummy(meter.latestterm, DUMMY.term);
              const units = displayOrDummy(
                rates.dayKwh ? `${rates.dayKwh} kWh` : null,
                DUMMY.units
              );
              // TODO: replace DUMMY.uplifts with real uplift from API when available
              const uplifts = DUMMY.uplifts;
              const standingCharge = displayOrDummy(
                rates.standingCharge,
                DUMMY.standingCharge
              );
              const dayRate = displayOrDummy(rates.dayRate, DUMMY.dayRate);
              const nightRate = displayOrDummy(
                rates.nightRate,
                DUMMY.nightRate
              );
              const ewRate = displayOrDummy(
                rates.eveningWeekendRate,
                DUMMY.ewRate
              );
              const winterRate = displayOrDummy(
                rates.winterRate,
                DUMMY.winterRate
              );

              return (
                <div
                  key={meter.meterid}
                  className="rounded-lg border border-gray-200 bg-white p-4 space-y-4"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
                    <MeterReferenceBadge meter={meter} />
                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 text-sm w-full">
                      <div>
                        <div className="text-[#737373]">Start Date</div>
                        {/* TODO: use real Contract_Start_Date / sold start when always present */}
                        <div className="text-black">{startDate}</div>
                      </div>
                      <div>
                        <div className="text-[#737373]">Supplier</div>
                        <div className="text-black">{supplier}</div>
                      </div>
                      <div>
                        <div className="text-[#737373]">Tariff Name</div>
                        <div className="text-black break-words">{tariffName}</div>
                      </div>
                      <div>
                        <div className="text-[#737373]">Term</div>
                        <div className="text-black">{term}</div>
                      </div>
                      <div>
                        <div className="text-[#737373]">Units</div>
                        {/* TODO: prefer day_kwh / aq_eac from quote when available */}
                        <div className="text-black">{units}</div>
                      </div>
                      <div>
                        <div className="text-[#737373]">Uplifts</div>
                        {/* TODO: render real uplift field from API */}
                        <div className="text-black">{uplifts}</div>
                      </div>
                      <div>
                        <div className="text-[#737373]">Site Name</div>
                        <div className="text-black">{siteName}</div>
                      </div>
                      <div>
                        <div className="text-[#737373]">Site Postcode</div>
                        <div className="text-black">
                          {displayOrDummy(sitePostcode, DUMMY.sitePostcode)}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-lg border border-gray-200 overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-primary hover:bg-primary">
                          <TableHead className="text-white font-medium py-2 px-3">
                            Standing Charge
                          </TableHead>
                          <TableHead className="text-white font-medium py-2 px-3">
                            Term
                          </TableHead>
                          <TableHead className="text-white font-medium py-2 px-3">
                            Day Rate
                          </TableHead>
                          <TableHead className="text-white font-medium py-2 px-3">
                            Night Rate
                          </TableHead>
                          <TableHead className="text-white font-medium py-2 px-3">
                            EW Rate
                          </TableHead>
                          <TableHead className="text-white font-medium py-2 px-3">
                            Winter Rate
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        <TableRow>
                          {/* TODO: standing/day/night/ew/winter from quote or latestSold* once reliable */}
                          <TableCell className="py-2 px-3">
                            {standingCharge}
                          </TableCell>
                          <TableCell className="py-2 px-3">{term}</TableCell>
                          <TableCell className="py-2 px-3">{dayRate}</TableCell>
                          <TableCell className="py-2 px-3">{nightRate}</TableCell>
                          <TableCell className="py-2 px-3">{ewRate}</TableCell>
                          <TableCell className="py-2 px-3">{winterRate}</TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>

                  <div className="flex items-center justify-end gap-3">
                    <Label
                      htmlFor={switchId}
                      className="text-sm font-medium text-[#363636]"
                    >
                      Submit Record:
                    </Label>
                    <Switch
                      id={switchId}
                      checked={isSelected}
                      disabled={isSending}
                      onCheckedChange={(checked) =>
                        toggleMeter(meter.meterid, checked)
                      }
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/*
          UI-only section matching Submit Contracts layout.
          Not included in send-application-contract payload.
          TODO: wire Contract Type / Payment Method / Consent / Reference when API supports them.
        */}
        <div className="mt-6 space-y-4 rounded-lg border border-gray-200 bg-[#F7FAFF] p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-6">
            <span className="text-sm font-medium text-[#363636] min-w-[120px]">
              Contract Type:
            </span>
            <div className="flex flex-wrap items-center gap-5">
              <label className="flex items-center gap-2 text-sm text-gray-800 cursor-pointer">
                <Checkbox
                  checked={contractTypeVerbal}
                  disabled={isSending}
                  onCheckedChange={(checked) =>
                    setContractTypeVerbal(checked === true)
                  }
                />
                Verbal/Written
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-800 cursor-pointer">
                <Checkbox
                  checked={contractTypeDocusign}
                  disabled={isSending}
                  onCheckedChange={(checked) =>
                    setContractTypeDocusign(checked === true)
                  }
                />
                DocuSign
              </label>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
              <span className="text-sm font-medium text-[#363636] min-w-[120px]">
                Payment Method:
              </span>
              <select
                className={selectClassName}
                value={paymentMethod}
                disabled={isSending}
                onChange={(event) => setPaymentMethod(event.target.value)}
                aria-label="Payment method"
              >
                <option value="">Select payment method</option>
                {PAYMENT_METHOD_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <Label
                htmlFor="send-contract-has-consent"
                className="text-sm font-medium text-[#363636]"
              >
                Has Consent:
              </Label>
              <Switch
                id="send-contract-has-consent"
                checked={hasConsent}
                disabled={isSending}
                onCheckedChange={setHasConsent}
              />
              {/* TODO: replace with real help content / tooltip when product copy is ready */}
              <button
                type="button"
                className="inline-flex h-6 w-6 items-center justify-center rounded bg-[#22D086] text-xs font-bold text-white"
                title="Consent help (placeholder)"
                aria-label="Consent help"
                onClick={() =>
                  toast.info(
                    "Consent help is a UI placeholder. Wire real help copy later."
                  )
                }
              >
                ?
              </button>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3 pt-4 sm:flex-row sm:items-center sm:justify-between">
          <Button
            type="button"
            variant="outline"
            disabled={isSending}
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>

          <div className="flex flex-1 flex-col gap-2 sm:mx-4 sm:max-w-md">
            <Label
              htmlFor="send-contract-your-reference"
              className="text-sm font-medium text-[#363636]"
            >
              Your Reference:
            </Label>
            {/* TODO: include yourReference in API payload when backend accepts it */}
            <Input
              id="send-contract-your-reference"
              value={yourReference}
              disabled={isSending}
              onChange={(event) => setYourReference(event.target.value)}
              placeholder="Enter reference"
              className="bg-white"
            />
          </div>

          <Button
            type="button"
            disabled={isSending || meterItems.length === 0}
            onClick={() => void handleConfirm()}
            className="bg-teal-600 hover:bg-teal-700 text-white"
          >
            {isSending ? "Sending..." : "Send to e-sign"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

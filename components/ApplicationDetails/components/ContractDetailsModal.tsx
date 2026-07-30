import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/ui/modal";
import { Label } from "@/ui/label";
import { ContractDetails } from '../types';

interface ContractDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  contractDetails: ContractDetails | null;
}

const ContractDetailsModal: React.FC<ContractDetailsModalProps> = ({
  isOpen,
  onClose,
  contractDetails
}) => {
  if (!contractDetails) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl bg-white">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold text-[#363636]">
            Contract Details
          </DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
          <div>
            <Label className="text-sm font-medium block mb-1">
              Contract commission
            </Label>
            <div className="w-full border-none rounded px-3 py-2 bg-[#E4E4E4] text-gray-700">
              : {contractDetails.contractCommission}
            </div>
          </div>
          <div>
            <Label className="text-sm font-medium block mb-1">
              Start Date
            </Label>
            <div className="w-full border-none rounded px-3 py-2 bg-[#E4E4E4] text-gray-700">
              : {contractDetails.startDate}
            </div>
          </div>

          <div>
            <Label className="text-sm font-medium block mb-1">
              Sold Supplier
            </Label>
            <div className="w-full border-none rounded px-3 py-2 bg-[#E4E4E4] text-gray-700">
              : {contractDetails.soldSupplier}
            </div>
          </div>
          <div>
            <Label className="text-sm font-medium block mb-1">
              Tariff
            </Label>
            <div className="w-full border-none rounded px-3 py-2 bg-[#E4E4E4] text-gray-700">
              : {contractDetails.tariff}
            </div>
          </div>

          <div>
            <Label className="text-sm font-medium block mb-1">
              Term
            </Label>
            <div className="w-full border-none rounded px-3 py-2 bg-[#E4E4E4] text-gray-700">
              : {contractDetails.term}
            </div>
          </div>
          <div>
            <Label className="text-sm font-medium block mb-1">
              Units
            </Label>
            <div className="w-full border-none rounded px-3 py-2 bg-[#E4E4E4] text-gray-700">
              : {contractDetails.units}
            </div>
          </div>

          <div>
            <Label className="text-sm font-medium block mb-1">
              Uplifts
            </Label>
            <div className="w-full border-none rounded px-3 py-2 bg-[#E4E4E4] text-gray-700">
              : {contractDetails.uplifts}
            </div>
          </div>
          <div>
            <Label className="text-sm font-medium block mb-1">
              Rates
            </Label>
            <div className="w-full border-none rounded px-3 py-2 bg-[#E4E4E4] text-gray-700">
              : Standing charge : &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; {contractDetails.rates.standingCharge}
              <br />
              &nbsp;&nbsp;Day rate: &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; {contractDetails.rates.dayRate}
              {contractDetails.rates.nightRate ? (
                <>
                  <br />
                  &nbsp;&nbsp;Night rate: &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; {contractDetails.rates.nightRate}
                </>
              ) : null}
              {contractDetails.rates.eveningWeekendRate ? (
                <>
                  <br />
                  &nbsp;&nbsp;Evening/Weekend rate: &nbsp;&nbsp; {contractDetails.rates.eveningWeekendRate}
                </>
              ) : null}
              {contractDetails.rates.winterRate ? (
                <>
                  <br />
                  &nbsp;&nbsp;Winter rate: &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; {contractDetails.rates.winterRate}
                </>
              ) : null}
            </div>
          </div>

          <div>
            <Label className="text-sm font-medium block mb-1">
              Savings
            </Label>
            <div className="w-full border-none rounded px-3 py-2 bg-[#E4E4E4] text-gray-700">
              : {contractDetails.savings}
            </div>
          </div>
          <div>
            <Label className="text-sm font-medium block mb-1">
              Yearly Cost
            </Label>
            <div className="w-full border-none rounded px-3 py-2 bg-[#E4E4E4] text-gray-700">
              : {contractDetails.yearlyCost}
            </div>
          </div>

          <div>
            <Label className="text-sm font-medium block mb-1">
              Sold Date
            </Label>
            <div className="w-full border-none rounded px-3 py-2 bg-[#E4E4E4] text-gray-700">
              : {contractDetails.soldDate}
            </div>
          </div>
          <div>
            <Label className="text-sm font-medium block mb-1">
              Contract Type
            </Label>
            <div className="w-full border-none rounded px-3 py-2 bg-[#E4E4E4] text-gray-700">
              : {contractDetails.contractType}
            </div>
          </div>

          <div>
            <Label className="text-sm font-medium block mb-1">
              Submitted
            </Label>
            <div className="w-full border-none rounded px-3 py-2 bg-[#E4E4E4] text-gray-700">
              : {contractDetails.submitted}
            </div>
          </div>
          <div>
            <Label className="text-sm font-medium block mb-1">
              Is Processed
            </Label>
            <div className="w-full border-none rounded px-3 py-2 bg-[#E4E4E4] text-gray-700">
              : {contractDetails.isProcessed}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ContractDetailsModal; 
"use client";
import { Card, CardContent } from "@/ui/card";
import { Dialog, DialogContent } from "@/ui/modal";
import { Slider } from "@/ui/slider";
import { X } from "lucide-react";
import { JSX, useState } from "react";

interface CostBreakdownModalProps {
  isOpen: boolean;
  onClose: () => void;
  quoteData?: {
    standingCharge: string;
    dayRate: string;
    dayKwh: string;
    totalCost: string;
    cclRate: string;
    cclCost: string;
    vatRate: string;
    vatCost: string;
    monthlyCost: string;
    savings1: string;
    savings2: string;
  };
  isCustomerView?: boolean;
}

export const CostBreakdownModal = ({
  isOpen,
  onClose,
  quoteData,
  isCustomerView = true,
}: CostBreakdownModalProps): JSX.Element => {
  // No default data - use only API data
  const [commissionValue, setCommissionValue] = useState([0.1]);
  const parsedTotalCost = Number((quoteData?.totalCost ?? "0").replace(/[^0-9.-]+/g, ""));
  const commissionAmount =
    Number.isFinite(parsedTotalCost)
      ? (parsedTotalCost * commissionValue[0]) / 100
      : null;

  // Data for the commission slider
  const commissionData = {
    label: "Commission",
    value: `${Number(commissionValue[0].toFixed(1))}`,
    amount: commissionAmount === null ? "-" : `£${commissionAmount.toFixed(2)}`,
  };
  const data = quoteData;

  // Cost breakdown items for the card layout
  const costBreakdownItems = [
    {
      type: "Standing Charge:",
      price: data?.standingCharge ?? "-",
      units: "365 days",
      cost: data?.totalCost ?? "-",
      isHighlighted: false,
    },
    {
      type: "Day:",
      price: data?.dayRate ?? "-",
      units: data?.dayKwh ?? "-",
      cost: data?.totalCost ?? "-",
      isHighlighted: false,
    },
    {
      type: "Total:",
      price: "",
      units: "",
      cost: data?.totalCost ?? "-",
      isHighlighted: true,
    },
    {
      type: "CCL (Climate Change Levy):",
      price: data?.cclRate ?? "-",
      units: data?.dayKwh ?? "-",
      cost: data?.cclCost ?? "-",
      isHighlighted: false,
    },
    {
      type: "VAT (Value Added Tax):",
      price: data?.vatRate ?? "-",
      units: "",
      cost: data?.vatCost ?? "-",
      isHighlighted: false,
    },
    {
      type: "Monthly Cost:",
      price: "",
      units: "12 Months",
      cost: data?.monthlyCost ?? "-",
      isHighlighted: true,
    },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto bg-white p-0">
        <div className="relative m-4">
          {/* Header */}
          <div className="flex items-center justify-end p-4 border-b border-gray-200">
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Section - Detailed Cost Breakdown */}
              <div className="">
                <div className="p-4">
                  {/* Header Row */}
                  <div className="flex items-center justify-between px-4 py-3 bg-[#346fb6] text-white rounded-t-lg font-medium text-sm mb-3">
                    <div className="flex-1 text-left">Type</div>
                    <div className="flex-1 text-right">Price</div>
                    <div className="flex-1 text-right">Units</div>
                    <div className="flex-1 text-right">Cost</div>
                  </div>

                  {/* Card List */}
                  <div className="flex flex-col gap-2">
                    {costBreakdownItems.map((item, index) => (
                      <Card
                        key={index}
                        className={`w-full border border-[#bbbbbb] rounded-sm shadow-sm ${
                          item.isHighlighted ? "bg-blue-50" : ""
                        }`}
                      >
                        <CardContent className="flex items-center justify-between px-4 py-3 gap-0">
                          <div className="flex-1 text-left font-medium text-[#737373] text-sm">
                            {item.type}
                          </div>
                          <div className="flex-1 text-right font-medium text-[#737373] text-sm">
                            {item.price}
                          </div>
                          <div className="flex-1 text-right font-medium text-[#737373] text-sm">
                            {item.units}
                          </div>
                          <div className="flex-1 text-right font-medium text-[#737373] text-sm">
                            {item.cost}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Section - Summary and Savings */}
              <div className="">
                <div className="px-4">
                                      {/* Card List */}
                    <div className="flex flex-col gap-2">
                     {!isCustomerView && (
                       <>
                          {/* Global Uplift Slider */}
                          <Card className="relative w-full h-28 bg-[#346fb6] rounded-lg overflow-hidden border-[0.8px] border-solid border-transparent shadow-shadow-xs">
                            <CardContent className="p-0 h-full">
                              <div className="absolute w-[85px] top-[43px] left-[17px] font-medium text-white text-sm tracking-[0] leading-6 whitespace-nowrap">
                                {commissionData.label}
                              </div>

                              <div className="absolute w-16 top-[18px] left-[210px] font-normal text-white text-sm tracking-[0] leading-6 whitespace-nowrap">
                                {commissionData.value}
                              </div>

                              <div className="absolute w-[78px] top-[70px] left-[203px] font-normal text-white text-sm tracking-[0] leading-6 whitespace-nowrap">
                                {commissionData.amount}
                              </div>

                              <div className="absolute w-[209px] top-[45px] left-32 h-6 flex items-center">
                                <Slider
                                  value={commissionValue}
                                  onValueChange={setCommissionValue}
                                  max={3}
                                  min={0.1}
                                  step={0.1}
                                  className="w-full"
                                />
                              </div>
                            </CardContent>
                          </Card>
                       </>
                     )}
                    <Card className="w-full border border-[#bbbbbb] rounded-sm shadow-sm">
                      <CardContent className="flex items-center justify-between px-6 py-3">
                        <div className="flex-1 text-left font-medium text-[#737373] text-sm">
                          Total Cost
                        </div>
                        <div className="flex-1 text-right font-medium text-[#737373] text-sm">
                          {data?.totalCost ?? "-"}
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="w-full border border-[#bbbbbb] rounded-sm shadow-sm">
                      <CardContent className="flex items-center justify-between px-6 py-3">
                        <div className="flex-1 text-left font-medium text-[#737373] text-sm">
                          Savings
                        </div>
                        <div className="flex-1 text-right font-medium text-[#737373] text-sm">
                          {data?.savings1 ?? "-"}
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="w-full rounded-sm shadow-sm bg-primary">
                      <CardContent className="flex items-center justify-between px-4 py-3">
                        <div className="flex-1 text-left font-medium text-white text-sm">
                          Final Savings
                        </div>
                        <div className="flex-1 text-right font-medium text-white text-sm">
                          {data?.savings2 ?? "-"}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Section - Additional Info */}
            {/* <div className="mt-6 pt-4 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  Day: 22.34000p
                </div>
                <button className="bg-[#346fb6] text-white px-4 py-2 rounded text-sm font-medium">
                  Export
                </button>
              </div>
            </div> */}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

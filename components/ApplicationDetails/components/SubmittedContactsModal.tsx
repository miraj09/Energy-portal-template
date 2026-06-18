import React from "react";
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
} from "@/ui";
import { Site, Meter } from "../types";

interface SubmittedContactsModalProps {
  isOpen: boolean;
  onClose: () => void;
  sites: Site[];
}

const joinAddress = (
  line1?: string | null,
  line2?: string | null,
  line3?: string | null,
  line4?: string | null
) => {
  return [line1, line2, line3, line4].filter(Boolean).join(", ");
};

const SubmittedContactsModal: React.FC<SubmittedContactsModalProps> = ({
  isOpen,
  onClose,
  sites,
}) => {
  const parseMeterReference = (meterRef: string) => {
    const chars = (meterRef || "").split("");
    let currentIndex = 0;
    const parts = [1, 2, 3, 3, 2, 4, 4, 3].map((count) => {
      const part = chars.slice(currentIndex, currentIndex + count).join("");
      currentIndex += count;
      return part || "0".repeat(count);
    });
    return {
      indicator: parts[0] || "S",
      topRow: [parts[1] || "00", parts[2] || "000", parts[3] || "000"],
      bottomRow: [
        parts[4] || "00",
        parts[5] || "0000",
        parts[6] || "0000",
        parts[7] || "000",
      ],
    };
  };

  const unsoldMetersBySite = sites.map((site) => ({
    site,
    meters: (site.meters || []).filter((m: Meter) => m.latest_issold),
  }));

  const hasAnyUnsold = unsoldMetersBySite.some((s) => s.meters.length > 0);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-5xl bg-white">
        <DialogHeader>
          <DialogTitle className="text-black">
            Submitted Site Meters
          </DialogTitle>
        </DialogHeader>

        {!hasAnyUnsold ? (
          <div className="text-center text-gray-500 py-8">
            No sold meters found.
          </div>
        ) : (
          <div className="space-y-6">
            {unsoldMetersBySite.map(({ site, meters }) =>
              meters.length === 0 ? null : (
                <div key={site.id} className="bg-white rounded border">
                  <div className="p-4 border-b">
                    <div className="text-base font-semibold text-black">
                      {site.sitename}
                    </div>
                    <div className="text-sm text-gray-600">
                      {joinAddress(
                        site.address_line_1,
                        site.address_line_2,
                        site.address_line_3,
                        site.address_line_4
                      )}
                      {site.postcode ? `, ${site.postcode}` : ""}
                    </div>
                    <div className="text-sm text-gray-600">
                      Employees: {site.total_employee}
                    </div>
                  </div>
                  <div className="p-4 space-y-6">
                    {meters.map((m) => {
                      const ref = parseMeterReference(m.meter_reference || "");
                      return (
                        <div key={m.meterid} className="border rounded">
                          <div className="grid grid-cols-1 md:grid-cols-1 gap-4 p-4">
                            <div className="flex items-start">
                              <div className="mr-4">
                                <div className="flex items-center">
                                  <div className="w-[40px] h-[40px] flex items-center justify-center bg-white border border-[#363636] border-r-0">
                                    <span className="font-medium text-[#363636] text-lg">
                                      {ref.indicator}
                                    </span>
                                  </div>
                                  <div className="flex flex-col">
                                    <div className="flex">
                                      <div className="w-[70px] h-[20px] bg-white border border-[#363636] border-b-0 border-r-0 flex items-center justify-center text-black">
                                        <span className="text-xs">
                                          {ref.topRow[0]}
                                        </span>
                                      </div>
                                      <div className="w-[90px] h-[20px] bg-white border border-[#363636] border-b-0 border-r-0 flex items-center justify-center text-black">
                                        <span className="text-xs">
                                          {ref.topRow[1]}
                                        </span>
                                      </div>
                                      <div className="w-[90px] h-[20px] bg-white border border-[#363636] border-b-0 flex items-center justify-center text-black">
                                        <span className="text-xs">
                                          {ref.topRow[2]}
                                        </span>
                                      </div>
                                    </div>
                                    <div className="flex">
                                      <div className="w-[50px] h-[20px] bg-white border border-[#363636] border-r-0 flex items-center justify-center text-black">
                                        <span className="text-xs">
                                          {ref.bottomRow[0]}
                                        </span>
                                      </div>
                                      <div className="w-[70px] h-[20px] bg-white border border-[#363636] border-r-0 flex items-center justify-center text-black">
                                        <span className="text-xs">
                                          {ref.bottomRow[1]}
                                        </span>
                                      </div>
                                      <div className="w-[70px] h-[20px] bg-white border border-[#363636] border-r-0 flex items-center justify-center text-black">
                                        <span className="text-xs">
                                          {ref.bottomRow[2]}
                                        </span>
                                      </div>
                                      <div className="w-[60px] h-[20px] bg-white border border-[#363636] flex items-center justify-center text-black">
                                        <span className="text-xs">
                                          {ref.bottomRow[3]}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 text-sm w-full">
                                <div>
                                  <div className="text-[#737373]">
                                    Start Date
                                  </div>
                                  <div className="text-black">-</div>
                                </div>
                                <div>
                                  <div className="text-[#737373]">End Date</div>
                                  <div className="text-black">-</div>
                                </div>
                                <div>
                                  <div className="text-[#737373]">Supplier</div>
                                  <div className="text-black">
                                    {m.latestsoldsuppliername || "-"}
                                  </div>
                                </div>
                                <div>
                                  <div className="text-[#737373]">
                                    Tariff Name
                                  </div>
                                  <div className="text-black break-words">
                                    {m.latesttariffname || "-"}
                                  </div>
                                </div>
                                <div>
                                  <div className="text-[#737373]">Term</div>
                                  <div className="text-black">
                                    {m.latestterm ?? "-"}
                                  </div>
                                </div>
                                <div>
                                  <div className="text-[#737373]">Units</div>
                                  <div className="text-black">
                                    {m.meter_type_name === "Electricity"
                                      ? "kWh"
                                      : "-"}
                                  </div>
                                </div>
                                <div>
                                  <div className="text-[#737373]">Uplifts</div>
                                  <div className="text-black">-</div>
                                </div>
                                <div>
                                  <div className="text-[#737373]">
                                    Site Name
                                  </div>
                                  <div className="text-black">
                                    {site.sitename}
                                  </div>
                                </div>
                                <div>
                                  <div className="text-[#737373]">
                                    Site Postcode
                                  </div>
                                  <div className="text-black">
                                    {site.postcode || "-"}
                                  </div>
                                </div>
                                <div>
                                  <div className="text-[#737373]">
                                    Processed
                                  </div>
                                  <div>
                                    <span
                                      className={`px-3 py-1 rounded text-xs font-medium ${
                                        m.latest_isprocessed
                                          ? "bg-[#22D086] text-white"
                                          : "bg-[#DC3545] text-white"
                                      }`}
                                    >
                                      {m.latest_isprocessed ? "Yes" : "No"}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                            <div className="w-full">
                              <div className="rounded-lg border border-gray-200 overflow-hidden">
                                <Table>
                                  <TableHeader>
                                    <TableRow className="bg-primary">
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
                                      <TableCell className="py-2 px-3">
                                        {m.latestSoldStandingCharge || "-"}
                                      </TableCell>
                                      <TableCell className="py-2 px-3">
                                        {m.latestterm ?? "-"}
                                      </TableCell>
                                      <TableCell className="py-2 px-3">
                                        {m.latestSoldDayRate || "-"}
                                      </TableCell>
                                      <TableCell className="py-2 px-3">
                                        {m.latestSoldNightRate || "-"}
                                      </TableCell>
                                      <TableCell className="py-2 px-3">
                                        {m.latestSoldEveningWeekendRate || "-"}
                                      </TableCell>
                                      <TableCell className="py-2 px-3">
                                        {m.latestSoldWinterRate || "-"}
                                      </TableCell>
                                    </TableRow>
                                  </TableBody>
                                </Table>
                              </div>
                              <div className="mt-3 text-sm flex items-center gap-2">
                                <span className="text-[#737373]">
                                  Processed:
                                </span>
                                <span
                                  className={`px-3 py-1 rounded text-xs font-medium ${
                                    m.latest_isprocessed
                                      ? "bg-[#22D086] text-white"
                                      : "bg-[#DC3545] text-white"
                                  }`}
                                >
                                  {m.latest_isprocessed ? "Yes" : "No"}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default SubmittedContactsModal;

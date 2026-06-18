import { Card, CardContent, CardHeader, CardTitle } from "@/ui/card";
import { ScrollArea, ScrollBar } from "@/ui/scroll-area";
import { Callback } from "../types";

interface CallbacksSectionProps {
  callbacks: Callback[];
}

const CallbacksSection: React.FC<CallbacksSectionProps> = ({ callbacks }) => {
  return (
    <Card>
      <CardContent className="p-4 lg:p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg text-[#363636] font-medium">Callbacks</h2>
        </div>

        {callbacks.length === 0 ? (
          <div className="p-4 bg-gray-50 rounded border">
            <p className="text-gray-500">No Callbacks Found</p>
          </div>
        ) : (
          <Card className="w-full  shadow-md py-4">
            <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-2 gap-3 sm:gap-0">
              <CardTitle className="text-xl sm:text-2xl font-semibold text-[#363636] font-['Plus_Jakarta_Sans',Helvetica]">
                Callbacks
                <span className="text-sm text-[#737373] font-['Inter']">
                  (View)
                </span>
              </CardTitle>
            </CardHeader>
            <ScrollArea className="h-[350px]  w-full custom-scrollbar">
              <div className="px-3 sm:px-5 py-2">
                {callbacks.map((cb) => (
                  <Card
                    key={cb.id}
                    className="mb-3 sm:mb-4 bg-[#F5F5F5] rounded-[10px]"
                  >
                    <CardContent className="p-0 relative">
                      <div className="p-2 sm:p-2.5">
                        <div className="flex flex-col gap-2 sm:gap-0">
                          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
                            <h3 className="font-semibold text-black text-sm sm:text-lg leading-5 [font-family:'Inter',Helvetica]">
                              {cb.type} — {cb.date} {cb.time}
                            </h3>
                            <div className="flex flex-wrap gap-2">
                              {/* {cb.is_completed === false && (
                                <span className="px-2 py-1 text-xs rounded bg-green-100 text-green-700">
                                  Completed
                                </span>
                              )} */}
                              {/* {cb.is_overdue === false && (
                                <span className="px-2 py-1 text-xs rounded bg-red-100 text-red-700">
                                  Overdue
                                </span>
                              )} */}
                            </div>
                          </div>
                          <div className="text-xs text-black [font-family:'Inter',Helvetica] text-[16px] mt-2 sm:mt-4 break-words leading-relaxed">
                            {cb.note}
                          </div>
                          <div className="mt-2 sm:mt-4">
                            <span className="text-[14px] text-neutral-600 [font-family:'Inter',Helvetica] font-semibold">
                              Contact: {cb.contact}
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              <ScrollBar orientation="vertical" />
            </ScrollArea>
          </Card>
        )}
      </CardContent>
    </Card>
  );
};

export default CallbacksSection;

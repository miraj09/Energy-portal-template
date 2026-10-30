"use client";

import React, { JSX, Suspense, lazy } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/ui/card";

// Lazy load the chart component to reduce initial bundle size
const RevenueBarChart = lazy(() => import("./RevenueBarChart"));

export const RevenueReportSection = (): JSX.Element => {
  return (
    <section className="w-full py-4">
      <Card className="w-full shadow-md">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold text-[#54577a] font-['Arial',Helvetica,sans-serif]">
            Revenue Report
          </CardTitle>
          <p className="text-xs font-normal text-[#54577a] font-['Arial',Helvetica,sans-serif]">
            Revenue During {new Date().toLocaleString("default", { year: "numeric" })} : £1,147.50
          </p>
        </CardHeader>
        <CardContent>
          <div className="relative flex h-[250px]">
            {/* Y-axis label */}
            <div className="absolute -left-8 top-[94px] -rotate-90 font-semibold text-xs text-[#54577a] tracking-[0] leading-5 whitespace-nowrap font-['Arial',Helvetica,sans-serif]">
              Commission
            </div>

            <div className="relative flex-1 min-w-0">
              <Suspense
                fallback={
                  <div className="w-full h-full flex items-center justify-center text-sm text-[#54577a]">
                    Loading chart...
                  </div>
                }
              >
                <RevenueBarChart />
              </Suspense>
            </div>
          </div>
        </CardContent>
      </Card>
    </section>
  );
};

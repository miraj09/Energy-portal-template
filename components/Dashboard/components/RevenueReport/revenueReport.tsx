"use client";

import React, { JSX, Suspense, lazy } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/ui/card";

// Lazy load the chart component to reduce initial bundle size
const RevenueLineChart = lazy(() => import("./RevenueLineChart"));

export const RevenueReportSection = (): JSX.Element => {
    
  return (
    <section className="w-full py-4">
      <Card className="w-full shadow-md">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold text-[#54577a]">
            Revenue Report
          </CardTitle>
          <p className="text-xs font-normal text-[#54577a]">
            Revenue During {new Date().toLocaleString('default', { year: 'numeric' })} : $1147.5
          </p>
        </CardHeader>
        <CardContent>
          <div className="relative flex h-[233px]">

            {/* Y-axis label (Commission) */}
            <div className="absolute -left-8 top-[94px] -rotate-90 font-semibold text-xs text-[#54577a] tracking-[0] leading-5 whitespace-nowrap font-['Plus_Jakarta_Sans']">
              Commission
            </div>

            {/* Chart area */}
            <div className="relative flex-1">
              <Suspense fallback={<div className="w-full h-full flex items-center justify-center">Loading chart...</div>}>
                <RevenueLineChart />
              </Suspense>
            </div>
          </div>
        </CardContent>
      </Card>
    </section>
  );
};
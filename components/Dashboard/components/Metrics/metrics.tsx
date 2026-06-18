import React, { JSX, memo } from "react";
import { Card, CardContent } from "@/ui/card";
import Image from "next/image";
import {
  MetricsProps,
  MetricCard,
} from "@/components/Dashboard/components/type";
import CountUp from 'react-countup';

export const Metrics = memo(
  ({
    totalSales,
    liveSales,
    paidSales,
    progressSales,
    deadSales,
  }: MetricsProps): JSX.Element => {
    // Data for metric cards
    const metricCards: MetricCard[] = [
      {
        title: "Total Sales",
        value: totalSales.toString(),
        percentage: "(25%)",
        bgColor: "bg-[#2db9eb33]",
        iconBgColor: "bg-[#346fb6]",
        icon: (
          <Image
            className="w-[15px] h-[15px] sm:w-[19px] sm:h-[19px]"
            alt="Shopping cart"
            src="/icons/total-sales.svg"
            width={19}
            height={19}
            priority
          />
        ),
      },
      {
        title: "Live Sales",
        value: liveSales.toString(),
        percentage: "(10%)",
        bgColor: "bg-[#e7822433]",
        iconBgColor: "bg-[#e78224]",
        icon: (
          <Image
            className="w-[17px] h-3 sm:w-[21px] sm:h-3.5"
            alt="Group"
            src="/icons/live-sales.svg"
            width={21}
            height={3.5}
            priority
          />
        ),
      },
      {
        title: "Paid Sales",
        value: paidSales.toString(),
        percentage: "(17%)",
        bgColor: "bg-[#07da8633]",
        iconBgColor: "bg-[#3dd856]",
        icon: (
          <Image
            className="w-5 h-5 sm:w-6 sm:h-6"
            alt="Paid"
            src="/icons/paid-sales.svg"
            width={24}
            height={24}
            priority
          />
        ),
      },
      {
        title: "Work In Progress",
        value: progressSales.toString(),
        percentage: "(20%)",
        bgColor: "bg-[#2db9eb26]",
        iconBgColor: "bg-[#2db9eb]",
        icon: (
          <Image
            className="w-5 h-5 sm:w-6 sm:h-6"
            alt="Work in progress"
            src="/icons/work-in-progress.svg"
            width={24}
            height={24}
            priority
          />
        ),
      },
      {
        title: "Dead Sale",
        value: deadSales.toString(),
        percentage: "(20%)",
        bgColor: "bg-[#ff000433]",
        iconBgColor: "bg-[#dc3739]",
        icon: (
          <Image
            className="w-5 h-5 sm:w-6 sm:h-6"
            alt="Circle xmark"
            src="/icons/dead-sales.svg"
            width={24}
            height={24}
            priority
          />
        ),
      },
    ];

    return (
      <section className="flex flex-col sm:flex-row w-full gap-3 sm:gap-4 py-3 sm:py-4">
        {metricCards.map((card, index) => (
          <Card
            key={`metric-card-${index}`}
            className={`${card.bgColor} border-none rounded-lg flex-1`}
          >
            <CardContent className="flex items-center p-3 sm:p-4">
              <div
                className={`${card.iconBgColor} w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center`}
              >
                {card.icon}
              </div>

              <div className="ml-3 sm:ml-4 flex-1">
                <div className="flex items-start justify-between">
                  <div className="font-bold text-lg sm:text-xl tracking-[1.00px] leading-[26px] sm:leading-[30px] text-black">
                    <CountUp end={parseInt(card.value)} duration={2} />
                  </div>
                  <div className="text-[#54577a] text-xs leading-5 font-semibold hidden">
                    {card.percentage}
                  </div>
                </div>
                <div className="text-[#616262] text-xs sm:text-sm font-semibold leading-4 sm:leading-5">
                  {card.title}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </section>
    );
  }
);

Metrics.displayName = "Metrics";

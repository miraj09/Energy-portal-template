"use client";
import React, { JSX, useEffect, useState } from "react";
import { AnnouncementsSection } from "@/components/Dashboard/components/AnnouncementsSection";
import { Metrics } from "@/components/Dashboard/components/Metrics";
import { RevenueReportSection } from "@/components/Dashboard/components/RevenueReport";
import { getDropdown } from "@/lib/actions/getDropdown";
import { DashboardData } from "@/components/Dashboard/components/type";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

const Dashboard = (): JSX.Element => {
  const router = useRouter();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const response = await getDropdown("/api/v1/auth/web/core/dashboard/");

        if (!response.success) {
          // Check if it's an authentication error
          if (
            response.errors &&
            typeof response.errors === "object" &&
            "authError" in response.errors
          ) {
            // Token expired or invalid, show toast and redirect to login
            toast.error("Token expired. Authentication required.");

            // Wait for 500ms before redirecting
            await new Promise((resolve) => setTimeout(resolve, 500));

            router.push("/login");
            return;
          }

          setError(response.message || "Failed to fetch dashboard data");
        } else if (response.data) {
          // Map the API response to DashboardData structure
          const apiData = response.data as {
            total_sales: number;
            live_sales: number;
            paid_sales: number;
            work_in_progress: number;
            dead_sales: number;
          };

          const mappedData: DashboardData = {
            total_sales: apiData.total_sales,
            live_sales: apiData.live_sales,
            paid_sales: apiData.paid_sales,
            progress_sales: apiData.work_in_progress,
            dead_sales: apiData.dead_sales,
            announcements: [], // New API doesn't return announcements
          };

          setDashboardData(mappedData);
        }
      } catch (err) {
        setError("An error occurred while fetching dashboard data");
        console.error("Dashboard data fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [router]);

  if (loading) {
    return (
      <div className="flex-1 flex flex-col gap-4 sm:gap-6 px-3 sm:px-4 lg:px-6">
        <h1 className="font-medium text-[#737373] font-['Inter', Plus_Jakarta_Sans',Helvetica] mt-5">
          Dashboard
        </h1>
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-gray-600">Loading dashboard data...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex flex-col gap-4 sm:gap-6 px-3 sm:px-4 lg:px-6">
        <h1 className="font-medium text-[#737373] font-['Inter', Plus_Jakarta_Sans',Helvetica] mt-5">
          Dashboard
        </h1>
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-red-600">Error: {error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col gap-4 sm:gap-6 px-3 sm:px-4 lg:px-6">
      <h1 className="font-medium text-[#737373] font-['Inter', Plus_Jakarta_Sans',Helvetica] mt-5">
        Dashboard
      </h1>

      {dashboardData && (
        <>
          <Metrics
            totalSales={dashboardData.total_sales}
            liveSales={dashboardData.live_sales}
            paidSales={dashboardData.paid_sales}
            progressSales={dashboardData.progress_sales}
            deadSales={dashboardData.dead_sales}
          />

          <AnnouncementsSection announcements={dashboardData.announcements} />
        </>
      )}

      <RevenueReportSection />
    </div>
  );
};

export default Dashboard;

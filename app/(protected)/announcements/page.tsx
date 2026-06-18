"use client";
import React, { useState, useEffect, useCallback } from "react";
import { Announcements } from "@/components/Announcements";
import {
  getAnnouncementsList,
  type TableFilters,
} from "@/composable/getTableData";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

// Define the announcement type based on the API response
interface Announcement {
  id: number;
  created_at: string;
  updated_at: string;
  is_deleted: boolean;
  deleted_at: string | null;
  is_active: boolean;
  category: string;
  subject: string;
  message: string;
  is_for_all: boolean;
  created_by: string | null;
  deleted_by: string | null;
  users: unknown[];
}

export default function AllAnnouncementsPage() {
  const router = useRouter();

  // State for announcements data and pagination
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [itemsPerPage] = useState(5); // Set to 5 as requested
  const [isLoading, setIsLoading] = useState(false);

  // Fetch announcements data from API
  const fetchAnnouncements = useCallback(
    async (page: number = 1) => {
      setIsLoading(true);
      try {
        const filters: TableFilters = {
          page,
          page_size: itemsPerPage,
        };

        const result = await getAnnouncementsList(filters);

        if (result.success && result.data) {
          setAnnouncements(result.data.results as Announcement[]);
          setTotalItems(result.data.count);
        } else {
          toast.error(result.message || "Failed to fetch announcements");
          // If authentication error, redirect to login
          if (
            result.message?.includes("authentication") ||
            result.message?.includes("token") ||
            (result.errors &&
              typeof result.errors === "object" &&
              "status" in result.errors &&
              result.errors.status === 401)
          ) {
            router.push("/login");
          }
          setAnnouncements([]);
          setTotalItems(0);
        }
      } catch (error) {
        console.error("Error fetching announcements:", error);
        toast.error("An error occurred while fetching announcements");
        setAnnouncements([]);
        setTotalItems(0);
      } finally {
        setIsLoading(false);
      }
    },
    [itemsPerPage, router]
  );

  // Load initial data
  useEffect(() => {
    fetchAnnouncements(currentPage);
  }, [fetchAnnouncements, currentPage]);

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  return (
    <Announcements
      announcements={announcements}
      currentPage={currentPage}
      totalItems={totalItems}
      itemsPerPage={itemsPerPage}
      onPageChange={handlePageChange}
      isLoading={isLoading}
    />
  );
}

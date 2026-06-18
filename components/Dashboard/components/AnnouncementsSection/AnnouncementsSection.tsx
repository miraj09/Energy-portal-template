"use client";
import React, { JSX } from "react";
import { Button } from "@/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/card";
import { useRouter } from "next/navigation";
import { AnnouncementsSectionProps } from "@/components/Dashboard/components/type";
// import Image from "next/image";

export const AnnouncementsSection = ({
  announcements,
}: AnnouncementsSectionProps): JSX.Element => {
  const router = useRouter();

  // Format date from ISO string to readable format
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return (
      date.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "2-digit",
      }) +
      " " +
      date.toLocaleTimeString("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      })
    );
  };

  // Convert HTML message to React elements (basic conversion)
  const parseMessage = (htmlMessage: string) => {
    // Simple HTML to React conversion - you might want to use a library like DOMPurify for production
    const cleanMessage = htmlMessage
      .replace(
        /<h3><strong>(.*?)<\/strong><\/h3>/g,
        '<h3 class="font-bold text-lg mb-2">$1</h3>'
      )
      .replace(/<p>(.*?)<\/p>/g, '<p class="mb-2">$1</p>')
      .replace(/<br\s*\/?>/g, "<br />");

    return <div dangerouslySetInnerHTML={{ __html: cleanMessage }} />;
  };

  return (
    <Card className="w-full shadow-md">
      <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-2 gap-3 sm:gap-0">
        <CardTitle className="text-xl sm:text-2xl font-semibold text-[#363636] font-['Plus_Jakarta_Sans',Helvetica]">
          Announcements
        </CardTitle>
        <Button
          onClick={() => router.push("/announcements")}
          className="bg-[#346fb6] text-white text-sm sm:text-base w-full sm:w-auto"
        >
          See All
        </Button>
      </CardHeader>
      <div className="px-3 sm:px-5 py-2">
        {announcements.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No announcements available
          </div>
        ) : (
          announcements.map((announcement) => (
            <Card
              key={announcement.id}
              className="mb-3 sm:mb-4 border-[0.5px] border-[#0066ff] rounded-[10px] pb-7 pt-2"
            >
              <CardContent className="p-0 relative">
                <div className="p-2 sm:p-2.5">
                  <div className="flex flex-col gap-2 sm:gap-0">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
                      <h3 className="font-semibold text-black break-words text-sm sm:text-lg leading-[18px] sm:leading-5 [font-family:'Inter',Helvetica]">
                        {announcement.subject}
                      </h3>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 self-start sm:self-auto">
                        <span className="text-xs sm:text-sm text-primary font-medium bg-primary/10 px-2 py-1 rounded-md [font-family:'Inter',Helvetica]">
                          {announcement.category}
                        </span>
                        <span className="text-xs sm:text-sm text-neutral-500 [-webkit-text-stroke:1px_#737373] [font-family:'Inter',Helvetica] whitespace-nowrap">
                          {formatDate(announcement.created_at)}
                        </span>
                      </div>
                    </div>
                    <div className="text-xs text-black [font-family:'Inter',Helvetica] mt-2 sm:mt-4 break-words leading-relaxed">
                      {parseMessage(announcement.message)}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </Card>
  );
};

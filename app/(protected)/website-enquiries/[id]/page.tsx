import React from "react";
import WebsiteEnquiriesDetails from "@/components/WebsiteEnquiriesDetails/WebsiteEnquiriesDetails";

interface WebsiteEnquiryDetailsPageProps {
  params: Promise<{
    id: string;
  }>;
}

const WebsiteEnquiryDetailsPage = async ({
  params,
}: WebsiteEnquiryDetailsPageProps) => {
  const { id } = await params;
  return <WebsiteEnquiriesDetails enquiryId={id} />;
};

export default WebsiteEnquiryDetailsPage;

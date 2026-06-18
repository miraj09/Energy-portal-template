import React from "react";
import TicketDetails from "@/components/TicketsTable/TicketDetails";

interface TicketDetailsPageProps {
  params: Promise<{
    id: string;
  }>;
}

const TicketDetailsPage = async ({ params }: TicketDetailsPageProps) => {
  const { id } = await params;
  return <TicketDetails ticketId={id} />;
};

export default TicketDetailsPage;

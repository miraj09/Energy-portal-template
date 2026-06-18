"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/ui/button";
import { Input } from "@/ui/input";
import { postMethod } from "@/lib/actions/postMethod";
import { addTicketMessage } from "@/lib/actions/postMethod";
import { toast } from "sonner";
import { Ticket, TicketMessage } from "@/lib/types";
import { formatDate } from "@/composable/getFormatedDate";
import { TICKET_STATUS } from "@/lib/constants";

import { Loader2 } from "lucide-react";
import { getTicketById } from "@/composable/getTableData";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/ui/modal";

interface TicketDetailsProps {
  ticketId: string;
}

const TicketDetails: React.FC<TicketDetailsProps> = ({ ticketId }) => {
  const router = useRouter();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formattedDate, setFormattedDate] = useState("");
  const [formattedCreatedDate, setFormattedCreatedDate] = useState("");
  const [isCloseModalOpen, setIsCloseModalOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [isReopening, setIsReopening] = useState(false);
  const [messages, setMessages] = useState<TicketMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");

  // Custom breadcrumbs for this page
  // const customBreadcrumbs = [
  //   { label: "Dashboard", href: "/dashboard" },
  //   { label: "Tickets", href: "/tickets" },
  //   { label: `Ticket ${ticketId}`, href: `/tickets/${ticketId}`, isCurrentPage: true },
  // ];

  // Fetch ticket data
  useEffect(() => {
    const fetchTicket = async () => {
      try {
        setIsLoading(true);
        const response = await getTicketById(ticketId);

        if (response.success && response.data) {
          setTicket(response.data);

          // Initialize messages from API response
          if (response.data.messages && response.data.messages.length > 0) {
            setMessages(response.data.messages);
          } else {
            // If no messages from API, keep messages empty
            setMessages([]);
          }

          // Format dates
          if (response.data.created_at) {
            const createdDate = await formatDate(response.data.created_at);
            setFormattedCreatedDate(createdDate);
            setFormattedDate(createdDate);
          }
        } else {
          // Check for authentication errors
          const errors = response.errors as
            | { authError?: boolean; status?: number }
            | undefined;
          if (errors?.authError) {
            toast.error("Token expired. Authentication required.");
            setTimeout(() => {
              router.push("/login");
            }, 500);
            return;
          }
          setError(response.message || "Failed to fetch ticket details");
        }
      } catch (err) {
        setError("Failed to fetch ticket details");
        console.error("Error fetching ticket:", err);
      } finally {
        setIsLoading(false);
      }
    };

    if (ticketId) {
      fetchTicket();
    }
  }, [ticketId, router]);

  const handleSubmit = async () => {
    if (!ticket || !newMessage.trim()) return;

    const messageText = newMessage.trim();
    setIsSubmitting(true);
    setNewMessage("");

    try {
      // Send message using the new API
      const response = await addTicketMessage(ticket.public_id, {
        body: messageText,
        is_internal: true,
      });

      if (response.success && response.data) {
        toast.success("Message sent successfully");
        // Add the new message to the messages list
        setMessages((prev) => [...prev, response.data!]);
      } else {
        // Check for authentication errors first
        const errors = response.errors as
          | Record<string, string[] | string>
          | { authError?: boolean; status?: number }
          | undefined;
        if (errors && typeof errors === "object" && "authError" in errors) {
          toast.error("Token expired. Authentication required.");
          setTimeout(() => {
            router.push("/login");
          }, 500);
          return;
        }

        // Handle validation errors
        if (errors && typeof errors === "object") {
          const firstKey = Object.keys(errors)[0];
          if (firstKey && firstKey !== "authError" && firstKey !== "status") {
            const errorValue = (errors as Record<string, string[] | string>)[
              firstKey
            ];
            const raw = Array.isArray(errorValue)
              ? errorValue[0]
              : String(errorValue);
            const message = raw?.startsWith("This field")
              ? `${firstKey.charAt(0).toUpperCase()}${firstKey.slice(
                  1
                )}${raw.replace("This field", "")}`.trim()
              : raw || response.message || "Request failed";
            toast.error(message.replace(/\.$/, ""));
          } else {
            toast.error(response.message || "Request failed");
          }
        } else {
          toast.error(response.message || "Request failed");
        }

        // Restore the message text for retry
        setNewMessage(messageText);
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "An unexpected error occurred";
      toast.error(errorMessage);
      console.error("Error sending message:", error);

      // Restore the message text for retry
      setNewMessage(messageText);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseTicket = async () => {
    if (!ticket) return;

    setIsClosing(true);
    try {
      const response = await postMethod(
        {},
        `/api/v1/auth/web/utility/tickets/${ticket.public_id}/close/`
      );

      if (response.success) {
        toast.success("Ticket closed successfully");
        setIsCloseModalOpen(false);
        // Update local state
        setTicket((prev) =>
          prev ? { ...prev, status: TICKET_STATUS.Closed } : null
        );
      } else {
        // Check for authentication errors first
        const errors = response.errors as
          | Record<string, string[] | string>
          | { authError?: boolean; status?: number }
          | undefined;
        if (errors && typeof errors === "object" && "authError" in errors) {
          toast.error("Token expired. Authentication required.");
          setTimeout(() => {
            router.push("/login");
          }, 500);
          return;
        }

        // Handle validation errors
        if (errors && typeof errors === "object") {
          const firstKey = Object.keys(errors)[0];
          if (firstKey && firstKey !== "authError" && firstKey !== "status") {
            const errorValue = (errors as Record<string, string[] | string>)[
              firstKey
            ];
            const raw = Array.isArray(errorValue)
              ? errorValue[0]
              : String(errorValue);
            const message = raw?.startsWith("This field")
              ? `${firstKey.charAt(0).toUpperCase()}${firstKey.slice(
                  1
                )}${raw.replace("This field", "")}`.trim()
              : raw || response.message || "Request failed";
            toast.error(message.replace(/\.$/, ""));
          } else {
            toast.error(response.message || "Request failed");
          }
        } else {
          toast.error(response.message || "Request failed");
        }
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "An unexpected error occurred";
      toast.error(errorMessage);
      console.error("Error closing ticket:", error);
    } finally {
      setIsClosing(false);
    }
  };

  const handleReopenTicket = async () => {
    if (!ticket) return;

    setIsReopening(true);
    try {
      const response = await postMethod(
        { public_id: ticket.public_id },
        `/api/v1/auth/web/utility/tickets/${ticket.public_id}/reopen/`
      );

      if (response.success) {
        toast.success("Ticket reopened successfully");
        // Update local state
        setTicket((prev) =>
          prev ? { ...prev, status: TICKET_STATUS.Pending } : null
        );
      } else {
        const errors = response.errors as
          | Record<string, string[] | string>
          | { authError?: boolean; status?: number }
          | undefined;
        if (errors && typeof errors === "object" && "authError" in errors) {
          toast.error("Token expired. Authentication required.");
          setTimeout(() => {
            router.push("/login");
          }, 500);
          return;
        }

        if (errors && typeof errors === "object") {
          const firstKey = Object.keys(errors)[0];
          if (firstKey && firstKey !== "authError" && firstKey !== "status") {
            const errorValue = (errors as Record<string, string[] | string>)[
              firstKey
            ];
            const raw = Array.isArray(errorValue)
              ? errorValue[0]
              : String(errorValue);
            const message = raw?.startsWith("This field")
              ? `${firstKey.charAt(0).toUpperCase()}${firstKey.slice(
                  1
                )}${raw.replace("This field", "")}`.trim()
              : raw || response.message || "Request failed";
            toast.error(message.replace(/\.$/, ""));
          } else {
            toast.error(response.message || "Request failed");
          }
        } else {
          toast.error(response.message || "Request failed");
        }
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "An unexpected error occurred";
      toast.error(errorMessage);
      console.error("Error reopening ticket:", error);
    } finally {
      setIsReopening(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col gap-4 sm:gap-6 px-3 sm:px-4 lg:px-6">
        {/* <DynamicBreadcrumb customBreadcrumbs={customBreadcrumbs} /> */}
        <div className="flex items-center justify-center h-64">
          <div className="flex items-center gap-2 text-lg text-gray-600">
            <Loader2 className="w-6 h-6 animate-spin" />
            Loading ticket details...
          </div>
        </div>
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <div className="flex-1 flex flex-col gap-4 sm:gap-6 px-3 sm:px-4 lg:px-6">
        {/* <DynamicBreadcrumb customBreadcrumbs={customBreadcrumbs} /> */}
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-red-600">
            {error || "Ticket not found"}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col gap-4 sm:gap-6 px-3 sm:px-4 lg:px-12">
      {/* <DynamicBreadcrumb customBreadcrumbs={customBreadcrumbs} /> */}

      <div className="bg-white rounded-lg shadow-sm p-6">
        {/* Header Section */}
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">
              Ticket : ID {ticket.tracking_id}
            </h1>
            <p className="text-gray-500 text-sm">{formattedCreatedDate}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={() =>
                ticket.status !== TICKET_STATUS.Closed &&
                setIsCloseModalOpen(true)
              }
              disabled={ticket.status === TICKET_STATUS.Closed}
              className={`px-3 py-1 rounded-md text-sm font-medium ${
                ticket.status === TICKET_STATUS.Closed
                  ? "bg-gray-400 text-white cursor-not-allowed"
                  : "bg-[#22D086] text-white hover:bg-[#22D086]/90"
              }`}
            >
              {ticket.status === TICKET_STATUS.Closed
                ? "Ticket Closed"
                : "Ticket Close"}
            </Button>
            {ticket.status === TICKET_STATUS.Closed && (
              <Button
                onClick={handleReopenTicket}
                disabled={isReopening}
                className="px-3 py-1 rounded-md text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isReopening ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Reopening...
                  </>
                ) : (
                  "Reopen"
                )}
              </Button>
            )}
          </div>
        </div>

        {/* Query Details Section */}
        <div className="grid grid-cols-1 gap-6 mb-6">
          <div className="space-y-4">
            <div>
              <label className="block text-[#48505E] font-medium text-sm mb-2">
                Query Type
              </label>
              <p className="text-[#858D9D] text-sm">{ticket.query_type}</p>
            </div>

            {/* <div>
              <label className="block text-[#48505E] font-medium text-sm mb-2">
                Contact Reference
              </label>
              <p className="text-[#858D9D] text-sm">No</p>
            </div> */}

            <div>
              <label className="block text-[#48505E] font-medium text-sm mb-2">
                Attachments
              </label>
              <div className="flex flex-wrap gap-2">
                {ticket.attachments && ticket.attachments.length > 0 ? (
                  ticket.attachments.map((attachment, index) => (
                    <a
                      key={attachment.id}
                      href={attachment.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block px-3 py-1 border border-blue-300 text-blue-600 rounded text-sm hover:bg-blue-50 hover:border-blue-400 transition-colors cursor-pointer"
                    >
                      Attachment {index + 1}
                    </a>
                  ))
                ) : (
                  <span className="text-gray-500 text-sm">No attachments</span>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-4 bg-[#F6F6F6] p-4">
            <div className="flex justify-between items-center">
              <div>
                <label className="block text-[#48505E] font-medium text-sm mb-2">
                  Subject
                </label>
                <p className="text-[#858D9D] text-sm">{ticket.subject}</p>
              </div>
              <div className="text-right">
                <p className="text-gray-500 text-sm">{formattedDate}</p>
              </div>
            </div>

            <div>
              <label className="block text-[#48505E] font-medium text-sm mb-2">
                Description
              </label>
              <p className="text-[#858D9D] text-sm">{ticket.description}</p>
            </div>
          </div>
        </div>

        {/* Chat Thread Section */}
        <div className="mb-6">
          <label className="block text-[#48505E] font-medium text-sm mb-2">
            Messages
          </label>

          {/* Messages Display */}
          <div className="border border-[#363636] rounded-md h-64 overflow-y-auto p-4 bg-gray-50">
            {messages.length === 0 ? (
              <div className="flex items-center justify-center h-full text-gray-500 text-sm">
                {ticket.status === TICKET_STATUS.Closed
                  ? "No messages."
                  : "No messages yet. Start the conversation below."}
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((message) => (
                  <div key={message.id} className="flex justify-start items-baseline">
                    <div className="max-w-[80%] p-3 rounded-lg bg-white border border-gray-200 text-gray-800">
                      <div className="flex justify-between items-start mb-2">
                        <p className="text-sm font-medium text-gray-500">
                          {message.author_name}
                        </p>
                      </div>
                      <p className="whitespace-pre-wrap">
                        {message.body}
                      </p>
                      {/* <div>
                        {message.is_internal && (
                          <p className="text-xs text-blue-600 mt-1 font-medium">
                            Internal Message
                          </p>
                        )}
                      </div> */}
                    </div>
                    <p className="text-xs text-gray-500 ml-1.5">
                      {new Date(message.created_at).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Message Input - hide when ticket is closed */}
          {ticket.status !== TICKET_STATUS.Closed && (
            <div className="flex gap-2 mt-3">
              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type your message..."
                className="flex-1 border border-[#363636] rounded-md p-3 text-[#858D9D] focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                onKeyPress={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit();
                  }
                }}
              />
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting || !newMessage.trim()}
                className="bg-[#2DB9EB] hover:bg-[#2DB9EB]/90 text-white px-6 py-2 rounded-md font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Sending...
                  </>
                ) : (
                  "Send"
                )}
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Close Ticket Confirmation Modal */}
      <Dialog open={isCloseModalOpen} onOpenChange={setIsCloseModalOpen}>
        <DialogContent className="sm:max-w-[425px] bg-white">
          <DialogHeader>
            <DialogTitle className="text-lg text-[#737373] font-bold">
              Are you sure you want to Close the ticket?
            </DialogTitle>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:justify-center">
            <Button
              onClick={handleCloseTicket}
              disabled={isClosing}
              className="bg-blue-600 text-white hover:bg-blue-700"
            >
              {isClosing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Closing...
                </>
              ) : (
                "Yes"
              )}
            </Button>
            <Button
              variant="outline"
              onClick={() => setIsCloseModalOpen(false)}
              disabled={isClosing}
              className="bg-[#DD373A] text-white"
            >
              No
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TicketDetails;

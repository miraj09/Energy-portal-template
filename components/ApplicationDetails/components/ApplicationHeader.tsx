"use client";

import { Card, CardContent } from "@/ui/card";
import { useRouter } from "next/navigation";
import { postMethod } from "@/lib/actions/postMethod";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import type { Site } from "@/components/ApplicationDetails/types";
import SendContractModal from "@/components/ApplicationDetails/components/SendContractModal";
import {
  formatSendContractEnvelopeLines,
  type SendApplicationContractPayload,
  type SendApplicationContractResponse,
} from "@/lib/contracts/sendApplicationContract";

interface ApplicationHeaderProps {
  companyName: string;
  applicationId: string;
  companyId: string;
  isSubmitted: boolean;
  /** Sites/meters for the send-contract selection modal. */
  sites?: Site[];
  // Optional identifier for an existing DocuSign envelope.
  // When present, the CTA should read "Re-send to e-sign".
  envelopeId?: string | null;
  onViewSubmittedContacts?: () => void;
}

type PendingSendMode = "send-only" | "submit-and-send" | null;

const ApplicationHeader: React.FC<ApplicationHeaderProps> = ({
  companyName,
  applicationId,
  companyId,
  isSubmitted,
  sites = [],
  envelopeId,
  onViewSubmittedContacts,
}) => {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSendingToEsign, setIsSendingToEsign] = useState(false);
  const [isSendModalOpen, setIsSendModalOpen] = useState(false);
  const [pendingSendMode, setPendingSendMode] = useState<PendingSendMode>(null);
  // Tracks whether this application already has a DocuSign envelope.
  // Initialized from the parent prop and then updated locally after a
  // successful "send to e-sign" call so the button label updates immediately.
  const [hasExistingEnvelope, setHasExistingEnvelope] = useState(
    Boolean(envelopeId)
  );

  // Keep local envelope state in sync if the parent fetches fresh data
  // and the `envelopeId` prop changes.
  useEffect(() => {
    setHasExistingEnvelope(Boolean(envelopeId));
  }, [envelopeId]);

  const hasAuthError = (err: unknown): err is { authError: boolean } => {
    return (
      typeof err === "object" &&
      err !== null &&
      "authError" in (err as Record<string, unknown>)
    );
  };

  const toastEnvelopeResults = (data: unknown) => {
    const response = data as SendApplicationContractResponse | undefined;
    const lines = formatSendContractEnvelopeLines(response?.envelopes);
    if (lines.length === 0) {
      toast.success("Sent to e-sign successfully");
      return;
    }
    toast.success(
      ["Sent to e-sign successfully", ...lines].join("\n"),
      { duration: 8000 }
    );
  };

  const sendContract = async (payload: SendApplicationContractPayload) => {
    const res = await postMethod(
      payload,
      "/api/v1/auth/web/core/send-application-contract/"
    );

    if (res.success) {
      toastEnvelopeResults(res.data);
      setHasExistingEnvelope(true);
      return { success: true as const };
    }

    if (res.errors && hasAuthError(res.errors)) {
      toast.error("Authentication failed. Please log in again.");
      router.push("/login");
      return { success: false as const, authFailed: true };
    }

    toast.error(res.message || "Failed to send to e-sign");
    return { success: false as const, authFailed: false };
  };

  const openSendModal = (mode: Exclude<PendingSendMode, null>) => {
    if (isSubmitting || isSendingToEsign) return;
    setPendingSendMode(mode);
    setIsSendModalOpen(true);
  };

  const handleModalOpenChange = (open: boolean) => {
    if (isSubmitting || isSendingToEsign) return;
    setIsSendModalOpen(open);
    if (!open) setPendingSendMode(null);
  };

  /**
   * Called when the user confirms site/meter selection in the modal.
   * - send-only: POST send-application-contract
   * - submit-and-send: submitted-sales first, then send
   */
  const handleConfirmSend = async (payload: SendApplicationContractPayload) => {
    if (!pendingSendMode) return;

    if (pendingSendMode === "send-only") {
      setIsSendingToEsign(true);
      const result = await sendContract(payload);
      setIsSendingToEsign(false);
      if (result.success) {
        setIsSendModalOpen(false);
        setPendingSendMode(null);
      }
      return;
    }

    // submit-and-send
    setIsSubmitting(true);
    const submitPayload = {
      reference: companyName,
      company: companyId,
      lead_status: 0,
    };
    const submitRes = await postMethod(
      submitPayload,
      "/api/v1/auth/web/core/submitted-sales/"
    );

    if (!submitRes.success) {
      if (submitRes.errors && hasAuthError(submitRes.errors)) {
        toast.error("Authentication failed. Please log in again.");
        router.push("/login");
      } else {
        toast.error(submitRes.message || "Failed to submit to sales");
      }
      setIsSubmitting(false);
      return;
    }

    toast.success("Submitted to sales successfully");
    setIsSubmitting(false);
    setIsSendingToEsign(true);

    const sendResult = await sendContract(payload);
    setIsSendingToEsign(false);

    if (sendResult.success) {
      setIsSendModalOpen(false);
      setPendingSendMode(null);
      router.push("/all-applications");
    }
  };

  const isBusy = isSubmitting || isSendingToEsign;

  return (
    <>
      <Card>
        <CardContent className="p-4 lg:p-6 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-[#363636]">
              {companyName}
            </h2>
            <p className="text-sm text-[#737373]">ID: {applicationId}</p>
          </div>

          <div className="flex space-x-3">
            {!isSubmitted ? (
              /* One button: open modal → submit to sales then send to e-sign */
              <button
                onClick={() => openSendModal("submit-and-send")}
                disabled={isBusy}
                className="bg-[#22D086] hover:bg-[#22D086] text-white px-4 py-2 rounded flex items-center space-x-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isBusy ? (
                  <>
                    <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>
                      {isSubmitting ? "Submitting..." : "Sending to e-sign..."}
                    </span>
                  </>
                ) : (
                  <>
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    <span>Submit Contact</span>
                  </>
                )}
              </button>
            ) : (
              /* Already submitted: open modal then send / re-send to e-sign */
              <button
                onClick={() => openSendModal("send-only")}
                disabled={isBusy}
                className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded flex items-center space-x-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isSendingToEsign ? (
                  <>
                    <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Sending...</span>
                  </>
                ) : (
                  <span>
                    {hasExistingEnvelope
                      ? "Re-send to e-sign"
                      : "Send to e-sign"}
                  </span>
                )}
              </button>
            )}
            <button
              onClick={onViewSubmittedContacts}
              className="bg-[#19499A] hover:bg-blue-900 text-white px-4 py-2 rounded cursor-pointer"
            >
              View Submitted Contacts
            </button>
          </div>
        </CardContent>
      </Card>

      <SendContractModal
        open={isSendModalOpen}
        onOpenChange={handleModalOpenChange}
        sites={sites}
        companyId={companyId}
        isSending={isBusy}
        onConfirm={handleConfirmSend}
      />
    </>
  );
};

export default ApplicationHeader;

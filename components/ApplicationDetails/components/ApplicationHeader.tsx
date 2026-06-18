import { Card, CardContent } from "@/ui/card";
import { useRouter } from "next/navigation";
import { postMethod } from "@/lib/actions/postMethod";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface ApplicationHeaderProps {
  companyName: string;
  applicationId: string;
  companyId: string;
  isSubmitted: boolean;
  // Optional identifier for an existing DocuSign envelope.
  // When present, the CTA should read "Re-send to e-sign".
  envelopeId?: string | null;
  onViewSubmittedContacts?: () => void;
}

const ApplicationHeader: React.FC<ApplicationHeaderProps> = ({
  companyName,
  applicationId,
  companyId,
  isSubmitted,
  envelopeId,
  onViewSubmittedContacts,
}) => {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSendingToEsign, setIsSendingToEsign] = useState(false);
  // Tracks whether this application already has a DocuSign envelope.
  // Initialized from the parent prop and then updated locally after a
  // successful "send to e-sign" call so the button label updates immediately.
  const [hasExistingEnvelope, setHasExistingEnvelope] = useState(
    Boolean(envelopeId),
  );

  // Keep local envelope state in sync if the parent fetches fresh data
  // and the `envelopeId` prop changes.
  useEffect(() => {
    setHasExistingEnvelope(Boolean(envelopeId));
  }, [envelopeId]);

  const handleSendToEsign = async () => {
    if (isSendingToEsign) return;
    setIsSendingToEsign(true);
    const payload = { company_id: companyId };

    const res = await postMethod(
      payload,
      "/api/v1/auth/web/core/send-application-contract/",
    );
    if (res.success) {
      toast.success("Sent to e-sign successfully");
      // Mark that we now have an e-sign envelope so the button
      // label switches to "Re-send to e-sign" on the next render.
      setHasExistingEnvelope(true);
      setIsSendingToEsign(false);
      return;
    }

    if (res.errors && hasAuthError(res.errors)) {
      toast.error("Authentication failed. Please log in again.");
      router.push("/login");
      return;
    }
    toast.error(res.message || "Failed to send to e-sign");
    setIsSendingToEsign(false);
  };

  const hasAuthError = (err: unknown): err is { authError: boolean } => {
    return (
      typeof err === "object" &&
      err !== null &&
      "authError" in (err as Record<string, unknown>)
    );
  };

  /**
   * Submits to sales first, then sends to e-sign.
   * Used when application is not yet submitted — one click does both.
   */
  const handleSubmitAndSendToEsign = async () => {
    if (isSubmitting || isSendingToEsign) return;
    setIsSubmitting(true);

    // Step 1: Submit to sales
    const submitPayload = {
      reference: companyName,
      company: companyId,
      lead_status: 0,
    };
    const submitRes = await postMethod(
      submitPayload,
      "/api/v1/auth/web/core/submitted-sales/",
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

    // Step 2: Send to e-sign (reuse existing handler logic without redirect)
    setIsSubmitting(false);
    setIsSendingToEsign(true);
    const esignPayload = { company_id: companyId };
    const esignRes = await postMethod(
      esignPayload,
      "/api/v1/auth/web/core/send-application-contract/",
    );

    if (esignRes.success) {
      toast.success("Sent to e-sign successfully");
      setHasExistingEnvelope(true);
      setIsSendingToEsign(false);
      router.push("/all-applications");
      return;
    }

    if (esignRes.errors && hasAuthError(esignRes.errors)) {
      toast.error("Authentication failed. Please log in again.");
      router.push("/login");
      return;
    }
    toast.error(esignRes.message || "Failed to send to e-sign");
    setIsSendingToEsign(false);
  };
  return (
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
            /* One button: submit to sales then send to e-sign */
            <button
              onClick={handleSubmitAndSendToEsign}
              disabled={isSubmitting || isSendingToEsign}
              className="bg-[#22D086] hover:bg-[#22D086] text-white px-4 py-2 rounded flex items-center space-x-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isSubmitting || isSendingToEsign ? (
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
            /* Already submitted: only show re-send to e-sign */
            <button
              onClick={handleSendToEsign}
              disabled={isSendingToEsign}
              className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded flex items-center space-x-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isSendingToEsign ? (
                <>
                  <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Sending...</span>
                </>
              ) : (
                <span>
                  {hasExistingEnvelope ? "Re-send to e-sign" : "Send to e-sign"}
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
  );
};

export default ApplicationHeader;

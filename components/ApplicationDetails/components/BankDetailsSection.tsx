import { useState, useEffect } from "react";
import DynamicInfoCard from "./DynamicInfoCard";
import { BankDetails } from "../types";
import { toast } from "sonner";
import { Card, CardContent } from "@/ui/card";
import { patchMethod } from "@/lib/actions/patchMethod";

interface BankDetailsSectionProps {
  bankDetails: BankDetails;
  onBankUpdate?: (updatedBank: BankDetails) => void;
}

const BankDetailsSection: React.FC<BankDetailsSectionProps> = ({
  bankDetails,
  onBankUpdate,
}) => {
  const [bank, setBank] = useState<BankDetails>(bankDetails);
  const [isEditing, setIsEditing] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  
  

  // Update local state when prop changes
  useEffect(() => {
    setBank(bankDetails);
  }, [bankDetails]);

  // Validate that we have all required bank data
  if (
    !bankDetails ||
    !bankDetails.bank_name ||
    !bankDetails.account_name ||
    !bankDetails.account_number ||
    !bankDetails.sort_code
  ) {
    return (
      <Card>
        <CardContent className="p-4 lg:p-6">
          <div className="text-center text-gray-500 py-8">
            <p>No bank details available</p>
            <p className="text-sm mt-2">
              Please add bank information to continue
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const fields = [
    {
      label: "Bank Name",
      value: bank.bank_name,
      type: "input",
      key: "bank_name",
    },
    {
      label: "Account Name",
      value: bank.account_name,
      type: "input",
      key: "account_name",
    },
    {
      label: "Account Number",
      value: bank.account_number,
      type: "input",
      key: "account_number",
    },
    {
      label: "Sort Code",
      value: bank.sort_code,
      type: "input",
      key: "sort_code",
    },
  ];

  const handleEditBank = () => {
    setIsEditing(true);
    setHasUnsavedChanges(true);
  };

  const handleFieldChange = (key: string, value: string) => {
    // Type-safe field update
    if (key in bank) {
      setBank((prev) => ({ ...prev, [key]: value }));
      setHasUnsavedChanges(true);
    } else {
      console.warn(`Unknown field key: ${key}`);
    }
  };

  const handleSaveBank = async () => {
    setIsSaving(true);

    try {
      // Validate required fields
      if (
        !bank.bank_name ||
        !bank.account_name ||
        !bank.account_number ||
        !bank.sort_code
      ) {
        toast.error("Please fill in all required fields");
        return;
      }

      // Prepare the data to send to the API
      const bankData = {
        banks: [
          {
            id: bank.id,
            bank_name: bank.bank_name,
            account_name: bank.account_name,
            account_number: bank.account_number,
            sort_code: bank.sort_code,
            // company: bank.company,
          },
        ],
      };

      

      // Call the PATCH API
      const response = await patchMethod(
        bankData,
        `/api/v1/auth/web/core/company/${bank.company}/`
      );

      if (response.success) {
        setIsEditing(false);
        setHasUnsavedChanges(false);

        if (onBankUpdate) {
          onBankUpdate(bank);
        }

        // Show success toast
        toast.success("Bank details saved successfully!");
      } else {
        // Handle specific error cases
        if (
          response.errors &&
          typeof response.errors === "object" &&
          "authError" in response.errors
        ) {
          toast.error("Authentication failed. Please log in again.");
        } else {
          throw new Error(response.message || "Failed to save bank details");
        }
      }
    } catch (error) {
      console.error("Error saving bank details:", error);
      toast.error("Failed to save bank details. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setBank(bankDetails);
    setIsEditing(false);
    setHasUnsavedChanges(false);
  };

  const actions = (
    <>
      <div className="flex gap-2 items-center">
        {isEditing ? (
          <>
            <button
              onClick={handleSaveBank}
              disabled={isSaving}
              className={`px-4 py-2 rounded text-white flex items-center gap-2 ${
                isSaving
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-green-600 hover:bg-green-700 cursor-pointer"
              }`}
            >
              {isSaving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Saving...
                </>
              ) : (
                "Save Bank"
              )}
            </button>
            <button
              onClick={handleCancelEdit}
              className="px-4 py-2 bg-red-500 text-white rounded cursor-pointer hover:bg-red-600"
            >
              Discard
            </button>
          </>
        ) : (
          <button
            onClick={handleEditBank}
            className="bg-[#2DB9EB] text-white px-4 py-2 rounded cursor-pointer hover:bg-blue-500"
          >
            Edit Bank
          </button>
        )}
        {hasUnsavedChanges && !isEditing && (
          <button
            onClick={handleSaveBank}
            disabled={isSaving}
            className={`px-4 py-2 rounded text-white flex items-center gap-2 ${
              isSaving
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-green-600 hover:bg-green-700 cursor-pointer"
            }`}
          >
            {isSaving ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Saving...
              </>
            ) : (
              "Save Changes"
            )}
          </button>
        )}
      </div>
    </>
  );

  return (
    <Card>
      <CardContent className="p-4 lg:p-6">
        <DynamicInfoCard
          title="Bank Details"
          fields={fields}
          actions={actions}
          isEditing={isEditing}
          onFieldChange={handleFieldChange}
          onSave={handleSaveBank}
          onCancel={handleCancelEdit}
        />
      </CardContent>
    </Card>
  );
};

export default BankDetailsSection;

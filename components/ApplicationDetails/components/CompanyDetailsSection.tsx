import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import DynamicInfoCard from "./DynamicInfoCard";
import { CompanyDetails } from "../types";
import { toast } from "sonner";
import { Card, CardContent } from "@/ui/card";
import { SelectOption } from "@/ui/select";
import { patchMethod } from "@/lib/actions/patchMethod";
import { getDropdown } from "@/lib/actions/getDropdown";

// Yes/No options for micro business
const microBusinessOptions: SelectOption[] = [
  { value: "true", label: "Yes" },
  { value: "false", label: "No" },
];

interface BusinessType {
  id: number;
  title: string;
  description: string | null;
  is_active: boolean;
}

interface BusinessTypeApiResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: BusinessType[];
}

interface CompanyDetailsSectionProps {
  companyDetails: CompanyDetails;
  onCompanyUpdate?: (updatedCompany: CompanyDetails) => void;
  companyId: string;
}

const CompanyDetailsSection: React.FC<CompanyDetailsSectionProps> = ({
  companyDetails,
  onCompanyUpdate,
  companyId,
}) => {
  const router = useRouter();
  const [company, setCompany] = useState<CompanyDetails>({
    ...companyDetails,
    current_address_line2: companyDetails.current_address_line2 || "",
    current_address_line3: companyDetails.current_address_line3 || "",
    current_address_line4: companyDetails.current_address_line4 || "",
  });
  const [isEditing, setIsEditing] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [businessTypeOptions, setBusinessTypeOptions] = useState<
    SelectOption[]
  >([]);

  // Keep local state in sync with parent updates
  useEffect(() => {
    setCompany({
      ...companyDetails,
      current_address_line2: companyDetails.current_address_line2 || "",
      current_address_line3: companyDetails.current_address_line3 || "",
      current_address_line4: companyDetails.current_address_line4 || "",
    });
  }, [companyDetails]);

  

  // Fetch business types from API
  useEffect(() => {
    const fetchBusinessTypes = async (search?: string) => {
      try {
        const endpoint = search
          ? `/api/v1/auth/web/core/business-type/?search=${encodeURIComponent(
              search
            )}`
          : `/api/v1/auth/web/core/business-type/`;

        const response = await getDropdown(endpoint);

        if (response.success && response.data) {
          const data = response.data as BusinessTypeApiResponse;
          if (data.results && Array.isArray(data.results)) {
            const options = data.results.map((item: BusinessType) => ({
              value: item.id.toString(),
              label: item.title,
            }));
            setBusinessTypeOptions(options);
          }
        } else {
          console.error("Failed to fetch business types:", response.message);
          // No fallback options - only use API data
          setBusinessTypeOptions([]);
        }
      } catch (error) {
        console.error("Error fetching business types:", error);
        // No fallback options - only use API data
        setBusinessTypeOptions([]);
      }
    };

    fetchBusinessTypes();
  }, []);

  // Function to search business types
  const searchBusinessTypes = async (searchTerm: string) => {
    if (searchTerm.length >= 2) {
      // Only search if 2+ characters
      const endpoint = `/api/v1/auth/web/core/business-type/?search=${encodeURIComponent(
        searchTerm
      )}`;
      const response = await getDropdown(endpoint);

      if (response.success && response.data) {
        const data = response.data as BusinessTypeApiResponse;
        if (data.results && Array.isArray(data.results)) {
          const options = data.results.map((item: BusinessType) => ({
            value: item.id.toString(),
            label: item.title,
          }));
          setBusinessTypeOptions(options);
        }
      }
    }
  };

  // Create combined address for display when not editing
  const combinedAddress = [
    company.current_address_line1,
    company.current_address_line2,
    company.current_address_line3,
    company.current_address_line4,
  ]
    .filter(Boolean)
    .join(", ");

  const fields = [
    {
      label: "Company Name *",
      value: company.company_name,
      type: "input",
      key: "company_name",
    },
    {
      label: "Business Type",
      value: company.business_type_id.toString(),
      type: "select",
      key: "business_type_id",
      options: businessTypeOptions,
      onSearch: searchBusinessTypes,
      searchable: true,
    },
    {
      label: "Number of Employees *",
      value: company.number_of_employees,
      type: "input",
      key: "number_of_employees",
    },
    {
      label: "Estimated Turnover *",
      value: company.estimated_turnover,
      type: "input",
      key: "estimated_turnover",
    },
    {
      label: "Is Micro-Business",
      value: company.is_micro_business ? "true" : "false",
      type: "select",
      key: "is_micro_business",
      options: microBusinessOptions,
    },
    {
      label: "Post Code *",
      value: company.current_postcode,
      type: "input",
      key: "current_postcode",
    },
    // Address field - shows combined when not editing, separate fields when editing
    ...(isEditing
      ? [
          {
            label: "Address Line 1 *",
            value: company.current_address_line1,
            type: "input",
            key: "current_address_line1",
          },
          {
            label: "Address Line 2",
            value: company.current_address_line2 || "",
            type: "input",
            key: "current_address_line2",
          },
          {
            label: "Address Line 3",
            value: company.current_address_line3 || "",
            type: "input",
            key: "current_address_line3",
          },
          {
            label: "Address Line 4",
            value: company.current_address_line4 || "",
            type: "input",
            key: "current_address_line4",
          },
        ]
      : [
          {
            label: "Address",
            value: combinedAddress,
            type: "input",
            key: "address_display",
          },
        ]),
    {
      label: "Registration No",
      value: company.registration_no,
      type: "input",
      key: "registration_no",
    },
  ];

  const handleEditCompany = () => {
    setIsEditing(true);
    setHasUnsavedChanges(true);
  };

  const handleFieldChange = (key: string, value: string) => {
    if (key === "is_micro_business") {
      // Convert "true"/"false" to boolean
      setCompany((prev) => ({
        ...prev,
        [key]: value === "true",
      }));
    } else if (key === "business_type_id") {
      // Convert string to number for business_type_id
      setCompany((prev) => ({
        ...prev,
        [key]: parseInt(value) || prev.business_type_id,
      }));
    } else if (key === "address_display") {
      // Display-only field when not editing
      return;
    } else {
      setCompany((prev) => ({ ...prev, [key]: value }));
    }
    setHasUnsavedChanges(true);
  };

  const handleSaveCompany = async () => {
    setIsSaving(true);

    try {
      // Validate required fields
      if (
        !company.company_name ||
        !company.number_of_employees ||
        !company.estimated_turnover ||
        !company.current_postcode ||
        !company.current_address_line1
      ) {
        toast.error("Please fill in all required fields");
        return;
      }

      // Prepare the data to send to the API
      const companyData = {
        company_name: company.company_name,
        number_of_employees: company.number_of_employees,
        estimated_turnover: company.estimated_turnover,
        is_micro_business: company.is_micro_business,
        current_postcode: company.current_postcode,
        current_address_line1: company.current_address_line1,
        current_address_line2: company.current_address_line2 || "",
        current_address_line3: company.current_address_line3 || "",
        current_address_line4: company.current_address_line4 || "",
        registration_no: company.registration_no,
        business_type: company.business_type_id,
      };

      

      const response = await patchMethod(
        companyData,
        `/api/v1/auth/web/core/company/${companyId}/`
      );

      if (response.success) {
        setIsEditing(false);
        setHasUnsavedChanges(false);

        if (onCompanyUpdate) {
          onCompanyUpdate(company);
        }

        // Show success toast
        toast.success("Company details saved successfully!");
      } else {
        // Handle specific error cases
        if (
          response.errors &&
          typeof response.errors === "object" &&
          "authError" in response.errors
        ) {
          toast.error("Authentication failed. Please log in again.");
          router.push("/login");
        } else {
          throw new Error(response.message || "Failed to save company details");
        }
      }
    } catch (error) {
      console.error("Error saving company details:", error);
      toast.error("Failed to save company details. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setCompany(companyDetails);
    setIsEditing(false);
    setHasUnsavedChanges(false);
  };

  const actions = (
    <>
      <div className="flex gap-2 items-center">
        {isEditing ? (
          <>
            <button
              onClick={handleSaveCompany}
              // disabled={isSaving}
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
                "Save Company"
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
            onClick={handleEditCompany}
            className="bg-[#2DB9EB] text-white px-4 py-2 rounded cursor-pointer hover:bg-blue-500"
          >
            Edit Company
          </button>
        )}
        {hasUnsavedChanges && !isEditing && (
          <button
            onClick={handleSaveCompany}
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
              "Save All Changes"
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
          title="Company Details"
          fields={fields}
          actions={actions}
          isEditing={isEditing}
          onFieldChange={handleFieldChange}
          onSave={handleSaveCompany}
          onCancel={handleCancelEdit}
          // onCancel={() => {}}
        />
      </CardContent>
    </Card>
  );
};

export default CompanyDetailsSection;

"use client";
import React, { useState } from "react";
import { Button } from "@/ui/button";
import { Card, CardContent } from "@/ui/card";
import type { SelectOption } from "@/ui/select";
import { useRouter, usePathname, useParams } from "next/navigation";
import SoldTariffFormPage1 from "./SoldTariffFormPage1";
import SoldTariffFormPage2 from "./SoldTariffFormPage2";
import SoldTariffFormPage3 from "./SoldTariffFormPage3";
import SoldTariffFormPage4 from "./SoldTariffFormPage4";
import { postMethod } from "@/lib/actions/postMethod";

// Step titles for the form
const STEP_TITLES = [
  "Company Information",
  "Contact Details",
  "Billing & Company Details",
  "Bank Details",
];

// Shared form type
export interface SoldTariffFormData {
  // Page 1 fields
  companyType: "existing" | "new";
  postCode: string;
  location: SelectOption | undefined;
  address: [string, string, string, string];
  companyName: SelectOption | undefined;
  site: SelectOption | undefined;
  siteType: "existing" | "new";
  businessType: SelectOption | undefined;
  isMicroBusiness: boolean;
  employees: string;
  turnover: string;
  regNo: string;
  // Page 2 fields
  homePostCode: string;
  homeLocation: SelectOption | undefined;
  homeAddress: [string, string, string, string];
  primaryContactTitle: SelectOption | undefined;
  primaryContactFirstName: string;
  primaryContactLastName: string;
  primaryContactPosition: string;
  telephoneNumber: string;
  primaryContactEmail: string;
  ownerPartnerName: string;
  ownerPartnerDOB: string;
  timeAtAddressYear: string;
  timeAtAddressMonth: string;
  // Page 3 fields
  billingType: SelectOption | undefined;
  billingPostCode: string;
  billingLocation: SelectOption | undefined;
  billingAddress: [string, string, string, string];
  timeTradingFor: string;
  incorporatedDate: string;
  directorFirstName: string;
  directorLastName: string;
  // Page 4 fields
  accountNumber: string;
  sortCode: string;
  bankName: string;
  accountName: string;
}

// Validation errors type
export interface ValidationErrors {
  [key: string]: string[];
}

// Validation rules for each page
export const VALIDATION_RULES = {
  page1: {
    company_status_id: {
      required: true,
      message: "Company status is required",
    },
    company_name: { required: true, message: "Company name is required" },
  },
  page2: {
    // Add page 2 validation rules if needed
  },
  page3: {
    // Add page 3 validation rules if needed
  },
  page4: {
    // Add page 4 validation rules if needed
  },
};

// --- Main SoldTariffForm ---
const initialFormState: SoldTariffFormData = {
  // Page 1 fields
  companyType: "new",
  postCode: "",
  location: undefined,
  address: ["", "", "", ""],
  companyName: undefined,
  site: undefined,
  siteType: "new",
  businessType: undefined,
  isMicroBusiness: false,
  employees: "",
  turnover: "",
  regNo: "",
  // Page 2 fields
  homePostCode: "",
  homeLocation: undefined,
  homeAddress: ["", "", "", ""],
  primaryContactTitle: undefined,
  primaryContactFirstName: "",
  primaryContactLastName: "",
  primaryContactPosition: "",
  telephoneNumber: "",
  primaryContactEmail: "",
  ownerPartnerName: "",
  ownerPartnerDOB: "",
  timeAtAddressYear: "",
  timeAtAddressMonth: "",
  // Page 3 fields
  billingType: undefined,
  billingPostCode: "",
  billingLocation: undefined,
  billingAddress: ["", "", "", ""],
  timeTradingFor: "",
  incorporatedDate: "",
  directorFirstName: "",
  directorLastName: "",
  // Page 4 fields
  accountNumber: "",
  sortCode: "",
  bankName: "",
  accountName: "",
};

const SoldTariffForm = () => {
  const router = useRouter();
  const params = useParams<{ quoteId?: string }>();
  const quoteId = Array.isArray(params?.quoteId)
    ? params?.quoteId?.[0]
    : params?.quoteId || null;
  const pathname = usePathname();
  const contractType = pathname?.includes("/gas-quote/")
    ? "GAS"
    : "ELECTRICITY";
  const [page, setPage] = useState(1);
  const [form, setForm] = useState(initialFormState);
  const resolvedSupplierId =
    typeof window !== "undefined"
      ? sessionStorage.getItem("sold_supplier_id") || ""
      : "";
  const resolvedSupplierName =
    typeof window !== "undefined"
      ? sessionStorage.getItem("sold_supplier_name") || ""
      : "";
  const resolvedLatestTariffName =
    typeof window !== "undefined"
      ? sessionStorage.getItem("sold_latesttariffname") || ""
      : "";
  const resolvedMeterString =
    typeof window !== "undefined"
      ? sessionStorage.getItem("sold_meterstring") || ""
      : "";

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>(
    {},
  );

  // Validation functions
  const validatePage = (pageNumber: number): boolean => {
    const errors: ValidationErrors = {};
    let isValid = true;

    if (pageNumber === 1) {
      console.log("=== VALIDATING PAGE 1 ===");
      console.log("Form data:", JSON.stringify(form, null, 2));
      console.log("Company type:", form.companyType);

      // Validate post code (required only for new companies)
      if (form.companyType === "new") {
        if (!form.postCode || !form.postCode.trim()) {
          errors.postCode = ["Post code is required"];
          isValid = false;
          console.log("❌ Post code validation FAILED");
        } else {
          console.log("✅ Post code validation PASSED");
        }

        // Validate location (required only for new companies)
        if (
          !form.location ||
          (!form.location.value?.trim() && !form.location.label?.trim())
        ) {
          errors.location = ["Location is required"];
          isValid = false;
          console.log("❌ Location validation FAILED");
        } else {
          console.log("✅ Location validation PASSED");
        }
      }

      // Always validate company_name as a required field
      // Validate company_name
      if (
        !form.companyName ||
        (!form.companyName.value?.trim() && !form.companyName.label?.trim())
      ) {
        errors.companyName = ["Company name is required"];
        isValid = false;
        console.log("❌ Company name validation FAILED");
      } else {
        console.log("✅ Company name validation PASSED");
      }

    }

    if (pageNumber === 2) {
      // Page 2: All inputs required
      if (!form.homePostCode || !form.homePostCode.trim()) {
        errors.homePostCode = ["Home post code is required"];
        isValid = false;
      }

      /**
       * `homeLocation` is a UI helper for postcode-based address lookup.
       * It is NOT sent to the `/api/v1/auth/web/core/company/` payload (only
       * `homeAddress` + `homePostCode` are), so the backend does not require it.
       *
       * For existing companies, Page 1 can pre-populate `homeAddress` directly
       * from the backend without going through the postcode search flow, so
       * there may never be a `homeLocation` value on Page 2.
       *
       * To avoid blocking existing-company flows unnecessarily, we only enforce
       * `homeLocation` as required when the company type is "new".
       */
      if (
        form.companyType === "new" &&
        (!form.homeLocation ||
          (!form.homeLocation.value?.trim() &&
            !form.homeLocation.label?.trim()))
      ) {
        errors.homeLocation = ["Home location is required"];
        isValid = false;
      }
      // Allow empty premises when API doesn't return it; only require lines 2-4
      const homeAddrMissing = [1, 2, 3].some(
        (i) => !form.homeAddress[i] || !form.homeAddress[i].trim(),
      );
      if (homeAddrMissing) {
        errors.homeAddress = ["All home address fields are required"];
        isValid = false;
      }

      if (
        !form.businessType ||
        (!form.businessType.value?.trim() && !form.businessType.label?.trim())
      ) {
        errors.businessType = ["Business type is required"];
        isValid = false;
      }
      if (
        !form.primaryContactTitle ||
        (!form.primaryContactTitle.value?.trim() &&
          !form.primaryContactTitle.label?.trim())
      ) {
        errors.primaryContactTitle = ["Primary contact title is required"];
        isValid = false;
      }
      if (
        !form.primaryContactFirstName ||
        !form.primaryContactFirstName.trim()
      ) {
        errors.primaryContactFirstName = [
          "Primary contact first name is required",
        ];
        isValid = false;
      }
      if (!form.primaryContactLastName || !form.primaryContactLastName.trim()) {
        errors.primaryContactLastName = [
          "Primary contact last name is required",
        ];
        isValid = false;
      }
      if (!form.primaryContactPosition || !form.primaryContactPosition.trim()) {
        errors.primaryContactPosition = [
          "Primary contact position is required",
        ];
        isValid = false;
      }
      if (!form.telephoneNumber || !form.telephoneNumber.trim()) {
        errors.telephoneNumber = ["Telephone number is required"];
        isValid = false;
      }
      if (!form.primaryContactEmail || !form.primaryContactEmail.trim()) {
        errors.primaryContactEmail = ["Primary contact email is required"];
        isValid = false;
      }
      if (!form.ownerPartnerName || !form.ownerPartnerName.trim()) {
        errors.ownerPartnerName = ["Owner/Partner name is required"];
        isValid = false;
      }
      if (!form.ownerPartnerDOB || !form.ownerPartnerDOB.trim()) {
        errors.ownerPartnerDOB = ["Owner/Partner DOB is required"];
        isValid = false;
      }
      if (!form.timeAtAddressYear || !form.timeAtAddressYear.trim()) {
        errors.timeAtAddressYear = ["Time at address (years) is required"];
        isValid = false;
      }
      if (!form.timeAtAddressMonth || !form.timeAtAddressMonth.trim()) {
        errors.timeAtAddressMonth = ["Time at address (months) is required"];
        isValid = false;
      }
    }

    if (pageNumber === 3) {
      // Page 3: Require billing type
      if (
        !form.billingType ||
        (!form.billingType.value?.trim() && !form.billingType.label?.trim())
      ) {
        errors.billingType = ["Billing type is required"];
        isValid = false;
      }
    }

    console.log("=== FINAL VALIDATION RESULT ===");
    console.log("Is valid:", isValid);
    console.log("Errors:", errors);
    setValidationErrors(errors);
    return isValid;
  };

  // Handlers
  const handleInput = <K extends keyof SoldTariffFormData>(
    field: K,
    value: SoldTariffFormData[K],
  ) => {
    console.log(`📝 Updating field: ${field}`, value);
    setForm((prev) => {
      const newForm = { ...prev, [field]: value };
      console.log("New form state:", newForm);
      return newForm;
    });
    // Clear validation error for this field when user starts typing
    if (validationErrors[field as string]) {
      setValidationErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field as string];
        return newErrors;
      });
    }
  };

  const handleAddressInput = (idx: number, value: string) => {
    setForm((prev) => ({
      ...prev,
      address: prev.address.map((v, i) => (i === idx ? value : v)) as [
        string,
        string,
        string,
        string,
      ],
    }));
  };

  const handleHomeAddressInput = (idx: number, value: string) => {
    setForm((prev) => ({
      ...prev,
      homeAddress: prev.homeAddress.map((v, i) => (i === idx ? value : v)) as [
        string,
        string,
        string,
        string,
      ],
    }));
  };

  const handleCancel = () => {
    router.back();
  };

  const handleSubmit = async () => {
    console.log("Form validation passed, preparing submission...");
    console.log("Current form data:", form);

    setIsSubmitting(true);
    try {
      // Map form data to API payload schema with flexible field handling
      const isLimitedCompany =
        (form.businessType?.label || "").toLowerCase() === "limited company" ||
        form.businessType?.value === "3" ||
        form.businessType?.value === "limited-company";
      const payload = {
        // Required fields with defaults
        lead_id: 1, // Default value - should be provided from context
        company_status_id: 1, // Default value - should be provided from context
        agent_user_id: 1, // Default value - should be provided from context
        partner_user_id: 1, // Default value - should be provided from context
        account_manager_user_id: 1, // Default value - should be provided from context
        created_user_id: 1, // Default value - should be provided from context
        last_modified_user_id: 1, // Default value - should be provided from context
        deleted_user_id: null,
        quote: quoteId || null,

        // Company information from form (with fallbacks)
        company_name:
          form.companyName?.label || form.companyName?.value || "New Company",
        ...(isLimitedCompany && form.regNo && { registration_no: form.regNo }),
        is_micro_business: form.isMicroBusiness || false,
        number_of_employees: form.employees || "",
        estimated_turnover: form.turnover || "",

        // Current address from form (with fallbacks)
        current_address_line1: form.address[0] || "",
        current_address_line2: form.address[1] || "",
        current_address_line3: form.address[2] || "",
        current_address_line4: form.address[3] || "",
        current_postcode: form.postCode || "",

        // Owner/Partner information from form (with fallbacks)
        owner_partner_name: form.ownerPartnerName || "",
        owner_partner_dob: form.ownerPartnerDOB || null,
        owner_partner_dobstring: form.ownerPartnerDOB || "",

        // Home address (from Page 2, independent from Page 1)
        home_address_line1: form.homeAddress[0] || "",
        home_address_line2: form.homeAddress[1] || "",
        home_address_line3: form.homeAddress[2] || "",
        home_address_line4: form.homeAddress[3] || "",
        home_postcode: form.homePostCode || "",

        // Time at current address (with fallback)
        time_at_current_address_months:
          parseInt(form.timeAtAddressYear || "0") * 12 +
          parseInt(form.timeAtAddressMonth || "0"),

        // Previous addresses (using empty defaults)
        previous_address_line1: "",
        previous_address_line2: "",
        previous_address_line3: "",
        previous_address_line4: "",
        previous_postcode: "",
        time_at_previous_address_months: 0,
        previous_address2_line1: "",
        previous_address2_line2: "",
        previous_address2_line3: "",
        previous_address2_line4: "",
        previous_postcode2: "",
        time_at_previous_address2_months: 0,

        // Provider information (using empty defaults)
        gas_provider: "",
        gas_renewal_date: null,
        gas_spending_band: "",
        electric_provider: "",
        electric_renewal_date: null,
        electric_spending_band: "",
        telecoms_provider: "",
        telecoms_renewal_date: null,
        telecoms_spending_band: "",
        gi_provider: "",
        gi_renewal_date: null,
        gi_spending_band: "",

        // Contact information from form (with fallbacks)
        primary_telephone_number: form.telephoneNumber || "",

        // Contract and business information
        contracts_processed: 0,
        contracts_issold: false,
        contracts_soldleadid: null,
        original_lead_source_campaign_string: "",
        original_lead_source_campaign_id: null,
        is_close_to_renewal: false,
        has_overdue_callbacks: false,
        has_renewal_callbacks: false,
        has_company_callbacks: false,
        ced: "",
        sold_supplier_name: resolvedSupplierName,
        // sold_supplier: resolvedSupplierId,
        sold_supplier: null,
        username: "",
        contract_type: contractType,
        business_type: form.businessType?.value
          ? parseInt(form.businessType.value)
          : null,

        // System fields
        is_active: true,
        is_deleted: false,
        deleted_at: null,
        deleted_datetime: null,
        account_manager_user_name: "",

        // Billing address from form (if different, with fallbacks)
        ...(form.billingType?.value === "different" &&
          {
            // Use billing address if different from current
          }),

        // Director information from form (optional)
        ...(form.directorFirstName && {
          director_first_name: form.directorFirstName,
        }),
        ...(form.directorLastName && {
          director_last_name: form.directorLastName,
        }),

        // Trading information from form (optional)
        ...(form.timeTradingFor && { time_trading_for: form.timeTradingFor }),
        ...(form.incorporatedDate && {
          incorporated_date: form.incorporatedDate,
        }),

        // Bank details from form (optional)
        ...(form.accountNumber && { account_number: form.accountNumber }),
        ...(form.sortCode && { sort_code: form.sortCode }),
        ...(form.bankName && { bank_name: form.bankName }),
        ...(form.accountName && { account_name: form.accountName }),

        // Contact details (optional)
        ...(form.primaryContactFirstName && {
          primary_contact_first_name: form.primaryContactFirstName,
        }),
        ...(form.primaryContactLastName && {
          primary_contact_last_name: form.primaryContactLastName,
        }),
        ...(form.primaryContactPosition && {
          primary_contact_position: form.primaryContactPosition,
        }),
        ...(form.primaryContactEmail && {
          primary_contact_email: form.primaryContactEmail,
        }),
        ...(form.primaryContactTitle && {
          primary_contact_title:
            form.primaryContactTitle?.label || form.primaryContactTitle?.value,
        }),
        supplier_name: resolvedSupplierName,
        latesttariffname: resolvedLatestTariffName,
        meterstring: resolvedMeterString,
      };

      console.log("Mapped payload:", payload);
      console.log("Submitting to endpoint: /api/v1/auth/web/core/company/");

      const response = await postMethod(
        payload,
        "/api/v1/auth/web/core/company/",
      );

      console.log("API response:", response);

      if (response.success) {
        console.log("Form submitted successfully:", response.data);
        setIsSubmitted(true);
        // Show success message for 3 seconds then redirect
        setTimeout(() => {
          router.push("/all-applications");
        }, 3000);
      } else {
        console.error(
          "Form submission failed:",
          response.message,
          response.errors,
        );
        // Handle error - you might want to show an error message to the user
        alert(`Submission failed: ${response.message}`);
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      alert("An error occurred while submitting the form. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Show success message after submission
  if (isSubmitted) {
    return (
      <section className="w-full max-w-[1106px] mx-auto my-4 lg:my-8 px-4 lg:px-0 bg-white">
        <Card className="w-full shadow-[0px_4px_10px_rgba(0,0,0,0.25)] rounded-lg">
          <CardContent className="p-6 flex flex-col items-center justify-center">
            <div className="text-2xl font-semibold text-green-600 mb-4">
              ✓ Form Submitted Successfully!
            </div>
            <div className="text-lg text-gray-600 mb-4">
              Your sold tariff form has been submitted.
            </div>
            <div className="text-sm text-gray-500">
              Redirecting to applications page...
            </div>
          </CardContent>
        </Card>
      </section>
    );
  }

  if (page === 1) {
    return (
      <SoldTariffFormPage1
        form={form}
        handleInput={handleInput}
        handleAddressInput={handleAddressInput}
        onCancel={handleCancel}
        onNext={() => {
          console.log("🔄 Next button clicked for page 1");
          const isValid = validatePage(1);
          console.log("Validation result:", isValid);

          if (isValid) {
            console.log("✅ Navigation allowed - moving to page 2");
            setPage(2);
          } else {
            console.log("❌ Navigation blocked - validation failed");
          }
        }}
        currentStep={1}
        totalSteps={4}
        stepTitles={STEP_TITLES}
        validationErrors={validationErrors}
      />
    );
  }

  if (page === 2) {
    return (
      <SoldTariffFormPage2
        form={form}
        handleInput={handleInput}
        handleAddressInput={handleHomeAddressInput}
        onPrev={() => setPage(1)}
        onNext={() => {
          if (validatePage(2)) {
            setPage(3);
          }
        }}
        currentStep={2}
        totalSteps={4}
        stepTitles={STEP_TITLES}
        validationErrors={validationErrors}
      />
    );
  }

  if (page === 3) {
    const handleBillingAddressInput = (idx: number, value: string) => {
      setForm((prev) => ({
        ...prev,
        billingAddress: prev.billingAddress.map((v, i) =>
          i === idx ? value : v,
        ) as [string, string, string, string],
      }));
    };
    return (
      <SoldTariffFormPage3
        form={form}
        handleInput={handleInput}
        handleBillingAddressInput={handleBillingAddressInput}
        onPrev={() => setPage(2)}
        onNext={() => {
          if (validatePage(3)) {
            setPage(4);
          }
        }}
        currentStep={3}
        totalSteps={4}
        stepTitles={STEP_TITLES}
        validationErrors={validationErrors}
      />
    );
  }

  if (page === 4) {
    return (
      <SoldTariffFormPage4
        form={form}
        handleInput={handleInput}
        onPrev={() => setPage(3)}
        onSubmit={() => {
          if (validatePage(4)) {
            handleSubmit();
          }
        }}
        currentStep={4}
        totalSteps={4}
        stepTitles={STEP_TITLES}
        isSubmitting={isSubmitting}
        validationErrors={validationErrors}
      />
    );
  }

  // Placeholder for other pages
  return (
    <section className="w-full max-w-[1106px] mx-auto my-4 lg:my-8 px-4 lg:px-0 bg-white">
      <Card className="w-full shadow-[0px_4px_10px_rgba(0,0,0,0.25)] rounded-lg">
        <CardContent className="p-6 flex flex-col items-center justify-center">
          <div className="text-lg font-semibold mb-4">
            Sold Tariff Form (Page {page} Placeholder)
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => setPage(page - 1)}
              variant="outline"
              className="h-[35px]"
            >
              Previous
            </Button>
            <Button
              onClick={handleCancel}
              className="bg-[#346fb6] text-white h-[35px]"
            >
              Cancel
            </Button>
            {page < 4 && (
              <Button
                onClick={() => setPage(page + 1)}
                className="bg-[#2db9eb] text-white h-[35px]"
              >
                Next Step
              </Button>
            )}
            {page === 4 && (
              <Button className="bg-[#2db9eb] text-white h-[35px]">
                Submit
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </section>
  );
};

export default SoldTariffForm;

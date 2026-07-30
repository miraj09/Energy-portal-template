import React, { useState, useEffect, useCallback, useRef } from "react";
import { Card, CardContent } from "@/ui/card";
import { Input } from "@/ui/input";
import { Button } from "@/ui/button";
import { Label } from "@/ui/label";
import { Switch } from "@/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/ui/radio-group";
import { CustomSelect, type SelectOption } from "@/ui/select";
import type { SoldTariffFormData, ValidationErrors } from "./SoldTariffForm";
import StepIndicator from "./StepIndicator";
import { useGetRequest } from "@/composable";
import { getLocationByPostcode } from "@/lib/actions/getLocationByPostcode";
import { resolveBusinessTypePk } from "@/composable/resolveBusinessTypePk";
import { getDropdown } from "@/lib/actions/getDropdown";

// Title options for contact (shared with Page 2)
const titleOptions: SelectOption[] = [
  { value: "mr", label: "MR." },
  { value: "mrs", label: "MRS." },
  { value: "ms", label: "MS." },
  { value: "dr", label: "DR." },
];

/**
 * Normalizes a raw title string so we can safely compare
 * values coming from the API (e.g. "MR", "Mr.", " mr ")
 * with our local select options (e.g. "mr", "MR.").
 */
const normalizeTitle = (rawTitle?: string | null): string =>
  (rawTitle || "").toLowerCase().replace(/\./g, "").trim();

// Options fetched from API

interface SoldTariffFormPage1Props {
  form: SoldTariffFormData;
  handleInput: <K extends keyof SoldTariffFormData>(
    field: K,
    value: SoldTariffFormData[K]
  ) => void;
  handleAddressInput: (idx: number, value: string) => void;
  onCancel: () => void;
  onNext: () => void;
  currentStep: number;
  totalSteps: number;
  stepTitles: string[];
  validationErrors: ValidationErrors;
}

export type { SoldTariffFormPage1Props };

const SoldTariffFormPage1: React.FC<SoldTariffFormPage1Props> = ({
  form,
  handleInput,
  handleAddressInput,
  onCancel,
  onNext,
  currentStep,
  totalSteps,
  stepTitles,
  validationErrors,
}) => {
  // State to track whether location dropdown should be shown
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  
  // State for location options from API
  const [locationOptions, setLocationOptions] = useState<SelectOption[]>([]);
  const [locationLoading, setLocationLoading] = useState(false);
  
  // State for other options from API
  const [companyNameOptions, setCompanyNameOptions] = useState<SelectOption[]>([]);
  const [companyNameLoading, setCompanyNameLoading] = useState(false);
  const [companyDetailsLoading, setCompanyDetailsLoading] = useState(false);
  const [siteOptions] = useState<SelectOption[]>([]);
  // State for server-side company search + pagination (existing company path)
  const [companySearch, setCompanySearch] = useState("");
  const [companyPage, setCompanyPage] = useState(1);
  const [hasMoreCompanies, setHasMoreCompanies] = useState(false);
  const companySearchDebounceRef = useRef<NodeJS.Timeout | null>(null);
  // Store full company data for address parsing
  const [companyData, setCompanyData] = useState<Record<string, {
    kind: string;
    company_status: string;
    date_of_creation: string;
    company_type: string;
    company_number: string;
    address: {
      address_line_1: string;
      address_line_2: string;
      country: string;
      locality: string;
      postal_code: string;
      region: string;
      premises: string;
    };
    title: string;
    address_snippet: string;
    description: string;
    links: {
      self: string;
    };
    snippet: string;
    matches: {
      snippet: string[];
    };
  }>>({});
  
  // State for business type options
  const [businessTypeOptions, setBusinessTypeOptions] = useState<SelectOption[]>([]);
  
  // Stable callbacks for fetching business types
  const handleBusinessTypesSuccess = useCallback((data: unknown) => {
    console.log("Business types API response:", data);
    if (data && typeof data === 'object' && 'results' in data && Array.isArray((data as { results: unknown[] }).results)) {
      const results = (data as { results: Array<{ id: number; title: string }> }).results;
      const options = results.map((item) => ({ value: item.id.toString(), label: item.title }));
      console.log("Mapped business type options:", options);
      setBusinessTypeOptions(options);
    } else if (data && Array.isArray(data)) {
      const options = (data as Array<{ id?: number; title?: string; name?: string; value?: string; label?: string }>).map((item) => ({
        value: item.id?.toString() || item.value || item.name || '',
        label: item.title || item.name || item.label || item.value || ''
      }));
      console.log("Mapped business type options from direct array:", options);
      setBusinessTypeOptions(options);
    } else if (data && typeof data === 'object' && 'data' in data && Array.isArray((data as { data: unknown[] }).data)) {
      const dataArray = (data as { data: Array<{ id?: number; title?: string; name?: string; value?: string; label?: string }> }).data;
      const options = dataArray.map((item) => ({
        value: item.id?.toString() || item.value || item.name || '',
        label: item.title || item.name || item.label || item.value || ''
      }));
      console.log("Mapped business type options from data property:", options);
      setBusinessTypeOptions(options);
    } else {
      console.warn("Unexpected business types data format:", data);
      setBusinessTypeOptions([]);
    }
  }, []);

  const handleBusinessTypesError = useCallback((message: string) => {
    console.error("Failed to fetch business types:", message);
    setBusinessTypeOptions([]);
  }, []);

  // Hook for fetching business types
  const { executeGet: fetchBusinessTypes } = useGetRequest({
    onSuccess: handleBusinessTypesSuccess,
    onError: handleBusinessTypesError,
  });
  
  // Fetch business types on component mount
  useEffect(() => {
    console.log("Fetching business types from API...");
    fetchBusinessTypes("/api/v1/auth/web/core/business-type/");
  }, [fetchBusinessTypes]);

  // Interface for company API response
  interface Company {
    id: number | string;
    company_name?: string;
  }

  interface CompanyApiResponse {
    count: number;
    previous: string | null;
    next: string | null;
    results: Company[];
  }

  // Interface for company details API response
  interface CompanyDetailsResponse {
    id: string;
    company_name: string;
    registration_no: string;
    is_micro_business: boolean;
    number_of_employees: string;
    estimated_turnover: string;
    current_address_line1: string;
    current_address_line2: string;
    current_address_line3: string | null;
    current_address_line4: string | null;
    current_postcode: string;
    home_address_line1: string;
    home_address_line2: string;
    home_address_line3: string | null;
    home_address_line4: string | null;
    home_postcode: string;
    owner_partner_name: string;
    owner_partner_dob: string;
    owner_partner_dobstring: string;
    time_at_current_address_months: string | null;
    primary_telephone_number: string | null;
    business_type?: number | { id: number; title?: string; name?: string } | null;
    business_type_name?: string;
    contacts?: Array<{
      id: string;
      title?: string;
      first_name: string;
      last_name: string;
      job_title?: string;
      email_address?: string;
      telephone1?: string;
      is_primary: boolean;
    }>;
    banks?: Array<{
      id: number;
      account_number: string;
      sort_code: string;
      bank_name: string;
      account_name: string;
    }>;
    bank?: {
      id?: number;
      account_number?: string;
      sort_code?: string;
      bank_name?: string;
      account_name?: string;
    } | null;
    primary_contact?: {
      id?: string;
      first_name?: string;
      last_name?: string;
      position?: string | null;
      email?: string;
      title?: string | null;
      telephone?: string;
    } | null;
    [key: string]: unknown;
  }

  /**
   * Map raw company API results into select options for the existing-company dropdown.
   */
  const mapCompaniesToOptions = (
    results: Company[] | undefined | null
  ): SelectOption[] => {
    if (!results || !Array.isArray(results)) return [];

    return results
      .filter(
        (company) =>
          company &&
          company.company_name &&
          company.id !== undefined &&
          company.id !== null
      )
      .map((company) => ({
        value: String(company.id),
        label: company.company_name as string,
      }));
  };

  /**
   * Fetch a page of companies from the backend with optional search term.
   * This mirrors the behaviour used in `TicketForm` for paginated search.
   */
  const fetchCompaniesPage = async ({
    search,
    page,
    append,
  }: {
    search: string;
    page: number;
    append: boolean;
  }) => {
    // Only fetch when the user is on the "existing company" path
    if (form.companyType !== "existing") return;

    const PAGE_SIZE = 10;

    try {
      setCompanyNameLoading(true);

      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("page_size", String(PAGE_SIZE));
      if (search.trim()) {
        params.set("company_name", search.trim());
      }

      const endpoint = `/api/v1/auth/web/core/company/?${params.toString()}`;
      const response = await getDropdown(endpoint);

      if (!response.success || !response.data) {
        console.error("Failed to fetch companies:", response.message);
        if (!append) {
          setCompanyNameOptions([]);
        }
        setHasMoreCompanies(false);
        return;
      }

      const data = response.data as CompanyApiResponse;
      const newOptions = mapCompaniesToOptions(data.results);

      setCompanyNameOptions((prev) => {
        if (!append) {
          return newOptions;
        }

        // Append while avoiding duplicates by `value`.
        const existingByValue = new Set(prev.map((opt) => opt.value));
        const merged = [
          ...prev,
          ...newOptions.filter((opt) => !existingByValue.has(opt.value)),
        ];
        return merged;
      });

      setCompanyPage(page);
      setHasMoreCompanies(Boolean(data.next));
    } catch (error) {
      console.error("Error fetching companies:", error);
      if (!append) {
        setCompanyNameOptions([]);
      }
      setHasMoreCompanies(false);
    } finally {
      setCompanyNameLoading(false);
    }
  };

  /**
   * Initial load + debounced search when the user types in the existing
   * company select. We always reset to page 1 on a new search term.
   */
  useEffect(() => {
    if (form.companyType !== "existing") {
      // Reset when switching away from existing company path
      setCompanyNameOptions([]);
      setCompanySearch("");
      setCompanyPage(1);
      setHasMoreCompanies(false);
      if (companySearchDebounceRef.current) {
        clearTimeout(companySearchDebounceRef.current);
      }
      return;
    }

    if (companySearchDebounceRef.current) {
      clearTimeout(companySearchDebounceRef.current);
    }

    companySearchDebounceRef.current = setTimeout(() => {
      fetchCompaniesPage({
        search: companySearch,
        page: 1,
        append: false,
      });
    }, 500);

    return () => {
      if (companySearchDebounceRef.current) {
        clearTimeout(companySearchDebounceRef.current);
      }
    };
    // We deliberately depend only on `form.companyType` + `companySearch`
    // here to debounce user input and avoid unnecessary calls.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.companyType, companySearch]);

  /**
   * When user scrolls to bottom of the company dropdown menu,
   * load the next page if available.
   */
  const handleCompanyMenuScrollToBottom = () => {
    if (companyNameLoading || !hasMoreCompanies || form.companyType !== "existing") return;

    fetchCompaniesPage({
      search: companySearch,
      page: companyPage + 1,
      append: true,
    });
  };

  // Fetch company details and autofill form when a company is selected
  useEffect(() => {
    const fetchCompanyDetails = async () => {
      if (form.companyType === "existing" && form.companyName?.value) {
        setCompanyDetailsLoading(true);
        try {
          const response = await getDropdown(
            `/api/v1/auth/web/core/company/${form.companyName.value}/`
          );

          if (response.success && response.data) {
            const companyData = response.data as CompanyDetailsResponse;

            // Autofill Page 1 fields
            // Post code
            if (companyData.current_postcode) {
              handleInput("postCode", companyData.current_postcode);
              
              // Try to fetch location for the postcode
              // This will help populate the location dropdown
              try {
                const locationResult = await getLocationByPostcode(companyData.current_postcode.trim());
                if (locationResult.success && locationResult.data) {
                  // Define interface for company item based on the API response structure
                  interface CompanyItem {
                    kind: string;
                    company_status: string;
                    date_of_creation: string;
                    company_type: string;
                    company_number: string;
                    address: {
                      address_line_1: string;
                      address_line_2: string;
                      country: string;
                      locality: string;
                      postal_code: string;
                      region: string;
                      premises: string;
                    };
                    title: string;
                    address_snippet: string;
                    description: string;
                    links: {
                      self: string;
                    };
                    snippet: string;
                    matches: {
                      snippet: string[];
                    };
                  }
                  
                  let locationOptionsList: SelectOption[] = [];
                  const companyDataMap: Record<string, CompanyItem> = {};
                  
                  if (locationResult.data && typeof locationResult.data === 'object' && 'items' in locationResult.data) {
                    const items = (locationResult.data as { items: CompanyItem[] }).items;
                    items.forEach((item) => {
                      companyDataMap[item.company_number] = item;
                    });
                    locationOptionsList = items.map((item) => ({
                      value: item.company_number,
                      label: `${item.address_snippet}`
                    }));
                  } else if (Array.isArray(locationResult.data)) {
                    const items = locationResult.data as CompanyItem[];
                    items.forEach((item) => {
                      companyDataMap[item.company_number] = item;
                    });
                    locationOptionsList = items.map((item) => ({
                      value: item.company_number,
                      label: `${item.title} - ${item.address_snippet}`
                    }));
                  }
                  
                  setLocationOptions(locationOptionsList);
                  setCompanyData(companyDataMap);
                  setShowLocationDropdown(true);
                  
                  // Try to auto-select location if we can find a good match
                  if (locationOptionsList.length > 0) {
                    // Try to find matching location by comparing address snippets
                    // or if there's only one option, select it
                    let selectedLocation: SelectOption | null = null;
                    
                    if (locationOptionsList.length === 1) {
                      // If only one option, select it
                      selectedLocation = locationOptionsList[0];
                    } else {
                      // Try to find best match by comparing address components
                      const companyAddressLower = (
                        (companyData.current_address_line1 || "") + " " +
                        (companyData.current_address_line2 || "") + " " +
                        (companyData.current_address_line3 || "") + " " +
                        (companyData.current_address_line4 || "")
                      ).toLowerCase();
                      
                      for (const opt of locationOptionsList) {
                        const item = companyDataMap[opt.value];
                        if (item) {
                          const itemAddressLower = (
                            (item.address.address_line_1 || "") + " " +
                            (item.address.address_line_2 || "") + " " +
                            (item.address.locality || "") + " " +
                            (item.address.country || "")
                          ).toLowerCase();
                          
                          // Check if addresses match reasonably well
                          if (
                            companyAddressLower.includes(item.address.locality?.toLowerCase() || "") ||
                            itemAddressLower.includes(companyData.current_address_line2?.toLowerCase() || "") ||
                            item.address.postal_code === companyData.current_postcode
                          ) {
                            selectedLocation = opt;
                            break;
                          }
                        }
                      }
                      
                      // If no match found, select first option as fallback
                      if (!selectedLocation && locationOptionsList.length > 0) {
                        selectedLocation = locationOptionsList[0];
                      }
                    }
                    
                    if (selectedLocation) {
                      handleInput("location", selectedLocation);
                    }
                  }
                }
              } catch (locationError) {
                console.error("Error fetching location for postcode:", locationError);
                // Continue with address autofill even if location fetch fails
              }
            }

            // Address fields
            if (companyData.current_address_line1) {
              handleAddressInput(0, companyData.current_address_line1 || "");
            }
            if (companyData.current_address_line2) {
              handleAddressInput(1, companyData.current_address_line2 || "");
            }
            if (companyData.current_address_line3) {
              handleAddressInput(2, companyData.current_address_line3 || "");
            }
            if (companyData.current_address_line4) {
              handleAddressInput(3, companyData.current_address_line4 || "");
            }

            // Business type - find matching option
            const businessTypePk = resolveBusinessTypePk(companyData.business_type);
            if (businessTypePk != null) {
              const businessTypeOption = businessTypeOptions.find(
                (opt) => opt.value === String(businessTypePk)
              );
              if (businessTypeOption) {
                handleInput("businessType", businessTypeOption);
              }
            }

            // Micro business
            if (companyData.is_micro_business !== undefined) {
              handleInput("isMicroBusiness", companyData.is_micro_business);
            }

            // Number of employees
            if (companyData.number_of_employees) {
              handleInput("employees", companyData.number_of_employees);
            }

            // Estimated turnover
            if (companyData.estimated_turnover) {
              handleInput("turnover", companyData.estimated_turnover);
            }

            // Registration number
            if (companyData.registration_no) {
              handleInput("regNo", companyData.registration_no);
            }

            // Autofill Page 2 fields (home address and contact details)
            // Home post code
            if (companyData.home_postcode) {
              handleInput("homePostCode", companyData.home_postcode);
            }

            // Home address fields - update the array directly
            if (
              companyData.home_address_line1 ||
              companyData.home_address_line2 ||
              companyData.home_address_line3 ||
              companyData.home_address_line4
            ) {
              const homeAddress: [string, string, string, string] = [
                companyData.home_address_line1 || "",
                companyData.home_address_line2 || "",
                companyData.home_address_line3 || "",
                companyData.home_address_line4 || "",
              ];
              handleInput("homeAddress", homeAddress);
            }

            // Owner/Partner name
            if (companyData.owner_partner_name) {
              handleInput("ownerPartnerName", companyData.owner_partner_name);
            }

            // Owner/Partner DOB
            if (companyData.owner_partner_dobstring) {
              handleInput("ownerPartnerDOB", companyData.owner_partner_dobstring);
            }

            // Time at address (convert months to years and months)
            if (companyData.time_at_current_address_months) {
              const months = parseInt(companyData.time_at_current_address_months);
              const years = Math.floor(months / 12);
              const remainingMonths = months % 12;
              handleInput("timeAtAddressYear", String(years));
              handleInput("timeAtAddressMonth", String(remainingMonths));
            }

            const applyPrimaryContactAutofill = (
              primaryContact: {
                title?: string | null;
                first_name?: string;
                last_name?: string;
                position?: string | null;
                job_title?: string;
                email?: string;
                email_address?: string;
                telephone?: string;
                telephone1?: string;
              }
            ) => {
              if (primaryContact.title) {
                const normalizedApiTitle = normalizeTitle(primaryContact.title);
                const titleOption = titleOptions.find((opt) => {
                  const normalizedValue = normalizeTitle(opt.value);
                  const normalizedLabel = normalizeTitle(opt.label);
                  return (
                    normalizedValue === normalizedApiTitle ||
                    normalizedLabel === normalizedApiTitle
                  );
                });
                if (titleOption) {
                  handleInput("primaryContactTitle", titleOption);
                }
              }

              if (primaryContact.first_name) {
                handleInput("primaryContactFirstName", primaryContact.first_name);
              }
              if (primaryContact.last_name) {
                handleInput("primaryContactLastName", primaryContact.last_name);
              }
              const position =
                primaryContact.position ?? primaryContact.job_title ?? "";
              if (position) {
                handleInput("primaryContactPosition", position);
              }
              const email =
                primaryContact.email ?? primaryContact.email_address ?? "";
              if (email) {
                handleInput("primaryContactEmail", email);
              }
              const telephone =
                primaryContact.telephone ?? primaryContact.telephone1 ?? "";
              if (telephone) {
                handleInput("telephoneNumber", telephone);
              } else if (companyData.primary_telephone_number) {
                handleInput("telephoneNumber", companyData.primary_telephone_number);
              }
            };

            if (companyData.primary_contact) {
              applyPrimaryContactAutofill(companyData.primary_contact);
            } else if (companyData.contacts && Array.isArray(companyData.contacts)) {
              const primaryContact = companyData.contacts.find(
                (contact) => contact.is_primary
              );
              if (primaryContact) {
                applyPrimaryContactAutofill(primaryContact);
              }
            }

            const resolvedBank =
              companyData.bank ??
              (companyData.banks &&
              Array.isArray(companyData.banks) &&
              companyData.banks.length > 0
                ? companyData.banks[0]
                : null);

            if (resolvedBank) {
              if (resolvedBank.account_number) {
                handleInput("accountNumber", resolvedBank.account_number);
              }
              if (resolvedBank.sort_code) {
                handleInput("sortCode", resolvedBank.sort_code);
              }
              if (resolvedBank.bank_name) {
                handleInput("bankName", resolvedBank.bank_name);
              }
              if (resolvedBank.account_name) {
                handleInput("accountName", resolvedBank.account_name);
              }
            }

            console.log("Company details autofilled successfully");
          } else {
            console.error("Failed to fetch company details:", response.message);
          }
        } catch (error) {
          console.error("Error fetching company details:", error);
        } finally {
          setCompanyDetailsLoading(false);
        }
      }
    };

    fetchCompanyDetails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.companyName?.value, form.companyType, businessTypeOptions]);

  // Restore UI when navigating back: if a location is already selected, just show it without refetching
  useEffect(() => {
    if (form.postCode && form.postCode.trim() && form.location) {
      setShowLocationDropdown(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handle find button click
  const handleFindClick = async () => {
    if (form.postCode.trim()) {
      setLocationLoading(true);
      setShowLocationDropdown(false);
      
      try {
        const result = await getLocationByPostcode(form.postCode.trim());
        console.log("Result:", result);
        if (result.success && result.data) {
          // Transform API response to SelectOption format
          let options: SelectOption[] = [];
          
          // Define interface for company item based on the API response structure
          interface CompanyItem {
            kind: string;
            company_status: string;
            date_of_creation: string;
            company_type: string;
            company_number: string;
            address: {
              address_line_1: string;
              address_line_2: string;
              country: string;
              locality: string;
              postal_code: string;
              region: string;
              premises: string;
            };
            title: string;
            address_snippet: string;
            description: string;
            links: {
              self: string;
            };
            snippet: string;
            matches: {
              snippet: string[];
            };
          }
          
          // Handle the specific API response structure with items array
          if (result.data && typeof result.data === 'object' && 'items' in result.data) {
            const items = (result.data as { items: CompanyItem[] }).items;
            
            // Store full company data for address parsing
            const companyDataMap: Record<string, CompanyItem> = {};
            items.forEach((item) => {
              companyDataMap[item.company_number] = item;
            });
            setCompanyData(companyDataMap);
            
            options = items.map((item) => ({
              value: item.company_number, // Use company number as unique identifier
              label: `${item.address_snippet}` // full address
            }));
          } else if (Array.isArray(result.data)) {
            // Fallback: If data is directly an array
            const items = result.data as CompanyItem[];
            
            // Store full company data for address parsing
            const companyDataMap: Record<string, CompanyItem> = {};
            items.forEach((item) => {
              companyDataMap[item.company_number] = item;
            });
            setCompanyData(companyDataMap);
            
            options = items.map((item) => ({
              value: item.company_number,
              label: `${item.title} - ${item.address_snippet}`
            }));
          }
          
          setLocationOptions(options);
          setShowLocationDropdown(true);
        } else {
          console.error("Failed to fetch locations:", result.message);
          // Show error message or fallback to empty options
          setLocationOptions([]);
          setShowLocationDropdown(true);
        }
      } catch (error) {
        console.error("Error fetching locations:", error);
        setLocationOptions([]);
        setShowLocationDropdown(true);
      } finally {
        setLocationLoading(false);
      }
    }
  };

  // Handle location selection and auto-populate company name and address
  const handleLocationChange = (option: SelectOption | null) => {
    handleInput("location", option || undefined);
    
    if (option) {
      // Get the full company data using the company number
      const selectedCompanyData = companyData[option.value];
      
      if (selectedCompanyData) {
        
        // Use structured address fields from API response
        const address = selectedCompanyData.address;
        
        // Map address fields to form inputs:
        // Input 1: premises (e.g., "45")
        // Input 2: address_line_1 (e.g., "Macaulay Road") 
        // Input 3: locality (e.g., "London")
        // Input 4: country (e.g., "England")
        handleAddressInput(0, address.premises || '');
        handleAddressInput(1, address.address_line_1 || '');
        handleAddressInput(2, address.locality || '');
        handleAddressInput(3, address.country || '');
      }
    }
  };

  return (
    <section className="w-full max-w-[700px] xl:max-w-[1100px] mx-auto my-4 lg:my-8 px-4 lg:px-0 bg-white relative">
      <Card className="w-full shadow-[0px_4px_10px_rgba(0,0,0,0.25)] rounded-lg">
        <CardContent className="p-4 lg:p-6">
          <StepIndicator 
            currentStep={currentStep}
            totalSteps={totalSteps}
            stepTitles={stepTitles}
          />
          <h1 className="font-semibold text-[#363636] text-xl sm:text-2xl tracking-[0] leading-5 font-['Plus_Jakarta_Sans',Helvetica] mb-6 lg:mb-8">
            Create New Company
          </h1>

          <div className="space-y-6 lg:space-y-8">
            {/* Company Type */}
            <div className="w-full max-w-md">
              <RadioGroup
                value={form.companyType}
                onValueChange={(val) =>
                  handleInput("companyType", val as "existing" | "new")
                }
                className="space-y-3"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem
                    value="existing"
                    id="existing"
                    className="w-6 h-6 rounded-xl border-[0.8px] border-solid border-[#2db9eb]"
                  />
                  <Label
                    htmlFor="existing"
                    className="font-medium text-[#383e49] text-base tracking-[0] leading-6 font-['Inter',Helvetica]"
                  >
                    Existing Company
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem
                    value="new"
                    id="new"
                    className="w-6 h-6 rounded-xl border-[0.8px] border-solid border-[#2db9eb]"
                  />
                  <Label
                    htmlFor="new"
                    className="font-medium text-[#383e49] text-base tracking-[0] leading-6 font-['Inter',Helvetica]"
                  >
                    New Company
                  </Label>
                </div>
              </RadioGroup>
            </div>
            {form.companyType === "new" && (
              <>
                {/* Post Code */}
                <div className="w-full lg:max-w-1/3">
                  <Label className="block font-medium text-sm text-[#48505E] tracking-[0] leading-6 font-['Inter',Helvetica] mb-2">
                    Post Code <span className="text-red-500">*</span>
                  </Label>
                  <div className="flex">
                    <Input
                      className={`flex-1 h-[35px] rounded-l rounded-r-none border-[0.8px] border-solid shadow-shadow-xs ${
                        validationErrors.postCode ? 'border-red-500' : 'border-neutral-500'
                      }`}
                      placeholder="E6 3BJ"
                      value={form.postCode}
                      onChange={(e) => handleInput("postCode", e.target.value.toUpperCase())}
                    />
                    <Button 
                      className="w-[83px] h-[35px] bg-[#346fb6] rounded-r rounded-l-none text-white text-lg font-medium ml-[-1px]"
                      onClick={handleFindClick}
                      disabled={locationLoading}
                    >
                      {locationLoading ? "..." : "Find"}
                    </Button>
                  </div>
                  {validationErrors.postCode && (
                    <p className="text-sm text-red-500 mt-1">{validationErrors.postCode[0]}</p>
                  )}
                </div>

                {/* Location List (Dropdown) - Only show when postcode is provided and find is clicked */}
                {showLocationDropdown && (
                  <div className="w-full max-w-md">
                    <Label className="block font-medium text-sm text-[#48505E] tracking-[0] leading-6 font-['Inter',Helvetica] mb-2">
                      Location List <span className="text-red-500">*</span>
                    </Label>
                    <CustomSelect
                      options={locationOptions}
                      placeholder={locationLoading ? "Loading locations..." : locationOptions.length === 0 ? "No locations found" : "Select location"}
                      value={form.location}
                      onChange={handleLocationChange}
                      className={`w-full h-[35px] ${validationErrors.location ? 'border-red-500' : ''}`}
                      isDisabled={locationLoading}
                    />
                    {validationErrors.location && (
                      <p className="text-sm text-red-500 mt-1">{validationErrors.location[0]}</p>
                    )}
                  </div>
                )}

                {/* Company Name - Only show when company is selected */}
                {form.location && (
                  <div className="w-full max-w-md">
                    <Label className="block font-medium text-sm tracking-[0] text-[#48505e] leading-6 font-['Inter',Helvetica] mb-2">
                      Company Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      className={`w-full h-[35px] bg-white rounded border-[0.8px] border-solid shadow-shadow-xs px-4 py-1.5 text-sm font-normal tracking-[0] leading-6 font-['Inter',Helvetica] ${
                        validationErrors.companyName ? 'border-red-500' : 'border-neutral-500'
                      }`}
                      placeholder=""
                      value={form.companyName?.value || ""}
                      onChange={(e) =>
                        handleInput("companyName", {
                          value: e.target.value,
                          label: e.target.value,
                        })
                      }
                    />
                    {validationErrors.companyName && (
                      <p className="text-sm text-red-500 mt-1">{validationErrors.companyName[0]}</p>
                    )}
                  </div>
                )}

                {/* Address - Only show when company is selected */}
                {form.location && (
                  <div className="w-full lg:w-3/4">
                    <Label className="block font-medium text-sm tracking-[0] leading-6 font-['Inter',Helvetica] mb-3">
                      Address
                    </Label>
                    <div className="bg-[#ffffff] rounded-lg border border-solid border-[#c4c4c4] p-4 lg:p-6">
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
                        <Input
                          className="h-[35px] rounded-lg border border-solid border-[#cfd4dc] bg-white shadow-shadow-xs"
                          placeholder="45"
                          value={form.address[0]}
                          onChange={(e) => handleAddressInput(0, e.target.value)}
                        />
                        <Input
                          className="h-[35px] rounded-lg border border-solid border-[#cfd4dc] bg-white shadow-shadow-xs"
                          placeholder="Macaulay Road"
                          value={form.address[1]}
                          onChange={(e) => handleAddressInput(1, e.target.value)}
                        />
                        <Input
                          className="h-[35px] rounded-lg border border-solid border-[#cfd4dc] bg-white shadow-shadow-xs"
                          placeholder="London"
                          value={form.address[2]}
                          onChange={(e) => handleAddressInput(2, e.target.value)}
                        />
                        <Input
                          className="h-[35px] rounded-lg border border-solid border-[#cfd4dc] bg-white shadow-shadow-xs"
                          placeholder="England"
                          value={form.address[3]}
                          onChange={(e) => handleAddressInput(3, e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                )}

              {/* Is Micro-Business */}
              <div className="w-full max-w-md">
                <div className="flex items-center justify-between">
                  <Label className="font-medium text-sm tracking-[0] leading-6 font-['Inter',Helvetica]">
                    Is Micro-Business
                  </Label>
                  <Switch
                    checked={form.isMicroBusiness}
                    onCheckedChange={(val) =>
                      handleInput("isMicroBusiness", val)
                    }
                    className="data-[state=checked]:bg-[#2db9eb] data-[state=unchecked]:bg-gray-200"
                  />
                </div>
              </div>

              {/* Number of Employees */}
              <div className="w-full max-w-md">
                <Label className="block font-medium text-sm tracking-[0] leading-6 font-['Inter',Helvetica] mb-2">
                  Number of Employees
                </Label>
                <Input
                  className="w-full h-[35px] bg-white rounded border-[0.8px] border-solid border-neutral-500 shadow-shadow-xs px-[15px] py-1.5 text-sm font-normal tracking-[0] leading-6 font-['Inter',Helvetica]"
                  placeholder="500"
                  value={form.employees}
                  onChange={(e) => handleInput("employees", e.target.value)}
                  type="number"
                />
              </div>

              {/* Estimated Turnover */}
              <div className="w-full max-w-md">
                <Label className="block font-medium text-sm tracking-[0] leading-6 font-['Inter',Helvetica] mb-2">
                  Estimated Turnover
                </Label>
                <Input
                  className="w-full h-[35px] bg-white rounded border-[0.8px] border-solid border-neutral-500 shadow-shadow-xs px-[15px] py-1.5 text-sm font-normal tracking-[0] leading-6 font-['Inter',Helvetica]"
                  placeholder="5000"
                  value={form.turnover}
                  onChange={(e) => handleInput("turnover", e.target.value)}
                  type="number"
                />
              </div>

              {/* Registration No - Only show when business type is Limited Company */}
              {(((form.businessType?.label || "").toLowerCase() === "limited company") || form.businessType?.value === "3" || form.businessType?.value === "limited-company") && (
                <div className="w-full max-w-md">
                  <Label className="block font-medium text-sm tracking-[0] leading-6 font-['Inter',Helvetica] mb-2">
                    Registration No
                  </Label>
                  <Input
                    className="w-full h-[35px] bg-white rounded border-[0.8px] border-solid border-neutral-500 shadow-shadow-xs px-[15px] py-1.5 text-sm font-normal tracking-[0] leading-6 font-['Inter',Helvetica]"
                    placeholder="163245051423"
                    value={form.regNo}
                    onChange={(e) => handleInput("regNo", e.target.value)}
                  />
                </div>
              )}
            </>
          )}
          {form.companyType === "existing" && (
            <>
              {/* Company Name (Dropdown) */}
              <div className="w-full max-w-md">
                <Label className="block font-medium text-sm tracking-[0] leading-6 font-['Inter',Helvetica] mb-2">
                  Company Name <span className="text-red-500">*</span>
                  {companyNameLoading && (
                    <span className="ml-2 text-sm text-gray-500">(Loading...)</span>
                  )}
                  {companyDetailsLoading && (
                    <span className="ml-2 text-sm text-blue-500">(Fetching details...)</span>
                  )}
                </Label>
                <CustomSelect
                  options={companyNameOptions}
                  placeholder={companyNameLoading ? "Loading companies..." : "Select company name"}
                  value={form.companyName}
                  // Enable server-side search as the user types into the select
                  onInputChange={(inputValue, actionMeta) => {
                    // Ignore changes not caused by actual typing (e.g. menu close).
                    if (actionMeta.action === "input-change") {
                      setCompanySearch(inputValue);
                    }
                    return inputValue;
                  }}
                  // Infinite scroll: load next page when the user hits the bottom of the menu.
                  onMenuScrollToBottom={handleCompanyMenuScrollToBottom}
                  onChange={(option) =>
                    handleInput("companyName", option || undefined)
                  }
                  className={`w-full h-[35px] ${
                    validationErrors.company_name ? 'border-red-500' : ''
                  }`}
                  // Keep dropdown interactive during list loading for better UX;
                  // only disable while we are autofilling details for a selected company.
                  isDisabled={companyDetailsLoading}
                  isLoading={companyNameLoading || companyDetailsLoading}
                />
                {validationErrors.company_name && (
                  <p className="text-sm text-red-500 mt-1">{validationErrors.company_name[0]}</p>
                )}
                {companyDetailsLoading && (
                  <p className="text-sm text-blue-500 mt-1">Autofilling company details...</p>
                )}
              </div>
              
              {/* Site Type */}
              {/* <div className="w-full max-w-md ml-5">
                <RadioGroup
                  value={form.siteType}
                  onValueChange={(val) =>
                    handleInput("siteType", val as "existing" | "new")
                  }
                  className="space-y-3"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem
                      value="existing"
                      id="site-existing"
                      className="w-5 h-5 rounded-xl border-[0.8px] border-solid border-[#2db9eb]"
                    />
                    <Label
                      htmlFor="site-existing"
                      className="font-medium text-[#383e49] text-base tracking-[0] leading-6 font-['Inter',Helvetica]"
                    >
                      Existing Site
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem
                      value="new"
                      id="site-new"
                      className="w-5 h-5 rounded-xl border-[0.8px] border-solid border-[#2db9eb]"
                    />
                    <Label
                      htmlFor="site-new"
                      className="font-medium text-[#383e49] text-base tracking-[0] leading-6 font-['Inter',Helvetica]"
                    >
                      New Site
                    </Label>
                  </div>
                </RadioGroup>
              </div> */}

              {/* Site (Dropdown) */}
              {/* <div className="w-full max-w-md">
                <Label className="block font-medium text-sm tracking-[0] leading-6 font-['Inter',Helvetica] mb-2">
                  Site
                </Label>
                <CustomSelect
                  options={siteOptions}
                  placeholder="Select site"
                  value={form.site}
                  onChange={(option) =>
                    handleInput("site", option || undefined)
                  }
                  className="w-full h-[35px]"
                />
              </div> */}
            </>
          )}
          {/* Navigation Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-end pt-6">
            <Button
              className="w-full sm:w-[99px] h-10 bg-transparent hover:bg-red-500 rounded border border-red-500 text-red-500 hover:text-white font-body-2-medium"
              onClick={onCancel}
            >
              Cancel
            </Button>
            <Button
              className="w-full sm:w-[99px] h-10 bg-[#2db9eb] rounded text-white font-body-2-medium"
              onClick={onNext}
            >
              Next Step
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  </section>
  );
};

export default SoldTariffFormPage1;

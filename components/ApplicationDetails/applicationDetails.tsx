"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  ApplicationHeader,
  ContactDetailsSection,
  BankDetailsSection,
  CompanyDetailsSection,
  PlanDetailsSection,
  MeterDetailsSection,
  NotesSection,
  CallbacksSection,
  UpdateHistorySection,
  ContractDetailsModal,
  SubmittedContactsModal,
  AddMeterModal,
  AddSiteModal,
  EditMeterModal,
} from "./components";
import {
  ContractDetails,
  MeterDetail,
  ContactDetails,
  CompanyDetails,
  BankDetails,
  CompanyApiResponse,
  ApiNote,
  Note,
  Callback,
  UpdateHistory,
  Meter,
  ApiMeter,
} from "./types";
import { formatDateTime } from "@/composable/getFormatedDate";
import { getDropdown } from "@/lib/actions/getDropdown";
import { toast } from "sonner";

const ApplicationDetails = ({ id }: { id: string }) => {
  const router = useRouter();
  const [applicationDetails, setApplicationDetails] =
    useState<CompanyApiResponse | null>(null);
  const [isContractModalOpen, setIsContractModalOpen] = useState(false);
  const [selectedContract, setSelectedContract] =
    useState<ContractDetails | null>(null);
  const [contacts, setContacts] = useState<ContactDetails[]>([]);
  const [company, setCompany] = useState<CompanyDetails | null>(null);
  const [bank, setBank] = useState<BankDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [callbacks, setCallbacks] = useState<Callback[]>([]);
  const [updateHistories, setUpdateHistories] = useState<UpdateHistory[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedSiteId, setSelectedSiteId] = useState<number | null>(null);
  const [isSubmittedContactsOpen, setIsSubmittedContactsOpen] = useState(false);
  const [isAddMeterModalOpen, setIsAddMeterModalOpen] = useState(false);
  const [isAddSiteModalOpen, setIsAddSiteModalOpen] = useState(false);
  const [isEditMeterModalOpen, setIsEditMeterModalOpen] = useState(false);
  const [meterToEdit, setMeterToEdit] = useState<MeterDetail | null>(null);

  const loadApplicationDetails = useCallback(
    async (showPageLoader = true) => {
      try {
        if (showPageLoader) {
          setIsLoading(true);
        }

        const response = await getDropdown(
          `/api/v1/auth/web/core/company/${id}/`
        );

        if (!response.success) {
          if (
            response.errors &&
            typeof response.errors === "object" &&
            "authError" in response.errors
          ) {
            toast.error("Token expired. Authentication required.");
            await new Promise((resolve) => setTimeout(resolve, 500));
            router.push("/login");
            return;
          }

          console.error("Failed to fetch company data:", response.message);
          return;
        }

        if (!response.data) return;

        const companyData = response.data as CompanyApiResponse;
        setApplicationDetails(companyData);

        if (companyData.banks && companyData.banks.length > 0) {
          setBank(companyData.banks[0]);
        } else {
          setBank(null);
        }

        if (companyData.company_name) {
          const extractedCompanyData: CompanyDetails = {
            company_name: companyData.company_name,
            business_type_id: companyData.business_type,
            business_type_name: companyData?.business_type_name || "",
            number_of_employees: companyData.number_of_employees,
            estimated_turnover: companyData.estimated_turnover,
            is_micro_business: companyData.is_micro_business,
            current_postcode: companyData.current_postcode,
            current_address_line1: companyData.current_address_line1,
            current_address_line2: companyData.current_address_line2 || "",
            current_address_line3: companyData.current_address_line3 || "",
            current_address_line4: companyData.current_address_line4 || "",
            registration_no: companyData.registration_no,
          };
          setCompany(extractedCompanyData);
        } else {
          setCompany(null);
        }

        if (companyData.contacts && companyData.contacts.length > 0) {
          setContacts(companyData.contacts);
        } else {
          setContacts([]);
        }

        if (companyData.notes && companyData.notes.length > 0) {
          const mappedNotes: Note[] = (companyData.notes as ApiNote[]).map(
            (apiNote) => ({
              id: apiNote.id,
              author: apiNote.created_by_name || "Unknown",
              timestamp: formatDateTime(apiNote.created_at),
              content: apiNote.detail,
            })
          );
          setNotes(mappedNotes);
        } else {
          setNotes([]);
        }

        if (companyData.callbacks && companyData.callbacks.length > 0) {
          setCallbacks(companyData.callbacks);
        } else {
          setCallbacks([]);
        }

        if (
          companyData.update_histories &&
          companyData.update_histories.length > 0
        ) {
          setUpdateHistories(companyData.update_histories);
        } else {
          setUpdateHistories([]);
        }
      } catch (error) {
        console.error("Error fetching company data:", error);
      } finally {
        if (showPageLoader) {
          setIsLoading(false);
        }
      }
    },
    [id, router]
  );

  useEffect(() => {
    if (id) {
      loadApplicationDetails();
    }
  }, [id, loadApplicationDetails]);

  const handleViewContract = (meter: MeterDetail) => {
    setSelectedContract(meter.contractDetails);
    setIsContractModalOpen(true);
  };

  const handleContactUpdate = (updatedContacts: ContactDetails[]) => {
    setContacts(updatedContacts);
    // Here you would typically also save to your backend/API
    console.log("Contacts updated:", updatedContacts);
  };

  const handleCompanyUpdate = (updatedCompany: CompanyDetails) => {
    setCompany(updatedCompany);

    // Update the company data in applicationDetails if it exists
    if (applicationDetails) {
      setApplicationDetails({
        ...applicationDetails,
        company_name: updatedCompany.company_name,
        number_of_employees: updatedCompany.number_of_employees,
        estimated_turnover: updatedCompany.estimated_turnover,
        is_micro_business: updatedCompany.is_micro_business,
        current_postcode: updatedCompany.current_postcode,
        current_address_line1: updatedCompany.current_address_line1,
        current_address_line2: updatedCompany.current_address_line2 || "",
        current_address_line3: updatedCompany.current_address_line3 || "",
        current_address_line4: updatedCompany.current_address_line4 || "",
        registration_no: updatedCompany.registration_no,
        business_type: updatedCompany.business_type_id,
        business_type_name: updatedCompany.business_type_name,
      });
    }

    // Here you would typically also save to your backend/API
    console.log("Company updated:", updatedCompany);
  };

  const handleBankUpdate = (updatedBank: BankDetails) => {
    setBank(updatedBank);

    // Update the banks array in applicationDetails if it exists
    if (applicationDetails) {
      const updatedBanks = applicationDetails.banks.map((b) =>
        b.id === updatedBank.id ? updatedBank : b
      );
      setApplicationDetails({
        ...applicationDetails,
        banks: updatedBanks,
      });
    }

    // Here you would typically also save to your backend/API
    console.log("Bank updated:", updatedBank);
  };

  const handleNoteUpdate = (newNote: Note) => {
    setNotes((prevNotes) => [newNote, ...prevNotes]);

    // Update the notes array in applicationDetails if it exists
    if (applicationDetails) {
      const apiNote: ApiNote = {
        id: newNote.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        is_deleted: false,
        deleted_at: null,
        is_active: true,
        detail: newNote.content,
        created_by: null,
        deleted_by: null,
        company: id,
        created_by_name: newNote.author,
      };

      setApplicationDetails({
        ...applicationDetails,
        notes: [apiNote, ...applicationDetails.notes],
      });
    }

    console.log("Note added:", newNote);
  };

  const handleViewMeters = (siteId: number) => {
    setSelectedSiteId((current) => (current === siteId ? null : siteId));
  };

  const handleMeterAdded = async (_newMeter: Meter) => {
    // Refetch from server so the meter list has real IDs and contract fields.
    await loadApplicationDetails(false);
  };

  const handleEditMeter = (meter: MeterDetail) => {
    setMeterToEdit(meter);
    setIsEditMeterModalOpen(true);
  };

  const handleMeterUpdated = async () => {
    await loadApplicationDetails(false);
    setMeterToEdit(null);
  };

  const handleMeterUpdate = (updatedMeters: MeterDetail[]) => {
    if (!applicationDetails || selectedSiteId === null) return;

    // Update the meters array for the selected site
    const updatedSites = applicationDetails.sites.map((site) => {
      if (site.id === selectedSiteId) {
        // Convert MeterDetail back to the original meter format
        const updatedSiteMeters = updatedMeters
          .map((meterDetail) => {
            // Find the original meter to preserve other properties
            const originalMeter = site.meters.find(
              (m) => m.meterid === meterDetail.id
            );
            if (originalMeter) {
              return {
                ...originalMeter,
                latest_issold: meterDetail.quoteDetails.sold,
                latest_isprocessed: meterDetail.quoteDetails.submitted,
              };
            }
            return null;
          })
          .filter(
            (meter): meter is NonNullable<typeof meter> => meter !== null
          );

        return {
          ...site,
          meters: updatedSiteMeters,
        };
      }
      return site;
    });

    setApplicationDetails({
      ...applicationDetails,
      sites: updatedSites,
    });
  };

  // Helper function to parse meter reference and create the reference structure
  const parseMeterReference = (meterRef: string) => {
    // Split the meter reference into 8 parts: 1, 2, 3, 3, 2, 4, 4, 3 characters
    // Example: "S038014441200034589324" -> ["S", "03", "801", "444", "12", "0033", "4580", "324"]
    const chars = meterRef.split("");
    let currentIndex = 0;

    const parts = [1, 2, 3, 3, 2, 4, 4, 3].map((count) => {
      const part = chars.slice(currentIndex, currentIndex + count).join("");
      currentIndex += count;
      return part || "0".repeat(count);
    });

    return {
      indicator: parts[0] || "S",
      topRow: [parts[1] || "00", parts[2] || "000", parts[3] || "000"],
      bottomRow: [
        parts[4] || "00",
        parts[5] || "0000",
        parts[6] || "0000",
        parts[7] || "000",
      ],
    };
  };

  // Helper function to map API meter data to MeterDetail format
  const mapMeterToMeterDetail = (
    meter: Meter | ApiMeter,
    siteName: string
  ): MeterDetail => {
    const meterType =
      "meter_type_name" in meter
        ? meter.meter_type_name || "Electricity"
        : "Electricity";

    return {
      id: meter.meterid,
      type: meterType,
      siteName: siteName,
      reference: parseMeterReference(meter.meter_reference),
      referenceString: meter.meter_reference,
      quoteDetails: {
        sold: meter.latest_issold || false,
        submitted: meter.latest_isprocessed || false,
      },
      contractDetails: {
        contractCommission: "0.00",
        startDate: new Date().toLocaleDateString(),
        soldSupplier: meter.latestsoldsuppliername || "N/A",
        tariff: meter.latesttariffname || "N/A",
        term: meter.latestterm?.toString() || "0",
        units: "kWh",
        uplifts: "0.00",
        rates: {
          standingCharge: meter.latestSoldStandingCharge || "0.00",
          dayRate: meter.latestSoldDayRate || "0.00",
        },
        savings: "0.00",
        yearlyCost: "0.00",
        soldDate: new Date().toLocaleDateString(),
        contractType: "Standard",
        submitted: meter.latest_isprocessed ? "Yes" : "No",
        isProcessed: meter.latest_isprocessed ? "Yes" : "No",
      },
    };
  };

  // Get meters for the selected site
  const getSelectedSiteMeters = (): MeterDetail[] => {
    if (selectedSiteId === null) return [];

    const sites = applicationDetails?.sites;
    if (!sites) return [];

    const selectedSite = sites.find((site) => site.id === selectedSiteId);

    if (!selectedSite || !selectedSite.meters) return [];

    return selectedSite.meters.map((meter) =>
      mapMeterToMeterDetail(meter, selectedSite.sitename)
    );
  };

  // Loading state with basic loader
  if (isLoading) {
    return (
      <section className="w-full mx-auto my-4 lg:my-8 px-6 lg:px-8 space-y-4">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600 text-lg">
              Loading application details...
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="w-full mx-auto my-4 lg:my-8 px-6 lg:px-8 space-y-4">
      <ApplicationHeader
        companyName={applicationDetails?.company_name || "N/A"}
        applicationId={applicationDetails?.lead_id.toString() || "N/A"}
        companyId={applicationDetails?.id || id}
        isSubmitted={applicationDetails?.is_submitted || false}
        // Pass through any existing DocuSign envelope so the header
        // can switch its label between "Send" and "Re-send"
        envelopeId={applicationDetails?.loa_envelope_id || null}
        onViewSubmittedContacts={() => setIsSubmittedContactsOpen(true)}
      />

      {company ? (
        <CompanyDetailsSection
          companyDetails={company}
          onCompanyUpdate={handleCompanyUpdate}
          companyId={id}
        />
      ) : (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Company Details
          </h3>
          <p className="text-gray-500 text-center">No company details found</p>
        </div>
      )}

      <ContactDetailsSection
        companyId={id}
        contactDetails={contacts}
        onContactUpdate={handleContactUpdate}
      />

      {bank ? (
        <BankDetailsSection
          bankDetails={bank}
          onBankUpdate={handleBankUpdate}
        />
      ) : (
        <div className="bg-[#F7FAFF] rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Bank Details
          </h3>
          <p className="text-gray-500 text-center">No bank details found</p>
        </div>
      )}

      <PlanDetailsSection
        sites={applicationDetails?.sites || []}
        onViewMeters={(site) => handleViewMeters(site.id)}
        onAddSite={() => setIsAddSiteModalOpen(true)}
        selectedSiteId={selectedSiteId}
      />

      {selectedSiteId !== null && (
        <MeterDetailsSection
          meterDetails={getSelectedSiteMeters()}
          onViewContract={handleViewContract}
          onMeterUpdate={handleMeterUpdate}
          onMeterDeleted={() => loadApplicationDetails(false)}
          onEditMeter={handleEditMeter}
          onAddMeter={() => setIsAddMeterModalOpen(true)}
        />
      )}

      <NotesSection
        notes={notes}
        onNoteUpdate={handleNoteUpdate}
        companyId={id}
      />

      <CallbacksSection callbacks={callbacks} />

      <UpdateHistorySection updateHistories={updateHistories} />

      <ContractDetailsModal
        isOpen={isContractModalOpen}
        onClose={() => setIsContractModalOpen(false)}
        contractDetails={selectedContract}
      />

      <SubmittedContactsModal
        isOpen={isSubmittedContactsOpen}
        onClose={() => setIsSubmittedContactsOpen(false)}
        sites={(applicationDetails?.sites || []).map((s) => ({
          ...s,
          meters: s.meters || [],
        }))}
      />

      {selectedSiteId !== null && (
        <AddMeterModal
          isOpen={isAddMeterModalOpen}
          onClose={() => setIsAddMeterModalOpen(false)}
          companyId={id}
          siteId={selectedSiteId}
          siteName={
            applicationDetails?.sites.find((s) => s.id === selectedSiteId)
              ?.sitename || ""
          }
          sitePostcode={
            applicationDetails?.sites.find((s) => s.id === selectedSiteId)
              ?.postcode || ""
          }
          onMeterAdded={handleMeterAdded}
        />
      )}

      <AddSiteModal
        isOpen={isAddSiteModalOpen}
        onClose={() => setIsAddSiteModalOpen(false)}
        companyId={id}
        onSiteAdded={() => loadApplicationDetails(false)}
      />

      {selectedSiteId !== null && (
        <EditMeterModal
          isOpen={isEditMeterModalOpen}
          onClose={() => {
            setIsEditMeterModalOpen(false);
            setMeterToEdit(null);
          }}
          companyId={id}
          siteId={selectedSiteId}
          sitePostcode={
            applicationDetails?.sites.find((s) => s.id === selectedSiteId)
              ?.postcode || ""
          }
          meter={meterToEdit}
          onMeterUpdated={handleMeterUpdated}
        />
      )}
    </section>
  );
};

export default ApplicationDetails;

import { useState } from "react";
import { ContactDetails } from "../types";
import DynamicInfoCard from "./DynamicInfoCard";
import { Card, CardContent } from "@/ui/card";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { patchMethod } from "@/lib/actions/patchMethod";
import { postMethod } from "@/lib/actions/postMethod";
import { useDeleteApiCall } from "@/composable";
import { DeleteConfirmationModal } from "@/ui";

// Define the InfoField interface locally to match DynamicInfoCard
interface InfoField {
  label: string;
  value: string;
  type: string;
  key: string;
  options?: { value: string; label: string }[];
  onSearch?: (searchTerm: string) => void;
  searchable?: boolean;
  required?: boolean;
  error?: string;
  disabled?: boolean;
  inputType?: "text" | "number" | "email" | "tel";
}

interface ContactDetailsSectionProps {
  contactDetails: ContactDetails[];
  onContactUpdate?: (updatedContacts: ContactDetails[]) => void;
  companyId: string;
}

const ContactDetailsSection: React.FC<ContactDetailsSectionProps> = ({
  contactDetails,
  onContactUpdate,
  companyId,
}) => {
  const [contacts, setContacts] = useState<ContactDetails[]>(contactDetails);
  const [editingContactId, setEditingContactId] = useState<string | null>(null);
  const [editingContact, setEditingContact] = useState<ContactDetails | null>(
    null
  );
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [validationErrors, setValidationErrors] = useState<{
    [key: string]: string;
  }>({});

  // Delete modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [contactToDelete, setContactToDelete] = useState<ContactDetails | null>(
    null
  );

  // API hooks
  const deleteApi = useDeleteApiCall({
    onSuccess: () => {
      toast.success("Contact deleted successfully!");
    },
    onError: (message) => {
      toast.error(`Failed to delete contact: ${message}`);
    },
    showSuccessMessage: false,
    showErrorMessage: false,
  });

  // Validation function for mandatory fields
  const validateContact = (
    contact: ContactDetails
  ): { [key: string]: string } => {
    const errors: { [key: string]: string } = {};

    if (!contact.job_title?.trim()) {
      errors.job_title = "Job title is required";
    }
    if (!contact.first_name?.trim()) {
      errors.first_name = "First name is required";
    }
    if (!contact.last_name?.trim()) {
      errors.last_name = "Last name is required";
    }
    if (!contact.email_address?.trim()) {
      errors.email_address = "Email address is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.email_address)) {
      errors.email_address = "Please enter a valid email address";
    }
    if (!contact.telephone1?.trim()) {
      errors.telephone1 = "Phone number is required";
    }

    return errors;
  };

  const handleAddContact = () => {
    const newContact: ContactDetails = {
      id: `temp-${Date.now()}`, // Use temporary ID for local state management
      job_title: "",
      first_name: "",
      last_name: "",
      email_address: "",
      telephone1: "",
      telephone2: null,
      is_primary: false,
    };

    // If this is the first contact, make it primary
    if (contacts.length === 0) {
      newContact.is_primary = true;
    }

    setContacts([...contacts, newContact]);
    setEditingContactId(newContact.id);
    setEditingContact({ ...newContact });
    setHasUnsavedChanges(true);
    setValidationErrors({});
  };

  const handleEditContact = (contact: ContactDetails) => {
    setEditingContactId(contact.id);
    setEditingContact({ ...contact });
    setValidationErrors({});
  };

  const handleDeleteContact = (contactId: string | null) => {
    if (!contactId) return; // Don't delete contacts without IDs

    // Find the contact to delete
    const contactToDelete = contacts.find(
      (contact) => contact.id === contactId
    );
    if (!contactToDelete) return;

    // If the contact has a temporary ID (starts with "temp-"), remove it directly from local state
    if (contactId.startsWith("temp-")) {
      const updatedContacts = contacts.filter(
        (contact) => contact.id !== contactId
      );

      // If we're deleting the primary contact and there are other contacts, make the first one primary
      if (contactToDelete.is_primary && updatedContacts.length > 0) {
        updatedContacts[0].is_primary = true;
      }

      setContacts(updatedContacts);
      setHasUnsavedChanges(true);
      return;
    }

    // For contacts with real IDs, set the contact to delete and open the modal
    setContactToDelete(contactToDelete);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!contactToDelete) return;

    try {
      // Call the delete API first
      const response = await deleteApi.executeDelete(
        `/api/v1/auth/web/core/contact/${contactToDelete.id}/`
      );

      if (response.success) {
        // Only remove from local state if API call was successful
        const updatedContacts = contacts.filter(
          (contact) => contact.id !== contactToDelete.id
        );

        // If we're deleting the primary contact and there are other contacts, make the first one primary
        if (contactToDelete.is_primary && updatedContacts.length > 0) {
          updatedContacts[0].is_primary = true;
        }

        setContacts(updatedContacts);
        setHasUnsavedChanges(true);

        // Close the modal
        setDeleteModalOpen(false);
        setContactToDelete(null);
      }
      // If the API call fails, the error will be handled by the useDeleteApiCall composable
    } catch (error) {
      console.error("Error deleting contact:", error);
      toast.error("Failed to delete contact. Please try again.");
    }
  };

  const handleCancelDelete = () => {
    setDeleteModalOpen(false);
    setContactToDelete(null);
  };

  const handleFieldChange = (key: string, value: string) => {
    if (!editingContact) return;

    const updatedContact = { ...editingContact, [key]: value };

    // If setting is_primary to true, set all other contacts to false
    if (key === "is_primary" && value === "true") {
      setContacts((prevContacts) =>
        prevContacts.map((contact) => ({
          ...contact,
          is_primary: contact.id === editingContact.id,
        }))
      );
    }

    setEditingContact(updatedContact);
    setHasUnsavedChanges(true);

    // Clear validation error for this field if it exists
    if (validationErrors[key]) {
      setValidationErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[key];
        return newErrors;
      });
    }
  };

  const handleSaveContact = async () => {
    if (!editingContact) return;

    // Validate the contact before saving
    const errors = validateContact(editingContact);

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      toast.error("Please fill in all required fields correctly");
      return;
    }

    try {
      // Prepare the data to send to API (only specified fields)
      const contactData = {
        email_address: editingContact.email_address,
        first_name: editingContact.first_name,
        is_primary: editingContact.is_primary, // Use the actual value from the contact
        job_title: editingContact.job_title,
        last_name: editingContact.last_name,
        telephone1: editingContact.telephone1,
        telephone2: editingContact.telephone2,
        title: "MR", // Default title as specified
      };

      // Save the contact to the API
      if (editingContact.id && !editingContact.id.startsWith("temp-")) {
        // Update existing contact - PATCH request
        const response = await patchMethod(
          contactData,
          `/api/v1/auth/web/core/contact/${editingContact.id}/`
        );

        if (response.success) {
          // Update local state
          const updatedContacts = contacts.map((contact) =>
            contact.id === editingContact.id ? editingContact : contact
          );

          setContacts(updatedContacts);
          setEditingContactId(null);
          setEditingContact(null);
          setValidationErrors({});
          // Don't reset hasUnsavedChanges here as we still need global save

          toast.success("Contact updated successfully!");
        } else {
          // Handle specific error cases
          if (
            response.errors &&
            typeof response.errors === "object" &&
            "authError" in response.errors
          ) {
            toast.error("Authentication failed. Please log in again.");
          } else {
            throw new Error(response.message || "Failed to update contact");
          }
        }
      } else {
        // Create new contact - POST request (include company field)
        const postData = {
          ...contactData,
          company: companyId, // Add company ID for new contacts
        };

        const response = await postMethod(
          postData,
          "/api/v1/auth/web/core/contact/"
        );

        if (response.success) {
          // Update local state with the real ID from the response
          const newContactWithRealId = {
            ...editingContact,
            id: (response.data as { id: string })?.id || editingContact.id, // Use the real ID from the response
          };

          // Remove the old contact with temporary ID and add the new one at the beginning
          const updatedContacts = [
            newContactWithRealId,
            ...contacts.filter((contact) => contact.id !== editingContact.id),
          ];

          setContacts(updatedContacts);
          setEditingContactId(null);
          setEditingContact(null);
          setValidationErrors({});
          // Don't reset hasUnsavedChanges here as we still need global save

          toast.success("Contact created successfully!");
        } else {
          // Handle specific error cases
          if (
            response.errors &&
            typeof response.errors === "object" &&
            "authError" in response.errors
          ) {
            toast.error("Authentication failed. Please log in again.");
          } else {
            throw new Error(response.message || "Failed to create contact");
          }
        }
      }
    } catch (error) {
      console.error("Error saving contact:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "An error occurred while saving";
      toast.error(errorMessage);
    }
  };

  const handleCancelEdit = () => {
    // If we're editing a new contact (temporary ID), remove it from the list
    if (
      editingContact &&
      editingContact.id &&
      editingContact.id.startsWith("temp-")
    ) {
      setContacts(
        contacts.filter((contact) => contact.id !== editingContact.id)
      );
    }

    setEditingContactId(null);
    setEditingContact(null);
    setValidationErrors({});

    // Reset contacts to original state if there were unsaved changes
    if (hasUnsavedChanges) {
      setContacts(contactDetails);
      setHasUnsavedChanges(false);
    }
  };

  const handleGlobalSave = async () => {
    // Validate all contacts before saving
    let hasErrors = false;
    const allErrors: { [key: string]: string } = {};

    contacts.forEach((contact, index) => {
      const errors = validateContact(contact);
      if (Object.keys(errors).length > 0) {
        hasErrors = true;
        Object.keys(errors).forEach((key) => {
          allErrors[`${index}_${key}`] = errors[key];
        });
      }
    });

    if (hasErrors) {
      setValidationErrors(allErrors);
      toast.error("Please fix validation errors before saving");
      return;
    }

    if (onContactUpdate) {
      setIsSaving(true);

      try {
        // Process each contact based on whether it has an ID
        for (const contact of contacts) {
          // Prepare the data to send to API (only specified fields)
          const contactData = {
            email_address: contact.email_address,
            first_name: contact.first_name,
            is_primary: contact.is_primary, // Use the actual value from the contact
            job_title: contact.job_title,
            last_name: contact.last_name,
            telephone1: contact.telephone1,
            telephone2: contact.telephone2,
            title: "MR", // Default title as specified
          };

          if (contact.id && !contact.id.startsWith("temp-")) {
            // Update existing contact - PATCH request
            const response = await patchMethod(
              contactData,
              `/api/v1/auth/web/core/contact/${contact.id}/`
            );

            if (!response.success) {
              // Handle specific error cases
              if (
                response.errors &&
                typeof response.errors === "object" &&
                "authError" in response.errors
              ) {
                toast.error("Authentication failed. Please log in again.");
                return;
              } else {
                throw new Error(response.message || "Failed to update contact");
              }
            }
          } else {
            // Create new contact - POST request (include company field)
            const postData = {
              ...contactData,
              company: companyId, // Add company ID for new contacts
            };

            const response = await postMethod(
              postData,
              "/api/v1/auth/web/core/contact/"
            );

            if (!response.success) {
              // Handle specific error cases
              if (
                response.errors &&
                typeof response.errors === "object" &&
                "authError" in response.errors
              ) {
                toast.error("Authentication failed. Please log in again.");
                return;
              } else {
                throw new Error(response.message || "Failed to create contact");
              }
            }
          }
        }

        // If all API calls succeed, update the parent component
        onContactUpdate(contacts);
        setHasUnsavedChanges(false);
        setValidationErrors({});
        toast.success("Contact details saved successfully!");
      } catch (error) {
        console.error("Error saving contacts:", error);
        const errorMessage =
          error instanceof Error
            ? error.message
            : "An error occurred while saving";
        toast.error(errorMessage);
      } finally {
        setIsSaving(false);
      }
    }
  };

  const renderContactCard = (contact: ContactDetails, index: number) => {
    const isEditing = editingContactId === contact.id;
    const currentContact = isEditing ? editingContact! : contact;

    const fields: InfoField[] = [
      {
        label: "Job Title",
        value: currentContact.job_title,
        type: "input",
        key: "job_title",
        required: true,
        inputType: "text",
        error:
          validationErrors[`${index}_job_title`] || validationErrors.job_title,
      },
      {
        label: "First Name",
        value: currentContact.first_name,
        type: "input",
        key: "first_name",
        required: true,
        inputType: "text",
        error:
          validationErrors[`${index}_first_name`] ||
          validationErrors.first_name,
      },
      {
        label: "Last Name",
        value: currentContact.last_name,
        type: "input",
        key: "last_name",
        required: true,
        inputType: "text",
        error:
          validationErrors[`${index}_last_name`] || validationErrors.last_name,
      },
      {
        label: "Email Address",
        value: currentContact.email_address,
        type: "input",
        key: "email_address",
        required: true,
        inputType: "email",
        error:
          validationErrors[`${index}_email_address`] ||
          validationErrors.email_address,
      },
      {
        label: "Phone No.",
        value: currentContact.telephone1,
        type: "input",
        key: "telephone1",
        required: true,
        inputType: "number",
        error:
          validationErrors[`${index}_telephone1`] ||
          validationErrors.telephone1,
      },
      {
        label: "Phone No. (optional)",
        value: currentContact.telephone2 || "",
        type: "input",
        key: "telephone2",
        required: false,
        inputType: "number",
      },
    ];

    const actions = (
      <>
        <div className="flex gap-2 items-center">
          {isEditing ? (
            <button
              onClick={handleSaveContact}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
            >
              Save
            </button>
          ) : (
            <button
              onClick={() => handleEditContact(contact)}
              className="bg-[#2DB9EB] text-white px-4 py-2 rounded hover:bg-blue-500 cursor-pointer"
            >
              Edit Contact
            </button>
          )}
          <button
            onClick={() => handleDeleteContact(contact.id)}
            className="bg-red-500 text-white w-10 h-10 rounded-[15%] hover:bg-red-600 flex items-center justify-center cursor-pointer"
          >
            <Trash2 />
          </button>
        </div>
      </>
    );

    return (
      <div key={contact.id || `temp-${index}`} className="relative">
        <div className="absolute  w-8 h-8 bg-[#2DB9EB] text-white rounded-full flex items-center justify-center text-sm font-semibold z-10">
          {index + 1}
        </div>
        <DynamicInfoCard
          title=""
          fields={fields}
          actions={actions}
          isEditing={isEditing}
          onFieldChange={handleFieldChange}
          onSave={handleSaveContact}
          onCancel={handleCancelEdit}
        />
      </div>
    );
  };

  return (
    <>
      <Card>
        <CardContent className="p-4 lg:p-6">
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-lg text-[#363636] font-semibold">
                Contact Details
              </h2>
              <div className="flex gap-2">
                <button
                  onClick={handleAddContact}
                  className="bg-[#2DB9EB] text-white px-4 py-2 rounded hover:bg-blue-500"
                >
                  + Add Contact
                </button>
                {hasUnsavedChanges && (
                  <button
                    onClick={handleGlobalSave}
                    disabled={isSaving}
                    className={` cursor-pointer px-4 py-2 rounded text-white flex items-center gap-2 ${
                      isSaving
                        ? "bg-gray-400 cursor-not-allowed"
                        : "bg-green-600 hover:bg-green-700"
                    } hidden`}
                  >
                    {isSaving ? (
                      <>
                        <div className=" w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Saving...
                      </>
                    ) : (
                      "Save Contact Details"
                    )}
                  </button>
                )}
              </div>
            </div>

            {contacts.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No contacts added yet. Click &quot;Add Contact&quot; to get
                started.
              </div>
            ) : (
              <div className="space-y-6">
                {contacts.map((contact, index) =>
                  renderContactCard(contact, index)
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={deleteModalOpen}
        onClose={handleCancelDelete}
        onConfirm={handleConfirmDelete}
        isDeleting={deleteApi.loading}
        title="Delete Contact"
        itemName={`${contactToDelete?.first_name} ${contactToDelete?.last_name}`}
      />
    </>
  );
};

export default ContactDetailsSection;

"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/ui/modal";
import { Button } from "@/ui/button";
import { Input } from "@/ui/input";
import { toast } from "sonner";
import { createApplicationSite } from "@/composable/createApplicationSite";

interface AddSiteModalProps {
  isOpen: boolean;
  onClose: () => void;
  companyId: string;
  onSiteAdded: () => void | Promise<void>;
}

interface SiteFormState {
  sitename: string;
  total_employee: string;
  postcode: string;
  address_line_1: string;
  address_line_2: string;
  address_line_3: string;
  address_line_4: string;
}

interface SiteFormErrors {
  sitename: string;
  total_employee: string;
  postcode: string;
  address_line_1: string;
}

const INITIAL_FORM: SiteFormState = {
  sitename: "",
  total_employee: "",
  postcode: "",
  address_line_1: "",
  address_line_2: "",
  address_line_3: "",
  address_line_4: "",
};

const INITIAL_ERRORS: SiteFormErrors = {
  sitename: "",
  total_employee: "",
  postcode: "",
  address_line_1: "",
};

const AddSiteModal: React.FC<AddSiteModalProps> = ({
  isOpen,
  onClose,
  companyId,
  onSiteAdded,
}) => {
  const router = useRouter();
  const [form, setForm] = useState<SiteFormState>(INITIAL_FORM);
  const [fieldErrors, setFieldErrors] = useState<SiteFormErrors>(INITIAL_ERRORS);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setForm(INITIAL_FORM);
      setFieldErrors(INITIAL_ERRORS);
      setIsSubmitting(false);
    }
  }, [isOpen]);

  function updateField(field: keyof SiteFormState, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (field in fieldErrors) {
      setFieldErrors((prev) => ({ ...prev, [field]: "" }));
    }
  }

  function validateForm(): boolean {
    const errors: SiteFormErrors = {
      sitename: "",
      total_employee: "",
      postcode: "",
      address_line_1: "",
    };
    let hasErrors = false;

    if (!form.sitename.trim()) {
      errors.sitename = "Site name is required";
      hasErrors = true;
    }

    if (!form.total_employee.trim()) {
      errors.total_employee = "Total employees is required";
      hasErrors = true;
    } else if (!/^\d+$/.test(form.total_employee.trim())) {
      errors.total_employee = "Total employees must be a whole number";
      hasErrors = true;
    }

    if (!form.postcode.trim()) {
      errors.postcode = "Postcode is required";
      hasErrors = true;
    }

    if (!form.address_line_1.trim()) {
      errors.address_line_1 = "Address line 1 is required";
      hasErrors = true;
    }

    setFieldErrors(errors);
    return !hasErrors;
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!validateForm()) return;

    try {
      setIsSubmitting(true);

      const response = await createApplicationSite({
        company_id: companyId,
        sitename: form.sitename.trim(),
        total_employee: parseInt(form.total_employee.trim(), 10),
        postcode: form.postcode.trim(),
        address_line_1: form.address_line_1.trim(),
        address_line_2: form.address_line_2.trim() || undefined,
        address_line_3: form.address_line_3.trim() || undefined,
        address_line_4: form.address_line_4.trim() || undefined,
      });

      if (response.success) {
        toast.success("Site added successfully!");
        await onSiteAdded();
        onClose();
        return;
      }

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

      toast.error(response.message || "Failed to add site");
    } catch (error) {
      console.error("Error creating site:", error);
      toast.error("An error occurred while adding the site");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold text-[#363636]">
            Add Site
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">
              Site Name <span className="text-red-500">*</span>
            </label>
            <Input
              value={form.sitename}
              onChange={(e) => updateField("sitename", e.target.value)}
              placeholder="Enter site name"
              className="border-[#363636]"
            />
            {fieldErrors.sitename ? (
              <p className="text-red-500 text-xs">{fieldErrors.sitename}</p>
            ) : null}
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">
              Total Employees <span className="text-red-500">*</span>
            </label>
            <Input
              type="number"
              min={0}
              value={form.total_employee}
              onChange={(e) => updateField("total_employee", e.target.value)}
              placeholder="Enter total employees"
              className="border-[#363636]"
            />
            {fieldErrors.total_employee ? (
              <p className="text-red-500 text-xs">{fieldErrors.total_employee}</p>
            ) : null}
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">
              Postcode <span className="text-red-500">*</span>
            </label>
            <Input
              value={form.postcode}
              onChange={(e) => updateField("postcode", e.target.value)}
              placeholder="Enter postcode"
              className="border-[#363636]"
            />
            {fieldErrors.postcode ? (
              <p className="text-red-500 text-xs">{fieldErrors.postcode}</p>
            ) : null}
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">
              Address Line 1 <span className="text-red-500">*</span>
            </label>
            <Input
              value={form.address_line_1}
              onChange={(e) => updateField("address_line_1", e.target.value)}
              placeholder="Enter address line 1"
              className="border-[#363636]"
            />
            {fieldErrors.address_line_1 ? (
              <p className="text-red-500 text-xs">{fieldErrors.address_line_1}</p>
            ) : null}
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">
              Address Line 2
            </label>
            <Input
              value={form.address_line_2}
              onChange={(e) => updateField("address_line_2", e.target.value)}
              placeholder="Enter address line 2"
              className="border-[#363636]"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">
              Address Line 3
            </label>
            <Input
              value={form.address_line_3}
              onChange={(e) => updateField("address_line_3", e.target.value)}
              placeholder="Enter address line 3"
              className="border-[#363636]"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">
              Address Line 4
            </label>
            <Input
              value={form.address_line_4}
              onChange={(e) => updateField("address_line_4", e.target.value)}
              placeholder="Enter address line 4"
              className="border-[#363636]"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Adding..." : "Add Site"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddSiteModal;

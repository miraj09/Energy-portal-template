"use client";

import { useEffect, useRef, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/ui/modal";
import EditRole from "@/components/account/EditRole";
import { getRole } from "@/lib/actions/getRole";
import type { RoleRecord } from "@/lib/types/role";

type PermissionSection = {
  name: string;
  permissions: Array<{ id: number; name: string; code: string }>;
};

type EditRoleModalProps = {
  isOpen: boolean;
  onClose: () => void;
  data: RoleRecord;
  permissionsData: PermissionSection[];
};

export default function EditRoleModal({ isOpen, onClose, data, permissionsData }: EditRoleModalProps) {
  const [completeRoleData, setCompleteRoleData] = useState<RoleRecord | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fetchRef = useRef(false);

  useEffect(() => {
    if (isOpen && data?.id && !fetchRef.current) {
      fetchRef.current = true;
      setIsLoading(true);
      setError(null);
      getRole(Number(data.id))
        .then((result) => {
          if (!result.success || !result.data) {
            throw new Error(result.message || "Failed to fetch role data");
          }
          setCompleteRoleData(result.data as RoleRecord);
        })
        .catch((err: Error) => setError(err.message))
        .finally(() => setIsLoading(false));
    } else if (!isOpen) {
      setCompleteRoleData(null);
      setError(null);
      fetchRef.current = false;
    }
  }, [data?.id, isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="account-modal max-h-[90vh] max-w-5xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-[#48505E]">Edit Role - {data.name}</DialogTitle>
        </DialogHeader>

        {isLoading ? <div className="py-6 text-sm text-card-foreground">Loading role data...</div> : null}
        {error ? <div className="py-6 text-sm text-red-600">{error}</div> : null}
        {completeRoleData ? (
          <EditRole
            initialRole={completeRoleData}
            permissionsData={permissionsData}
            onSave={onClose}
            onClose={onClose}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

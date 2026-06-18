"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/ui/modal";
import ViewRole from "@/components/account/ViewRole";
import type { RoleRecord } from "@/lib/types/role";

type ViewRoleModalProps = {
  isOpen: boolean;
  onClose: () => void;
  data: RoleRecord;
};

export default function ViewRoleModal({ isOpen, onClose, data }: ViewRoleModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="account-modal max-h-[90vh] max-w-4xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-[#48505E]">View Role</DialogTitle>
        </DialogHeader>
        <ViewRole role={data} />
      </DialogContent>
    </Dialog>
  );
}

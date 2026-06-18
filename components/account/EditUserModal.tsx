"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/ui/modal";
import EditUser from "@/components/account/EditUser";
import type { UserRecord } from "@/lib/types/user";

type EditUserModalProps = {
  isOpen: boolean;
  onClose: () => void;
  data: UserRecord;
  rolesData: Array<{ id: number; name: string }>;
  onSave: () => void;
};

export default function EditUserModal({ isOpen, onClose, data, rolesData, onSave }: EditUserModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="account-modal max-w-3xl">
        <DialogHeader>
          <DialogTitle className="text-[#48505E]">Edit User</DialogTitle>
        </DialogHeader>
        <EditUser user={data} rolesData={rolesData} onSave={onSave} onClose={onClose} />
      </DialogContent>
    </Dialog>
  );
}

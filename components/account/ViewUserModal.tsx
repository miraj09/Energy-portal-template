"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/ui/modal";
import type { UserRecord } from "@/lib/types/user";

type ViewUserModalProps = {
  isOpen: boolean;
  onClose: () => void;
  data: UserRecord;
};

export default function ViewUserModal({ isOpen, onClose, data }: ViewUserModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="account-modal max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-[#48505E]">User Details</DialogTitle>
        </DialogHeader>
        <div className="space-y-2 text-sm text-card-foreground">
          <p><span className="font-medium">Name:</span> {data.name}</p>
          <p><span className="font-medium">Email:</span> {data.email}</p>
          <p><span className="font-medium">Phone:</span> {data.phone || "N/A"}</p>
          <p><span className="font-medium">Status:</span> {data.is_active ? "Active" : "Inactive"}</p>
          <p>
            <span className="font-medium">Roles:</span>{" "}
            {(data.role_details || []).map((role) => role.name).join(", ") || "No role assigned"}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

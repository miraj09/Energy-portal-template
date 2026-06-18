"use client";
import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/ui/modal";
import { Button } from "@/ui/button";
import { Input } from "@/ui/input";

interface CreateFolderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateFolder: (folderName: string) => void;
  isCreating?: boolean;
}

const CreateFolderModal: React.FC<CreateFolderModalProps> = ({
  isOpen,
  onClose,
  onCreateFolder,
  isCreating = false,
}) => {
  const [folderName, setFolderName] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (folderName.trim()) {
      onCreateFolder(folderName.trim());
      setFolderName("");
      onClose();
    }
  };

  const handleClose = () => {
    if (!isCreating) {
      setFolderName("");
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md bg-white">
        <DialogHeader className="text-left">
          <DialogTitle className="text-lg font-semibold text-gray-800">
            Folder Name
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Input
              type="text"
              placeholder="Type Folder Name"
              value={folderName}
              onChange={(e) => setFolderName(e.target.value)}
              className="w-full h-12 text-base bg-[#F5F5F5] border-[#737373] focus:border-[#5A5A5A] focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none focus-visible:border-[#5A5A5A]"
              autoFocus
              disabled={isCreating}
            />
          </div>
          
          <DialogFooter className="flex justify-end">
            <Button
              type="submit"
              className="bg-cyan-600 hover:bg-cyan-700 text-white px-6 py-2 rounded-md font-medium"
              disabled={!folderName.trim() || isCreating}
            >
              {isCreating ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Creating...
                </div>
              ) : (
                "Create Folder"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateFolderModal;

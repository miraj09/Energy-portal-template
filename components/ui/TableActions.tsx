"use client";

import { useState } from "react";
import { MoreHorizontal, Eye, Pencil, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/ui/dropdown-menu";
import { Button } from "@/ui/button";
import DeleteConfirmDialog from "@/components/ui/DeleteConfirmDialog";
import useAllowedActions from "@/hooks/useAllowedActions";

type ViewAction<T> = {
  ViewComponent: React.ComponentType<{ isOpen: boolean; onClose: () => void; data: T }>;
  title?: string;
};

type EditAction<T> = {
  FormComponent: React.ComponentType<{ isOpen: boolean; onClose: () => void; data: T }>;
  title?: string;
};

type DeleteAction<T> = {
  onDelete: (item: T) => void | Promise<void>;
  title?: string;
  description?: string;
};

type TableActionsProps<T> = {
  item: T;
  module?: string;
  actions: {
    view?: ViewAction<T>;
    edit?: EditAction<T>;
    delete?: DeleteAction<T>;
  };
};

export default function TableActions<T>({ item, actions, module }: TableActionsProps<T>) {
  const [activeModal, setActiveModal] = useState<"view" | "edit" | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const getAllowedActions = useAllowedActions(module);
  const visibleActions = getAllowedActions(["view", "edit", "delete"]);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="text-gray-700 hover:bg-gray-100 hover:text-gray-900">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-[8rem]">
          {actions.view && visibleActions.includes("view") ? (
            <DropdownMenuItem onClick={() => setActiveModal("view")}>
              <Eye className="h-4 w-4" />
              View
            </DropdownMenuItem>
          ) : null}
          {actions.edit && visibleActions.includes("edit") ? (
            <DropdownMenuItem onClick={() => setActiveModal("edit")}>
              <Pencil className="h-4 w-4" />
              Edit
            </DropdownMenuItem>
          ) : null}
          {actions.delete && visibleActions.includes("delete") ? (
            <DropdownMenuItem
              className="text-red-600 data-[highlighted]:bg-red-50 data-[highlighted]:text-red-700"
              onClick={() => setShowDeleteDialog(true)}
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </DropdownMenuItem>
          ) : null}
        </DropdownMenuContent>
      </DropdownMenu>

      {actions.view && activeModal === "view" ? (
        <actions.view.ViewComponent isOpen={true} onClose={() => setActiveModal(null)} data={item} />
      ) : null}

      {actions.edit && activeModal === "edit" ? (
        <actions.edit.FormComponent isOpen={true} onClose={() => setActiveModal(null)} data={item} />
      ) : null}

      {actions.delete ? (
        <DeleteConfirmDialog
          open={showDeleteDialog}
          onOpenChange={setShowDeleteDialog}
          title={actions.delete.title || "Delete item"}
          description={actions.delete.description || "Are you sure you want to delete this item?"}
          onConfirm={async () => {
            await actions.delete?.onDelete(item);
          }}
        />
      ) : null}
    </>
  );
}

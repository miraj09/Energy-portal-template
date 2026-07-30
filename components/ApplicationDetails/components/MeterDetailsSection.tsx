import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/ui/table";
import { Button } from "@/ui/button";
import { MeterDetail } from "../types";
import { toast } from "sonner";
import { useApiCall } from "@/composable";
import { deleteApplicationMeter } from "@/composable/deleteApplicationMeter";
import { DeleteConfirmationModal } from "@/ui";

interface MeterDetailsSectionProps {
  meterDetails: MeterDetail[];
  onViewContract: (meter: MeterDetail) => void | Promise<void>;
  onMeterUpdate?: (updatedMeters: MeterDetail[]) => void;
  onMeterDeleted?: () => void | Promise<void>;
  onEditMeter?: (meter: MeterDetail) => void;
  onAddMeter?: () => void;
  hideAction?: boolean;
  viewingMeterId?: number | null;
}

const MeterDetailsSection: React.FC<MeterDetailsSectionProps> = ({
  meterDetails,
  onViewContract,
  onMeterUpdate,
  onMeterDeleted,
  onEditMeter,
  onAddMeter,
  hideAction = false,
  viewingMeterId = null,
}) => {
  const router = useRouter();
  // Local state for meters
  const [meters, setMeters] = useState<MeterDetail[]>(meterDetails);

  // Delete modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [meterToDelete, setMeterToDelete] = useState<MeterDetail | null>(null);

  // Un-sell modal state
  const [unSellModalOpen, setUnSellModalOpen] = useState(false);
  const [meterToUnSell, setMeterToUnSell] = useState<MeterDetail | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Sync local state with prop changes
  useEffect(() => {
    setMeters(meterDetails);
  }, [meterDetails]);

  const apiCall = useApiCall();

  const handleDeleteMeter = (meter: MeterDetail) => {
    setMeterToDelete(meter);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!meterToDelete) return;

    try {
      setIsDeleting(true);

      const response = await deleteApplicationMeter(meterToDelete.id);

      if (response.success) {
        toast.success("Meter deleted successfully!");
        setDeleteModalOpen(false);
        setMeterToDelete(null);

        if (onMeterDeleted) {
          await onMeterDeleted();
          return;
        }

        const updatedMeters = meters.filter(
          (meter) => meter.id !== meterToDelete.id
        );
        setMeters(updatedMeters);
        onMeterUpdate?.(updatedMeters);
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

      toast.error(response.message || "Failed to delete meter");
    } catch (error) {
      console.error("Error deleting meter:", error);
      toast.error("Failed to delete meter. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCancelDelete = () => {
    setDeleteModalOpen(false);
    setMeterToDelete(null);
  };

  const handleUnSellMeter = (meter: MeterDetail) => {
    setMeterToUnSell(meter);
    setUnSellModalOpen(true);
  };

  const handleConfirmUnSell = async () => {
    if (!meterToUnSell) return;

    try {
      // Call the PATCH API to update the meter's sold status
      const response = await apiCall.executePatch(
        `/api/v1/auth/web/core/meter/${meterToUnSell.id}/`,
        { latest_issold: false }
      );

      if (response.success) {
        // Update local state to set sold status to false
        const updatedMeters = meters.map((m) =>
          m.id === meterToUnSell.id
            ? {
                ...m,
                quoteDetails: {
                  ...m.quoteDetails,
                  sold: false,
                },
              }
            : m
        );

        // Update local state
        setMeters(updatedMeters);

        // Update parent component if callback is provided
        if (onMeterUpdate) {
          onMeterUpdate(updatedMeters);
        }

        // Close the modal
        setUnSellModalOpen(false);
        setMeterToUnSell(null);

        toast.success("Meter un-sold successfully!");
      } else {
        // Handle specific error cases
        if (
          response.errors &&
          typeof response.errors === "object" &&
          "authError" in response.errors
        ) {
          toast.error("Authentication failed. Please log in again.");
        } else {
          throw new Error(response.message || "Failed to un-sell meter");
        }
      }
    } catch (error) {
      console.error("Error un-selling meter:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "An error occurred while un-selling meter";
      toast.error(errorMessage);
    }
  };

  const handleCancelUnSell = () => {
    setUnSellModalOpen(false);
    setMeterToUnSell(null);
  };

  return (
    <>
      <Card>
        <CardContent className="p-4 lg:p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg text-[#363636] font-semibold">
              Meter Details
            </h2>
            {!hideAction && onAddMeter && (
              <button
                type="button"
                onClick={onAddMeter}
                className="bg-[#2DB9EB] text-white px-4 py-2 rounded hover:bg-blue-500 text-sm font-medium"
              >
                + Add Meter
              </button>
            )}
          </div>
          <div className="rounded-lg border border-gray-200 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-[#D9D9D9]">
                  <TableHead className="text-black font-medium py-6 px-4">
                    Type
                  </TableHead>
                  <TableHead className="text-black font-medium py-6 px-4">
                    Site Name
                  </TableHead>
                  <TableHead className="text-black font-medium py-6 px-4">
                    Reference
                  </TableHead>
                  <TableHead className="text-black font-medium py-6 px-4">
                    Quote Details
                  </TableHead>
                  {!hideAction && (
                    <TableHead className="text-black font-medium py-6 px-4">
                      Action
                    </TableHead>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {meters.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={hideAction ? 4 : 5}
                      className="py-12 text-center text-gray-500"
                    >
                      No meters available for this site.
                    </TableCell>
                  </TableRow>
                ) : (
                  meters.map((meter) => (
                    <TableRow
                      key={meter.id}
                      className="border-b border-gray-200 hover:bg-gray-50"
                      style={{ height: "80px" }}
                    >
                      <TableCell className="py-6 px-4 align-middle">
                        {meter.type}
                      </TableCell>
                      <TableCell className="py-6 px-4 align-middle">
                        {meter.siteName}
                      </TableCell>
                      <TableCell className="py-6 px-4 align-middle">
                        {meter.type.toLowerCase() === "gas" ? (
                          <span className="text-sm">{meter.referenceString}</span>
                        ) : (
                          <div className="flex items-center">
                            <div className="w-[40px] h-[40px] flex items-center justify-center bg-white border border-[#363636] border-r-0">
                              <span className="font-medium text-[#363636] text-lg">
                                {meter.reference.indicator}
                              </span>
                            </div>
                            <div className="flex flex-col">
                              <div className="flex">
                                <div className="w-[70px] h-[20px] bg-white border border-[#363636] border-b-0 border-r-0 flex items-center justify-center">
                                  <span className="text-xs">
                                    {meter.reference.topRow[0]}
                                  </span>
                                </div>
                                <div className="w-[90px] h-[20px] bg-white border border-[#363636] border-b-0 border-r-0 flex items-center justify-center">
                                  <span className="text-xs">
                                    {meter.reference.topRow[1]}
                                  </span>
                                </div>
                                <div className="w-[90px] h-[20px] bg-white border border-[#363636] border-b-0 flex items-center justify-center">
                                  <span className="text-xs">
                                    {meter.reference.topRow[2]}
                                  </span>
                                </div>
                              </div>
                              <div className="flex">
                                <div className="w-[50px] h-[20px] bg-white border border-[#363636] border-r-0 flex items-center justify-center">
                                  <span className="text-xs">
                                    {meter.reference.bottomRow[0]}
                                  </span>
                                </div>
                                <div className="w-[70px] h-[20px] bg-white border border-[#363636] border-r-0 flex items-center justify-center">
                                  <span className="text-xs">
                                    {meter.reference.bottomRow[1]}
                                  </span>
                                </div>
                                <div className="w-[70px] h-[20px] bg-white border border-[#363636] border-r-0 flex items-center justify-center">
                                  <span className="text-xs">
                                    {meter.reference.bottomRow[2]}
                                  </span>
                                </div>
                                <div className="w-[60px] h-[20px] bg-white border border-[#363636] flex items-center justify-center">
                                  <span className="text-xs">
                                    {meter.reference.bottomRow[3]}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="py-6 px-4 align-middle">
                        <div className="space-y-3">
                          <div className="flex items-center justify-start space-x-3">
                            <span className="text-sm w-20">Sold :</span>
                            <span
                              className={`px-3 py-1 rounded text-xs font-medium ${
                                meter.quoteDetails.sold
                                  ? "bg-[#22D086] text-white"
                                  : "bg-[#DC3545] text-white"
                              }`}
                            >
                              {meter.quoteDetails.sold ? "Yes" : "No"}
                            </span>
                          </div>
                          <div className="flex items-center justify-start space-x-3">
                            <span className="text-sm w-20">Submitted :</span>
                            <span
                              className={`px-3 py-1 rounded text-xs font-medium ${
                                meter.quoteDetails.submitted
                                  ? "bg-[#22D086] text-white"
                                  : "bg-[#DC3545] text-white"
                              }`}
                            >
                              {meter.quoteDetails.submitted ? "Yes" : "No"}
                            </span>
                          </div>
                        </div>
                      </TableCell>
                      {!hideAction && (
                        <TableCell className="py-6 px-4 align-middle">
                          <div className="flex flex-col space-y-3">
                            {meter.quoteDetails.sold ? (
                              <>
                                <Button
                                  onClick={() => onViewContract(meter)}
                                  disabled={viewingMeterId === meter.id}
                                  className="bg-primary hover:bg-primary/90 text-primary-foreground px-3 py-1 rounded text-sm w-28 disabled:opacity-50"
                                >
                                  {viewingMeterId === meter.id
                                    ? "Loading..."
                                    : "View"}
                                </Button>
                                <Button
                                  onClick={() => handleUnSellMeter(meter)}
                                  className="bg-[#F5B800] hover:bg-[#E0A500] text-white px-3 py-1 rounded text-sm w-28"
                                >
                                  Un Sell
                                </Button>
                              </>
                            ) : (
                              <>
                                <Button
                                  onClick={() => onEditMeter?.(meter)}
                                  className="bg-[#28A745] hover:bg-[#218838] text-white px-3 py-1 rounded text-sm w-28"
                                >
                                  Edit
                                </Button>
                                <Button
                                  onClick={() => handleDeleteMeter(meter)}
                                  className="bg-[#DC3545] hover:bg-[#C82333] text-white px-3 py-1 rounded text-sm w-28"
                                >
                                  Delete
                                </Button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {!hideAction && (
        <>
          {/* Delete Confirmation Modal */}
          <DeleteConfirmationModal
            isOpen={deleteModalOpen}
            onClose={handleCancelDelete}
            onConfirm={handleConfirmDelete}
            isDeleting={isDeleting}
            title="Delete Meter"
            itemName={`${meterToDelete?.type} - ${meterToDelete?.siteName}`}
          />

          {/* Un-Sell Confirmation Modal */}
          <DeleteConfirmationModal
            isOpen={unSellModalOpen}
            onClose={handleCancelUnSell}
            onConfirm={handleConfirmUnSell}
            isDeleting={apiCall.loading}
            title="Un-Sell Meter"
            itemName={`${meterToUnSell?.type} - ${meterToUnSell?.siteName}`}
            confirmButtonText="Un-Sell"
            confirmButtonLoadingText="Un-Selling..."
          />
        </>
      )}
    </>
  );
};

export default MeterDetailsSection;

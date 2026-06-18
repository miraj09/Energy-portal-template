import { Card, CardContent, CardHeader, CardTitle } from "@/ui/card";
import { Button } from "@/ui/button";
import { ScrollArea, ScrollBar } from "@/ui/scroll-area";
import { useState } from "react";
// import Image from "next/image";
import { Note } from "../types";
import { usePostApiCall } from "@/composable/postApiCall";
import { toast } from "sonner";

interface NotesSectionProps {
  notes: Note[];
  onNoteUpdate: (newNote: Note) => void;
  companyId: string;
}

const NotesSection: React.FC<NotesSectionProps> = ({
  notes,
  onNoteUpdate,
  companyId,
}) => {
  const [showAddNoteInput, setShowAddNoteInput] = useState(false);
  const [newNoteText, setNewNoteText] = useState("");

  const {
    executePost,
    loading: isSubmitting,
    error: submitError,
  } = usePostApiCall({
    onSuccess: () => {
      // Create a new note object with the response data

      // Generate a unique ID for the new note
      // Since the API response has data: null, we'll use timestamp + random number
      const uniqueId = Date.now() + Math.floor(Math.random() * 1000);

      const newNote: Note = {
        id: uniqueId,
        author: "Current User", // You might want to get this from user context
        timestamp: new Date().toLocaleString(),
        content: newNoteText,
      };

      // Call the parent callback to update the notes array
      onNoteUpdate(newNote);

      // Reset form and show success message
      setNewNoteText("");
      setShowAddNoteInput(false);
      toast.success("Note added successfully!");
    },
    onError: (message) => {
      toast.error(`Failed to add note: ${message}`);
    },
    showSuccessMessage: false, // We're handling success manually with toast
    showErrorMessage: false, // We're handling errors manually with toast
  });

  const handleAddNoteClick = () => {
    setShowAddNoteInput(!showAddNoteInput);
    if (showAddNoteInput) {
      setNewNoteText("");
    }
  };

  const handleNoteSubmit = async () => {
    if (!newNoteText.trim()) {
      toast.error("Please enter a note before submitting");
      return;
    }

    if (newNoteText.trim().length < 3) {
      toast.error("Note must be at least 3 characters long");
      return;
    }

    if (newNoteText.trim().length > 1000) {
      toast.error("Note cannot exceed 1000 characters");
      return;
    }

    const payload = {
      detail: newNoteText.trim(),
      company: companyId,
    };

    await executePost("/api/v1/auth/web/core/company-notes/", payload);
  };

  const handleNoteCancel = () => {
    setNewNoteText("");
    setShowAddNoteInput(false);
  };

  return (
    <Card>
      <CardContent className="p-4 lg:p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg text-[#363636] font-medium">Notes</h2>
        </div>

        {notes.length === 0 ? (
          // Show add note input directly when no notes exist
          <div className="space-y-4">
            <label
              htmlFor="add-note"
              className="text-sm text-[#363636] font-['Inter']"
            >
              Add Note
            </label>
            <textarea
              name="add-note"
              className="w-full border border-gray-300 rounded-md p-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              placeholder="Write your note here..."
              value={newNoteText}
              onChange={(e) => setNewNoteText(e.target.value)}
              disabled={isSubmitting}
              maxLength={1000}
            />
            <div className="flex justify-between items-center mt-1">
              {submitError && (
                <div className="text-red-600 text-sm">{submitError}</div>
              )}
              <div
                className={`text-sm ml-auto ${
                  newNoteText.length > 900
                    ? "text-red-500"
                    : newNoteText.length > 800
                    ? "text-yellow-500"
                    : "text-gray-500"
                }`}
              >
                {newNoteText.length}/1000
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                onClick={handleNoteSubmit}
                disabled={isSubmitting}
                className="bg-[#346fb6] text-white px-4 py-2 rounded hover:bg-[#346fb6] disabled:opacity-50"
              >
                {isSubmitting ? "Adding..." : "Add Note"}
              </Button>
            </div>
          </div>
        ) : (
          // Show scrollable notes section when notes exist
          <Card className="w-full shadow-md py-4">
            <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-2 gap-3 sm:gap-0">
              <CardTitle className="text-xl sm:text-2xl font-semibold text-[#363636] font-['Plus_Jakarta_Sans',Helvetica]">
                Notes
                <span className="text-sm text-[#737373] font-['Inter']">
                  (View)
                </span>
              </CardTitle>
              <Button
                onClick={handleAddNoteClick}
                className="bg-[#346fb6] text-white text-sm sm:text-base w-full sm:w-auto"
              >
                {showAddNoteInput ? "Cancel Note" : "Add Note"}
              </Button>
            </CardHeader>
            <ScrollArea className="h-[400px]  w-full custom-scrollbar">
              <div className="px-3 sm:px-5 py-2">
                {notes.map((note) => (
                  <Card
                    key={note.id}
                    className={`mb-3 sm:mb-4 bg-[#F5F5F5] rounded-[10px]`}
                  >
                    <CardContent className="p-0 relative">
                      <div className="p-2 sm:p-2.5">
                        <div className="flex flex-col gap-2 sm:gap-0">
                          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
                            <h3
                              className={`font-semibold text-black break-words ${
                                note.id === 2
                                  ? "text-sm sm:text-lg leading-[18px] sm:leading-[25px]"
                                  : "text-sm sm:text-lg leading-[18px] sm:leading-5"
                              } [font-family:'Inter',Helvetica] hidden`}
                            >
                              {note.author}
                            </h3>
                            <h3
                              className={`font-semibold text-black break-words ${
                                note.id === 2
                                  ? "text-sm sm:text-lg leading-[18px] sm:leading-[25px]"
                                  : "text-sm sm:text-lg leading-[18px] sm:leading-5"
                              } [font-family:'Inter',Helvetica] `}
                            >
                              {note.timestamp}
                            </h3>
                          </div>
                          <div
                            className={`text-xs text-black [font-family:'Inter',Helvetica] mt-2 sm:mt-4 break-words leading-relaxed`}
                          >
                            {note.content}
                          </div>
                          <div className="mt-2 sm:mt-4 relative">
                            {/* <Image
                              width={11}
                              height={1}
                              className="absolute w-[11px] h-px top-[11px] left-0"
                              alt="Line"
                              src="/line-7.svg"
                            /> */}
                            <span className="ml-[8px] text-[12px] font-semibold text-neutral-500 [font-family:'Inter',Helvetica] hidden">
                              {note.timestamp}
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              <ScrollBar orientation="vertical" />
            </ScrollArea>
            {showAddNoteInput && (
              <div className="px-3 sm:px-5 py-2">
                <label
                  htmlFor="add-note"
                  className="text-sm text-[#363636] font-['Inter']"
                >
                  Add Note
                </label>
                <textarea
                  name="add-note"
                  className="w-full border border-gray-300 text-gray-800 rounded-md p-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  placeholder="Write your note here..."
                  value={newNoteText}
                  onChange={(e) => setNewNoteText(e.target.value)}
                  disabled={isSubmitting}
                  maxLength={1000}
                />
                <div className="flex justify-between items-center mt-1">
                  {submitError && (
                    <div className="text-red-600 text-sm">{submitError}</div>
                  )}
                  <div
                    className={`text-sm ml-auto ${
                      newNoteText.length > 900
                        ? "text-red-500"
                        : newNoteText.length > 800
                        ? "text-yellow-500"
                        : "text-gray-500"
                    }`}
                  >
                    {newNoteText.length}/1000
                  </div>
                </div>
                <div className="flex justify-end gap-2 mt-2 mb-4">
                  <Button
                    onClick={handleNoteCancel}
                    className="bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleNoteSubmit}
                    disabled={isSubmitting}
                    className="bg-[#346fb6] text-white px-4 py-2 rounded hover:bg-[#346fb6] disabled:opacity-50"
                  >
                    {isSubmitting ? "Adding..." : "Add Note"}
                  </Button>
                </div>
              </div>
            )}
          </Card>
        )}
      </CardContent>
    </Card>
  );
};

export default NotesSection;

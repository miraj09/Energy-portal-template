"use client";
import React, { JSX, useState } from "react";
import { Dialog, DialogContent } from "@/ui/modal";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/card";
import { ScrollArea, ScrollBar } from "@/ui/scroll-area";
import { Button } from "@/ui/button";
import { CustomSelect, SelectOption } from "@/ui/select";
import { X, Upload, File, Trash2 } from "lucide-react";
import { SingleValue } from "react-select";
// import Image from "next/image";                                                                                                                                                                                                                            3w  11
// import router from "next/router";

interface AttachmentData {
  docType: string;
  docFileName: string;
  attachedOn: string;
  attachedBy: string;
}

interface NoteData {
  id: number;
  author: string;
  timestamp: string;
  content: string | string[];
}

interface NotesAttachmentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  companyName: string;
  subtitle: string;
  attachments: AttachmentData[];
  notes: NoteData[];
}

// Document type options for the dropdown
const documentTypeOptions: SelectOption[] = [
  { value: "all", label: "Select a document type" },
  { value: "contract-verbal", label: "Contract verbal" },
  { value: "contract-written", label: "Contract written" },
  // { value: "docusign-summary", label: "DocuSign - Summary" },
  { value: "other", label: "Other" },
];

export const NotesAttachmentsModal = ({
  isOpen,
  onClose,
  companyName,
  subtitle,
  attachments,
  notes,
}: NotesAttachmentsModalProps): JSX.Element => {
  const [selectedDocType, setSelectedDocType] = useState<SelectOption>(
    documentTypeOptions[0]
  );
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [showAddNoteInput, setShowAddNoteInput] = useState(false);
  const [newNoteText, setNewNoteText] = useState("");

  const handleDocTypeChange = (newValue: SingleValue<SelectOption>) => {
    if (newValue) {
      setSelectedDocType(newValue);
      setSelectedFile(null); // Reset file when doc type changes
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    const file = event.dataTransfer.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleFileSubmit = () => {
    if (selectedFile) {
      // Handle file submission logic here
      console.log("Submitting file:", selectedFile.name);
      setSelectedFile(null);
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
  };

  const handleAddNoteClick = () => {
    setShowAddNoteInput(!showAddNoteInput);
    if (showAddNoteInput) {
      setNewNoteText(""); // Clear the input when hiding
    }
  };

  const handleNoteSubmit = () => {
    if (newNoteText.trim()) {
      // Handle note submission logic here
      console.log("Submitting note:", newNoteText);
      setNewNoteText("");
      setShowAddNoteInput(false);
    }
  };

  const handleNoteCancel = () => {
    setNewNoteText("");
    setShowAddNoteInput(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[90vw] max-h-[90vh] w-full overflow-hidden bg-white p-0">
        <div className="relative flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white sticky top-0 z-10">
            <div className="flex flex-col">
              <h2 className="text-lg font-semibold text-[#363636] font-['Plus_Jakarta_Sans']">
                {companyName}
              </h2>
              <p className="text-sm text-[#737373] font-['Inter']">
                {subtitle}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 transition-colors p-1"
            >
              <X size={20} />
            </button>
          </div>
          <ScrollArea className="max-h-[calc(100vh-120px)]">
            <div className="py-4 px-8 pb-8">
              {/* Document Type Selector */}
              <div className="mb-6">
                <div className="w-64">
                  <CustomSelect
                    className="w-full"
                    value={selectedDocType}
                    onChange={handleDocTypeChange}
                    options={documentTypeOptions}
                    placeholder="Select a document type"
                  />
                </div>
              </div>

              {/* File Upload Section - Only show when a document type is selected */}
              {selectedDocType.value !== "all" && (
                <div className="mb-6 w-3/4">
                  {/* Hidden File Input */}
                  <input
                    type="file"
                    onChange={handleFileChange}
                    className="hidden"
                    id="file-input"
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  />

                  {/* Drag & Drop Area - Also clickable for file browsing */}
                  <label
                    htmlFor="file-input"
                    className="block border-2 border-dashed border-gray-300 rounded-lg p-8 text-center mb-4 bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer"
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                  >
                    <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <p className="text-gray-600 text-sm">
                      Drag & drop files or browse
                    </p>
                  </label>

                  {/* File Input Field */}
                  <div className="flex items-center gap-2 mb-4">
                    <div className="flex items-center gap-2 flex-1 border border-gray-300 rounded px-3 py-2 bg-white">
                      <File className="h-4 w-4 text-red-500" />
                      <span className="text-sm text-gray-700">
                        {selectedFile ? selectedFile.name : "Company Document file"}
                      </span>
                    </div>
                    {selectedFile && (
                      <button
                        onClick={handleRemoveFile}
                        className="text-red-500 hover:text-red-700 transition-colors p-1"
                        title="Remove file"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>

                  {/* Submit Button */}
                  <Button
                    onClick={handleFileSubmit}
                    disabled={!selectedFile}
                    className="bg-[#22D086] text-white px-6 py-2 rounded hover:bg-[#22D086] disabled:bg-gray-300 disabled:text-[#363636] disabled:cursor-not-allowed transition-colors text-right"
                  >
                    File Submit
                  </Button>
                </div>
              )}
              {/* Attachments Section */}
              <div className="mb-8 px-4">
                <h3 className="text-sm font-medium text-[#363636] mb-3 font-['Inter']">
                  Attachments:
                </h3>
                <Card className="border border-gray-200 w-3/4">
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-primary hover:bg-primary">
                          <TableHead className="text-white font-medium text-sm">
                            Doc Type
                          </TableHead>
                          <TableHead className="text-white font-medium text-sm">
                            Doc File Name
                          </TableHead>
                          <TableHead className="text-white font-medium text-sm">
                            Attached On
                          </TableHead>
                          <TableHead className="text-white font-medium text-sm">
                            Attached By
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                    </Table>
                    <ScrollArea className="h-[300px] custom-scrollbar">
                      <Table>
                        <TableBody>
                          {attachments && attachments.length > 0 ? (
                            attachments.map((attachment, idx) => (
                              <TableRow key={idx} className="hover:bg-gray-50">
                                <TableCell className="py-2 px-3 text-sm text-[#363636]">
                                  {attachment.docType}
                                </TableCell>
                                <TableCell className="py-2 px-3 text-sm text-[#363636] max-w-[200px] truncate">
                                  {attachment.docFileName}
                                </TableCell>
                                <TableCell className="py-2 px-3 text-sm text-[#363636]">
                                  {attachment.attachedOn}
                                </TableCell>
                                <TableCell className="py-2 px-3 text-sm text-[#363636]">
                                  {attachment.attachedBy}
                                </TableCell>
                              </TableRow>
                            ))
                          ) : (
                            <TableRow>
                              <TableCell colSpan={4} className="py-6 px-3 text-sm text-[#737373] text-center">
                                No data
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                      <ScrollBar orientation="vertical" />
                    </ScrollArea>
                  </CardContent>
                </Card>
              </div>
              {/* Notes Section */}
              <Card className="w-full shadow-md py-4">
                <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-2 gap-3 sm:gap-0">
                  <CardTitle className="text-xl sm:text-2xl font-semibold text-[#363636] font-['Plus_Jakarta_Sans',Helvetica]">
                    Notes
                    <span className="text-sm text-[#737373] font-['Inter']">
                      (view)
                    </span>
                  </CardTitle>
                  <Button
                    onClick={handleAddNoteClick}
                    className="bg-[#346fb6] text-white text-sm sm:text-base w-full sm:w-auto"
                  >
                    {showAddNoteInput ? "Cancel Add Note" : "Add Note"}
                  </Button>
                </CardHeader>
                <ScrollArea className="h-[400px] sm:h-[513px] w-full custom-scrollbar">
                  <div className="px-3 sm:px-5 py-2">
                    {notes && notes.length > 0 ? (
                      notes.map((note) => (
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
                                    } [font-family:'Inter',Helvetica]`}
                                  >
                                    {note.author}
                                  </h3>
                                  <span className="text-xs sm:text-sm text-neutral-500 [-webkit-text-stroke:1px_#737373] [font-family:'Inter',Helvetica] self-start sm:self-auto whitespace-nowrap">
                                    {note.timestamp}
                                  </span>
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
                                  <span className="ml-[15px] text-[8px] text-neutral-500 [font-family:'Inter',Helvetica]">
                                    {note.timestamp}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    ) : (
                      <div className="w-full py-6 text-center text-sm text-[#737373]">No data</div>
                    )}
                  </div>
                  <ScrollBar orientation="vertical" />
                </ScrollArea>
                {showAddNoteInput && (
                  <div className="px-3 sm:px-5 py-2">
                    <label htmlFor="add-note" className="text-sm text-[#363636] font-['Inter']">Add Note</label>
                    <textarea
                      name="add-note"
                      className="w-full border border-gray-300 rounded-md p-2 text-sm"
                      placeholder="Write your note here..."
                      value={newNoteText}
                      onChange={(e) => setNewNoteText(e.target.value)}
                    />
                    <div className="flex justify-end gap-2 mt-2 mb-402">
                      <Button
                        onClick={handleNoteCancel}
                        className="bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400"
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleNoteSubmit}
                        className="bg-[#346fb6] text-white px-4 py-2 rounded hover:bg-[#346fb6]"
                      >
                        Add Note
                      </Button>
                    </div>
                  </div>
                )}
              </Card>
            </div>
            <ScrollBar orientation="vertical" />
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
};

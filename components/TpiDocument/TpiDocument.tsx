"use client";
import React, { useState, useEffect } from "react";
import { Button } from "@/ui/button";
import { Card } from "@/ui/card";
import Image from "next/image";
import CreateFolderModal from "./CreateFolderModal";
import FileUploadModal from "./FileUploadModal";
import { getTpiFolders, TpiFolder } from "@/lib/actions/getTpiFolders";
import { createTpiFolder } from "@/lib/actions/createTpiFolder";
import { getTpiFolderDetails } from "@/lib/actions/getTpiFolderDetails";
import {
  getTpiFolderChildren,
  type TpiDocument,
} from "@/lib/actions/getTpiFolderChildren";
import { getTpiDocuments } from "@/lib/actions/getTpiDocuments";
import { uploadTpiDocumentAction } from "@/lib/actions/uploadTpiDocument";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface TpiDocumentProps {
  folderPath?: string[];
}

const TpiDocument: React.FC<TpiDocumentProps> = ({ folderPath = [] }) => {
  const router = useRouter();
  const [isCreateFolderModalOpen, setIsCreateFolderModalOpen] = useState(false);
  const [isFileUploadModalOpen, setIsFileUploadModalOpen] = useState(false);
  const [folders, setFolders] = useState<TpiFolder[]>([]);
  const [documents, setDocuments] = useState<TpiDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [navigating, setNavigating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [creatingFolder, setCreatingFolder] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [breadcrumbFolders, setBreadcrumbFolders] = useState<TpiFolder[]>([]);

  // Fetch folders on component mount or when folderPath changes
  useEffect(() => {
    const fetchContent = async () => {
      try {
        setLoading(true);
        setNavigating(false);
        setError(null);

        if (folderPath.length === 0) {
          // Root level - fetch all folders and documents
          const [foldersResponse, documentsResponse] = await Promise.all([
            getTpiFolders(),
            getTpiDocuments(), // default endpoint for root level documents
          ]);

          if (foldersResponse.success && foldersResponse.data) {
            const allFolders = Array.isArray(foldersResponse.data)
              ? foldersResponse.data
              : (foldersResponse.data as { results: TpiFolder[] }).results ||
                [];

            // Filter for root folders (parent === null)
            const rootFolders = allFolders.filter(
              (folder) => folder.parent === null
            );
            setFolders(rootFolders);
          } else {
            handleApiError(foldersResponse);
          }

          if (documentsResponse.success && documentsResponse.data) {
            const allDocuments = Array.isArray(documentsResponse.data)
              ? documentsResponse.data
              : (documentsResponse.data as { results: TpiDocument[] })
                  .results || [];
            
            // Filter for root level documents (folder === null)
            const rootDocuments = allDocuments.filter(
              (document) => document.folder === null
            );
            setDocuments(rootDocuments);
          } else {
            handleApiError(documentsResponse);
          }
        } else {
          // Inside a folder - fetch children
          const currentFolderId = parseInt(folderPath[folderPath.length - 1]);
          const response = await getTpiFolderChildren(currentFolderId);

          if (response.success && response.data) {
            setFolders(response.data.folders || []);
            setDocuments(response.data.documents || []);
          } else {
            handleApiError(response);
          }
        }
      } catch (err) {
        setError("An error occurred while fetching content");
        console.error("Error fetching content:", err);
      } finally {
        setLoading(false);
      }
    };

    const handleApiError = (response: {
      errors?: unknown;
      message?: string;
    }) => {
      console.log("API Response Error:", response);

      // Check if it's an authentication error
      if (
        response.errors &&
        typeof response.errors === "object" &&
        "authError" in response.errors
      ) {
        console.log("Authentication error detected, redirecting to login");
        // Token expired or invalid, show toast and redirect to login
        toast.error("Token expired. Authentication required.");

        // Wait for 500ms before redirecting
        setTimeout(() => {
          window.location.href = "/login";
        }, 500);
        return;
      }

      setError(response.message || "Failed to fetch content");
    };

    fetchContent();
  }, [router, folderPath]);

  // Fetch breadcrumb folder details when folderPath changes
  useEffect(() => {
    const fetchBreadcrumbFolders = async () => {
      if (folderPath.length === 0) {
        setBreadcrumbFolders([]);
        return;
      }

      try {
        const folderDetails = await Promise.all(
          folderPath.map((id) => getTpiFolderDetails(`/api/v1/auth/web/utility/tpi-folders/${id}/`))
        );

        const validFolders = folderDetails
          .filter((response) => response.success && response.data)
          .map((response) => response.data as TpiFolder);

        setBreadcrumbFolders(validFolders);
      } catch (error) {
        console.error("Error fetching breadcrumb folders:", error);
        setBreadcrumbFolders([]);
      }
    };

    fetchBreadcrumbFolders();
  }, [folderPath]);

  const handleNewFolder = () => {
    setIsCreateFolderModalOpen(true);
  };

  const handleFolderClick = (folder: TpiFolder) => {
    // Show loading state
    setNavigating(true);
    // Navigate to the folder
    const newPath = [...folderPath, folder.id.toString()];
    const pathString = newPath.join("/");
    router.push(`/tpi-document/${pathString}`);
  };

  const handleBreadcrumbClick = (index: number) => {
    // Show loading state
    setNavigating(true);
    // Navigate to the breadcrumb folder
    const newPath = folderPath.slice(0, index + 1);
    const pathString = newPath.length > 0 ? newPath.join("/") : "";
    router.push(pathString ? `/tpi-document/${pathString}` : "/tpi-document");
  };

  const handleBackToParent = () => {
    if (folderPath.length > 0) {
      // Show loading state
      setNavigating(true);
      const newPath = folderPath.slice(0, -1);
      const pathString = newPath.length > 0 ? newPath.join("/") : "";
      router.push(pathString ? `/tpi-document/${pathString}` : "/tpi-document");
    }
  };

  const getFileIcon = (document: TpiDocument) => {
    const extension = document.extension.toLowerCase();
    const contentType = document.content_type.toLowerCase();

    if (contentType.includes("image")) {
      return (
        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
          <svg
            className="w-6 h-6 text-blue-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
        </div>
      );
    }

    if (extension === "pdf") {
      return (
        <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
          <Image
            src="/icons/pdf.svg"
            alt="PDF Icon"
            width={24}
            height={24}
            className="w-6 h-6"
          />
        </div>
      );
    }

    if (["doc", "docx"].includes(extension)) {
      return (
        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
          <svg
            className="w-6 h-6 text-blue-600"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
          </svg>
        </div>
      );
    }

    if (["xls", "xlsx"].includes(extension)) {
      return (
        <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
          <svg
            className="w-6 h-6 text-green-600"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
          </svg>
        </div>
      );
    }

    // Default file icon
    return (
      <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
        <svg
          className="w-6 h-6 text-gray-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
      </div>
    );
  };

  const handleFileUpload = () => {
    setIsFileUploadModalOpen(true);
  };

  const handleUploadFile = async (file: File, name: string) => {
    try {
      setUploadingFile(true);
      console.log("Uploading file:", name);

      const folderId =
        folderPath.length > 0
          ? parseInt(folderPath[folderPath.length - 1])
          : null;

      const response = await uploadTpiDocumentAction(file, name, folderId);

      if (response.success) {
        toast.success("File uploaded successfully!");
        // Refresh the content to show the new file
        await refreshContent();
      } else {
        // Check if it's an authentication error
        if (
          response.errors &&
          typeof response.errors === "object" &&
          "authError" in response.errors
        ) {
          toast.error("Token expired. Authentication required.");
          await new Promise((resolve) => setTimeout(resolve, 500));
          window.location.href = "/login";
          return;
        }

        toast.error(response.message || "Failed to upload file");
      }
    } catch (err) {
      console.error("Error uploading file:", err);
      toast.error("An error occurred while uploading the file");
    } finally {
      setUploadingFile(false);
    }
  };

  const handleCreateFolder = async (folderName: string) => {
    try {
      setCreatingFolder(true);
      console.log("Creating folder:", folderName);

      const parentId =
        folderPath.length > 0
          ? parseInt(folderPath[folderPath.length - 1])
          : null;
      const response = await createTpiFolder({
        name: folderName,
        parent: parentId,
      });

      if (response.success) {
        toast.success("Folder created successfully!");
        // Refresh the content to show the new folder
        await refreshContent();
      } else {
        // Check if it's an authentication error
        if (
          response.errors &&
          typeof response.errors === "object" &&
          "authError" in response.errors
        ) {
          toast.error("Token expired. Authentication required.");
          await new Promise((resolve) => setTimeout(resolve, 500));
          window.location.href = "/login";
          return;
        }

        toast.error(response.message || "Failed to create folder");
      }
    } catch (err) {
      console.error("Error creating folder:", err);
      toast.error("An error occurred while creating the folder");
    } finally {
      setCreatingFolder(false);
    }
  };

  const refreshContent = async () => {
    try {
      setLoading(true);
      setError(null);

      if (folderPath.length === 0) {
        // Root level - fetch all folders and documents
        const [foldersResponse, documentsResponse] = await Promise.all([
          getTpiFolders(),
          getTpiDocuments(), // default endpoint for root level documents
        ]);

        if (foldersResponse.success && foldersResponse.data) {
          const allFolders = Array.isArray(foldersResponse.data)
            ? foldersResponse.data
            : (foldersResponse.data as { results: TpiFolder[] }).results || [];

          // Filter for root folders (parent === null)
          const rootFolders = allFolders.filter(
            (folder) => folder.parent === null
          );
          setFolders(rootFolders);
        } else {
          handleApiError(foldersResponse);
        }

        if (documentsResponse.success && documentsResponse.data) {
          const allDocuments = Array.isArray(documentsResponse.data)
            ? documentsResponse.data
            : (documentsResponse.data as { results: TpiDocument[] }).results ||
              [];
          
          // Filter for root level documents (folder === null)
          const rootDocuments = allDocuments.filter(
            (document) => document.folder === null
          );
          setDocuments(rootDocuments);
        } else {
          handleApiError(documentsResponse);
        }
      } else {
        // Inside a folder - fetch children
        const currentFolderId = parseInt(folderPath[folderPath.length - 1]);
        const response = await getTpiFolderChildren(currentFolderId);

        if (response.success && response.data) {
          setFolders(response.data.folders || []);
          setDocuments(response.data.documents || []);
        } else {
          handleApiError(response);
        }
      }
    } catch (err) {
      setError("An error occurred while fetching content");
      console.error("Error fetching content:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleApiError = (response: { errors?: unknown; message?: string }) => {
    console.log("API Response Error:", response);

    // Check if it's an authentication error
    if (
      response.errors &&
      typeof response.errors === "object" &&
      "authError" in response.errors
    ) {
      console.log("Authentication error detected, redirecting to login");
      // Token expired or invalid, show toast and redirect to login
      toast.error("Token expired. Authentication required.");

      // Wait for 500ms before redirecting
      setTimeout(() => {
        window.location.href = "/login";
      }, 500);
      return;
    }

    setError(response.message || "Failed to fetch content");
  };

  return (
    <div className="flex-1 flex flex-col gap-4 sm:gap-6 px-3 sm:px-4 lg:px-6">
      <div className="bg-white rounded-lg shadow-sm p-6">
        {/* Header Section */}
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-4">
            {folderPath.length > 0 && (
              <Button
                onClick={handleBackToParent}
                variant="outline"
                className="flex items-center gap-2 text-[#222222]"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
                Back
              </Button>
            )}
            <h1 className="text-2xl font-bold text-gray-800">TPI Document</h1>
          </div>
        </div>

        {/* Breadcrumb Navigation */}
        {folderPath.length > 0 && (
          <div className="mb-6">
            <nav className="flex items-center space-x-2 text-sm">
              <button
                onClick={() => router.push("/tpi-document")}
                className="text-blue-600 hover:text-blue-800 hover:underline"
              >
                TPI Document
              </button>
              {breadcrumbFolders.map((folder, index) => (
                <React.Fragment key={folder.id}>
                  <span className="text-gray-400">/</span>
                  <button
                    onClick={() => handleBreadcrumbClick(index)}
                    className="text-blue-600 hover:text-blue-800 hover:underline"
                  >
                    {folder.name}
                  </button>
                </React.Fragment>
              ))}
            </nav>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-4 mb-8">
          <Button
            onClick={handleNewFolder}
            className="flex items-center gap-2 text-white px-4 py-2 rounded-md border border-[#363636]"
          >
            {/* <FolderPlus className="w-4 h-4" /> */}
            <Image
              src="/icons/folder-sm.svg"
              alt="Folder"
              width={20}
              height={20}
            />
            New Folder
          </Button>
          <Button
            onClick={handleFileUpload}
            className="flex items-center gap-2 text-white px-4 py-2 rounded-md border border-[#363636]"
          >
            {/* <UploadIcon width={16} height={16} color="#737373" /> */}
            <Image
              src="/icons/file-upload.svg"
              alt="File Upload"
              width={20}
              height={20}
            />
            File Upload
          </Button>
        </div>

        {/* Content Area */}
        {loading ? (
          <Card className="border border-gray-200 bg-gray-50">
            <div className="flex flex-col items-center justify-center py-16 px-6">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-600 mb-4"></div>
              <p className="text-gray-600">Loading content...</p>
            </div>
          </Card>
        ) : error ? (
          <Card className="border border-red-200 bg-red-50">
            <div className="flex flex-col items-center justify-center py-16 px-6">
              <div className="text-red-500 mb-4">
                <svg
                  className="w-12 h-12"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-red-600 mb-2">
                Error Loading Content
              </h3>
              <p className="text-red-500 text-sm mb-4">{error}</p>
              <Button
                onClick={refreshContent}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                Try Again
              </Button>
            </div>
          </Card>
        ) : folders.length === 0 && documents.length === 0 ? (
          <Card className="border border-gray-200 bg-gray-50">
            <div className="flex flex-col items-center justify-center py-16 px-6">
              {/* Folder Illustration */}
              <div className="mb-6 relative">
                <Image
                  src="/icons/folder-lg.svg"
                  alt="Folder"
                  width={176}
                  height={162}
                />
              </div>

              {/* Empty State Message */}
              <div className="text-center">
                <h3 className="text-lg font-medium text-gray-600 mb-2">
                  Looks like there are no{" "}
                  <span className="font-bold">Document or Folder</span> here
                </h3>
                <p className="text-gray-500 text-sm">
                  Files are created from New Folder, so you&apos;ll need to
                  create one of those first.
                </p>
              </div>
            </div>
          </Card>
        ) : (
          <div className="relative">
            {/* Loading overlay for folder navigation */}
            {navigating && (
              <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-10 flex items-center justify-center">
                <div className="flex flex-col items-center gap-2">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <p className="text-sm text-gray-600">Opening folder...</p>
                </div>
              </div>
            )}
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {/* Display Folders */}
              {folders.map((folder) => (
                <div
                  className="p-4 text-center cursor-pointer hover:bg-gray-50 rounded-lg transition-colors"
                  onClick={() => handleFolderClick(folder)}
                  key={`folder-${folder.id}`}
                >
                <div className="mb-3 flex justify-center">
                  <Image
                    src="/icons/folder.svg"
                    alt="Folder"
                    width={48}
                    height={48}
                  />
                </div>
                <h3
                  className="font-medium text-gray-800 text-sm mb-1 truncate"
                  title={folder.name}
                >
                  {folder.name}
                </h3>
                {/* <div className="flex justify-between text-xs text-gray-500 mt-2">
                  <span>{folder.documents_count} docs</span>
                  <span className="flex items-center gap-1">
                    {folder.children_count} folders
                    {folder.children_count > 0 && (
                      <svg
                        className="w-3 h-3"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    )}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Created: {new Date(folder.created_at).toLocaleDateString()}
                </p> */}
              </div>
            ))}

            {/* Display Documents */}
            {documents.map((document) => (
              <div
                className="p-4 text-center"
                onClick={() => {
                  // Open document in new tab
                  window.open(document.file_url, "_blank");
                }}
                key={`document-${document.id}`}
              >
                <div className="mb-3 flex justify-center">
                  {getFileIcon(document)}
                </div>
                <h3
                  className="font-medium text-gray-800 text-sm mb-1 truncate"
                  title={document.name}
                >
                  {document.name}
                </h3>
                {/* <div className="text-xs text-gray-500 mt-2">
                    <div className="mb-1">{formatFileSize(document.size)}</div>
                    <div className="text-gray-400">
                      {document.extension.toUpperCase()}
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Uploaded:{" "}
                    {new Date(document.uploaded_at).toLocaleDateString()}
                  </p> */}
              </div>
            ))}
            </div>
          </div>
        )}
      </div>

      {/* Create Folder Modal */}
      <CreateFolderModal
        isOpen={isCreateFolderModalOpen}
        onClose={() => setIsCreateFolderModalOpen(false)}
        onCreateFolder={handleCreateFolder}
        isCreating={creatingFolder}
      />

      {/* File Upload Modal */}
      <FileUploadModal
        isOpen={isFileUploadModalOpen}
        onClose={() => setIsFileUploadModalOpen(false)}
        onUploadFile={handleUploadFile}
        isUploading={uploadingFile}
      />
    </div>
  );
};

export default TpiDocument;

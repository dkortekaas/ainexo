"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Upload,
  MoreVertical,
  FileText,
  Edit,
  Trash2,
  Download,
  Eye,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { FileEditForm } from "@/components/knowledgebase/FileEditForm";

// Lazy load heavy modal component for code splitting
const FileUploadModal = dynamic(
  () => import("@/components/knowledgebase/FileUploadModal").then(mod => ({ default: mod.FileUploadModal })),
  { ssr: false }
);
import { DeleteConfirmationModal } from "@/components/shared/DeleteConfirmationModal";
import { useToast } from "@/components/ui/use-toast";
import { useAssistant } from "@/contexts/assistant-context";
import { useTranslations } from "next-intl";

interface KnowledgeFile {
  id: string;
  originalName: string;
  fileName: string;
  filePath: string;
  mimeType: string;
  fileSize: number;
  enabled: boolean;
  status: "PROCESSING" | "COMPLETED" | "ERROR";
  errorMessage?: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export function BestandenTab() {
  const t = useTranslations();
  const { currentAssistant } = useAssistant();
  const router = useRouter();
  const [files, setFiles] = useState<KnowledgeFile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editingFile, setEditingFile] = useState<KnowledgeFile | null>(null);
  const [fileToDelete, setFileToDelete] = useState<KnowledgeFile | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();

  const fetchFiles = useCallback(async () => {
    try {
      if (!currentAssistant?.id) {
        setFiles([]);
        setIsLoading(false);
        return;
      }
      const response = await fetch(
        `/api/files?assistantId=${encodeURIComponent(currentAssistant.id)}`
      );
      if (response.ok) {
        const paginatedResponse = await response.json();
        // Extract the data array from the paginated response
        setFiles(paginatedResponse.data || []);
      } else {
        throw new Error("Failed to fetch files");
      }
    } catch (error) {
      console.error("Error fetching files:", error);
      toast({
        description: t("error.failedToLoadFiles"),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [currentAssistant?.id, toast, t]);

  // Fetch files on component mount
  useEffect(() => {
    fetchFiles();
  }, [currentAssistant?.id, fetchFiles]);

  const handleUploadFile = () => {
    setIsUploadModalOpen(true);
  };

  const handleEditFile = (file: KnowledgeFile) => {
    setEditingFile(file);
    setIsEditModalOpen(true);
  };

  const handleViewFile = (file: KnowledgeFile) => {
    router.push(`/knowledgebase/files/${file.id}`);
  };

  const handleDeleteFile = (file: KnowledgeFile) => {
    setFileToDelete(file);
    setIsDeleteModalOpen(true);
  };

  const confirmDeleteFile = async () => {
    if (!fileToDelete) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/files/${fileToDelete.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast({
          description: t("success.fileDeletedSuccessfully"),
          variant: "success",
        });
        fetchFiles();
        setIsDeleteModalOpen(false);
        setFileToDelete(null);
      } else {
        const error = await response.json();
        throw new Error(error.error || t("error.failedToDeleteFile"));
      }
    } catch (error) {
      console.error("Error downloading file:", error);
      toast({
        description:
          error instanceof Error
            ? error.message
            : t("error.failedToDeleteFile"),
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDownloadFile = async (file: KnowledgeFile) => {
    try {
      const response = await fetch(`/api/files/${file.id}/download`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = file.originalName;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        throw new Error(t("error.failedToDownloadFile"));
      }
    } catch {
      toast({
        description: t("error.failedToDownloadFile"),
        variant: "destructive",
      });
    }
  };

  const toggleEnabled = async (file: KnowledgeFile) => {
    try {
      const response = await fetch(`/api/files/${file.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          description: file.description,
          enabled: !file.enabled,
        }),
      });

      if (response.ok) {
        toast({
          description: t("success.fileUpdatedSuccessfully"),
          variant: "success",
        });
        fetchFiles();
      } else {
        throw new Error(t("error.failedToUpdateFile"));
      }
    } catch (error) {
      console.error("Error updating file:", error);
      toast({
        description:
          error instanceof Error
            ? error.message
            : t("error.failedToUpdateFile"),
        variant: "destructive",
      });
    }
  };

  const handleUploadSuccess = () => {
    fetchFiles();
  };

  const handleEditSuccess = () => {
    fetchFiles();
  };

  const handleUploadModalClose = () => {
    setIsUploadModalOpen(false);
  };

  const handleEditModalClose = () => {
    setIsEditModalOpen(false);
    setEditingFile(null);
  };

  const handleDeleteModalClose = () => {
    if (!isDeleting) {
      setIsDeleteModalOpen(false);
      setFileToDelete(null);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const formatModifiedDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInDays === 0) return t("knowledgebase.today");
    if (diffInDays === 1) return t("knowledgebase.yesterday");
    if (diffInDays < 7) return `${diffInDays} ${t("knowledgebase.daysAgo")}`;
    if (diffInDays < 30)
      return `${Math.floor(diffInDays / 7)} ${t("knowledgebase.weeksAgo")}`;
    if (diffInDays < 365)
      return `${Math.floor(diffInDays / 30)} ${t("knowledgebase.monthsAgo")}`;
    return `${Math.floor(diffInDays / 365)} ${t("knowledgebase.yearsAgo")}`;
  };

  const getProcessingBadge = (status: KnowledgeFile["status"]) => {
    switch (status) {
      case "COMPLETED":
        return (
          <Badge className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400">
            ✓ {t("knowledgebase.completed")}
          </Badge>
        );
      case "PROCESSING":
        return (
          <Badge className="bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400">
            {t("knowledgebase.processing")}
          </Badge>
        );
      case "ERROR":
        return (
          <Badge className="bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400">
            {t("knowledgebase.error")}
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {t("knowledgebase.files")}
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {t("knowledgebase.filesDescription")}{" "}
            <strong>{currentAssistant?.name}</strong>.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            className="bg-primary hover:bg-primary/80"
            onClick={handleUploadFile}
          >
            <Upload className="w-4 h-4 mr-2" />
            {t("common.upload")}
          </Button>
        </div>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {t("knowledgebase.name")}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {t("knowledgebase.size")}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {t("knowledgebase.enabled")}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {t("knowledgebase.processing")}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {t("knowledgebase.modified")}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {t("common.actions")}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
              {isLoading ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-8 text-center text-gray-500 dark:text-gray-400"
                  >
                    {t("knowledgebase.loadingFiles")}
                  </td>
                </tr>
              ) : files.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-8 text-center text-gray-500 dark:text-gray-400"
                  >
                    {t("knowledgebase.noFilesUploaded")}
                  </td>
                </tr>
              ) : (
                files.map((file) => (
                  <tr key={file.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <FileText className="w-4 h-4 text-gray-400 dark:text-gray-500 mr-3" />
                        <div>
                          <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {file.originalName}
                          </span>
                          {file.description && (
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              {file.description}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                      {formatFileSize(file.fileSize)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Switch
                        checked={file.enabled}
                        onCheckedChange={() => toggleEnabled(file)}
                        className="data-[state=checked]:bg-primary"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getProcessingBadge(file.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                      {formatModifiedDate(file.updatedAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => handleViewFile(file)}
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            {t("common.view")}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDownloadFile(file)}
                          >
                            <Download className="w-4 h-4 mr-2" />
                            {t("common.download")}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleEditFile(file)}
                          >
                            <Edit className="w-4 h-4 mr-2" />
                            {t("common.edit")}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-red-600"
                            onClick={() => handleDeleteFile(file)}
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            {t("common.delete")}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* File Upload Modal */}
      <FileUploadModal
        isOpen={isUploadModalOpen}
        onClose={handleUploadModalClose}
        onSuccess={handleUploadSuccess}
        assistantId={currentAssistant?.id}
      />

      {/* File Edit Modal */}
      <FileEditForm
        isOpen={isEditModalOpen}
        onClose={handleEditModalClose}
        onSuccess={handleEditSuccess}
        file={editingFile}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={handleDeleteModalClose}
        onConfirm={confirmDeleteFile}
        title={t("knowledgebase.deleteFile")}
        description={t("knowledgebase.deleteFileDescription")}
        itemName={fileToDelete?.originalName || ""}
        isLoading={isDeleting}
      />
    </div>
  );
}

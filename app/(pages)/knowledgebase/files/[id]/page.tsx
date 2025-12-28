"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Badge, Button, Card } from "@/components/ui";
import { ArrowLeft, FileText, Download, Edit } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";
import { TrialGuard } from "@/components/guards/TrialGuard";

interface FileContent {
  id: string;
  title: string;
  type: string;
  size: string;
  uploadedAt: string;
  status: string;
  content: string;
  metadata: {
    mimeType: string;
    fileExtension: string;
    words: number;
    chunks: number;
    description?: string;
    errorMessage?: string;
    documentId?: string;
    hasEmbeddings: boolean;
  };
}

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

export default function FileDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("overview");
  const [file, setFile] = useState<KnowledgeFile | null>(null);
  const [fileContent, setFileContent] = useState<FileContent | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingContent, setIsLoadingContent] = useState(false);
  const t = useTranslations();

  const tabs = [
    { id: "overview", name: t("knowledgebase.overview") },
    { id: "content", name: t("knowledgebase.content") },
  ];

  const fetchFileDetails = useCallback(async () => {
    try {
      const response = await fetch(`/api/files/${params.id}`);
      if (response.ok) {
        const data = await response.json();
        setFile(data);
      } else {
        console.error("Failed to fetch file details");
      }
    } catch (error) {
      console.error("Error fetching file details:", error);
    } finally {
      setIsLoading(false);
    }
  }, [params.id]);

  const fetchFileContent = useCallback(async () => {
    if (activeTab !== "content" || fileContent) return;

    setIsLoadingContent(true);
    try {
      const response = await fetch(`/api/files/${params.id}/content`);
      if (response.ok) {
        const data = await response.json();
        setFileContent(data);
      }
    } catch (error) {
      console.error("Error fetching file content:", error);
    } finally {
      setIsLoadingContent(false);
    }
  }, [params.id, activeTab, fileContent]);

  useEffect(() => {
    if (params.id) {
      fetchFileDetails();
    }
  }, [params.id, fetchFileDetails]);

  useEffect(() => {
    if (activeTab === "content") {
      fetchFileContent();
    }
  }, [activeTab, fetchFileContent]);

  const handleDownload = async () => {
    try {
      const response = await fetch(`/api/files/${params.id}/download`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = file?.originalName || "download";
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error("Error downloading file:", error);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status.toUpperCase()) {
      case "COMPLETED":
        return (
          <Badge className="bg-green-100 text-green-800">
            ✓ {t("knowledgebase.completed")}
          </Badge>
        );
      case "PROCESSING":
        return (
          <Badge className="bg-yellow-100 text-yellow-800">
            {t("knowledgebase.processing")}
          </Badge>
        );
      case "ERROR":
        return (
          <Badge className="bg-red-100 text-red-800">
            {t("knowledgebase.error")}
          </Badge>
        );
      default:
        return <Badge className="bg-gray-100 text-gray-800">{status}</Badge>;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  if (isLoading) {
    return (
      <TrialGuard feature="document">
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => router.back()}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              {t("common.back")}
            </Button>
            <div className="h-8 bg-gray-200 rounded w-64 animate-pulse"></div>
          </div>
          <div className="h-96 bg-gray-200 rounded animate-pulse"></div>
        </div>
      </TrialGuard>
    );
  }

  if (!file) {
    return (
      <TrialGuard feature="document">
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => router.back()}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              {t("common.back")}
            </Button>
            <h1 className="text-2xl font-semibold text-gray-900">
              {t("knowledgebase.fileNotFound")}
            </h1>
          </div>
        </div>
      </TrialGuard>
    );
  }

  return (
    <TrialGuard feature="document">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => router.back()}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              {t("common.back")}
            </Button>
            <div className="flex items-center gap-3">
              <FileText className="w-8 h-8 text-gray-400" />
              <div>
                <h1 className="text-2xl font-semibold text-gray-900">
                  {file.originalName}
                </h1>
                {file.description && (
                  <p className="text-sm text-gray-500">{file.description}</p>
                )}
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleDownload}>
              <Download className="w-4 h-4 mr-2" />
              {t("common.download")}
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm",
                  activeTab === tab.id
                    ? "border-primary text-primary"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                )}
              >
                {tab.name}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="mt-6">
          {activeTab === "overview" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* File Information */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">
                  {t("knowledgebase.fileInformation")}
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">
                      {t("knowledgebase.fileName")}:
                    </span>
                    <span className="text-sm font-medium">
                      {file.originalName}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">
                      {t("knowledgebase.mimeType")}:
                    </span>
                    <span className="text-sm font-medium">{file.mimeType}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">
                      {t("knowledgebase.size")}:
                    </span>
                    <span className="text-sm font-medium">
                      {formatFileSize(file.fileSize)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">
                      {t("knowledgebase.uploadedAt")}:
                    </span>
                    <span className="text-sm font-medium">
                      {formatDate(file.createdAt)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">
                      {t("knowledgebase.enabled")}:
                    </span>
                    <span className="text-sm font-medium">
                      {file.enabled ? t("common.yes") : t("common.no")}
                    </span>
                  </div>
                </div>
              </Card>

              {/* Processing Status */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">
                  {t("knowledgebase.processingStatus")}
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">
                      {t("knowledgebase.status")}:
                    </span>
                    {getStatusBadge(file.status)}
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">
                      {t("knowledgebase.lastUpdated")}:
                    </span>
                    <span className="text-sm font-medium">
                      {formatDate(file.updatedAt)}
                    </span>
                  </div>
                  {file.errorMessage && (
                    <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded">
                      <p className="text-sm text-red-800">
                        {file.errorMessage}
                      </p>
                    </div>
                  )}
                  {fileContent && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500">
                          {t("knowledgebase.wordCount")}:
                        </span>
                        <span className="text-sm font-medium">
                          {fileContent.metadata.words.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500">
                          {t("knowledgebase.chunks")}:
                        </span>
                        <span className="text-sm font-medium">
                          {fileContent.metadata.chunks}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500">
                          {t("knowledgebase.embeddings")}:
                        </span>
                        <span className="text-sm font-medium">
                          {fileContent.metadata.hasEmbeddings
                            ? t("common.yes")
                            : t("common.no")}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </Card>
            </div>
          )}

          {activeTab === "content" && (
            <Card className="p-6">
              {isLoadingContent ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : fileContent ? (
                <div className="space-y-4">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold">
                      {t("knowledgebase.fileContent")}
                    </h3>
                    <div className="flex gap-4 text-sm text-gray-500">
                      <span>
                        {fileContent.metadata.words.toLocaleString()}{" "}
                        {t("knowledgebase.words")}
                      </span>
                      <span>
                        {fileContent.metadata.chunks}{" "}
                        {t("knowledgebase.chunks")}
                      </span>
                    </div>
                  </div>
                  <div className="prose max-w-none">
                    <pre className="whitespace-pre-wrap text-sm text-gray-700 bg-gray-50 p-4 rounded border border-gray-200 max-h-[600px] overflow-y-auto">
                      {fileContent.content}
                    </pre>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  {t("knowledgebase.noContentAvailable")}
                </div>
              )}
            </Card>
          )}
        </div>
      </div>
    </TrialGuard>
  );
}

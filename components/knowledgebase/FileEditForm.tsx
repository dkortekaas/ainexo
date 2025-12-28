"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
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

interface FileEditFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  file: KnowledgeFile | null;
}

export function FileEditForm({
  isOpen,
  onClose,
  onSuccess,
  file,
}: FileEditFormProps) {
  const t = useTranslations();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    description: file?.description || "",
    enabled: file?.enabled ?? true,
  });
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/files/${file.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || t("error.failedToUpdateFile"));
      }

      toast({
        description: t("success.fileUpdatedSuccessfully"),
        variant: "success",
      });

      onSuccess();
      onClose();
    } catch (error) {
      toast({
        description:
          error instanceof Error ? error.message : t("error.anErrorOccurred"),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      setFormData({
        description: file?.description || "",
        enabled: file?.enabled ?? true,
      });
      onClose();
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const getFileTypeIcon = (mimeType: string) => {
    if (mimeType.includes("pdf")) return "📄";
    if (mimeType.includes("word")) return "📝";
    if (mimeType.includes("text")) return "📄";
    if (mimeType.includes("csv")) return "📊";
    if (mimeType.includes("json")) return "📋";
    return "📁";
  };

  if (!file) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{t("knowledgebase.editFile")}</DialogTitle>
          <DialogDescription>
            {t("knowledgebase.updateFileInformation")}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* File Info Display */}
          <div className="rounded-lg bg-gray-50 p-4">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{getFileTypeIcon(file.mimeType)}</span>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">
                  {file.originalName}
                </p>
                <p className="text-xs text-gray-500">
                  {formatFileSize(file.fileSize)} • {file.mimeType}
                </p>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">
              {t("knowledgebase.description")}
            </Label>
            <Textarea
              id="description"
              placeholder={t("knowledgebase.briefDescription")}
              value={formData.description}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
              disabled={isLoading}
              rows={3}
            />
          </div>

          {/* Enabled Switch */}
          <div className="flex items-center space-x-2">
            <Switch
              id="enabled"
              checked={formData.enabled}
              onCheckedChange={(checked) =>
                setFormData((prev) => ({ ...prev, enabled: checked }))
              }
              disabled={isLoading}
              className="data-[state=checked]:bg-primary"
            />
            <Label htmlFor="enabled">{t("knowledgebase.enabled")}</Label>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isLoading}
            >
              {t("common.cancel")}
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? t("common.updating") : t("common.update")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

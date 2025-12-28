"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import SaveButton from "@/components/ui/save-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { useAssistant } from "@/contexts/assistant-context";
import { useTranslations } from "next-intl";

interface Website {
  id: string;
  url: string;
  name?: string;
  description?: string;
  pages: number;
  syncSpeed?: number;
  syncInterval: string;
  lastSync?: string;
  status: "PENDING" | "SYNCING" | "COMPLETED" | "ERROR";
  errorMessage?: string;
}

interface WebsiteFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  website?: Website | null;
}

export function WebsiteForm({
  isOpen,
  onClose,
  onSuccess,
  website,
}: WebsiteFormProps) {
  const t = useTranslations();
  const { currentAssistant } = useAssistant();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    url: website?.url || "",
    name: website?.name || "",
    description: website?.description || "",
    syncInterval: website?.syncInterval || "never",
  });
  const { toast } = useToast();

  const isEditing = !!website;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentAssistant) {
      toast({
        title: "Error",
        description: t("error.noAssistantSelected"),
        variant: "destructive",
      });
      return;
    }

    // Normalize URL for comparison (lowercase, remove trailing slash)
    const normalizeUrl = (u: string) =>
      u.trim().toLowerCase().replace(/\/$/, "");
    const normalizedInputUrl = normalizeUrl(formData.url);

    // Preflight duplicate check against existing websites for this assistant
    try {
      const existingResp = await fetch(
        `/api/websites?assistantId=${currentAssistant.id}`
      );
      if (existingResp.ok) {
        const existingList: Array<{ url: string }> = await existingResp.json();
        const alreadyExists = existingList.some(
          (w) => normalizeUrl(w.url) === normalizedInputUrl
        );
        if (alreadyExists) {
          toast({
            title: t("error.urlAlreadyExists"),
            description:
              "Deze website URL is al toegevoegd voor deze assistant. Kies een andere URL of bewerk de bestaande.",
            variant: "destructive",
          });
          return;
        }
      }
    } catch {
      // If the preflight check fails, continue to submit; server will still validate
    }

    setIsLoading(true);

    try {
      const url = isEditing ? `/api/websites/${website.id}` : "/api/websites";
      const method = isEditing ? "PUT" : "POST";

      const requestData = isEditing
        ? formData
        : { ...formData, assistantId: currentAssistant.id };

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        let errorData: { error?: string; message?: string } | null = null;
        try {
          errorData = (await response.json()) as {
            error?: string;
            message?: string;
          };
        } catch {
          // ignore parse errors
        }

        // Handle duplicate URL explicitly with toast
        if (response.status === 409) {
          toast({
            title: t("error.urlAlreadyExists"),
            description: t("error.urlAlreadyExistsDescription"),
            variant: "destructive",
          });
          return;
        }

        // Fallback for server 500 with unique constraint (no structured code)
        if (
          response.status === 500 &&
          errorData &&
          typeof errorData.error === "string" &&
          errorData.error.toLowerCase().includes("failed to create website")
        ) {
          toast({
            description: t("error.urlAlreadyExistsDescription"),
            variant: "destructive",
          });
          return;
        }

        // Generic error toast
        toast({
          description: errorData && (errorData.error || errorData.message),
          variant: "destructive",
        });
        return;
      }

      toast({
        description: isEditing
          ? t("success.websiteUpdatedSuccessfully")
          : t("success.websiteAddedSuccessfully"),
        variant: "success",
      });

      onSuccess();
      onClose();
    } catch (error) {
      toast({
        description:
          error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      setFormData({
        url: website?.url || "",
        name: website?.name || "",
        description: website?.description || "",
        syncInterval: website?.syncInterval || "never",
      });
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing
              ? t("knowledgebase.editWebsite")
              : t("knowledgebase.addWebsite")}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? t("knowledgebase.updateWebsiteInformation")
              : t("knowledgebase.addWebsiteInformation")}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="url">{t("knowledgebase.url")} *</Label>
            <Input
              id="url"
              type="url"
              placeholder="https://example.com"
              value={formData.url}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, url: e.target.value }))
              }
              required
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">{t("knowledgebase.name")} (optional)</Label>
            <Input
              id="name"
              placeholder={t("knowledgebase.websiteName")}
              value={formData.name}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, name: e.target.value }))
              }
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">
              {t("knowledgebase.description")} (optional)
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

          <div className="space-y-2">
            <Label htmlFor="syncInterval">
              {t("knowledgebase.syncInterval")}
            </Label>
            <Select
              value={formData.syncInterval}
              onValueChange={(value) =>
                setFormData((prev) => ({ ...prev, syncInterval: value }))
              }
              disabled={isLoading}
            >
              <SelectTrigger>
                <SelectValue
                  placeholder={t("knowledgebase.selectSyncInterval")}
                />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="never">
                  {t("knowledgebase.never")}
                </SelectItem>
                <SelectItem value="daily">
                  {t("knowledgebase.daily")}
                </SelectItem>
                <SelectItem value="weekly">
                  {t("knowledgebase.weekly")}
                </SelectItem>
                <SelectItem value="monthly">
                  {t("knowledgebase.monthly")}
                </SelectItem>
              </SelectContent>
            </Select>
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
            <SaveButton type="submit" isLoading={isLoading}>
              {isLoading
                ? t("common.saving")
                : isEditing
                  ? t("common.update")
                  : t("common.add")}
            </SaveButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

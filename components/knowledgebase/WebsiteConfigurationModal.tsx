"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import SaveButton from "@/components/ui/save-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { useTranslations } from "next-intl";

interface Website {
  id: string;
  url: string;
  name?: string;
  maxDepth?: number;
  maxUrls?: number;
  syncInterval: string;
}

interface WebsiteConfigurationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  website: Website | null;
}

export function WebsiteConfigurationModal({
  isOpen,
  onClose,
  onSuccess,
  website,
}: WebsiteConfigurationModalProps) {
  const t = useTranslations();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    url: website?.url || "",
    name: website?.name || "",
    maxDepth: website?.maxDepth?.toString() || "3",
    maxUrls: website?.maxUrls?.toString() || "50",
    syncInterval: website?.syncInterval || "never",
  });
  const { toast } = useToast();

  // Update form data when website changes
  useEffect(() => {
    if (website) {
      setFormData({
        url: website.url || "",
        name: website.name || "",
        maxDepth: website.maxDepth?.toString() || "3",
        maxUrls: website.maxUrls?.toString() || "50",
        syncInterval: website.syncInterval || "never",
      });
    }
  }, [website]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!website) {
      return;
    }

    // Validate numeric fields
    const maxDepth = parseInt(formData.maxDepth, 10);
    const maxUrls = parseInt(formData.maxUrls, 10);

    if (isNaN(maxDepth) || maxDepth < 1 || maxDepth > 10) {
      toast({
        description: t("error.maxDepthInvalid") || "Max depth must be between 1 and 10",
        variant: "destructive",
      });
      return;
    }

    if (isNaN(maxUrls) || maxUrls < 1 || maxUrls > 1000) {
      toast({
        description: t("error.maxUrlsInvalid") || "Max URLs must be between 1 and 1000",
        variant: "destructive",
      });
      return;
    }

    // Validate URL format
    try {
      new URL(formData.url);
    } catch {
      toast({
        description: t("error.invalidUrl") || "Invalid URL format",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`/api/websites/${website.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          url: formData.url,
          name: formData.name || null,
          syncInterval: formData.syncInterval,
          maxDepth,
          maxUrls,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        toast({
          description:
            errorData.error ||
            errorData.message ||
            t("error.failedToUpdateWebsite") ||
            "Failed to update website",
          variant: "destructive",
        });
        return;
      }

      toast({
        description:
          t("success.websiteUpdatedSuccessfully") ||
          "Website updated successfully",
        variant: "success",
      });

      onSuccess();
      onClose();
    } catch (error) {
      toast({
        description:
          error instanceof Error
            ? error.message
            : t("error.failedToUpdateWebsite") || "An error occurred",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      if (website) {
        setFormData({
          url: website.url || "",
          name: website.name || "",
          maxDepth: website.maxDepth?.toString() || "3",
          maxUrls: website.maxUrls?.toString() || "50",
          syncInterval: website.syncInterval || "never",
        });
      }
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {t("knowledgebase.configureWebsite") || "Configure Website"}
          </DialogTitle>
          <DialogDescription>
            {t("knowledgebase.updateWebsiteConfiguration") ||
              "Update website settings and scraping options"}
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
            <Label htmlFor="name">
              {t("knowledgebase.name")} ({t("common.optional") || "optional"})
            </Label>
            <Input
              id="name"
              placeholder={t("knowledgebase.websiteName") || "Website name"}
              value={formData.name}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, name: e.target.value }))
              }
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="maxDepth">
              {t("knowledgebase.maxDepth")} (1-10) *
            </Label>
            <Input
              id="maxDepth"
              type="number"
              min="1"
              max="10"
              value={formData.maxDepth}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, maxDepth: e.target.value }))
              }
              required
              disabled={isLoading}
            />
            <p className="text-xs text-gray-500">
              {t("knowledgebase.maxDepthDescription") ||
                "Maximum depth level for crawling (how many levels deep to go)"}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="maxUrls">
              {t("knowledgebase.maxUrls")} (1-1000) *
            </Label>
            <Input
              id="maxUrls"
              type="number"
              min="1"
              max="1000"
              value={formData.maxUrls}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, maxUrls: e.target.value }))
              }
              required
              disabled={isLoading}
            />
            <p className="text-xs text-gray-500">
              {t("knowledgebase.maxUrlsDescription") ||
                "Maximum number of URLs to scrape"}
            </p>
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
                : t("common.update")}
            </SaveButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}


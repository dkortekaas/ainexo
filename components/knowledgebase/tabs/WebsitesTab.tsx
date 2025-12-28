"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  MoreVertical,
  ExternalLink,
  Trash2,
  Edit,
  Bot,
  RefreshCw,
  Eye,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { WebsiteForm } from "@/components/knowledgebase/WebsiteForm";
import { DeleteConfirmationModal } from "@/components/shared/DeleteConfirmationModal";
import { useToast } from "@/components/ui/use-toast";
import { useAssistant } from "@/contexts/assistant-context";
import { useTranslations } from "next-intl";

interface Website {
  id: string;
  url: string;
  name?: string;
  description?: string;
  pageCount: number;
  pages: number;
  syncSpeed?: number;
  syncInterval: string;
  lastSync?: string;
  status: "PENDING" | "SYNCING" | "COMPLETED" | "ERROR";
  errorMessage?: string;
  scrapedContent?: string;
  scrapedLinks?: string[];
  createdAt: string;
  updatedAt: string;
}

export function WebsitesTab() {
  const t = useTranslations();
  const router = useRouter();
  const { currentAssistant } = useAssistant();
  const [websites, setWebsites] = useState<Website[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingWebsite, setEditingWebsite] = useState<Website | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [websiteToDelete, setWebsiteToDelete] = useState<Website | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();

  const fetchWebsites = useCallback(async () => {
    if (!currentAssistant) return;

    try {
      const response = await fetch(
        `/api/websites?assistantId=${currentAssistant.id}`
      );
      if (response.ok) {
        const paginatedResponse = await response.json();
        // Extract the data array from the paginated response
        setWebsites(paginatedResponse.data || []);
      } else {
        throw new Error("Failed to fetch websites");
      }
    } catch {
      toast({
        description: t("error.failedToLoadWebsites"),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [currentAssistant, toast, t]);

  // Fetch websites on component mount and when assistant changes
  useEffect(() => {
    if (currentAssistant) {
      fetchWebsites();
    }
  }, [currentAssistant, fetchWebsites]);

  const handleAddWebsite = () => {
    setEditingWebsite(null);
    setIsFormOpen(true);
  };

  const handleEditWebsite = (website: Website) => {
    router.push(`/knowledgebase/websites/${website.id}`);
  };

  const handleDeleteWebsite = (website: Website) => {
    setWebsiteToDelete(website);
    setIsDeleteOpen(true);
  };

  const confirmDeleteWebsite = async () => {
    if (!websiteToDelete) return;
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/websites/${websiteToDelete.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast({
          description: t("success.websiteDeletedSuccessfully"),
          variant: "success",
        });
        setIsDeleteOpen(false);
        setWebsiteToDelete(null);
        fetchWebsites();
      } else {
        const error = await response.json();
        throw new Error(error.error || t("error.failedToDeleteWebsite"));
      }
    } catch (error) {
      toast({
        description:
          error instanceof Error
            ? error.message
            : t("error.failedToDeleteWebsite"),
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleFormSuccess = () => {
    fetchWebsites();
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setEditingWebsite(null);
  };

  const handleScrapeWebsite = async (website: Website) => {
    try {
      const response = await fetch(`/api/websites/${website.id}/scrape`, {
        method: "POST",
      });

      if (response.ok) {
        toast({
          description: t("success.scrapingStartedSuccessfully"),
          variant: "success",
        });
        // Refresh the websites list to show updated status
        setTimeout(() => {
          fetchWebsites();
        }, 1000);
      } else {
        const error = await response.json();
        throw new Error(error.error || t("error.failedToStartScraping"));
      }
    } catch (error) {
      toast({
        description:
          error instanceof Error
            ? error.message
            : t("error.failedToStartScraping"),
        variant: "destructive",
      });
    }
  };

  const handleViewContent = (website: Website) => {
    router.push(`/knowledgebase/websites/${website.id}/content`);
  };

  const getStatusBadge = (status: Website["status"]) => {
    switch (status) {
      case "COMPLETED":
        return (
          <Badge className="bg-green-100 text-green-800">
            ✓ {t("knowledgebase.completed")}
          </Badge>
        );
      case "PENDING":
        return (
          <Badge className="bg-yellow-100 text-yellow-800">
            {t("knowledgebase.pending")}
          </Badge>
        );
      case "SYNCING":
        return (
          <Badge className="bg-blue-100 text-blue-800">
            {t("knowledgebase.syncing")}
          </Badge>
        );
      case "ERROR":
        return (
          <Badge className="bg-red-100 text-red-800">
            {t("knowledgebase.error")}
          </Badge>
        );
    }
  };

  const formatLastSync = (lastSync?: string) => {
    if (!lastSync) return t("knowledgebase.never");

    const date = new Date(lastSync);
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

  if (!currentAssistant) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <div className="text-gray-500 mb-4">
            <Bot className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {t("knowledgebase.noAssistantSelected")}
            </h3>
            <p className="text-sm text-gray-500">
              {t("knowledgebase.noAssistantSelectedDescription")}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            {t("knowledgebase.websites")}
          </h2>
          <p className="text-sm text-gray-500">
            {t("knowledgebase.websitesDescription")}{" "}
            <strong>{currentAssistant.name}</strong>.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            className="bg-primary hover:bg-primary/80"
            onClick={handleAddWebsite}
          >
            <Plus className="w-4 h-4 mr-2" />
            {t("common.add")}
          </Button>
        </div>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t("knowledgebase.url")}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t("knowledgebase.pages")}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t("knowledgebase.syncSpeed")}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t("knowledgebase.syncInterval")}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t("knowledgebase.lastSync")}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t("knowledgebase.status")}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t("knowledgebase.actions")}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-6 py-8 text-center text-gray-500"
                  >
                    {t("knowledgebase.loadingWebsites")}
                  </td>
                </tr>
              ) : websites.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-6 py-8 text-center text-gray-500"
                  >
                    {t("knowledgebase.noWebsitesAdded")}
                  </td>
                </tr>
              ) : (
                websites.map((website) => (
                  <tr key={website.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <ExternalLink className="w-4 h-4 text-gray-400 mr-2" />
                        <div>
                          <button
                            onClick={() => handleEditWebsite(website)}
                            className="text-primary hover:text-blue-800 font-medium text-left"
                          >
                            {website.url}
                          </button>
                          {website.name && (
                            <div className="text-sm text-gray-500">
                              {website.name}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {website.pageCount}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {website.syncSpeed ? website.syncSpeed.toFixed(2) : "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {website.syncInterval}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatLastSync(website.lastSync)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(website.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => handleEditWebsite(website)}
                          >
                            <Edit className="w-4 h-4 mr-2" />
                            {t("common.edit")}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleScrapeWebsite(website)}
                          >
                            <RefreshCw className="w-4 h-4 mr-2" />
                            {t("common.scrapeNow")}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleViewContent(website)}
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            {t("common.viewContent")}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-red-600"
                            onClick={() => handleDeleteWebsite(website)}
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

      {/* Website Form Dialog */}
      <WebsiteForm
        isOpen={isFormOpen}
        onClose={handleFormClose}
        onSuccess={handleFormSuccess}
        website={editingWebsite}
      />

      <DeleteConfirmationModal
        isOpen={isDeleteOpen}
        onClose={() => {
          if (!isDeleting) {
            setIsDeleteOpen(false);
            setWebsiteToDelete(null);
          }
        }}
        onConfirm={confirmDeleteWebsite}
        title={t("knowledgebase.deleteWebsite")}
        description={t("knowledgebase.deleteWebsiteDescription")}
        itemName={websiteToDelete?.url || ""}
        isLoading={isDeleting}
      />
    </div>
  );
}

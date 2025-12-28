"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { Badge, Button, Card } from "@/components/ui";
import { ArrowLeft, Settings, Play } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Website,
  Webpage,
  SyncLog,
  WebsiteSyncLog,
} from "@/types/knowledgebase";
import { useTranslations } from "next-intl";
import { TrialGuard } from "@/components/guards/TrialGuard";

// Lazy load heavy modal component for code splitting
const WebsiteConfigurationModal = dynamic(
  () => import("@/components/knowledgebase/WebsiteConfigurationModal").then(mod => ({ default: mod.WebsiteConfigurationModal })),
  { ssr: false }
);

export default function WebsiteDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("overview");
  const [website, setWebsite] = useState<Website | null>(null);
  const [webpages, setWebpages] = useState<Webpage[]>([]);
  const [syncLogs, setSyncLogs] = useState<SyncLog[]>([]);
  const [websiteSyncLogs, setWebsiteSyncLogs] = useState<WebsiteSyncLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const t = useTranslations();

  const tabs = [
    { id: "overview", name: t("knowledgebase.overview") },
    { id: "webpages", name: t("knowledgebase.webpages") },
    { id: "sync-logs", name: t("knowledgebase.sync-logs") },
  ];

  const fetchWebsiteDetails = useCallback(async () => {
    try {
      const response = await fetch(`/api/websites/${params.id}`);
      if (response.ok) {
        const data = await response.json();
        setWebsite(data);
      }
    } catch (error) {
      console.error("Error fetching website details:", error);
    } finally {
      setIsLoading(false);
    }
  }, [params.id]);

  const fetchWebpages = useCallback(async () => {
    try {
      const response = await fetch(`/api/websites/${params.id}/pages`);
      if (response.ok) {
        const pages = await response.json();
        // Transform API response to match Webpage interface
        const transformedPages: Webpage[] = pages.map((page: any) => {
          const urlObj = new URL(page.url);
          const path = urlObj.pathname || "/";
          // Calculate size in bytes (UTF-8 encoding: most characters are 1 byte, some are 2-4 bytes)
          // For simplicity, we'll use a close approximation: string length for ASCII, slightly more for unicode
          const sizeBytes = page.content ? new Blob([page.content]).size : 0;
          const sizeKB = (sizeBytes / 1024).toFixed(2);

          return {
            id: page.id,
            path: path,
            fullUrl: page.url,
            status:
              page.status === "COMPLETED"
                ? 200
                : page.status === "ERROR"
                  ? 500
                  : 0,
            size: `${sizeKB} KB`,
            downloadedAt: page.scrapedAt
              ? new Date(page.scrapedAt).toLocaleString()
              : new Date(page.createdAt).toLocaleString(),
            contentType: "text/html", // Default, could be enhanced if stored in DB
          };
        });
        setWebpages(transformedPages);
      }
    } catch (error) {
      console.error("Error fetching webpages:", error);
    }
  }, [params.id]);

  const fetchSyncLogs = useCallback(async () => {
    try {
      const response = await fetch(
        `/api/websites/${params.id}/sync-logs?limit=100`
      );
      if (response.ok) {
        const data = await response.json();
        setWebsiteSyncLogs(data.data || []);
      }
    } catch (error) {
      console.error("Error fetching sync logs:", error);
    }
  }, [params.id]);

  useEffect(() => {
    if (params.id) {
      fetchWebsiteDetails();
      if (activeTab === "webpages") {
        fetchWebpages();
      }
      if (activeTab === "sync-logs") {
        fetchSyncLogs();
      }
    }
  }, [params.id, activeTab, fetchWebsiteDetails, fetchWebpages, fetchSyncLogs]);

  const getStatusBadge = (status: Website["status"]) => {
    switch (status) {
      case "COMPLETED":
        return (
          <Badge className="bg-green-100 text-green-800">
            ✓ {t("knowledgebase.statusDetails.completed")}
          </Badge>
        );
      case "PENDING":
        return (
          <Badge className="bg-yellow-100 text-yellow-800">
            {t("knowledgebase.statusDetails.pending")}
          </Badge>
        );
      case "SYNCING":
        return (
          <Badge className="bg-blue-100 text-blue-800">
            {t("knowledgebase.statusDetails.syncing")}
          </Badge>
        );
      case "ERROR":
        return (
          <Badge className="bg-red-100 text-red-800">
            {t("knowledgebase.statusDetails.error")}
          </Badge>
        );
    }
  };

  const getLogTypeBadge = (type: string) => {
    switch (type) {
      case "url_outside_allowed_domains":
        return (
          <Badge className="bg-orange-100 text-orange-800">
            url_outside_allowed_domains
          </Badge>
        );
      case "url_already_seen":
        return (
          <Badge className="bg-blue-100 text-blue-800">url_already_seen</Badge>
        );
      case "url_invalid":
        return <Badge className="bg-red-100 text-red-800">url_invalid</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">{type}</Badge>;
    }
  };

  const getSyncLogStatusBadge = (status: WebsiteSyncLog["status"]) => {
    switch (status) {
      case "COMPLETED":
        return (
          <Badge className="bg-green-100 text-green-800">✓ Completed</Badge>
        );
      case "RUNNING":
        return <Badge className="bg-blue-100 text-blue-800">Running...</Badge>;
      case "FAILED":
        return <Badge className="bg-red-100 text-red-800">Failed</Badge>;
    }
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return "-";
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  if (isLoading) {
    return (
      <TrialGuard feature="website">
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => router.back()}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div className="h-8 bg-gray-200 rounded w-64 animate-pulse"></div>
          </div>
          <div className="h-96 bg-gray-200 rounded animate-pulse"></div>
        </div>
      </TrialGuard>
    );
  }

  if (!website) {
    return (
      <TrialGuard feature="website">
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => router.back()}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <h1 className="text-2xl font-semibold text-gray-900">
              {t("knowledgebase.websiteNotFound")}
            </h1>
          </div>
        </div>
      </TrialGuard>
    );
  }

  return (
    <TrialGuard feature="website">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => router.back()}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              {t("common.back")}
            </Button>
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">
                {website.url}
              </h1>
              {website.name && (
                <p className="text-sm text-gray-500">{website.name}</p>
              )}
            </div>
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
              {/* Website Configuration */}
              <Card className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold">
                    {t("knowledgebase.websiteConfiguration")}
                  </h3>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsConfigModalOpen(true)}
                  >
                    <Settings className="w-4 h-4 mr-2" />
                    {t("knowledgebase.configure")}
                  </Button>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">
                      {t("knowledgebase.url")}:
                    </span>
                    <span className="text-sm font-medium">{website.url}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">
                      {t("knowledgebase.title")}:
                    </span>
                    <span className="text-sm font-medium">
                      {website.name || "Not Set"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">
                      {t("knowledgebase.maxDepth")}:
                    </span>
                    <span className="text-sm font-medium">
                      {(website as any)?.maxDepth || 3}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">
                      {t("knowledgebase.maxUrls")}:
                    </span>
                    <span className="text-sm font-medium">
                      {(website as any)?.maxUrls || 50}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">
                      {t("knowledgebase.syncSchedule")}:
                    </span>
                    <span className="text-sm font-medium">
                      {website.syncInterval}
                    </span>
                  </div>
                </div>
              </Card>

              {/* Sync Status */}
              <Card className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold">
                    {t("knowledgebase.syncStatus")}
                  </h3>
                  <Button size="sm" className="bg-primary hover:bg-primary/80">
                    <Play className="w-4 h-4 mr-2" />
                    {t("knowledgebase.runNow")}
                  </Button>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">
                      {t("knowledgebase.status")}:
                    </span>
                    {getStatusBadge(website.status)}
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">
                      {t("knowledgebase.pendingUrls")}:
                    </span>
                    <span className="text-sm font-medium">0</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">
                      {t("knowledgebase.visitedUrls")}:
                    </span>
                    <span className="text-sm font-medium">{website.pages}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">
                      {t("knowledgebase.startedAt")}:
                    </span>
                    <span className="text-sm font-medium">
                      Feb 11, 2025, 2:16:43 PM
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">
                      {t("knowledgebase.duration")}:
                    </span>
                    <span className="text-sm font-medium">6 seconds</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">
                      {t("knowledgebase.error")}:
                    </span>
                    <span className="text-sm font-medium text-gray-400">-</span>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {activeTab === "webpages" && (
            <Card>
              <div className="p-6">
                {webpages.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    {t("knowledgebase.noWebpagesYet") ||
                      "No webpages scraped yet. Start scraping to see pages here."}
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            {t("knowledgebase.path")}
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            {t("knowledgebase.status")}
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            {t("knowledgebase.size")}
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            {t("knowledgebase.downloadedAt")}
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {webpages.map((webpage) => (
                          <tr key={webpage.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div>
                                <div className="text-sm font-medium text-gray-900">
                                  {webpage.path === "/"
                                    ? "{ empty }"
                                    : webpage.path}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {webpage.fullUrl
                                    .replace("https://", "")
                                    .replace("http://", "")}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {webpage.contentType}
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <Badge
                                className={
                                  webpage.status === 200
                                    ? "bg-green-100 text-green-800"
                                    : webpage.status === 500
                                      ? "bg-red-100 text-red-800"
                                      : "bg-yellow-100 text-yellow-800"
                                }
                              >
                                {webpage.status === 200
                                  ? "COMPLETED"
                                  : webpage.status === 500
                                    ? "ERROR"
                                    : "PENDING"}
                              </Badge>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {webpage.size}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {webpage.downloadedAt}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </Card>
          )}

          {activeTab === "sync-logs" && (
            <Card>
              <div className="p-6">
                {websiteSyncLogs.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    {t("knowledgebase.noSyncLogsYet") ||
                      "No sync logs yet. The first sync will create a log."}
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Started At
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Duration
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Total URLs
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Success
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Failed
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Skipped
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {websiteSyncLogs.map((log) => (
                          <tr
                            key={log.id}
                            className="hover:bg-gray-50 cursor-pointer"
                            onClick={() =>
                              router.push(
                                `/knowledgebase/websites/${params.id}/sync-logs/${log.id}`
                              )
                            }
                          >
                            <td className="px-6 py-4 whitespace-nowrap">
                              {getSyncLogStatusBadge(log.status)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {formatDate(log.startedAt)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {formatDuration(log.duration)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {log.totalUrls}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="text-sm text-green-600 font-medium">
                                {log.successCount}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="text-sm text-red-600 font-medium">
                                {log.failedCount}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="text-sm text-gray-600 font-medium">
                                {log.skippedCount}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-primary hover:text-indigo-800">
                              View Details →
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </Card>
          )}
        </div>

        {/* Website Configuration Modal */}
        <WebsiteConfigurationModal
          isOpen={isConfigModalOpen}
          onClose={() => setIsConfigModalOpen(false)}
          onSuccess={() => {
            fetchWebsiteDetails();
            setIsConfigModalOpen(false);
          }}
          website={website}
        />
      </div>
    </TrialGuard>
  );
}

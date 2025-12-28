"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Badge, Button, Card } from "@/components/ui";
import { ArrowLeft } from "lucide-react";
import { WebsiteSyncLog, WebsiteSyncLogEntry } from "@/types/knowledgebase";
import { useTranslations } from "next-intl";
import { TrialGuard } from "@/components/guards/TrialGuard";

export default function SyncLogDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [syncLog, setSyncLog] = useState<WebsiteSyncLog | null>(null);
  const [entries, setEntries] = useState<WebsiteSyncLogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const t = useTranslations();

  const fetchSyncLogDetails = useCallback(async () => {
    try {
      const response = await fetch(
        `/api/websites/${params.id}/sync-logs/${params.logId}?limit=100`
      );
      if (response.ok) {
        const data = await response.json();
        setSyncLog(data.syncLog);
        setEntries(data.entries.data || []);
      }
    } catch (error) {
      console.error("Error fetching sync log details:", error);
    } finally {
      setIsLoading(false);
    }
  }, [params.id, params.logId]);

  useEffect(() => {
    if (params.id && params.logId) {
      fetchSyncLogDetails();
    }
  }, [params.id, params.logId, fetchSyncLogDetails]);

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

  const getEntryStatusBadge = (status: WebsiteSyncLogEntry["status"]) => {
    switch (status) {
      case "SUCCESS":
        return <Badge className="bg-green-100 text-green-800">Success</Badge>;
      case "FAILED":
        return <Badge className="bg-red-100 text-red-800">Failed</Badge>;
      case "SKIPPED":
        return <Badge className="bg-yellow-100 text-yellow-800">Skipped</Badge>;
      case "ALREADY_VISITED":
        return (
          <Badge className="bg-blue-100 text-blue-800">Already Visited</Badge>
        );
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

  const formatBytes = (bytes?: number) => {
    if (!bytes) return "-";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
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

  if (!syncLog) {
    return (
      <TrialGuard feature="website">
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => router.back()}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <h1 className="text-2xl font-semibold text-gray-900">
              Sync log not found
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
                Sync Log Details
              </h1>
              <p className="text-sm text-gray-500">
                {formatDate(syncLog.startedAt)}
              </p>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="text-sm text-gray-500 mb-1">Status</div>
            {getSyncLogStatusBadge(syncLog.status)}
          </Card>

          <Card className="p-4">
            <div className="text-sm text-gray-500 mb-1">Duration</div>
            <div className="text-2xl font-semibold">
              {formatDuration(syncLog.duration)}
            </div>
          </Card>

          <Card className="p-4">
            <div className="text-sm text-gray-500 mb-1">Total URLs</div>
            <div className="text-2xl font-semibold">{syncLog.totalUrls}</div>
          </Card>

          <Card className="p-4">
            <div className="text-sm text-gray-500 mb-1">Results</div>
            <div className="flex gap-2 text-sm">
              <span className="text-green-600 font-medium">
                {syncLog.successCount} ✓
              </span>
              <span className="text-red-600 font-medium">
                {syncLog.failedCount} ✗
              </span>
              <span className="text-gray-600 font-medium">
                {syncLog.skippedCount} ⊘
              </span>
            </div>
          </Card>
        </div>

        {/* Error Message (if exists) */}
        {syncLog.errorMessage && (
          <Card className="p-4 bg-red-50 border-red-200">
            <div className="text-sm font-medium text-red-800 mb-1">
              Error Message
            </div>
            <div className="text-sm text-red-700">{syncLog.errorMessage}</div>
          </Card>
        )}

        {/* URL Entries Table */}
        <Card>
          <div className="p-6">
            <h3 className="text-lg font-semibold mb-4">Scraped URLs</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      URL
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Size
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Scraped At
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {entries.map((entry) => (
                    <tr key={entry.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <a
                            href={entry.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-primary hover:text-indigo-800 break-all"
                          >
                            {entry.url}
                          </a>
                          {entry.errorMessage && (
                            <span className="text-xs text-red-600 mt-1">
                              {entry.errorMessage}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getEntryStatusBadge(entry.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatBytes(entry.contentSize)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(entry.scrapedAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </Card>
      </div>
    </TrialGuard>
  );
}

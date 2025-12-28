"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  ExternalLink,
  FileText,
  Link as LinkIcon,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Clock,
} from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { useTranslations } from "next-intl";
import { TrialGuard } from "@/components/guards/TrialGuard";

interface Website {
  id: string;
  url: string;
  name?: string;
  description?: string;
  pageCount: number;
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

interface WebsitePage {
  id: string;
  url: string;
  title?: string;
  content: string;
  links?: string[];
  status: "PENDING" | "SYNCING" | "COMPLETED" | "ERROR";
  errorMessage?: string;
  scrapedAt?: string;
}

export default function WebsiteContentPage() {
  const params = useParams();
  const router = useRouter();
  const [website, setWebsite] = useState<Website | null>(null);
  const [pages, setPages] = useState<WebsitePage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isScraping, setIsScraping] = useState(false);
  const t = useTranslations();

  const websiteId = params.id as string;

  const fetchWebsiteData = useCallback(async () => {
    try {
      setIsLoading(true);

      // Fetch website details
      const websiteResponse = await fetch(`/api/websites/${websiteId}`, {
        credentials: "include",
      });
      if (websiteResponse.ok) {
        const websiteData = await websiteResponse.json();
        setWebsite(websiteData);
      } else {
        console.error(
          "Failed to fetch website:",
          websiteResponse.status,
          websiteResponse.statusText
        );
      }

      // Fetch individual pages
      const pagesResponse = await fetch(`/api/websites/${websiteId}/pages`, {
        credentials: "include",
      });
      if (pagesResponse.ok) {
        const pagesData = await pagesResponse.json();
        setPages(pagesData);
      } else {
        console.error(
          "Failed to fetch pages:",
          pagesResponse.status,
          pagesResponse.statusText
        );
      }
    } catch (error) {
      console.error("Error fetching website data:", error);
      toast({
        title: t("error.title"),
        description: t("error.description"),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [websiteId, t]);

  useEffect(() => {
    if (websiteId) {
      fetchWebsiteData();
    }
  }, [websiteId, fetchWebsiteData]);

  const handleScrapeNow = async () => {
    if (!website) return;

    try {
      setIsScraping(true);
      const response = await fetch(`/api/websites/${websiteId}/scrape`, {
        method: "POST",
        credentials: "include",
      });

      if (response.ok) {
        toast({
          title: t("scraping.started"),
          description: t("scraping.initiated"),
          variant: "success",
        });
        // Refresh data after a short delay
        setTimeout(() => {
          fetchWebsiteData();
        }, 2000);
      } else {
        const error = await response.json();
        throw new Error(error.error || "Failed to start scraping");
      }
    } catch (error) {
      toast({
        title: t("error.title"),
        description:
          error instanceof Error ? error.message : t("error.description"),
        variant: "destructive",
      });
    } finally {
      setIsScraping(false);
    }
  };

  const getStatusIcon = (status: Website["status"]) => {
    switch (status) {
      case "COMPLETED":
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case "PENDING":
        return <Clock className="w-4 h-4 text-yellow-600" />;
      case "SYNCING":
        return <RefreshCw className="w-4 h-4 text-primary animate-spin" />;
      case "ERROR":
        return <AlertCircle className="w-4 h-4 text-red-600" />;
    }
  };

  const getStatusBadge = (status: Website["status"]) => {
    switch (status) {
      case "COMPLETED":
        return (
          <Badge className="bg-green-100 text-green-800">✓ Completed</Badge>
        );
      case "PENDING":
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case "SYNCING":
        return <Badge className="bg-blue-100 text-blue-800">Syncing</Badge>;
      case "ERROR":
        return <Badge className="bg-red-100 text-red-800">Error</Badge>;
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "Never";
    return new Date(dateString).toLocaleString();
  };

  if (isLoading) {
    return (
      <TrialGuard feature="website">
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={() => router.back()}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div className="h-6 bg-gray-200 rounded w-48 animate-pulse"></div>
          </div>
          <div className="space-y-4">
            <div className="h-32 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-64 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </div>
      </TrialGuard>
    );
  }

  if (!website) {
    return (
      <TrialGuard feature="website">
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={() => router.back()}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </div>
          <div className="text-center py-12">
            <AlertCircle className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {t("website.notFound")}
            </h3>
            <p className="text-sm text-gray-500">
              {t("website.notFoundDescription")}
            </p>
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
            <Button variant="outline" onClick={() => router.back()}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">
                {website.name || t("website.content")}
              </h1>
              <div className="flex items-center gap-2 mt-1">
                <ExternalLink className="w-4 h-4 text-gray-400" />
                <a
                  href={website.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-primary hover:text-indigo-800"
                >
                  {website.url}
                </a>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {getStatusIcon(website.status)}
            {getStatusBadge(website.status)}
            <Button
              onClick={handleScrapeNow}
              disabled={isScraping || website.status === "SYNCING"}
              variant="outline"
            >
              <RefreshCw
                className={`w-4 h-4 mr-2 ${isScraping ? "animate-spin" : ""}`}
              />
              {isScraping ? t("website.scraping") : t("website.scrapeNow")}
            </Button>
          </div>
        </div>

        {/* Website Info */}
        <Card className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">
                {t("website.pagesScraped")}
              </h3>
              <p className="text-2xl font-semibold text-gray-900">
                {website.pageCount}
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">
                {t("website.lastSync")}
              </h3>
              <p className="text-sm text-gray-900">
                {formatDate(website.lastSync)}
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">
                {t("website.syncInterval")}
              </h3>
              <p className="text-sm text-gray-900 capitalize">
                {website.syncInterval}
              </p>
            </div>
          </div>
          {website.errorMessage && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <div className="flex items-center">
                <AlertCircle className="w-4 h-4 text-red-600 mr-2" />
                <p className="text-sm text-red-800">{website.errorMessage}</p>
              </div>
            </div>
          )}
        </Card>

        {/* Main Content */}
        {website.scrapedContent && (
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <FileText className="w-5 h-5 text-gray-600" />
              <h2 className="text-lg font-semibold text-gray-900">
                {t("website.scrapedContent")}
              </h2>
            </div>
            <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto">
              <pre className="whitespace-pre-wrap text-sm text-gray-700 font-mono">
                {website.scrapedContent}
              </pre>
            </div>
          </Card>
        )}

        {/* Links */}
        {website.scrapedLinks && website.scrapedLinks.length > 0 && (
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <LinkIcon className="w-5 h-5 text-gray-600" />
              <h2 className="text-lg font-semibold text-gray-900">
                {t("website.foundLinks")} ({website.scrapedLinks.length})
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-96 overflow-y-auto">
              {website.scrapedLinks.map((link, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 p-2 bg-gray-50 rounded border"
                >
                  <ExternalLink className="w-3 h-3 text-gray-400 flex-shrink-0" />
                  <a
                    href={link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary hover:text-indigo-800 truncate"
                  >
                    {link}
                  </a>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Individual Pages */}
        {pages.length > 0 && (
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <FileText className="w-5 h-5 text-gray-600" />
              <h2 className="text-lg font-semibold text-gray-900">
                {t("website.individualPages")} ({pages.length})
              </h2>
            </div>
            <div className="space-y-4">
              {pages.map((page) => (
                <div key={page.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-medium text-gray-900 truncate">
                        {page.title || page.url}
                      </h3>
                      <p className="text-xs text-gray-500 truncate">
                        {page.url}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      {getStatusIcon(page.status)}
                      {getStatusBadge(page.status)}
                    </div>
                  </div>
                  {page.content && (
                    <div className="mt-2 bg-gray-50 rounded p-3 max-h-32 overflow-y-auto">
                      <pre className="whitespace-pre-wrap text-xs text-gray-700 font-mono">
                        {page.content.substring(0, 500)}
                        {page.content.length > 500 && "..."}
                      </pre>
                    </div>
                  )}
                  {page.links && page.links.length > 0 && (
                    <div className="mt-2">
                      <p className="text-xs text-gray-500 mb-1">
                        {page.links.length} {t("website.linksFound")}
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {page.links.slice(0, 5).map((link, index) => (
                          <a
                            key={index}
                            href={link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-primary hover:text-indigo-800 bg-indigo-50 px-2 py-1 rounded"
                          >
                            {new URL(link).hostname}
                          </a>
                        ))}
                        {page.links.length > 5 && (
                          <span className="text-xs text-gray-500 px-2 py-1">
                            +{page.links.length - 5} {t("website.more")}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                  {page.errorMessage && (
                    <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-800">
                      {page.errorMessage}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* No Content State */}
        {!website.scrapedContent && website.status === "COMPLETED" && (
          <Card className="p-6">
            <div className="text-center py-8">
              <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {t("website.noContentFound")}
              </h3>
              <p className="text-sm text-gray-500 mb-4">
                {t("website.noContentFoundDescription")}
              </p>
              <Button onClick={handleScrapeNow} variant="outline">
                <RefreshCw className="w-4 h-4 mr-2" />
                {t("website.tryScrapingAgain")}
              </Button>
            </div>
          </Card>
        )}
      </div>
    </TrialGuard>
  );
}

export interface FAQ {
  id: string;
  question: string;
  answer: string;
  enabled: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface Website {
  id: string;
  url: string;
  name?: string;
  description?: string;
  pages: number;
  syncSpeed?: number;
  syncInterval: string;
  maxDepth?: number;
  maxUrls?: number;
  lastSync?: string;
  status: "PENDING" | "SYNCING" | "COMPLETED" | "ERROR";
  errorMessage?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Webpage {
  id: string;
  path: string;
  fullUrl: string;
  status: number;
  size: string;
  downloadedAt: string;
  contentType: string;
}

export interface SyncLog {
  id: string;
  type: string;
  message: string;
  timestamp: string;
  url?: string;
}

export interface WebsiteSyncLog {
  id: string;
  websiteId: string;
  status: "RUNNING" | "COMPLETED" | "FAILED";
  startedAt: string;
  completedAt?: string;
  duration?: number;
  totalUrls: number;
  successCount: number;
  failedCount: number;
  skippedCount: number;
  errorMessage?: string;
  createdAt: string;
  updatedAt: string;
}

export interface WebsiteSyncLogEntry {
  id: string;
  syncLogId: string;
  url: string;
  status: "SUCCESS" | "FAILED" | "SKIPPED" | "ALREADY_VISITED";
  statusCode?: number;
  errorMessage?: string;
  contentSize?: number;
  scrapedAt: string;
  createdAt: string;
}

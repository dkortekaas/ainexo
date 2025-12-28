"use client";

import { useEffect, useState } from "react";
import { ConversationSessionTable } from "@/components/conversations/conversation-session-table";
import { ConversationFilters } from "@/components/conversations/conversation-filters";
import { Pagination } from "@/components/ui/Pagination";
import { useAssistant } from "@/contexts/assistant-context";
import { useTranslations } from "next-intl";

interface Filters {
  type: string;
  time: string;
  duration: string;
}

interface ConversationSource {
  id: string;
  chunkContent: string;
  relevanceScore: number | null;
  document: {
    id: string;
    name: string;
    type: string;
  };
}

interface ConversationMessage {
  id: string;
  messageType: "USER" | "ASSISTANT" | "SYSTEM";
  content: string;
  responseTime: number | null;
  tokensUsed: number | null;
  model: string | null;
  confidence: number | null;
  createdAt: string;
  sources: ConversationSource[];
}

interface ConversationSession {
  id: string;
  sessionId: string;
  assistantId: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  referrer: string | null;
  startedAt: string;
  lastActivity: string;
  messageCount: number;
  totalTokens: number;
  avgResponseTime: number | null;
  rating: number | null;
  ratingNotes: string | null;
  ratedAt: string | null;
  ratedBy: string | null;
  isActive: boolean;
  messages: ConversationMessage[];
}

interface ApiResponse {
  sessions: ConversationSession[];
  total: number;
  page: number;
  pageSize: number;
}

export function ConversationList() {
  const [filters, setFilters] = useState<Filters>({
    type: "all",
    time: "all",
    duration: "all",
  });
  const { currentAssistant } = useAssistant();
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [isLoading, setIsLoading] = useState(false);
  const [totalItems, setTotalItems] = useState(0);
  const [sessions, setSessions] = useState<ConversationSession[]>([]);
  const t = useTranslations();

  useEffect(() => {
    const fetchSessions = async () => {
      if (!currentAssistant?.id) return;
      setIsLoading(true);
      try {
        const params = new URLSearchParams({
          assistantId: currentAssistant.id,
          page: String(currentPage),
          pageSize: String(pageSize),
        });
        const res = await fetch(
          `/api/conversations/sessions?${params.toString()}`
        );
        if (res.ok) {
          const data: ApiResponse = await res.json();
          setSessions(data.sessions);
          setTotalItems(data.total);
        } else {
          setSessions([]);
          setTotalItems(0);
        }
      } finally {
        setIsLoading(false);
      }
    };
    fetchSessions();
  }, [currentAssistant?.id, currentPage, pageSize]);

  const totalPages = Math.ceil((totalItems || 0) / pageSize);

  return (
    <div className="space-y-6">
      <ConversationFilters filters={filters} onChange={setFilters} />
      {isLoading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <ConversationSessionTable sessions={sessions} />
      )}

      {totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalItems}
          itemsPerPage={pageSize}
          onPageChange={setCurrentPage}
        />
      )}
    </div>
  );
}

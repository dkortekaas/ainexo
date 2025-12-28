"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { useAssistant } from "@/contexts/assistant-context";
import { MessageSquare, Star, AlertCircle } from "lucide-react";
import { useTranslations } from "next-intl";

interface ConversationStatsProps {
  all: number;
  conversations: number;
  empty: number;
}

interface StatsData {
  totalSessions: number;
  activeSessions: number;
  totalMessages: number;
  avgMessagesPerSession: number;
}

export function ConversationStats({
  all,
  conversations,
  empty,
}: ConversationStatsProps) {
  const { currentAssistant } = useAssistant();
  const [stats, setStats] = useState<StatsData>({
    totalSessions: 0,
    activeSessions: 0,
    totalMessages: 0,
    avgMessagesPerSession: 0,
  });
  const [isLoading, setIsLoading] = useState(false);
  const t = useTranslations();

  useEffect(() => {
    const fetchStats = async () => {
      if (!currentAssistant?.id) return;
      setIsLoading(true);
      try {
        const res = await fetch(
          `/api/conversations/sessions/stats?assistantId=${currentAssistant.id}`
        );
        if (res.ok) {
          const data = await res.json();
          setStats(data);
        }
      } catch (error) {
        console.error("Error fetching conversation session stats:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchStats();
  }, [currentAssistant?.id]);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="text-center">
                <div className="animate-pulse bg-gray-200 h-8 w-16 mx-auto mb-2 rounded"></div>
                <div className="animate-pulse bg-gray-200 h-4 w-12 mx-auto rounded"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <Card>
        <CardContent className="p-4">
          <div className="text-center">
            <div className="flex items-center justify-center mb-2">
              <MessageSquare className="h-5 w-5 text-blue-600 mr-2" />
              <div className="text-2xl font-bold text-gray-900">
                {stats.totalSessions.toLocaleString()}
              </div>
            </div>
            <div className="text-sm text-gray-500">
              {t("conversations.stats.total")}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="text-center">
            <div className="flex items-center justify-center mb-2">
              <Star className="h-5 w-5 text-green-600 mr-2" />
              <div className="text-2xl font-bold text-gray-900">
                {stats.activeSessions.toLocaleString()}
              </div>
            </div>
            <div className="text-sm text-gray-500">
              {t("conversations.stats.active")}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="text-center">
            <div className="flex items-center justify-center mb-2">
              <AlertCircle className="h-5 w-5 text-purple-600 mr-2" />
              <div className="text-2xl font-bold text-gray-900">
                {stats.totalMessages.toLocaleString()}
              </div>
            </div>
            <div className="text-sm text-gray-500">
              {t("conversations.stats.totalMessages")}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="text-center">
            <div className="flex items-center justify-center mb-2">
              <MessageSquare className="h-5 w-5 text-orange-600 mr-2" />
              <div className="text-2xl font-bold text-gray-900">
                {stats.avgMessagesPerSession.toLocaleString()}
              </div>
            </div>
            <div className="text-sm text-gray-500">
              {t("conversations.stats.avgMessagesPerSession")}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

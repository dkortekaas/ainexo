"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ChevronDown,
  ChevronRight,
  Star,
  Clock,
  MessageSquare,
  FileText,
  User,
  Bot,
  Calendar,
  Activity,
} from "lucide-react";
import { useTranslations } from "next-intl";

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

interface ConversationSessionTableProps {
  sessions: ConversationSession[];
}

export function ConversationSessionTable({
  sessions,
}: ConversationSessionTableProps) {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const t = useTranslations();

  const toggleRow = (sessionId: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(sessionId)) {
      newExpanded.delete(sessionId);
    } else {
      newExpanded.add(sessionId);
    }
    setExpandedRows(newExpanded);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("nl-NL", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDuration = (startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffMs = end.getTime() - start.getTime();
    const diffMins = Math.round(diffMs / (1000 * 60));

    if (diffMins < 60) {
      return `${diffMins} min`;
    } else {
      const hours = Math.floor(diffMins / 60);
      const mins = diffMins % 60;
      return `${hours}u ${mins}min`;
    }
  };

  const truncateText = (text: string, maxLength: number = 100) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  };

  const getMessageIcon = (messageType: string) => {
    switch (messageType) {
      case "USER":
        return <User className="h-4 w-4 text-blue-600" />;
      case "ASSISTANT":
        return <Bot className="h-4 w-4 text-green-600" />;
      case "SYSTEM":
        return <MessageSquare className="h-4 w-4 text-gray-600" />;
      default:
        return <MessageSquare className="h-4 w-4 text-gray-600" />;
    }
  };

  return (
    <div className="space-y-4">
      {sessions.map((session) => {
        const isExpanded = expandedRows.has(session.sessionId);
        const firstMessage = session.messages.find(
          (m) => m.messageType === "USER"
        );
        const lastMessage = session.messages[session.messages.length - 1];

        return (
          <Card key={session.sessionId} className="overflow-hidden">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-500">
                      {formatDate(session.startedAt)}
                    </span>
                    <span className="text-sm text-gray-400">•</span>
                    <span className="text-sm text-gray-500">
                      {formatDuration(session.startedAt, session.lastActivity)}
                    </span>
                    {session.rating && (
                      <div className="flex items-center gap-1">
                        <Star className="h-3 w-3 text-yellow-500 fill-current" />
                        <span className="text-sm text-gray-600">
                          {session.rating}/5
                        </span>
                      </div>
                    )}
                  </div>
                  <CardTitle className="text-base font-medium text-gray-900 mb-2">
                    {firstMessage
                      ? truncateText(firstMessage.content, 120)
                      : t("conversations.conversationSession")}
                  </CardTitle>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <MessageSquare className="h-3 w-3" />
                      <span>
                        {session.messageCount} {t("conversations.messages")}
                      </span>
                    </div>
                    {session.totalTokens > 0 && (
                      <div className="flex items-center gap-1">
                        <FileText className="h-3 w-3" />
                        <span>
                          {session.totalTokens} {t("conversations.tokens")}
                        </span>
                      </div>
                    )}
                    {session.avgResponseTime && (
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>
                          {t("conversations.avg")}: {session.avgResponseTime}ms
                        </span>
                      </div>
                    )}
                    <Badge
                      variant={session.isActive ? "default" : "secondary"}
                      className="text-xs"
                    >
                      {session.isActive
                        ? t("conversations.active")
                        : t("common.inactive")}
                    </Badge>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleRow(session.sessionId)}
                  className="ml-4"
                >
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </CardHeader>

            {isExpanded && (
              <CardContent className="pt-0 border-t">
                <div className="space-y-4">
                  {/* Messages */}
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">
                      {t("conversations.messages")}:
                    </h4>
                    <div className="space-y-3">
                      {session.messages.map((message, index) => (
                        <div key={message.id} className="flex gap-3">
                          <div className="flex-shrink-0 mt-1">
                            {getMessageIcon(message.messageType)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm font-medium text-gray-700">
                                {message.messageType === "USER"
                                  ? t("conversations.user")
                                  : message.messageType === "ASSISTANT"
                                    ? t("conversations.assistant")
                                    : t("common.system")}
                              </span>
                              <span className="text-xs text-gray-500">
                                {formatDate(message.createdAt)}
                              </span>
                              {message.responseTime && (
                                <Badge variant="outline" className="text-xs">
                                  {message.responseTime}ms
                                </Badge>
                              )}
                              {message.confidence && (
                                <Badge variant="outline" className="text-xs">
                                  {Math.round(message.confidence * 100)}%
                                  {t("conversations.confidence")}
                                </Badge>
                              )}
                            </div>
                            <div
                              className={`p-3 rounded-lg text-sm ${
                                message.messageType === "USER"
                                  ? "bg-blue-50 text-blue-900"
                                  : message.messageType === "ASSISTANT"
                                    ? "bg-green-50 text-green-900"
                                    : "bg-gray-50 text-gray-700"
                              }`}
                            >
                              {message.content}
                            </div>

                            {/* Sources for assistant messages */}
                            {message.sources && message.sources.length > 0 && (
                              <div className="mt-2 space-y-1">
                                {message.sources.map((source) => (
                                  <div
                                    key={source.id}
                                    className="bg-blue-50 p-2 rounded text-xs"
                                  >
                                    <div className="flex items-center justify-between">
                                      <span className="font-medium text-blue-900">
                                        {source.document.name}
                                      </span>
                                      {source.relevanceScore && (
                                        <Badge
                                          variant="outline"
                                          className="text-xs"
                                        >
                                          {Math.round(
                                            source.relevanceScore * 100
                                          )}
                                          % {t("conversations.relevant")}
                                        </Badge>
                                      )}
                                    </div>
                                    <p className="text-blue-800 mt-1">
                                      {truncateText(source.chunkContent, 150)}
                                    </p>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Session Details */}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-gray-700">
                        {t("conversations.sessionId")}:
                      </span>
                      <p className="text-gray-600 font-mono text-xs">
                        {session.sessionId}
                      </p>
                    </div>
                    {session.ipAddress && (
                      <div>
                        <span className="font-medium text-gray-700">
                          {t("conversations.ipAddress")}:
                        </span>
                        <p className="text-gray-600 font-mono text-xs">
                          {session.ipAddress}
                        </p>
                      </div>
                    )}
                    <div>
                      <span className="font-medium text-gray-700">
                        {t("conversations.startedAt")}:
                      </span>
                      <p className="text-gray-600">
                        {formatDate(session.startedAt)}
                      </p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">
                        {t("conversations.lastActivity")}:
                      </span>
                      <p className="text-gray-600">
                        {formatDate(session.lastActivity)}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            )}
          </Card>
        );
      })}

      {sessions.length === 0 && (
        <div className="text-center py-12">
          <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {t("conversations.noSessionsFound")}
          </h3>
          <p className="text-gray-500">
            {t("conversations.noSessionsFoundDescription")}
          </p>
        </div>
      )}
    </div>
  );
}

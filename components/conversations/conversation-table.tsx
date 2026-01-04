"use client";

import { useState, memo } from "react";
import { useLocale } from "next-intl";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ChevronDown,
  ChevronRight,
  Eye,
  Star,
  Clock,
  MessageSquare,
  FileText,
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

interface Conversation {
  id: string;
  sessionId: string;
  question: string;
  answer: string;
  responseTime: number | null;
  rating: number | null;
  createdAt: string;
  tokensUsed: number | null;
  confidence: number | null;
  model: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  sources: ConversationSource[];
}

interface ConversationTableProps {
  conversations: Conversation[];
}

const ConversationTableComponent = ({ conversations }: ConversationTableProps) => {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const t = useTranslations();
  const locale = useLocale();

  const toggleRow = (conversationId: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(conversationId)) {
      newExpanded.delete(conversationId);
    } else {
      newExpanded.add(conversationId);
    }
    setExpandedRows(newExpanded);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(locale, {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const truncateText = (text: string, maxLength: number = 100) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  };

  return (
    <div className="space-y-4">
      {conversations.map((conversation) => {
        const isExpanded = expandedRows.has(conversation.id);

        return (
          <Card key={conversation.id} className="overflow-hidden">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <MessageSquare className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-500">
                      {formatDate(conversation.createdAt)}
                    </span>
                    {conversation.rating && (
                      <div className="flex items-center gap-1">
                        <Star className="h-3 w-3 text-yellow-500 fill-current" />
                        <span className="text-sm text-gray-600">
                          {conversation.rating}/5
                        </span>
                      </div>
                    )}
                  </div>
                  <CardTitle className="text-base font-medium text-gray-900 mb-2">
                    {truncateText(conversation.question, 120)}
                  </CardTitle>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    {conversation.responseTime && (
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>
                          {conversation.responseTime} {t("conversations.ms")}
                        </span>
                      </div>
                    )}
                    {conversation.tokensUsed && (
                      <div className="flex items-center gap-1">
                        <FileText className="h-3 w-3" />
                        <span>
                          {conversation.tokensUsed} {t("conversations.tokens")}
                        </span>
                      </div>
                    )}
                    {conversation.confidence && (
                      <Badge variant="outline" className="text-xs">
                        {Math.round(conversation.confidence * 100)}%
                        {t("conversations.confidence")}
                      </Badge>
                    )}
                    {conversation.sources.length > 0 && (
                      <Badge variant="secondary" className="text-xs">
                        {conversation.sources.length}{" "}
                        {t("conversations.source")}
                        {conversation.sources.length !== 1 ? "s" : ""}
                      </Badge>
                    )}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleRow(conversation.id)}
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
                  {/* Answer */}
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">
                      {t("conversations.answer")}:
                    </h4>
                    <div className="bg-gray-50 p-3 rounded-lg text-sm text-gray-700">
                      {conversation.answer}
                    </div>
                  </div>

                  {/* Sources */}
                  {conversation.sources.length > 0 && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">
                        {t("conversations.sources")}:
                      </h4>
                      <div className="space-y-2">
                        {conversation.sources.map((source) => (
                          <div
                            key={source.id}
                            className="bg-blue-50 p-3 rounded-lg"
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-medium text-sm text-blue-900">
                                {source.document.name}
                              </span>
                              {source.relevanceScore && (
                                <Badge variant="outline" className="text-xs">
                                  {Math.round(source.relevanceScore * 100)}%
                                  {t("conversations.relevant")}
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-blue-800">
                              {truncateText(source.chunkContent, 200)}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Technical Details */}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-gray-700">
                        {t("conversations.sessionId")}:
                      </span>
                      <p className="text-gray-600 font-mono text-xs">
                        {conversation.sessionId}
                      </p>
                    </div>
                    {conversation.model && (
                      <div>
                        <span className="font-medium text-gray-700">
                          {t("conversations.model")}:
                        </span>
                        <p className="text-gray-600">{conversation.model}</p>
                      </div>
                    )}
                    {conversation.ipAddress && (
                      <div>
                        <span className="font-medium text-gray-700">
                          {t("conversations.ipAddress")}:
                        </span>
                        <p className="text-gray-600 font-mono text-xs">
                          {conversation.ipAddress}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            )}
          </Card>
        );
      })}

      {conversations.length === 0 && (
        <div className="text-center py-12">
          <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {t("conversations.noConversationsFound")}
          </h3>
          <p className="text-gray-500">
            {t("conversations.noConversationsFoundDescription")}
          </p>
        </div>
      )}
    </div>
  );
};

ConversationTableComponent.displayName = "ConversationTable";

// Memoize to prevent unnecessary re-renders
export const ConversationTable = memo(ConversationTableComponent);

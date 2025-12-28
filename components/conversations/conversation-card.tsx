import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Star, Clock, User } from "lucide-react";
import { useTranslations } from "next-intl";

interface Conversation {
  id: string;
  userId: string;
  messages: number;
  rating: number | null;
  startedAt: string;
  lastMessageAt: string;
  status: "active" | "completed";
  topic: string;
}

interface ConversationCardProps {
  conversation: Conversation;
}

export function ConversationCard({ conversation }: ConversationCardProps) {
  const t = useTranslations();

  const getStatusColor = () => {
    switch (conversation.status) {
      case "active":
        return "default";
      case "completed":
        return "secondary";
      default:
        return "secondary";
    }
  };

  const getStatusText = () => {
    switch (conversation.status) {
      case "active":
        return t("conversations.active");
      case "completed":
        return t("conversations.completed");
      default:
        return t("conversations.unknown");
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString("nl-NL", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <Link href={`/dashboard/conversations/${conversation.id}`}>
      <Card className="hover:shadow-md transition-shadow cursor-pointer">
        <CardContent className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2 mb-2">
                <h3 className="font-medium text-sm truncate">
                  {conversation.topic}
                </h3>
                <Badge variant={getStatusColor()}>{getStatusText()}</Badge>
              </div>

              <div className="flex items-center space-x-4 text-xs text-gray-500">
                <span className="flex items-center space-x-1">
                  <User className="h-3 w-3" />
                  <span>{conversation.userId}</span>
                </span>
                <span className="flex items-center space-x-1">
                  <MessageSquare className="h-3 w-3" />
                  <span>
                    {conversation.messages} {t("conversations.messages")}
                  </span>
                </span>
                <span className="flex items-center space-x-1">
                  <Clock className="h-3 w-3" />
                  <span>{formatTime(conversation.lastMessageAt)}</span>
                </span>
              </div>
            </div>

            <div className="flex items-center space-x-2 ml-4">
              {conversation.rating && (
                <div className="flex items-center space-x-1">
                  <Star className="h-4 w-4 text-yellow-400 fill-current" />
                  <span className="text-sm font-medium">
                    {conversation.rating}
                  </span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

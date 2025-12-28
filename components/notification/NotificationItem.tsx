// components/notification/NotificationItem.tsx

"use client";

import { Notification } from "@prisma/client";
import { format } from "date-fns";
import { nl } from "date-fns/locale";
import { useTranslations } from "next-intl";
import { useSession } from "next-auth/react";
import { useState } from "react";
import { X } from "lucide-react";
import { logger } from "@/lib/logger";
import {
  Button,
  Badge,
  Card,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui";

interface NotificationItemProps {
  notification: Notification;
  onDelete?: (id: string) => void;
}

export function NotificationItem({
  notification,
  onDelete,
}: NotificationItemProps) {
  const [isRead, setIsRead] = useState(notification.isRead);
  const t = useTranslations();
  const { data: session } = useSession();

  const handleClick = async () => {
    if (!isRead) {
      try {
        const response = await fetch("/api/notifications/read", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            notificationId: notification.id,
          }),
        });

        if (response.ok) {
          setIsRead(true);
        }
      } catch (error) {
        logger.error("Error marking notification as read", {
          context: {
            error: error instanceof Error ? error.message : String(error),
          },
          userId: session?.user.id,
          companyId: session?.user.companyId,
        });
      }
    }
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const response = await fetch(`/api/notifications/${notification.id}`, {
        method: "DELETE",
      });

      if (response.ok && onDelete) {
        onDelete(notification.id);
      }
    } catch (error) {
      logger.error("Error deleting notification", {
        context: {
          error: error instanceof Error ? error.message : String(error),
        },
        userId: session?.user.id,
        companyId: session?.user.companyId,
      });
    }
  };

  return (
    <Card onClick={handleClick}>
      <CardHeader className="relative">
        <div className="absolute -top-3 right-4 flex gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 hover:bg-gray-100 dark:hover:bg-gray-800"
            onClick={handleDelete}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        {!isRead && (
          <Badge className="bg-primary text-white -mt-3 mb-2">
            {t("notifications.new")}
          </Badge>
        )}
        <CardTitle className="leading-5">{notification.message}</CardTitle>
      </CardHeader>
      <CardFooter className="text-xs text-gray-500 dark:text-gray-400">
        {format(new Date(notification.createdAt), "d MMMM yyyy 'at' HH:mm", {
          locale: nl,
        })}
      </CardFooter>
    </Card>
  );
}

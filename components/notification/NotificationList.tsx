"use client";

import { Notification } from "@prisma/client";
import { NotificationItem } from "@/components/notification/NotificationItem";
import { useState, useEffect, useRef } from "react";
import { useToast } from "@/components/ui/use-toast";
import { useTranslations } from "next-intl";
import { useSession } from "next-auth/react";
import { logger } from "@/lib/logger";

interface NotificationListProps {
  initialNotifications: Notification[];
}

export function NotificationList({
  initialNotifications,
}: NotificationListProps) {
  const [notifications, setNotifications] = useState(initialNotifications);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const { toast } = useToast();
  const t = useTranslations();
  const { data: session } = useSession();

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      const response = await fetch(`/api/notifications/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        // Wait for animation to complete before removing from state
        setTimeout(() => {
          setNotifications(notifications.filter((n) => n.id !== id));
          setDeletingId(null);
        }, 300);
        toast({
          title: t("notifications.notificationDeleted"),
          variant: "default",
          duration: 3000,
        });
      } else {
        setDeletingId(null);
        toast({
          title: t("notifications.errorDeletingNotification"),
          variant: "destructive",
          duration: 3000,
        });
        return;
      }
    } catch (error) {
      setDeletingId(null);
      logger.error("Error deleting notification", {
        context: {
          error: error instanceof Error ? error.message : String(error),
        },
        userId: session?.user.id,
        companyId: session?.user.companyId,
      });
      toast({
        title: t("notifications.errorDeletingNotification"),
        variant: "destructive",
        duration: 3000,
      });
      return;
    }
  };

  return (
    <div className="space-y-4">
      {notifications.length === 0 ? (
        <p className="text-gray-500 dark:text-gray-400 text-center">
          {t("notifications.noNotifications")}
        </p>
      ) : (
        <>
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className={`transition-all duration-300 ${
                deletingId === notification.id
                  ? "opacity-0 scale-95 -translate-y-2"
                  : "opacity-100 scale-100 translate-y-0"
              }`}
            >
              <NotificationItem
                notification={notification}
                onDelete={handleDelete}
              />
            </div>
          ))}
        </>
      )}
    </div>
  );
}

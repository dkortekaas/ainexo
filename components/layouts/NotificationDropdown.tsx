"use client";

import { useState, useEffect, useRef } from "react";
import { Bell, ChevronLeft } from "lucide-react";
import { Notification } from "@prisma/client";
import { useTranslations } from "next-intl";

export default function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const lastNotificationId = useRef<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [fullScreenOpen, setFullScreenOpen] = useState(false);
  const t = useTranslations();

  // Check if we're on mobile
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkIfMobile();
    window.addEventListener("resize", checkIfMobile);

    return () => {
      window.removeEventListener("resize", checkIfMobile);
    };
  }, []);

  // Fetch notifications on component mount
  useEffect(() => {
    fetchNotifications();

    // Set up polling interval
    const interval = setInterval(fetchNotifications, 30000); // Poll every 30 seconds

    return () => clearInterval(interval);
  }, []);

  // Close dropdown when clicking outside (desktop only)
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        !isMobile &&
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isMobile]);

  // Lock body scroll when fullscreen mobile view is open
  useEffect(() => {
    if (fullScreenOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [fullScreenOpen]);

  const fetchNotifications = async () => {
    try {
      const response = await fetch("/api/notifications");
      if (!response.ok) {
        throw new Error("Failed to fetch notifications");
      }

      const data = await response.json();

      // Set the last notification ID after the first fetch
      if (lastNotificationId.current === null && data.length > 0) {
        lastNotificationId.current = data[0].id;
      }

      // Check for new notifications
      if (lastNotificationId.current !== null && data.length > 0) {
        const newNotifications = data.filter(
          (notification: Notification) =>
            notification.id !== lastNotificationId.current
        );

        if (newNotifications.length > 0) {
          // Update the last notification ID
          lastNotificationId.current = data[0].id;
        }
      }

      setNotifications(data);
      setUnreadCount(data.filter((n: Notification) => !n.isRead).length);
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      const response = await fetch("/api/notifications/read", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ notificationId: id }),
      });

      if (!response.ok) {
        throw new Error("Failed to mark notification as read");
      }

      // Update the local state
      setNotifications(
        notifications.map((notification) =>
          notification.id === id
            ? { ...notification, isRead: true }
            : notification
        )
      );

      // Update unread count
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const unreadNotifications = notifications.filter((n) => !n.isRead);

      // Mark each unread notification as read
      await Promise.all(
        unreadNotifications.map((notification) =>
          fetch("/api/notifications/read", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ notificationId: notification.id }),
          })
        )
      );

      // Update the local state
      setNotifications(
        notifications.map((notification) => ({ ...notification, isRead: true }))
      );

      // Reset unread count
      setUnreadCount(0);
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
    }
  };

  // Format date for notifications
  const formatDate = (date: Date) => {
    const now = new Date();
    const notificationDate = new Date(date);

    // Check if it's today
    if (notificationDate.toDateString() === now.toDateString()) {
      return notificationDate.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    }

    // Check if it's yesterday
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    if (notificationDate.toDateString() === yesterday.toDateString()) {
      return t("common.yesterday");
    }

    // Default to date
    return notificationDate.toLocaleDateString();
  };

  // Handle clicking notification bell
  const handleBellClick = () => {
    if (isMobile) {
      setFullScreenOpen(true);
    } else {
      setIsOpen(!isOpen);
    }
  };

  // Handle clicking a notification
  const handleNotificationClick = (notification: Notification) => {
    if (!notification.isRead) {
      handleMarkAsRead(notification.id);
    }
  };

  // Mobile fullscreen notification panel
  if (isMobile && fullScreenOpen) {
    return (
      <div className="fixed inset-0 bg-white dark:bg-gray-800 z-50 flex flex-col">
        <div className="sticky top-0 border-b border-gray-200 dark:border-gray-700">
          <div className="p-4 flex items-center justify-between">
            <button
              onClick={() => setFullScreenOpen(false)}
              className="p-2 -ml-2 text-gray-500 dark:text-gray-400"
            >
              <ChevronLeft size={24} />
            </button>
            <h1 className="text-lg font-medium text-center flex-1 text-gray-900 dark:text-gray-100">
              {t("notifications.title")}
            </h1>
            {notifications.length > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="text-sm text-primary dark:text-primary"
              >
                {t("notifications.markAllAsRead")}
              </button>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-auto custom-scrollbar">
          {loading ? (
            <div className="flex items-center justify-center h-40">
              <div className="animate-spin h-6 w-6 border-t-2 border-primary dark:border-primary rounded-full"></div>
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full p-4 text-gray-500 dark:text-gray-400">
              <Bell
                size={48}
                className="text-gray-300 dark:text-gray-600 mb-4"
              />
              <p>{t("notifications.noNotifications")}</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-700">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`p-4 ${!notification.isRead ? "bg-indigo-50 dark:bg-blue-900/20" : ""} cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <p className="text-sm text-gray-900 dark:text-gray-100">
                        {notification.message}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {formatDate(notification.createdAt)}
                      </p>
                    </div>
                    {!notification.isRead && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
                        {t("notifications.new")}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Desktop dropdown
  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={handleBellClick}
        className="relative rounded-lg p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 -mt-1 -mr-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-md shadow-lg py-1 z-50 ring-1 ring-gray-200 dark:ring-gray-700">
          <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
            <h2 className="text-sm font-medium text-gray-900 dark:text-gray-100">
              {t("notifications.title")}
            </h2>
            {notifications.length > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="text-xs text-primary dark:text-primary hover:text-primary dark:hover:text-indigo-300"
              >
                {t("notifications.markAllAsRead")}
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-auto custom-scrollbar">
            {loading ? (
              <div className="flex items-center justify-center h-40">
                <div className="animate-spin h-6 w-6 border-t-2 border-primary dark:border-primary rounded-full"></div>
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 p-4 text-gray-500 dark:text-gray-400">
                <Bell
                  size={32}
                  className="text-gray-300 dark:text-gray-600 mb-2"
                />
                <p className="text-sm">{t("notifications.noNotifications")}</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100 dark:divide-gray-700">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={`px-4 py-3 ${!notification.isRead ? "bg-indigo-50 dark:bg-blue-900/20" : ""} cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <p className="text-sm text-gray-900 dark:text-gray-100">
                          {notification.message}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {formatDate(notification.createdAt)}
                        </p>
                      </div>
                      {!notification.isRead && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
                          {t("notifications.new")}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

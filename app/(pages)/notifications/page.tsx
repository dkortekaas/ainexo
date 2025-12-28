import { getAuthSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/layouts";
import { NotificationList } from "@/components/notification/NotificationList";
import { redirect } from "next/navigation";

export default async function NotificationsPage() {
  const session = await getAuthSession();
  const t = await getTranslations();

  if (!session?.user) {
    redirect("/login");
  }

  // Fetch notifications for the current user
  const notifications = await db.notification.findMany({
    where: {
      isActive: true,
      AND: [
        {
          OR: [
            { targetUsers: { has: session.user.id } },
            { targetUsers: { isEmpty: true } }, // Empty array means all users
          ],
        },
        {
          OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
        },
      ],
    },
    include: {
      createdByUser: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
    orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
  });

  return (
    <div className="space-y-8">
      <PageHeader
        title={t("notifications.title")}
        description={t("notifications.description")}
      />

      <div className="flex justify-center">
        <div className="w-full max-w-2xl p-6">
          <NotificationList initialNotifications={notifications} />
        </div>
      </div>
    </div>
  );
}

import { getTranslations } from "next-intl/server";
import { db } from "@/lib/db";

export async function AdminDashboard() {
  const t = await getTranslations();

  // Get total number of users
  const totalUsers = await db.user.count();

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <div className="flex flex-col">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
              {t("dashboard.totalUsers")}
            </h3>
            <div className="text-2xl font-bold mt-2">{totalUsers}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

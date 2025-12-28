// app/(pages)/dashboard/page.tsx
import { getAuthSession } from "@/lib/auth";
import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import DashboardCharts from "@/components/dashboard/DashboardCharts";
import { TrialDashboardWidgets } from "@/components/dashboard/TrialDashboardWidgets";
import { AssistantOverview } from "@/components/dashboard/AssistantOverview";

async function getDashboardData() {
  const session = await getAuthSession();

  if (!session?.user) {
    redirect("/auth/signin");
  }
}

export default async function Dashboard() {
  const session = await getAuthSession();
  const t = await getTranslations();

  return (
    <div className="space-y-4 sm:space-y-6 bg-gray-50 dark:bg-gray-900 min-h-screen p-4 sm:p-6">
      <div className="flex flex-col items-start gap-2 sm:gap-0 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
            {t("dashboard.title")}
          </h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1">
            {t("dashboard.welcome", { name: session?.user?.name || "" })}
          </p>
        </div>
      </div>

      {/* Trial Status & Quota Widgets */}
      <TrialDashboardWidgets />

      {/* Assistant Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <AssistantOverview />
      </div>

      {/* Dashboard Widgets */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <DashboardCharts />
      </div>
    </div>
  );
}

"use client";

import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";

// Lazy load charts for better performance (recharts is heavy ~240KB)
const ConversationChart = dynamic(
  () => import("@/components/dashboard/ConversationChart"),
  {
    loading: () => (
      <div className="flex items-center justify-center p-8 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    ),
    ssr: false,
  }
);

const KnowledgeSourceChart = dynamic(
  () => import("@/components/dashboard/KnowledgeSourceChart"),
  {
    loading: () => (
      <div className="flex items-center justify-center p-8 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    ),
    ssr: false,
  }
);

export default function DashboardCharts() {
  return (
    <>
      <ConversationChart />
      <KnowledgeSourceChart />
    </>
  );
}


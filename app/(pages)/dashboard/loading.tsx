import { RefreshCw } from "lucide-react";

export default function DashboardLoading() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <RefreshCw className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          Loading Dashboard
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Please wait while we load your data...
        </p>
      </div>
    </div>
  );
}

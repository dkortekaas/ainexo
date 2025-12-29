"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertCircle, RefreshCw, Home } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

export default function KnowledgebaseError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations("knowledgebase");
  const router = useRouter();

  useEffect(() => {
    // Log error to error reporting service (e.g., Sentry)
    console.error("Knowledgebase error:", error.message);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <div className="max-w-md w-full space-y-8 text-center">
        <div className="flex justify-center">
          <AlertCircle className="h-24 w-24 text-red-500" />
        </div>

        <div className="space-y-3">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {t("errorDetails.title")}
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            {t("errorDetails.description")}
          </p>
          {error.message && (
            <p className="text-sm text-gray-500 dark:text-gray-500 mt-2 font-mono bg-gray-100 dark:bg-gray-800 p-3 rounded-md">
              {error.message}
            </p>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center mt-8">
          <Button onClick={reset} className="bg-primary hover:bg-primary/80">
            <RefreshCw className="w-4 h-4 mr-2" />
            {t("errorDetails.tryAgain")}
          </Button>
          <Button onClick={() => router.push("/dashboard")} variant="outline">
            <Home className="w-4 h-4 mr-2" />
            {t("errorDetails.backToDashboard")}
          </Button>
        </div>

        {error.digest && (
          <p className="text-xs text-gray-400 mt-6">
            {t("errorDetails.errorReference")}: {error.digest}
          </p>
        )}
      </div>
    </div>
  );
}

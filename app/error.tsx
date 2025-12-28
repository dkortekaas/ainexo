"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useToast } from "@/components/ui/use-toast";
import * as Sentry from "@sentry/nextjs";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations();
  const { toast } = useToast();
  useEffect(() => {
    // Log the error to Sentry
    Sentry.captureException(error, {
      tags: {
        component: "error-boundary",
      },
      extra: {
        digest: error.digest,
      },
    });

    // Also log to console in development
    if (process.env.NODE_ENV === "development") {
      console.error(error);
    }
  }, [error]);

  return (
    <div className="h-screen w-full flex flex-col items-center justify-center bg-gray-100">
      <div className="flex flex-col items-center justify-center">
        <div className="rounded-full bg-red-100 p-6 mb-6">
          <svg
            className="h-16 w-16 text-red-600"
            fill="none"
            height="24"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            viewBox="0 0 24 24"
            width="24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M12 9v4" />
            <path d="M12 17h.01" />
            <path d="m9 3 9 15H6L15 3Z" />
          </svg>
        </div>
        <h2 className="text-3xl font-bold text-gray-700 mt-2">
          {t("error.title")}
        </h2>
        <p className="text-xl text-gray-500 mt-4 text-center max-w-md">
          {t("error.description")}
        </p>
        <div className="mt-8 flex space-x-4">
          <button
            onClick={reset}
            className="px-6 py-3 rounded-md bg-primary/80 text-white font-medium hover:bg-primary/80 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-400"
          >
            {t("error.tryAgain")}
          </button>
          <Link
            href="/dashboard"
            className="px-6 py-3 rounded-md border border-gray-300 bg-white text-gray-700 font-medium hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-400"
          >
            {t("error.backToDashboard")}
          </Link>
        </div>
        <div className="mt-6 text-gray-500 text-sm">
          <p>
            {t("error.errorReference")}: {error.digest}
          </p>
        </div>
      </div>
    </div>
  );
}

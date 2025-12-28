"use client";

import { useTranslations } from "next-intl";

interface PageHeaderProps {
  title: string;
  description?: string;
  namespace?: string;
}

export default function PageHeader({
  title,
  description = "",
  namespace,
}: PageHeaderProps) {
  // Always call the hook, but only use it if namespace is provided
  const t = useTranslations(namespace || "common");

  return (
    <div className="mb-6">
      <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
        {namespace ? t("title") : title}
      </h1>
      <p className="text-sm sm:text-base text-gray-600">
        {namespace ? t("description") : description}
      </p>
    </div>
  );
}

"use client";

import { useTranslations } from "next-intl";

/**
 * Props voor de StatusBadge component
 * @interface
 */
type StatusBadgeProps = {
  /** De status van de declaratie */
  status: string;
  /** Optionele beschrijving voor screenreaders */
  description?: string;
};

/**
 * Component voor het weergeven van een status badge met toegankelijkheid
 * @component
 * @param {StatusBadgeProps} props - Component props
 * @returns {JSX.Element} Rendered component
 */
export default function StatusBadge({ status, description }: StatusBadgeProps) {
  const t = useTranslations();

  const statusLabels: Record<string, string> = {
    PENDING: t("status.pending"),
    ACCEPTED: t("status.approved"),
    DECLINED: t("status.rejected"),
    EXPIRED: t("status.expired"),
  };

  // Status kleuren
  const statusColors: Record<string, string> = {
    PENDING: "bg-yellow-100 text-yellow-800",
    ACCEPTED: "bg-green-100 text-green-800",
    DECLINED: "bg-red-100 text-red-800",
    EXPIRED: "bg-gray-100 text-gray-800",
  };

  const label = statusLabels[status] || status;
  const colorClass = statusColors[status] || "bg-gray-100 text-gray-800";

  return (
    <span
      role='status'
      aria-label={description || `Status: ${label}`}
      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${colorClass}`}
    >
      {label}
    </span>
  );
}

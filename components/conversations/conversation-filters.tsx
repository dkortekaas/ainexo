"use client";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Filter, X } from "lucide-react";
import { useTranslations } from "next-intl";

interface Filters {
  type: string;
  time: string;
  duration: string;
}

interface ConversationFiltersProps {
  filters: Filters;
  onChange: (filters: Filters) => void;
}

export function ConversationFilters({
  filters,
  onChange,
}: ConversationFiltersProps) {
  const t = useTranslations();

  const handleFilterChange = (key: keyof Filters, value: string) => {
    onChange({
      ...filters,
      [key]: value,
    });
  };

  const clearFilters = () => {
    onChange({
      type: "all",
      time: "all",
      duration: "all",
    });
  };

  const hasActiveFilters =
    filters.type !== "all" ||
    filters.time !== "all" ||
    filters.duration !== "all";

  return (
    <div className="flex items-center gap-3 mb-6">
      <div className="flex items-center gap-2">
        <Filter className="h-4 w-4 text-gray-500" />
        <span className="text-sm text-gray-600">{t("common.filter")}</span>
      </div>

      <Select
        value={filters.type}
        onValueChange={(value) => handleFilterChange("type", value)}
      >
        <SelectTrigger className="w-32">
          <SelectValue placeholder="Type" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{t("common.all")}</SelectItem>
          <SelectItem value="rated">{t("common.rated")}</SelectItem>
          <SelectItem value="unrated">{t("common.unrated")}</SelectItem>
          <SelectItem value="empty">{t("common.empty")}</SelectItem>
        </SelectContent>
      </Select>

      <Select
        value={filters.time}
        onValueChange={(value) => handleFilterChange("time", value)}
      >
        <SelectTrigger className="w-32">
          <SelectValue placeholder={t("common.time")} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{t("common.all")}</SelectItem>
          <SelectItem value="today">{t("common.today")}</SelectItem>
          <SelectItem value="week">{t("common.week")}</SelectItem>
          <SelectItem value="month">{t("common.month")}</SelectItem>
          <SelectItem value="year">{t("common.year")}</SelectItem>
        </SelectContent>
      </Select>

      <Select
        value={filters.duration}
        onValueChange={(value) => handleFilterChange("duration", value)}
      >
        <SelectTrigger className="w-32">
          <SelectValue placeholder={t("common.duration")} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{t("common.all")}</SelectItem>
          <SelectItem value="fast">{t("common.fast")} (&lt;1s)</SelectItem>
          <SelectItem value="medium">{t("common.medium")} (1-3s)</SelectItem>
          <SelectItem value="slow">{t("common.slow")} (&gt;3s)</SelectItem>
        </SelectContent>
      </Select>

      {hasActiveFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={clearFilters}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          <X className="h-3 w-3 mr-1" />
          {t("common.clearFilters")}
        </Button>
      )}
    </div>
  );
}

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowDownIcon, ArrowUpIcon } from "@heroicons/react/24/outline";
import { formatCurrency } from "@/lib/formatters";
import { cn } from "@/lib/utils";
import { getTranslations } from "next-intl/server";

// Stat card component
export const StatCard = async ({
  title,
  value,
  change,
  isPositive,
  isCurrency = false,
  icon,
}: {
  title: string;
  value: number;
  change: number;
  isPositive: boolean;
  isCurrency?: boolean;
  icon?: React.ReactNode;
}) => {
  const t = await getTranslations();
  const formattedValue = isCurrency
    ? formatCurrency(value)
    : value.toLocaleString();

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">
          {title}
        </CardTitle>
        {icon && (
          <div
            className={cn(
              "p-2 rounded",
              isPositive
                ? "bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400"
                : "bg-blue-100 text-primary dark:bg-blue-900 dark:text-blue-400"
            )}
          >
            {icon}
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-gray-900 dark:text-white">
          {formattedValue}
        </div>
        <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 mt-2">
          {isPositive ? (
            <ArrowUpIcon className="h-3 w-3 text-green-500 dark:text-green-400" />
          ) : (
            <ArrowDownIcon className="h-3 w-3 text-red-500 dark:text-red-400" />
          )}
          <span
            className={cn(
              "ml-1",
              isPositive
                ? "text-green-500 dark:text-green-400"
                : "text-red-500 dark:text-red-400"
            )}
          >{`${Math.abs(change).toFixed(1)}%`}</span>
          <span className="ml-1">{t("dashboard.stats.vsPreviousPeriod")}</span>
        </div>
      </CardContent>
    </Card>
  );
};

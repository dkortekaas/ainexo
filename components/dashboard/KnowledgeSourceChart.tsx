"use client";

import { useState, useEffect, memo } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Globe, HelpCircle } from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";

interface KnowledgeSourceStats {
  sources: {
    files: number;
    websites: number;
    faqs: number;
  };
  total: number;
  period: number;
}

const timeRanges = [
  { label: "Today", value: 1 },
  { label: "Last 7 days", value: 7 },
  { label: "Last 30 days", value: 30 },
];

const COLORS = {
  files: "#8b5cf6", // Purple
  websites: "#06b6d4", // Cyan
  faqs: "#10b981", // Emerald
};

const KnowledgeSourceChart = () => {
  const [selectedPeriod, setSelectedPeriod] = useState(1);
  const [data, setData] = useState<KnowledgeSourceStats | null>(null);
  const [loading, setLoading] = useState(true);
  const t = useTranslations("dashboard");

  const fetchData = async (period: number) => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/dashboard/knowledge-sources?period=${period}`
      );
      if (response.ok) {
        const result = await response.json();
        setData(result);
      }
    } catch (error) {
      console.error("Error fetching knowledge source data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(selectedPeriod);
  }, [selectedPeriod]);

  if (loading) {
    return (
      <Card className="col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="h-4 w-4 bg-gray-200 rounded animate-pulse" />
            <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 bg-gray-100 rounded animate-pulse" />
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card className="col-span-2">
        <CardHeader>
          <CardTitle>{t("knowledgeSources.title")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-44 flex items-center justify-center text-gray-500">
            {t("knowledgeSources.noData")}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Prepare data for the pie chart
  const chartData = [
    {
      name: t("knowledgeSources.files"),
      value: data.sources.files,
      color: COLORS.files,
      icon: FileText,
    },
    {
      name: t("knowledgeSources.websites"),
      value: data.sources.websites,
      color: COLORS.websites,
      icon: Globe,
    },
    {
      name: t("knowledgeSources.faqs"),
      value: data.sources.faqs,
      color: COLORS.faqs,
      icon: HelpCircle,
    },
  ].filter((item) => item.value > 0); // Only show sources with data

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <div className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: data.payload.color }}
            />
            <span className="font-medium">{data.name}</span>
          </div>
          <p className="text-sm text-gray-600 mt-1">
            {data.value} {t("knowledgeSources.answers")} (
            {((data.value / data.payload.total) * 100).toFixed(1)}%)
          </p>
        </div>
      );
    }
    return null;
  };

  const CustomLegend = ({ payload }: any) => {
    return (
      <div className="flex flex-col gap-2 mt-4">
        {payload.map((entry: any, index: number) => {
          const Icon = chartData[index]?.icon;
          return (
            <div key={index} className="flex items-center gap-2 text-sm">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
              {Icon && <Icon className="w-4 h-4" />}
              <span className="text-gray-700">{entry.value}</span>
              <span className="text-gray-500">
                ({((entry.value / data.total) * 100).toFixed(1)}%)
              </span>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <Card className="col-span-2">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              {t("knowledgeSources.title")}
            </CardTitle>
            <p className="text-sm text-gray-600 mt-1">
              {t("knowledgeSources.subtitle")}
            </p>
          </div>
          <div className="flex gap-1">
            {timeRanges.map((range) => (
              <Button
                key={range.value}
                variant={selectedPeriod === range.value ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedPeriod(range.value)}
                className="text-xs"
              >
                {range.label}
              </Button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {data.total === 0 ? (
          <div className="h-44 flex items-center justify-center text-gray-500">
            {t("knowledgeSources.noData")}
          </div>
        ) : (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend content={<CustomLegend />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Summary stats */}
        <div className="mt-4 grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <FileText className="w-4 h-4 text-purple-600" />
              <span className="text-sm font-medium text-gray-700">
                {t("knowledgeSources.files")}
              </span>
            </div>
            <div className="text-2xl font-bold text-purple-600">
              {data.sources.files}
            </div>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Globe className="w-4 h-4 text-cyan-600" />
              <span className="text-sm font-medium text-gray-700">
                {t("knowledgeSources.websites")}
              </span>
            </div>
            <div className="text-2xl font-bold text-cyan-600">
              {data.sources.websites}
            </div>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <HelpCircle className="w-4 h-4 text-emerald-600" />
              <span className="text-sm font-medium text-gray-700">
                {t("knowledgeSources.faqs")}
              </span>
            </div>
            <div className="text-2xl font-bold text-emerald-600">
              {data.sources.faqs}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

KnowledgeSourceChart.displayName = "KnowledgeSourceChart";

// Memoize to prevent unnecessary re-renders
export default memo(KnowledgeSourceChart);

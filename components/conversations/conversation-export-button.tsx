"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Download, FileText, FileSpreadsheet } from "lucide-react";
import { useTranslations } from "next-intl";

export function ConversationExportButton() {
  const [isExporting, setIsExporting] = useState(false);
  const t = useTranslations();

  const handleExport = async (format: "csv" | "json") => {
    setIsExporting(true);
    // TODO: Implement export logic
    console.log("Exporting conversations as:", format);

    setTimeout(() => {
      setIsExporting(false);
    }, 2000);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" disabled={isExporting}>
          <Download className="mr-2 h-4 w-4" />
          {isExporting ? t("common.exporting") : t("common.export")}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => handleExport("csv")}>
          <FileSpreadsheet className="mr-2 h-4 w-4" />
          {t("common.exportAsCsv")}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport("json")}>
          <FileText className="mr-2 h-4 w-4" />
          {t("common.exportAsJson")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

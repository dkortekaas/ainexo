"use client";

import { useState, useRef, memo } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/components/ui/use-toast";
import { Upload, FileText, X, CheckCircle2, AlertCircle } from "lucide-react";
import { useTranslations } from "next-intl";

interface FAQImportRow {
  question: string;
  answer: string;
  enabled?: boolean;
  order?: number;
  errors?: string[];
}

interface ImportResult {
  success: boolean;
  total: number;
  imported: number;
  failed: number;
  errors: Array<{ row: number; errors: string[] }>;
}

interface FaqBulkImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  assistantId: string;
}

const FaqBulkImportModalComponent = ({
  isOpen,
  onClose,
  onSuccess,
  assistantId,
}: FaqBulkImportModalProps) => {
  const t = useTranslations();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [parsedRows, setParsedRows] = useState<FAQImportRow[]>([]);
  const [isValidating, setIsValidating] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const MAX_QUESTION_LENGTH = 500;
  const MAX_ANSWER_LENGTH = 5000;

  // Parse CSV file
  const parseCSV = (csvText: string): FAQImportRow[] => {
    const lines = csvText.split("\n").filter((line) => line.trim());
    if (lines.length === 0) return [];

    // Parse header row
    const headerLine = lines[0];
    const headers = parseCSVLine(headerLine).map((h) => h.trim().toLowerCase());

    // Find column indices
    const questionIndex = headers.findIndex(
      (h) => h === "question" || h === "vraag" || h === "q"
    );
    const answerIndex = headers.findIndex(
      (h) => h === "answer" || h === "antwoord" || h === "a"
    );
    const enabledIndex = headers.findIndex(
      (h) => h === "enabled" || h === "actief" || h === "active"
    );
    const orderIndex = headers.findIndex(
      (h) => h === "order" || h === "volgorde" || h === "o"
    );

    if (questionIndex === -1 || answerIndex === -1) {
      throw new Error(
        t("knowledgebase.csvMissingColumns") ||
          "CSV moet 'question' en 'answer' kolommen bevatten"
      );
    }

    // Parse data rows
    const rows: FAQImportRow[] = [];
    for (let i = 1; i < lines.length; i++) {
      const values = parseCSVLine(lines[i]);
      const question = values[questionIndex]?.trim() || "";
      const answer = values[answerIndex]?.trim() || "";

      if (!question && !answer) continue; // Skip empty rows

      const row: FAQImportRow = {
        question,
        answer,
      };

      // Parse optional fields
      if (enabledIndex !== -1 && values[enabledIndex]) {
        const enabledValue = values[enabledIndex].trim().toLowerCase();
        row.enabled =
          enabledValue === "true" ||
          enabledValue === "1" ||
          enabledValue === "yes" ||
          enabledValue === "ja" ||
          enabledValue === "actief";
      }

      if (orderIndex !== -1 && values[orderIndex]) {
        const orderValue = parseInt(values[orderIndex].trim(), 10);
        if (!isNaN(orderValue)) {
          row.order = orderValue;
        }
      }

      rows.push(row);
    }

    return rows;
  };

  // Parse a single CSV line, handling quoted fields
  const parseCSVLine = (line: string): string[] => {
    const result: string[] = [];
    let current = "";
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      const nextChar = line[i + 1];

      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          // Escaped quote
          current += '"';
          i++; // Skip next quote
        } else {
          // Toggle quote state
          inQuotes = !inQuotes;
        }
      } else if (char === "," && !inQuotes) {
        // Field separator
        result.push(current);
        current = "";
      } else {
        current += char;
      }
    }

    // Add last field
    result.push(current);
    return result;
  };

  // Validate parsed rows
  const validateRows = (rows: FAQImportRow[]): FAQImportRow[] => {
    return rows.map((row, index) => {
      const errors: string[] = [];

      if (!row.question || row.question.trim().length === 0) {
        errors.push(
          t("knowledgebase.csvValidationQuestionRequired") ||
            `Rij ${index + 2}: Vraag is verplicht`
        );
      } else if (row.question.length > MAX_QUESTION_LENGTH) {
        errors.push(
          t("knowledgebase.csvValidationQuestionTooLong", {
            max: MAX_QUESTION_LENGTH,
          }) ||
            `Rij ${index + 2}: Vraag mag niet meer dan ${MAX_QUESTION_LENGTH} tekens zijn`
        );
      }

      if (!row.answer || row.answer.trim().length === 0) {
        errors.push(
          t("knowledgebase.csvValidationAnswerRequired") ||
            `Rij ${index + 2}: Antwoord is verplicht`
        );
      } else if (row.answer.length > MAX_ANSWER_LENGTH) {
        errors.push(
          t("knowledgebase.csvValidationAnswerTooLong", {
            max: MAX_ANSWER_LENGTH,
          }) ||
            `Rij ${index + 2}: Antwoord mag niet meer dan ${MAX_ANSWER_LENGTH} tekens zijn`
        );
      }

      if (errors.length > 0) {
        row.errors = errors;
      }

      return row;
    });
  };

  const handleFileSelect = async (file: File) => {
    // Validate file type
    if (!file.name.endsWith(".csv") && file.type !== "text/csv") {
      toast({
        title: t("error.fileTypeNotSupported"),
        description:
          t("knowledgebase.csvOnly") || "Alleen CSV bestanden zijn toegestaan",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      toast({
        title: t("error.fileTooLarge"),
        description:
          t("knowledgebase.csvFileTooLarge") ||
          "CSV bestand mag niet groter zijn dan 5MB",
        variant: "destructive",
      });
      return;
    }

    setSelectedFile(file);
    setParsedRows([]);
    setImportResult(null);

    // Parse and validate CSV
    try {
      setIsValidating(true);
      const text = await file.text();
      const parsed = parseCSV(text);
      const validated = validateRows(parsed);
      setParsedRows(validated);
    } catch (error) {
      toast({
        title: t("error.failedToParseCSV") || "Fout bij parsen CSV",
        description:
          error instanceof Error
            ? error.message
            : t("error.unknownError") || "Onbekende fout",
        variant: "destructive",
      });
      setSelectedFile(null);
    } finally {
      setIsValidating(false);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleImport = async () => {
    if (parsedRows.length === 0) return;

    // Filter out rows with errors
    const validRows = parsedRows.filter(
      (row) => !row.errors || row.errors.length === 0
    );

    if (validRows.length === 0) {
      toast({
        title: t("error.noValidRows") || "Geen geldige rijen",
        description:
          t("knowledgebase.allRowsHaveErrors") ||
          "Alle rijen bevatten fouten. Corrigeer de fouten en probeer opnieuw.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setImportProgress(0);
    setImportResult(null);

    try {
      // Prepare data for import
      const importData = validRows.map((row) => ({
        question: row.question,
        answer: row.answer,
        enabled: row.enabled !== undefined ? row.enabled : true,
        order: row.order !== undefined ? row.order : 0,
      }));

      // Import in batches with progress updates
      const batchSize = 10;
      let imported = 0;
      let failed = 0;
      const errors: Array<{ row: number; errors: string[] }> = [];

      for (let i = 0; i < importData.length; i += batchSize) {
        const batch = importData.slice(i, i + batchSize);

        try {
          const response = await fetch("/api/faqs/bulk", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              assistantId,
              faqs: batch,
            }),
          });

          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || t("error.failedToImportFAQs"));
          }

          const result = await response.json();
          imported += result.imported || batch.length;
          failed += result.failed || 0;

          if (result.errors) {
            errors.push(...result.errors);
          }
        } catch (error) {
          // Mark entire batch as failed
          failed += batch.length;
          errors.push({
            row: i + 1,
            errors: [
              error instanceof Error
                ? error.message
                : t("error.unknownError") || "Onbekende fout",
            ],
          });
        }

        // Update progress
        setImportProgress(
          Math.round(((i + batch.length) / importData.length) * 100)
        );
      }

      const result: ImportResult = {
        success: failed === 0,
        total: parsedRows.length,
        imported,
        failed,
        errors,
      };

      setImportResult(result);

      if (result.success) {
        toast({
          description:
            t("success.faqsImportedSuccessfully", {
              count: imported,
            }) || `${imported} FAQ's succesvol geïmporteerd`,
          variant: "success",
        });
        onSuccess();
        // Close modal after a short delay
        setTimeout(() => {
          handleClose();
        }, 2000);
      } else {
        toast({
          title: t("error.partialImport") || "Gedeeltelijke import",
          description:
            t("knowledgebase.importCompletedWithErrors", {
              imported,
              failed,
            }) || `${imported} FAQ's geïmporteerd, ${failed} mislukt`,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: t("error.failedToImportFAQs") || "Import mislukt",
        description:
          error instanceof Error
            ? error.message
            : t("error.unknownError") || "Onbekende fout",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setImportProgress(100);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      setSelectedFile(null);
      setParsedRows([]);
      setImportResult(null);
      setImportProgress(0);
      setDragActive(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      onClose();
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const validRows = parsedRows.filter(
    (row) => !row.errors || row.errors.length === 0
  );
  const invalidRows = parsedRows.filter(
    (row) => row.errors && row.errors.length > 0
  );

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {t("knowledgebase.bulkImportFAQs") || "FAQ's Bulk Importeren"}
          </DialogTitle>
          <DialogDescription>
            {t("knowledgebase.bulkImportDescription") ||
              "Upload een CSV bestand om meerdere FAQ's tegelijk toe te voegen"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* File Upload Area */}
          {!selectedFile && (
            <div className="space-y-2">
              <Label>{t("knowledgebase.csvFile") || "CSV Bestand"} *</Label>
              <div
                className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                  dragActive
                    ? "border-primary bg-purple-50"
                    : "border-gray-300 hover:border-gray-400"
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={handleFileInputChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  accept=".csv"
                  disabled={isLoading || isValidating}
                />

                <div className="flex flex-col items-center gap-2">
                  <Upload className="w-8 h-8 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600">
                      <span className="font-medium text-primary">
                        {t("knowledgebase.clickToUpload")}
                      </span>{" "}
                      {t("knowledgebase.orDragAndDrop")}
                    </p>
                    <p className="text-xs text-gray-500 mt-2">
                      {t("knowledgebase.csvFormat") ||
                        "Verwacht formaat: question,answer,enabled,order"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Selected File */}
          {selectedFile && (
            <div className="space-y-2">
              <Label>
                {t("knowledgebase.selectedFile") || "Geselecteerd bestand"}
              </Label>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-primary" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {selectedFile.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatFileSize(selectedFile.size)}
                    </p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSelectedFile(null);
                    setParsedRows([]);
                    setImportResult(null);
                  }}
                  disabled={isLoading || isValidating}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Validation Status */}
          {isValidating && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
              {t("knowledgebase.validatingCSV") || "CSV valideren..."}
            </div>
          )}

          {/* Parsed Rows Summary */}
          {parsedRows.length > 0 && !isLoading && (
            <div className="space-y-2">
              <Label>
                {t("knowledgebase.importPreview") || "Import Overzicht"}
              </Label>
              <div className="p-4 bg-gray-50 rounded-lg border space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">
                    {t("knowledgebase.totalRows") || "Totaal rijen"}:
                  </span>
                  <span className="font-medium">{parsedRows.length}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-green-600">
                    {t("knowledgebase.validRows") || "Geldige rijen"}:
                  </span>
                  <span className="font-medium text-green-600">
                    {validRows.length}
                  </span>
                </div>
                {invalidRows.length > 0 && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-red-600">
                      {t("knowledgebase.invalidRows") || "Ongeldige rijen"}:
                    </span>
                    <span className="font-medium text-red-600">
                      {invalidRows.length}
                    </span>
                  </div>
                )}
              </div>

              {/* Show errors if any */}
              {invalidRows.length > 0 && (
                <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-medium text-red-900">
                        {t("knowledgebase.validationErrors") ||
                          "Validatiefouten gevonden"}
                      </p>
                      <div className="text-xs text-red-700 space-y-1 max-h-32 overflow-y-auto">
                        {invalidRows.slice(0, 5).map((row, idx) => (
                          <div key={idx}>{row.errors?.join(", ")}</div>
                        ))}
                        {invalidRows.length > 5 && (
                          <div>... en {invalidRows.length - 5} meer</div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Import Progress */}
          {isLoading && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">
                  {t("knowledgebase.importing") || "Importeren..."}
                </span>
                <span className="font-medium">{importProgress}%</span>
              </div>
              <Progress value={importProgress} />
            </div>
          )}

          {/* Import Result */}
          {importResult && !isLoading && (
            <div className="space-y-2">
              <Label>
                {t("knowledgebase.importResult") || "Import Resultaat"}
              </Label>
              <div
                className={`p-4 rounded-lg border ${
                  importResult.success
                    ? "bg-green-50 border-green-200"
                    : "bg-yellow-50 border-yellow-200"
                }`}
              >
                <div className="flex items-start gap-2">
                  {importResult.success ? (
                    <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                  )}
                  <div className="flex-1 space-y-2">
                    <p
                      className={`text-sm font-medium ${
                        importResult.success
                          ? "text-green-900"
                          : "text-yellow-900"
                      }`}
                    >
                      {importResult.success
                        ? t("success.importCompleted") ||
                          "Import succesvol voltooid"
                        : t("error.partialImport") || "Gedeeltelijke import"}
                    </p>
                    <div className="text-xs space-y-1">
                      <div className="flex justify-between">
                        <span>Geïmporteerd:</span>
                        <span className="font-medium">
                          {importResult.imported}
                        </span>
                      </div>
                      {importResult.failed > 0 && (
                        <div className="flex justify-between text-red-600">
                          <span>Mislukt:</span>
                          <span className="font-medium">
                            {importResult.failed}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isLoading || isValidating}
          >
            {t("common.cancel")}
          </Button>
          <Button
            type="button"
            onClick={handleImport}
            disabled={
              !selectedFile ||
              parsedRows.length === 0 ||
              validRows.length === 0 ||
              isLoading ||
              isValidating
            }
          >
            {isLoading
              ? t("knowledgebase.importing") || "Importeren..."
              : t("knowledgebase.importFAQs") || "FAQ's Importeren"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

FaqBulkImportModalComponent.displayName = "FaqBulkImportModal";

// Memoize to prevent unnecessary re-renders when parent re-renders
export const FaqBulkImportModal = memo(FaqBulkImportModalComponent);

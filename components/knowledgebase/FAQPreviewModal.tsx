"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useTranslations } from "next-intl";
import { FAQ } from "@/types/knowledgebase";
import { CheckCircle2, XCircle } from "lucide-react";

interface FAQPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  faq: FAQ | null;
}

// Simple content rendering with preserved formatting
const renderContent = (text: string) => {
  if (!text) return null;

  // Show text with preserved line breaks
  // Basic markdown support: **bold**, *italic*, [links](url)
  // For full markdown support, consider adding react-markdown library
  return (
    <div className="prose prose-sm max-w-none text-gray-900">
      <div className="whitespace-pre-wrap">{text}</div>
    </div>
  );
};

export function FAQPreviewModal({
  isOpen,
  onClose,
  faq,
}: FAQPreviewModalProps) {
  const t = useTranslations();

  if (!faq) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {t("knowledgebase.faqPreview") || "FAQ Preview"}
          </DialogTitle>
          <DialogDescription>
            {t("knowledgebase.faqPreviewDescription") ||
              "Preview van de FAQ zoals deze wordt weergegeven"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Status Badge */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">
              {t("knowledgebase.status") || "Status"}:
            </span>
            <Badge
              variant={faq.enabled ? "default" : "secondary"}
              className="flex items-center gap-1"
            >
              {faq.enabled ? (
                <>
                  <CheckCircle2 className="w-3 h-3" />
                  {t("common.enabled") || "Actief"}
                </>
              ) : (
                <>
                  <XCircle className="w-3 h-3" />
                  {t("common.disabled") || "Inactief"}
                </>
              )}
            </Badge>
          </div>

          {/* Question */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
              {t("knowledgebase.question")}
            </h3>
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-lg font-medium text-gray-900">
                {faq.question}
              </p>
            </div>
          </div>

          {/* Answer */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
              {t("knowledgebase.answer")}
            </h3>
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
              {renderContent(faq.answer)}
            </div>
          </div>

          {/* Metadata */}
          <div className="pt-4 border-t border-gray-200">
            <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
              <div>
                <span className="font-medium">
                  {t("knowledgebase.order") || "Volgorde"}:
                </span>{" "}
                {faq.order}
              </div>
              <div>
                <span className="font-medium">
                  {t("common.createdAt") || "Aangemaakt"}:
                </span>{" "}
                {new Date(faq.createdAt).toLocaleDateString()}
              </div>
              <div>
                <span className="font-medium">
                  {t("common.updatedAt") || "Bijgewerkt"}:
                </span>{" "}
                {new Date(faq.updatedAt).toLocaleDateString()}
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

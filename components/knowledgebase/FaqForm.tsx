"use client";

import { useState, useEffect } from "react";
import {
  Button,
  Input,
  Label,
  Textarea,
  Switch,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui";
import { useToast } from "@/components/ui/use-toast";
import { useAssistant } from "@/contexts/assistant-context";
import { useTranslations } from "next-intl";
import { FAQ } from "@/types/knowledgebase";

interface FAQFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  faq?: FAQ | null;
}

// Validation constants
const MAX_QUESTION_LENGTH = 500;
const MAX_ANSWER_LENGTH = 5000;

export function FAQForm({ isOpen, onClose, onSuccess, faq }: FAQFormProps) {
  const t = useTranslations();
  const { currentAssistant } = useAssistant();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    question: faq?.question || "",
    answer: faq?.answer || "",
    enabled: faq?.enabled ?? true,
    order: faq?.order || 0,
  });
  const [errors, setErrors] = useState<{
    question?: string;
    answer?: string;
  }>({});
  const { toast } = useToast();

  const isEditing = !!faq;

  // Reset form when FAQ changes or modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setFormData({
        question: faq?.question || "",
        answer: faq?.answer || "",
        enabled: faq?.enabled ?? true,
        order: faq?.order || 0,
      });
      setErrors({});
    }
  }, [isOpen, faq]);

  const validateForm = (): boolean => {
    const newErrors: { question?: string; answer?: string } = {};

    // Validate question
    if (!formData.question.trim()) {
      newErrors.question = t("forms.validation.required");
    } else if (formData.question.length > MAX_QUESTION_LENGTH) {
      newErrors.question = t("forms.validation.maxLength", {
        max: MAX_QUESTION_LENGTH,
      });
    }

    // Validate answer
    if (!formData.answer.trim()) {
      newErrors.answer = t("forms.validation.required");
    } else if (formData.answer.length > MAX_ANSWER_LENGTH) {
      newErrors.answer = t("forms.validation.maxLength", {
        max: MAX_ANSWER_LENGTH,
      });
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentAssistant) {
      toast({
        description: t("error.knowledgebase.noAssistantSelected"),
        variant: "destructive",
      });
      return;
    }

    // Validate form before submission
    if (!validateForm()) {
      toast({
        description: t("error.missingFieldsDescription"),
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const url = isEditing ? `/api/faqs/${faq.id}` : "/api/faqs";
      const method = isEditing ? "PUT" : "POST";

      const requestData = isEditing
        ? formData
        : { ...formData, assistantId: currentAssistant.id };

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || t("error.failedToSaveFAQ"));
      }

      toast({
        description: isEditing
          ? t("success.faqUpdatedSuccessfully")
          : t("success.faqAddedSuccessfully"),
        variant: "success",
      });

      onSuccess();
      onClose();
    } catch (error) {
      toast({
        description:
          error instanceof Error ? error.message : t("error.unknownError"),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      // Reset form to original FAQ values or empty
      setFormData({
        question: faq?.question || "",
        answer: faq?.answer || "",
        enabled: faq?.enabled ?? true,
        order: faq?.order || 0,
      });
      setErrors({});
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? t("knowledgebase.editFAQ") : t("knowledgebase.addFAQ")}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? t("knowledgebase.updateFAQInformation")
              : t("knowledgebase.addFAQInformation")}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="question">{t("knowledgebase.question")} *</Label>
              <span
                className={`text-xs ${
                  formData.question.length > MAX_QUESTION_LENGTH
                    ? "text-destructive"
                    : "text-muted-foreground"
                }`}
              >
                {formData.question.length}/{MAX_QUESTION_LENGTH}
              </span>
            </div>
            <Input
              id="question"
              placeholder={t("knowledgebase.questionPlaceholder")}
              value={formData.question}
              onChange={(e) => {
                const value = e.target.value;
                if (value.length <= MAX_QUESTION_LENGTH) {
                  setFormData((prev) => ({ ...prev, question: value }));
                  if (errors.question) {
                    setErrors((prev) => ({ ...prev, question: undefined }));
                  }
                }
              }}
              required
              disabled={isLoading}
              maxLength={MAX_QUESTION_LENGTH}
              className={errors.question ? "border-destructive" : ""}
              aria-invalid={!!errors.question}
              aria-describedby={errors.question ? "question-error" : undefined}
            />
            {errors.question && (
              <p id="question-error" className="text-sm text-destructive">
                {errors.question}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="answer">{t("knowledgebase.answer")} *</Label>
              <span
                className={`text-xs ${
                  formData.answer.length > MAX_ANSWER_LENGTH
                    ? "text-destructive"
                    : "text-muted-foreground"
                }`}
              >
                {formData.answer.length}/{MAX_ANSWER_LENGTH}
              </span>
            </div>
            <Textarea
              id="answer"
              placeholder={t("knowledgebase.answerPlaceholder")}
              value={formData.answer}
              onChange={(e) => {
                const value = e.target.value;
                if (value.length <= MAX_ANSWER_LENGTH) {
                  setFormData((prev) => ({ ...prev, answer: value }));
                  if (errors.answer) {
                    setErrors((prev) => ({ ...prev, answer: undefined }));
                  }
                }
              }}
              required
              disabled={isLoading}
              rows={6}
              maxLength={MAX_ANSWER_LENGTH}
              className={errors.answer ? "border-destructive" : ""}
              aria-invalid={!!errors.answer}
              aria-describedby={errors.answer ? "answer-error" : undefined}
            />
            {errors.answer && (
              <p id="answer-error" className="text-sm text-destructive">
                {errors.answer}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="order">{t("knowledgebase.order")}</Label>
            <Input
              id="order"
              type="number"
              placeholder="0"
              value={formData.order}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  order: parseInt(e.target.value) || 0,
                }))
              }
              disabled={isLoading}
              min="0"
            />
            <p className="text-sm text-gray-500">
              {t("knowledgebase.orderDescription")}
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="enabled"
              checked={formData.enabled}
              onCheckedChange={(checked) =>
                setFormData((prev) => ({ ...prev, enabled: checked }))
              }
              disabled={isLoading}
              className="data-[state=checked]:bg-primary"
            />
            <Label htmlFor="enabled">{t("knowledgebase.enabled")}</Label>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isLoading}
            >
              {t("common.cancel")}
            </Button>
            <Button
              type="submit"
              disabled={
                isLoading ||
                !formData.question.trim() ||
                !formData.answer.trim() ||
                formData.question.length > MAX_QUESTION_LENGTH ||
                formData.answer.length > MAX_ANSWER_LENGTH
              }
              className="bg-primary text-white hover:bg-primary/80"
            >
              {isLoading
                ? t("common.saving")
                : isEditing
                  ? t("common.save")
                  : t("common.add")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

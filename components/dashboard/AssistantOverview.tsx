"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Bot,
  CheckCircle,
  XCircle,
  Edit,
  Trash2,
  Code,
  Copy,
  Check,
  Loader2,
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useAssistant } from "@/contexts/assistant-context";
import { useToast } from "@/components/ui/use-toast";
import { DeleteConfirmationModal } from "@/components/shared/DeleteConfirmationModal";
import { useTranslations } from "next-intl";
import type { Assistant } from "@/types/assistant";

export function AssistantOverview() {
  const router = useRouter();
  const { toast } = useToast();
  const t = useTranslations();
  const { data: session } = useSession();
  const { assistants, refreshAssistants, isLoading } = useAssistant();
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [assistantToDelete, setAssistantToDelete] = useState<Assistant | null>(
    null
  );
  const [isDeleting, setIsDeleting] = useState(false);
  const [embedCode, setEmbedCode] = useState<string>("");
  const [embedCodeLoading, setEmbedCodeLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isToggling, setIsToggling] = useState(false);

  const isAdmin =
    session?.user?.role === "ADMIN" || session?.user?.role === "SUPERUSER";

  // Limit to 1 assistant for trial users (display only first one)
  const displayAssistants = useMemo(() => assistants.slice(0, 1), [assistants]);
  const firstAssistantId = displayAssistants[0]?.id;

  useEffect(() => {
    if (!firstAssistantId) return;

    const fetchEmbedCode = async (assistantId: string) => {
      setEmbedCodeLoading(true);
      try {
        const response = await fetch(
          `/api/assistants/${assistantId}/embed-code`
        );
        if (response.ok) {
          const data = await response.json();
          setEmbedCode(data.embedCode);
        }
      } catch (error) {
        console.error("Error fetching embed code:", error);
      } finally {
        setEmbedCodeLoading(false);
      }
    };

    fetchEmbedCode(firstAssistantId);
  }, [firstAssistantId]);

  const handleCopyEmbedCode = async () => {
    if (!embedCode) return;
    try {
      await navigator.clipboard.writeText(embedCode);
      setCopied(true);
      toast({
        title: t("common.success") || "Success",
        description: t("assistants.embedCodeCopied") || "Embed code gekopieerd",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
      toast({
        title: t("common.error") || "Error",
        description: t("error.failedToCopy") || "Kon embed code niet kopiëren",
        variant: "destructive",
      });
    }
  };

  const handleEditAssistant = (assistant: Assistant) => {
    router.push(`/assistants/${assistant.id}/edit`);
  };

  const handleDeleteAssistant = (assistant: Assistant) => {
    setAssistantToDelete(assistant);
    setIsDeleteModalOpen(true);
  };

  const confirmDeleteAssistant = async () => {
    if (!assistantToDelete) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/assistants/${assistantToDelete.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast({
          description:
            t("success.assistantDeletedDescription") ||
            "Assistent succesvol verwijderd",
          variant: "success",
        });
        refreshAssistants();
        setIsDeleteModalOpen(false);
        setAssistantToDelete(null);
        setEmbedCode(""); // Clear embed code
      } else {
        const error = await response.json();
        throw new Error(
          error.error ||
            t("error.failedToDeleteAssistant") ||
            "Verwijderen mislukt"
        );
      }
    } catch (error) {
      toast({
        title: t("common.error") || "Error",
        description:
          error instanceof Error
            ? error.message
            : t("error.failedToDeleteAssistant") || "Verwijderen mislukt",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteModalClose = () => {
    if (!isDeleting) {
      setIsDeleteModalOpen(false);
      setAssistantToDelete(null);
    }
  };

  const handleToggleActive = async () => {
    if (!assistant) return;

    setIsToggling(true);
    try {
      const response = await fetch(`/api/assistants/${assistant.id}/toggle`, {
        method: "PATCH",
      });

      if (response.ok) {
        const data = await response.json();
        toast({
          title: t("common.success") || "Success",
          description: data.isActive
            ? t("success.assistantActivated") ||
              "Assistent succesvol geactiveerd"
            : t("success.assistantDeactivated") ||
              "Assistent succesvol gedeactiveerd",
          variant: "success",
        });
        // Refresh assistants to get updated state
        await refreshAssistants();
      } else {
        // Rollback optimistic update
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error ||
            t("error.failedToToggleAssistant") ||
            "Toggle mislukt"
        );
      }
    } catch (error) {
      // Rollback would happen automatically via refreshAssistants
      toast({
        title: t("common.error") || "Error",
        description:
          error instanceof Error
            ? error.message
            : t("error.failedToToggleAssistant") || "Toggle mislukt",
        variant: "destructive",
      });
      // Refresh to get correct state
      await refreshAssistants();
    } finally {
      setIsToggling(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (displayAssistants.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="w-5 h-5" />
            {t("assistants.aiAssistants") || "AI Assistenten"}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-12 text-center">
          <Bot className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {t("assistants.noAssistantsYet") || "Nog geen assistenten"}
          </h3>
          <p className="text-gray-500 mb-6">
            {t("assistants.noAssistantsYetDescription") ||
              "Maak je eerste AI assistent aan om te beginnen"}
          </p>
          {isAdmin && (
            <Button
              className="bg-primary hover:bg-primary/80"
              onClick={() => router.push("/assistants/new")}
            >
              {t("assistants.createYourFirstAssistant") ||
                "Maak je eerste assistent aan"}
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  const assistant = displayAssistants[0];

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="w-5 h-5" />
            {t("assistants.aiAssistants") || "AI Assistenten"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Assistant Card */}
          <div className="space-y-4">
            {/* Assistant Header */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: assistant.primaryColor }}
                >
                  <Bot className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">
                    {assistant.name}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {assistant.language.toUpperCase()} • {assistant.tone}
                  </p>
                </div>
              </div>
              {/* Status Badge */}
              {assistant.isActive ? (
                <Badge className="bg-green-100 text-green-800">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  {t("common.active") || "Actief"}
                </Badge>
              ) : (
                <Badge className="bg-gray-100 text-gray-800">
                  <XCircle className="w-3 h-3 mr-1" />
                  {t("common.inactive") || "Inactief"}
                </Badge>
              )}
            </div>

            {/* Toggle Switch */}
            {isAdmin && (
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                <div className="space-y-0.5">
                  <Label className="text-sm font-medium">
                    {t("assistants.active") || "Assistent Activeren"}
                  </Label>
                  <p className="text-xs text-gray-500">
                    {assistant.isActive
                      ? t("assistants.assistantIsActive") ||
                        "Assistent is actief en reageert op berichten"
                      : t("assistants.assistantIsInactive") ||
                        "Assistent is inactief en reageert niet op berichten"}
                  </p>
                </div>
                <Switch
                  checked={assistant.isActive}
                  onCheckedChange={handleToggleActive}
                  disabled={isToggling}
                  className="data-[state=checked]:bg-primary"
                />
              </div>
            )}

            {/* Embed Code Section */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700">
                  {t("assistants.embedCode") || "Embed Code"}
                </label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopyEmbedCode}
                  disabled={!embedCode || embedCodeLoading}
                >
                  {embedCodeLoading ? (
                    <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                  ) : copied ? (
                    <>
                      <Check className="w-3 h-3 mr-1" />
                      {t("assistants.copied") || "Gekopieerd"}
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3 mr-1" />
                      {t("assistants.copy") || "Kopiëren"}
                    </>
                  )}
                </Button>
              </div>
              {embedCodeLoading ? (
                <div className="p-4 bg-gray-50 rounded-lg flex items-center justify-center">
                  <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                </div>
              ) : embedCode ? (
                <div className="relative">
                  <pre className="p-3 bg-gray-50 rounded-lg text-xs font-mono overflow-x-auto max-h-32 overflow-y-auto">
                    {embedCode}
                  </pre>
                </div>
              ) : (
                <div className="p-4 bg-gray-50 rounded-lg text-sm text-gray-500 text-center">
                  {t("assistants.embedCodeNotAvailable") ||
                    "Embed code niet beschikbaar"}
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => handleEditAssistant(assistant)}
              >
                <Edit className="w-3 h-3 mr-1" />
                {t("common.edit") || "Bewerken"}
              </Button>
              {isAdmin && (
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                  onClick={() => handleDeleteAssistant(assistant)}
                >
                  <Trash2 className="w-3 h-3 mr-1" />
                  {t("common.delete") || "Verwijderen"}
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={handleDeleteModalClose}
        onConfirm={confirmDeleteAssistant}
        title={t("assistants.deleteAssistant") || "Assistent verwijderen"}
        description={
          t("assistants.deleteAssistantDescription") ||
          "Weet je zeker dat je deze assistent wilt verwijderen? Deze actie kan niet ongedaan worden gemaakt."
        }
        itemName={assistantToDelete?.name || ""}
        isLoading={isDeleting}
      />
    </>
  );
}

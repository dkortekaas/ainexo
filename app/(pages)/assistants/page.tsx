"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  MoreVertical,
  Bot,
  CheckCircle,
  XCircle,
  Edit,
  Trash2,
  Copy,
  Settings,
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DeleteConfirmationModal } from "@/components/shared/DeleteConfirmationModal";
import { useToast } from "@/components/ui/use-toast";
import { useAssistant } from "@/contexts/assistant-context";
import { Assistant } from "@/types/assistant";
import { useTranslations } from "next-intl";
import { PageHeader } from "@/components/layouts";

export default function AssistantsPage() {
  const router = useRouter();
  const { assistants, refreshAssistants, isLoading } = useAssistant();
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [assistantToDelete, setAssistantToDelete] = useState<Assistant | null>(
    null
  );
  const [isDeleting, setIsDeleting] = useState(false);
  const [togglingAssistantId, setTogglingAssistantId] = useState<string | null>(
    null
  );
  const { toast } = useToast();
  const t = useTranslations();
  const { data: session } = useSession();
  const isAdmin =
    session?.user?.role === "ADMIN" || session?.user?.role === "SUPERUSER";

  const handleAddAssistant = () => {
    router.push("/assistants/new");
  };

  const handleEditAssistant = (assistant: Assistant) => {
    router.push(`/assistants/${assistant.id}/edit`);
  };

  const handleDuplicateAssistant = async (assistant: Assistant) => {
    try {
      const response = await fetch("/api/assistants", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: `${assistant.name} (Copy)`,
          welcomeMessage: assistant.welcomeMessage,
          placeholderText: assistant.placeholderText,
          primaryColor: assistant.primaryColor,
          secondaryColor: assistant.secondaryColor,
          tone: assistant.tone,
          language: assistant.language,
          maxResponseLength: assistant.maxResponseLength,
          temperature: assistant.temperature,
          fallbackMessage: assistant.fallbackMessage,
          position: assistant.position,
          showBranding: assistant.showBranding,
          isActive: assistant.isActive,
          allowedDomains: assistant.allowedDomains,
          rateLimit: assistant.rateLimit,
        }),
      });

      if (response.ok) {
        toast({
          description: t("success.assistantDuplicatedDescription"),
          variant: "success",
        });
        refreshAssistants();
      } else {
        const error = await response.json();
        throw new Error(error.error || t("error.failedToDuplicateAssistant"));
      }
    } catch (error) {
      toast({
        description:
          error instanceof Error
            ? error.message
            : t("error.failedToDuplicateAssistant"),
        variant: "destructive",
      });
    }
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
          description: t("success.assistantDeletedDescription"),
          variant: "success",
        });
        refreshAssistants();
        setIsDeleteModalOpen(false);
        setAssistantToDelete(null);
      } else {
        const error = await response.json();
        throw new Error(error.error || t("error.failedToDeleteAssistant"));
      }
    } catch (error) {
      toast({
        title: t("error"),
        description:
          error instanceof Error
            ? error.message
            : t("error.failedToDeleteAssistant"),
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

  const handleToggleActive = async (assistant: Assistant) => {
    setTogglingAssistantId(assistant.id);

    try {
      const response = await fetch(`/api/assistants/${assistant.id}/toggle`, {
        method: "PATCH",
      });

      if (response.ok) {
        const data = await response.json();
        toast({
          title: t("common.success") || "Success",
          description:
            data.isActive
              ? t("success.assistantActivated") ||
                "Assistent succesvol geactiveerd"
              : t("success.assistantDeactivated") ||
                "Assistent succesvol gedeactiveerd",
          variant: "success",
        });
        refreshAssistants();
      } else {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error ||
            t("error.failedToToggleAssistant") ||
            "Toggle mislukt"
        );
      }
    } catch (error) {
      toast({
        title: t("common.error") || "Error",
        description:
          error instanceof Error
            ? error.message
            : t("error.failedToToggleAssistant") || "Toggle mislukt",
        variant: "destructive",
      });
      refreshAssistants(); // Refresh to get correct state
    } finally {
      setTogglingAssistantId(null);
    }
  };

  const formatCreatedDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInDays === 0) return t("common.today");
    if (diffInDays === 1) return t("common.yesterday");
    if (diffInDays < 7) return t("common.daysAgo", { days: diffInDays });
    if (diffInDays < 30)
      return t("common.weeksAgo", { weeks: Math.floor(diffInDays / 7) });
    if (diffInDays < 365)
      return t("common.monthsAgo", { months: Math.floor(diffInDays / 30) });
    return t("common.yearsAgo", { years: Math.floor(diffInDays / 365) });
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div className="flex-1">
          <PageHeader
            title={t("assistants.aiAssistants")}
            description={t("assistants.aiAssistantsDescription")}
          />
        </div>
        {isAdmin && (
          <div className="flex gap-2">
            <Button
              className="bg-primary hover:bg-primary/80 w-full md:w-auto"
              onClick={handleAddAssistant}
            >
              <Plus className="w-4 h-4 mr-2" />
              {t("assistants.createAssistant")}
            </Button>
          </div>
        )}
      </div>

      {/* Assistants Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="p-6 animate-pulse">
              <div className="space-y-4">
                <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            </Card>
          ))
        ) : assistants.length === 0 ? (
          <div className="col-span-full">
            <Card className="p-12 text-center">
              <Bot className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {t("assistants.noAssistantsYet")}
              </h3>
              <p className="text-gray-500 mb-6">
                {t("assistants.noAssistantsYetDescription")}
              </p>
              {isAdmin ? (
                <Button
                  className="bg-primary hover:bg-primary/80 w-3/12 mx-auto"
                  onClick={handleAddAssistant}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  {t("assistants.createYourFirstAssistant")}
                </Button>
              ) : null}
            </Card>
          </div>
        ) : (
          assistants.map((assistant) => (
            <Card
              key={assistant.id}
              className="p-6 hover:shadow-lg transition-shadow"
            >
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
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => handleEditAssistant(assistant)}
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        {t("common.edit")}
                      </DropdownMenuItem>
                      {isAdmin && (
                        <DropdownMenuItem
                          onClick={() => handleDuplicateAssistant(assistant)}
                        >
                          <Copy className="w-4 h-4 mr-2" />
                          {t("common.duplicate")}
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem>
                        <Settings className="w-4 h-4 mr-2" />
                        {t("common.settings")}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-red-600"
                        onClick={() => handleDeleteAssistant(assistant)}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        {t("common.delete")}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {/* Assistant Description */}
                <p className="text-sm text-gray-600 line-clamp-2">
                  {assistant.welcomeMessage}
                </p>

                {/* Assistant Status */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {assistant.isActive ? (
                      <Badge className="bg-green-100 text-green-800">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        {t("common.active")}
                      </Badge>
                    ) : (
                      <Badge className="bg-gray-100 text-gray-800">
                        <XCircle className="w-3 h-3 mr-1" />
                        {t("common.inactive")}
                      </Badge>
                    )}
                    {isAdmin && (
                      <Switch
                        checked={assistant.isActive}
                        onCheckedChange={() => handleToggleActive(assistant)}
                        disabled={togglingAssistantId === assistant.id}
                        className="data-[state=checked]:bg-primary"
                      />
                    )}
                  </div>
                  <span className="text-xs text-gray-500">
                    {t("common.created")}{" "}
                    {formatCreatedDate(assistant.createdAt)}
                  </span>
                </div>

                {/* Assistant Actions */}
                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => handleEditAssistant(assistant)}
                  >
                    <Edit className="w-3 h-3 mr-1" />
                    {t("common.edit")}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push("/kennisbank")}
                  >
                    {t("assistants.knowledge")}
                  </Button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={handleDeleteModalClose}
        onConfirm={confirmDeleteAssistant}
        title={t("assistants.deleteAssistant")}
        description={t("assistants.deleteAssistantDescription")}
        itemName={assistantToDelete?.name || ""}
        isLoading={isDeleting}
      />
    </div>
  );
}

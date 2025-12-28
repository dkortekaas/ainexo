"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { Bot, ChevronDown, Check, Plus, Settings } from "lucide-react";
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui";
import { useAssistant } from "@/contexts/assistant-context";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

export function AssistantSwitcher() {
  const { currentAssistant, assistants, setCurrentAssistant, isLoading } =
    useAssistant();
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
  const t = useTranslations();
  const { data: session } = useSession();
  const isAdmin =
    session?.user?.role === "ADMIN" || session?.user?.role === "SUPERUSER";

  const handleAssistantSelect = (assistantId: string) => {
    const assistant = assistants.find((a) => a.id === assistantId);
    if (assistant) {
      setCurrentAssistant(assistant);
    }
    setIsOpen(false);
  };

  const handleCreateNew = () => {
    router.push("/assistants/new");
    setIsOpen(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-100 animate-pulse">
        <Bot className="w-4 h-4 text-gray-400" />
        <span className="text-sm text-gray-500">
          {t("common.statuses.loading")}
        </span>
      </div>
    );
  }

  if (!currentAssistant) {
    if (isAdmin) {
      return (
        <Button
          variant="outline"
          size="sm"
          onClick={handleCreateNew}
          className="flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          {t("assistants.createAssistant")}
        </Button>
      );
    }
    // Non-admins see an informative disabled state
    return (
      <Button
        variant="outline"
        size="sm"
        disabled
        className="flex items-center gap-2"
      >
        <Bot className="w-4 h-4" />
        {t("assistants.noAssistantsYet")}
      </Button>
    );
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="flex items-center gap-2 min-w-0 max-w-xs"
        >
          <div
            className="w-4 h-4 rounded-full flex items-center justify-center"
            style={{ backgroundColor: currentAssistant.primaryColor }}
          >
            <Bot className="w-2.5 h-2.5 text-white" />
          </div>
          <span className="truncate text-gray-900 font-medium">
            {currentAssistant.name}
          </span>
          <ChevronDown className="w-4 h-4 text-gray-500" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64">
        <div className="px-2 py-1.5 text-xs font-medium text-gray-500 uppercase tracking-wider">
          {t("assistants.aiAssistants")}
        </div>
        {assistants.map((assistant) => (
          <DropdownMenuItem
            key={assistant.id}
            onClick={() => handleAssistantSelect(assistant.id)}
            className="flex items-center justify-between cursor-pointer"
          >
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <div
                className="w-3 h-3 rounded-full flex items-center justify-center"
                style={{ backgroundColor: assistant.primaryColor }}
              >
                <Bot className="w-2 h-2 text-white" />
              </div>
              <span className="truncate">{assistant.name}</span>
            </div>
            {currentAssistant.id === assistant.id && (
              <Check className="w-4 h-4 text-primary" />
            )}
          </DropdownMenuItem>
        ))}
        {isAdmin && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => {
                router.push("/assistants");
                setIsOpen(false);
              }}
              className="cursor-pointer"
            >
              <Settings className="w-4 h-4 mr-2" />
              {t("assistants.manageAssistants")}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={handleCreateNew}
              className="cursor-pointer"
            >
              <Plus className="w-4 h-4 mr-2" />
              {t("assistants.createNewAssistant")}
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

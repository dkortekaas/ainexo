"use client";

import { useState, useEffect, forwardRef, useImperativeHandle } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Info, RotateCcw, ChevronLeft, ChevronRight } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface PersonalityTabRef {
  save: () => Promise<void>;
}

interface PersonalityTabProps {
  onChanges?: (hasChanges: boolean) => void;
}

interface SnippetExample {
  id: string;
  text: string;
  category: string;
  title: string;
}

interface SnippetCategory {
  id: string;
  label: string;
  count: number;
}

// Default prompt will be loaded from API

export const PersonalityTab = forwardRef<
  PersonalityTabRef,
  PersonalityTabProps
>(({ onChanges }, ref) => {
  const t = useTranslations();
  const { toast } = useToast();

  const [mainPrompt, setMainPrompt] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [currentPage, setCurrentPage] = useState(0);
  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [categories, setCategories] = useState<SnippetCategory[]>([]);
  const [snippetExamples, setSnippetExamples] = useState<SnippetExample[]>([]);
  const [isLoadingSnippets, setIsLoadingSnippets] = useState(true);
  const [displaySnippets, setDisplaySnippets] = useState<SnippetExample[]>([]);

  const itemsPerPage = 4;

  // Load initial data
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        // Load categories and snippets
        setIsLoadingSnippets(true);
        const snippetsUrl = window.location.origin + "/api/snippets";
        console.log("Fetching snippets from:", snippetsUrl);
        const response = await fetch(snippetsUrl);
        console.log(
          "Snippets API response:",
          response.status,
          response.statusText
        );
        console.log(
          "Response headers:",
          Object.fromEntries(response.headers.entries())
        );
        if (response.ok) {
          const data = await response.json();
          console.log("Snippets data loaded:", data);
          setCategories(data.categories);
          setSnippetExamples(data.snippets);
          setDisplaySnippets(data.snippets); // Initialize with all snippets
        } else {
          console.error(
            "Failed to load snippets:",
            response.status,
            response.statusText
          );
          const errorText = await response.text();
          console.error("Error response:", errorText);
        }

        // Load assistant's main prompt
        const pathParts = window.location.pathname.split("/");
        const assistantId = pathParts[pathParts.length - 2];
        console.log("Full URL path:", window.location.pathname);
        console.log("Path parts:", pathParts);
        console.log("Assistant ID from URL:", assistantId);

        if (assistantId && assistantId !== "edit") {
          const assistantResponse = await fetch(
            `${window.location.origin}/api/assistants/${assistantId}`
          );
          console.log(
            "Assistant API response:",
            assistantResponse.status,
            assistantResponse.statusText
          );
          if (assistantResponse.ok) {
            const assistant = await assistantResponse.json();
            console.log("Assistant data loaded:", assistant);
            if (assistant.mainPrompt) {
              setMainPrompt(assistant.mainPrompt);
            } else {
              // Load default prompt if no custom prompt exists
              const defaultResponse = await fetch(
                "/api/snippets/default-prompt"
              );
              if (defaultResponse.ok) {
                const defaultData = await defaultResponse.json();
                setMainPrompt(defaultData.defaultPrompt);
              }
            }
          } else {
            console.error(
              "Failed to load assistant:",
              assistantResponse.status,
              assistantResponse.statusText
            );
            const errorText = await assistantResponse.text();
            console.error("Assistant error response:", errorText);
            // Fallback to default prompt
            const defaultResponse = await fetch(
              `${window.location.origin}/api/snippets/default-prompt`
            );
            if (defaultResponse.ok) {
              const defaultData = await defaultResponse.json();
              setMainPrompt(defaultData.defaultPrompt);
            }
          }
        } else {
          console.log("No valid assistant ID found, loading default prompt");
          // Load default prompt if no assistant ID
          const defaultResponse = await fetch(
            `${window.location.origin}/api/snippets/default-prompt`
          );
          if (defaultResponse.ok) {
            const defaultData = await defaultResponse.json();
            setMainPrompt(defaultData.defaultPrompt);
          }
        }
      } catch (error) {
        console.error("Error loading initial data:", error);
        toast({
          title: t("common.error"),
          description: "Failed to load data",
          variant: "destructive",
        });
      } finally {
        setIsLoadingSnippets(false);
      }
    };

    loadInitialData();
  }, [toast, t]);

  // Expose save method to parent component
  useImperativeHandle(ref, () => ({
    save: async () => {
      await handleSave();
    },
  }));

  const handleMainPromptChange = (value: string) => {
    setMainPrompt(value);
    setHasChanges(true);
    onChanges?.(true);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Get the current assistant ID from the URL
      const pathParts = window.location.pathname.split("/");
      const assistantId = pathParts[pathParts.length - 2]; // Assuming URL is /assistants/[id]/edit
      console.log("Save - Assistant ID:", assistantId);

      if (!assistantId || assistantId === "edit") {
        throw new Error("No valid assistant ID found");
      }

      const response = await fetch(
        `${window.location.origin}/api/assistants/${assistantId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ mainPrompt }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Save error response:", errorText);

        if (response.status === 401) {
          throw new Error("Please log in to save settings");
        } else if (response.status === 403) {
          throw new Error("Admin access required to save settings");
        } else {
          throw new Error("Failed to save personality settings");
        }
      }

      setHasChanges(false);
      onChanges?.(false);

      toast({
        title: t("common.success"),
        description: t("assistants.personalitySettingsSaved"),
      });
    } catch (error) {
      console.error("Error saving personality settings:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : t("assistants.failedToSavePersonalitySettings");
      toast({
        title: t("common.error"),
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const resetToDefault = async () => {
    try {
      const response = await fetch(
        `${window.location.origin}/api/snippets/default-prompt`
      );
      if (response.ok) {
        const data = await response.json();
        setMainPrompt(data.defaultPrompt);
        setHasChanges(true);
        onChanges?.(true);
      } else {
        throw new Error("Failed to fetch default prompt");
      }
    } catch (error) {
      console.error("Error loading default prompt:", error);
      toast({
        title: t("common.error"),
        description: "Failed to load default prompt",
        variant: "destructive",
      });
    }
  };

  const insertSnippet = (snippet: SnippetExample) => {
    const newPrompt = mainPrompt + "\n\n" + snippet.text;
    setMainPrompt(newPrompt);
    setHasChanges(true);
    onChanges?.(true);
  };

  const totalPages = Math.ceil(displaySnippets.length / itemsPerPage);
  const currentSnippets = displaySnippets.slice(
    currentPage * itemsPerPage,
    (currentPage + 1) * itemsPerPage
  );

  const nextPage = () => {
    if (currentPage < totalPages - 1) {
      setCurrentPage(currentPage + 1);
    }
  };

  const prevPage = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
    }
  };

  // Filter snippets when category changes
  useEffect(() => {
    if (selectedCategory === "all") {
      setDisplaySnippets(snippetExamples);
    } else {
      setDisplaySnippets(
        snippetExamples.filter((s) => s.category === selectedCategory)
      );
    }
    setCurrentPage(0); // Reset to first page when category changes
  }, [selectedCategory, snippetExamples]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            {t("assistants.personalityPrompts")}
            <Info className="w-5 h-5 text-gray-400" />
          </h2>
          <p className="text-gray-600 mt-1">
            {t("assistants.personalityPromptsDescription")}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Main Prompt Section */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t("assistants.mainPrompt")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="mainPrompt">
                  {t("assistants.mainPromptInstructions")}
                </Label>
                <Textarea
                  id="mainPrompt"
                  value={mainPrompt}
                  onChange={(e) => handleMainPromptChange(e.target.value)}
                  placeholder={t("assistants.enterMainPrompt")}
                  rows={12}
                  className="resize-none"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={resetToDefault}
                  disabled={isSaving}
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  {t("assistants.resetToDefault")}
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={!hasChanges || isSaving || !mainPrompt}
                  className="bg-primary hover:bg-primary/80"
                >
                  {isSaving ? t("common.saving") : t("common.save")}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Snippet Examples Section */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t("assistants.snippetExamples")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Category Filters */}
              <div className="flex flex-wrap gap-2">
                {isLoadingSnippets ? (
                  <div className="text-sm text-gray-500">
                    Loading categories...
                  </div>
                ) : (
                  categories.map((category) => (
                    <Badge
                      key={category.id}
                      variant={
                        selectedCategory === category.id
                          ? "default"
                          : "secondary"
                      }
                      className={`cursor-pointer ${
                        selectedCategory === category.id
                          ? "bg-primary hover:bg-primary/80"
                          : "hover:bg-gray-200"
                      }`}
                      onClick={() => {
                        setSelectedCategory(category.id);
                        setCurrentPage(0);
                      }}
                    >
                      {category.label} ({category.count})
                    </Badge>
                  ))
                )}
              </div>

              {/* Snippet Cards */}
              <div className="grid grid-cols-1 gap-3">
                {isLoadingSnippets ? (
                  <div className="text-sm text-gray-500">
                    Loading snippets...
                  </div>
                ) : currentSnippets.length === 0 ? (
                  <div className="text-sm text-gray-500">
                    No snippets found for this category.
                  </div>
                ) : (
                  currentSnippets.map((snippet) => (
                    <Card key={snippet.id} className="border border-gray-200">
                      <CardContent className="p-4">
                        <p className="text-sm text-gray-700 mb-3">
                          {snippet.text}
                        </p>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => insertSnippet(snippet)}
                          className="w-full"
                        >
                          {t("assistants.insert")}
                        </Button>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={prevPage}
                    disabled={currentPage === 0}
                  >
                    <ChevronLeft className="w-4 h-4 mr-1" />
                    {t("common.previous")}
                  </Button>
                  <span className="text-sm text-gray-500">
                    {currentPage + 1} / {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={nextPage}
                    disabled={currentPage === totalPages - 1}
                  >
                    {t("common.next")}
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
});

PersonalityTab.displayName = "PersonalityTab";

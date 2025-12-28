"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { ChatbotPreview } from "@/components/assistant/ChatbotPreview";
import { useToast } from "@/components/ui/use-toast";
import { useAssistant } from "@/contexts/assistant-context";
import { useSession } from "next-auth/react";
import { ArrowLeft, X, Plus, Info } from "lucide-react";
import SaveButton from "@/components/ui/save-button";
import { useTranslations } from "next-intl";
import { PageHeader } from "@/components/layouts";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { avatarOptions } from "@/lib/avatar-icons";
import {
  LookAndFeelTab,
  LookAndFeelTabRef,
} from "@/components/settings/tabs/LookAndFeelTab";
import { ActionButtonsTab } from "@/components/settings/tabs/ActionButtonsTab";
import { FormsTab } from "@/components/settings/tabs/FormsTab";
import { IntegrationsTab } from "@/components/settings/tabs/IntegrationsTab";
import { WidgetTab } from "@/components/settings/tabs/WidgetTab";
import { PersonalityTab } from "@/components/settings/tabs/PersonalityTab";
import { TrialGuard } from "@/components/guards/TrialGuard";

interface Assistant {
  id: string;
  userId: string;
  name: string;
  description?: string;
  welcomeMessage: string;
  placeholderText: string;
  primaryColor: string;
  secondaryColor: string;
  fontFamily?: string;
  assistantName?: string;
  assistantSubtitle?: string;
  selectedAvatar?: string;
  selectedAssistantIcon?: string;
  tone: string;
  language: string;
  maxResponseLength: number;
  temperature: number;
  fallbackMessage: string;
  position: string;
  showBranding: boolean;
  isActive: boolean;
  apiKey: string;
  allowedDomains: string[];
  rateLimit: number;
  createdAt: string;
  updatedAt: string;
}

const toneOptions = [
  { value: "professional", label: "Professional" },
  { value: "friendly", label: "Friendly" },
  { value: "casual", label: "Casual" },
  { value: "formal", label: "Formal" },
];

const languageOptions = [
  { value: "nl", label: "Dutch" },
  { value: "en", label: "English" },
  { value: "de", label: "German" },
  { value: "fr", label: "French" },
];

const positionOptions = [
  { value: "bottom-right", label: "Bottom Right" },
  { value: "bottom-left", label: "Bottom Left" },
  { value: "top-right", label: "Top Right" },
  { value: "top-left", label: "Top Left" },
];

const fontOptions = [
  "Inter",
  "Roboto",
  "Open Sans",
  "Lato",
  "Montserrat",
  "Poppins",
  "Source Sans Pro",
  "Nunito",
];

export default function EditAssistantPage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const { setCurrentAssistant, refreshAssistants } = useAssistant();
  const { data: session } = useSession();
  const t = useTranslations();

  // Check if user is admin or superuser
  const isAdmin =
    session?.user?.role === "ADMIN" || session?.user?.role === "SUPERUSER";

  const [assistant, setAssistant] = useState<Assistant | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [domainInput, setDomainInput] = useState("");
  const [activeTab, setActiveTab] = useState(
    isAdmin ? "basic" : "look-and-feel"
  );

  // Redirect to look-and-feel tab if user is on admin-only tab but not admin
  useEffect(() => {
    if (
      !isAdmin &&
      (activeTab === "basic" ||
        activeTab === "personality" ||
        activeTab === "integrations" ||
        activeTab === "widget")
    ) {
      setActiveTab("look-and-feel");
    }
  }, [isAdmin, activeTab, setActiveTab]);

  const lookAndFeelRef = useRef<LookAndFeelTabRef>(null);
  const personalityRef = useRef<any>(null);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    welcomeMessage: "Hallo! Hoe kan ik je helpen?",
    placeholderText: "Stel een vraag...",
    primaryColor: "#3B82F6",
    secondaryColor: "#1E40AF",
    fontFamily: "Inter",
    assistantName: "PS in foodservice",
    assistantSubtitle: "We helpen je graag verder!",
    selectedAvatar: "chat-bubble",
    selectedAssistantIcon: "robot",
    tone: "professional",
    language: "nl",
    maxResponseLength: 500,
    temperature: 0.7,
    fallbackMessage:
      "Sorry, ik kan deze vraag niet beantwoorden op basis van de beschikbare informatie.",
    position: "bottom-right",
    showBranding: true,
    isActive: true,
    allowedDomains: [] as string[],
    rateLimit: 10,
    mainPrompt: "",
  });

  // Load assistant data
  useEffect(() => {
    const loadAssistant = async () => {
      if (!params.id) return;

      try {
        const response = await fetch(`/api/assistants/${params.id}`);
        if (response.ok) {
          const data = await response.json();
          setAssistant(data);
          setCurrentAssistant(data); // Set the current assistant in context
          setFormData({
            name: data.name,
            description: data.description || "",
            welcomeMessage: data.welcomeMessage,
            placeholderText: data.placeholderText,
            primaryColor: data.primaryColor,
            secondaryColor: data.secondaryColor,
            fontFamily: data.fontFamily || "Inter",
            assistantName:
              data.assistantName || data.name || "PS in foodservice",
            assistantSubtitle:
              data.assistantSubtitle || "We helpen je graag verder!",
            selectedAvatar: data.selectedAvatar || "chat-bubble",
            selectedAssistantIcon: data.selectedAssistantIcon || "robot",
            tone: data.tone,
            language: data.language,
            maxResponseLength: data.maxResponseLength,
            temperature: data.temperature,
            fallbackMessage: data.fallbackMessage,
            position: data.position,
            showBranding: data.showBranding,
            isActive: data.isActive,
            allowedDomains: data.allowedDomains,
            rateLimit: data.rateLimit,
            mainPrompt: data.mainPrompt || "",
          });
        } else {
          toast({
            title: t("error"),
            description: t("error.failedToLoadAssistant"),
            variant: "destructive",
          });
          router.push("/assistants");
        }
      } catch (error) {
        console.error("Error loading assistant:", error);
        toast({
          title: t("error"),
          description: t("error.failedToLoadAssistant"),
          variant: "destructive",
        });
        router.push("/assistants");
      } finally {
        setIsLoading(false);
      }
    };

    loadAssistant();
  }, [params.id, router, toast, setCurrentAssistant, t]);

  const handleInputChange = (
    field: string,
    value: string | boolean | number
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    setHasChanges(true);
  };

  const addDomain = () => {
    if (
      domainInput.trim() &&
      !formData.allowedDomains.includes(domainInput.trim())
    ) {
      setFormData((prev) => ({
        ...prev,
        allowedDomains: [...prev.allowedDomains, domainInput.trim()],
      }));
      setDomainInput("");
      setHasChanges(true);
    }
  };

  const removeDomain = (domain: string) => {
    setFormData((prev) => ({
      ...prev,
      allowedDomains: prev.allowedDomains.filter((d) => d !== domain),
    }));
    setHasChanges(true);
  };

  const handleSave = useCallback(async () => {
    if (!assistant) return;

    // Optimistic update: update UI immediately
    const previousAssistant = { ...assistant };
    const previousFormData = { ...formData };
    const optimisticAssistant = {
      ...assistant,
      ...formData,
      updatedAt: new Date().toISOString(),
    };
    
    // Update local state optimistically
    setAssistant(optimisticAssistant);
    setCurrentAssistant(optimisticAssistant);
    setHasChanges(false);

    setIsSaving(true);
    try {
      // If we're on the look-and-feel tab, use the tab's save function
      if (activeTab === "look-and-feel" && lookAndFeelRef.current) {
        await lookAndFeelRef.current.save();
        // Don't refresh context here - let the tab handle its own state
        return;
      }

      // If we're on the personality tab, use the tab's save function (admin only)
      if (activeTab === "personality" && personalityRef.current && isAdmin) {
        await personalityRef.current.save();
        // Don't refresh context here - let the tab handle its own state
        return;
      }

      // Otherwise, use the default save for basic information
      const response = await fetch(`/api/assistants/${assistant.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const updatedAssistant = await response.json();
        // Update with server response (source of truth)
        setAssistant(updatedAssistant);
        setCurrentAssistant(updatedAssistant);
        
        // Refresh assistants list in context
        await refreshAssistants();
        
        toast({
          title: t("common.success") || "Success",
          description: t("success.assistantUpdatedSuccessfully") || "Assistent succesvol bijgewerkt",
          variant: "success",
        });
      } else {
        // Rollback optimistic update on error
        setAssistant(previousAssistant);
        setCurrentAssistant(previousAssistant);
        setFormData(previousFormData);
        setHasChanges(true);
        
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error || t("error.failedToUpdateAssistant") || "Bijwerken mislukt"
        );
      }
    } catch (error) {
      console.error("Error updating assistant:", error);
      
      // Rollback optimistic update on error
      setAssistant(previousAssistant);
      setCurrentAssistant(previousAssistant);
      setFormData(previousFormData);
      setHasChanges(true);
      
      toast({
        title: t("common.error") || "Error",
        description:
          error instanceof Error
            ? error.message
            : t("error.failedToUpdateAssistant") || "Bijwerken mislukt",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  }, [assistant, formData, toast, activeTab, t, isAdmin, setCurrentAssistant, refreshAssistants]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-gray-600">{t("common.statuses.loading")}</p>
        </div>
      </div>
    );
  }

  if (!assistant) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-gray-600">{t("assistants.assistantNotFound")}</p>
          <Button onClick={() => router.push("/assistants")} className="mt-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t("assistants.backToAssistants")}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <TrialGuard feature="assistant">
      <div className="space-y-8">
        <div className="flex justify-between items-center">
          <PageHeader
            title={t("assistants.editAssistant")}
            description={t("assistants.configureYourAISettings")}
          />
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => router.push("/assistants")}
              disabled={isSaving}
            >
              <X className="w-4 h-4 mr-2" />
              {t("common.cancel")}
            </Button>
            <SaveButton
              onClick={handleSave}
              isLoading={isSaving}
              disabled={!hasChanges}
            >
              {t("common.saveChanges")}
            </SaveButton>
          </div>
        </div>

        {/* Main Content */}
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          defaultValue={isAdmin ? "basic" : "look-and-feel"}
          className="space-y-6"
        >
          <TabsList>
            {isAdmin && (
              <TabsTrigger value="basic">
                {t("assistants.basicInformation")}
              </TabsTrigger>
            )}
            <TabsTrigger value="look-and-feel">
              {t("assistants.lookAndFeel")}
            </TabsTrigger>
            {isAdmin && (
              <TabsTrigger value="personality">
                {t("assistants.personality")}
              </TabsTrigger>
            )}
            <TabsTrigger value="action-buttons">
              {t("assistants.actionButtons")}
            </TabsTrigger>
            <TabsTrigger value="forms">{t("assistants.forms")}</TabsTrigger>
            {isAdmin && (
              <>
                <TabsTrigger value="integrations">
                  {t("assistants.integrations")}
                </TabsTrigger>
                <TabsTrigger value="widget">
                  {t("assistants.widget")}
                </TabsTrigger>
              </>
            )}
          </TabsList>

          {isAdmin && (
            <TabsContent value="basic">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Settings Column */}
                <div className="space-y-6">
                  {/* Basic Information */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <span>{t("assistants.basicInformation")}</span>
                        <Info className="w-4 h-4 text-gray-400" />
                      </CardTitle>
                      <CardDescription>
                        {t(
                          "assistants.configureTheBasicSettingsForYourAssistant"
                        )}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">{t("assistants.name")} *</Label>
                        <Input
                          id="name"
                          value={formData.name}
                          onChange={(e) =>
                            handleInputChange("name", e.target.value)
                          }
                          placeholder={t("assistants.enterAssistantName")}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="description">
                          {t("assistants.description")}
                        </Label>
                        <Textarea
                          id="description"
                          value={formData.description}
                          onChange={(e) =>
                            handleInputChange("description", e.target.value)
                          }
                          placeholder={t(
                            "assistants.enterAssistantDescription"
                          )}
                          rows={3}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="tone">{t("assistants.tone")}</Label>
                          <Select
                            value={formData.tone}
                            onValueChange={(value) =>
                              handleInputChange("tone", value)
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {toneOptions.map((option) => (
                                <SelectItem
                                  key={option.value}
                                  value={option.value}
                                >
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="language">
                            {t("assistants.language")}
                          </Label>
                          <Select
                            value={formData.language}
                            onValueChange={(value) =>
                              handleInputChange("language", value)
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {languageOptions.map((option) => (
                                <SelectItem
                                  key={option.value}
                                  value={option.value}
                                >
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Messages */}
                  <Card>
                    <CardHeader>
                      <CardTitle>{t("assistants.messages")}</CardTitle>
                      <CardDescription>
                        {t(
                          "assistants.configureTheMessagesYourAssistantWillUse"
                        )}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="welcomeMessage">
                          {t("assistants.welcomeMessage")}
                        </Label>
                        <Textarea
                          id="welcomeMessage"
                          value={formData.welcomeMessage}
                          onChange={(e) =>
                            handleInputChange("welcomeMessage", e.target.value)
                          }
                          placeholder={t("assistants.enterWelcomeMessage")}
                          rows={2}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="placeholderText">
                          {t("assistants.placeholderText")}
                        </Label>
                        <Input
                          id="placeholderText"
                          value={formData.placeholderText}
                          onChange={(e) =>
                            handleInputChange("placeholderText", e.target.value)
                          }
                          placeholder={t("assistants.enterPlaceholderText")}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="fallbackMessage">
                          {t("assistants.fallbackMessage")}
                        </Label>
                        <Textarea
                          id="fallbackMessage"
                          value={formData.fallbackMessage}
                          onChange={(e) =>
                            handleInputChange("fallbackMessage", e.target.value)
                          }
                          placeholder={t("assistants.enterFallbackMessage")}
                          rows={2}
                        />
                      </div>
                    </CardContent>
                  </Card>

                  {/* AI Settings */}
                  <Card>
                    <CardHeader>
                      <CardTitle>{t("assistants.aiSettings")}</CardTitle>
                      <CardDescription>
                        {t("assistants.configureTheAIBehaviorAndResponses")}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="maxResponseLength">
                            {t("assistants.maxResponseLength")}
                          </Label>
                          <Input
                            id="maxResponseLength"
                            type="number"
                            value={formData.maxResponseLength}
                            onChange={(e) =>
                              handleInputChange(
                                "maxResponseLength",
                                parseInt(e.target.value)
                              )
                            }
                            min="100"
                            max="2000"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="temperature">
                            {t("assistants.temperature")}
                          </Label>
                          <Input
                            id="temperature"
                            type="number"
                            step="0.1"
                            min="0"
                            max="1"
                            value={formData.temperature}
                            onChange={(e) =>
                              handleInputChange(
                                "temperature",
                                parseFloat(e.target.value)
                              )
                            }
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Security & Access */}
                  <Card>
                    <CardHeader>
                      <CardTitle>{t("assistants.securityAndAccess")}</CardTitle>
                      <CardDescription>
                        {t(
                          "assistants.configureSecuritySettingsAndAccessControl"
                        )}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="rateLimit">
                          {t("assistants.rateLimit")} (
                          {t("assistants.requestsPerMinute")})
                        </Label>
                        <Input
                          id="rateLimit"
                          type="number"
                          value={formData.rateLimit}
                          onChange={(e) =>
                            handleInputChange(
                              "rateLimit",
                              parseInt(e.target.value)
                            )
                          }
                          min="1"
                          max="100"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>{t("assistants.allowedDomains")}</Label>
                        <div className="flex space-x-2">
                          <Input
                            value={domainInput}
                            onChange={(e) => setDomainInput(e.target.value)}
                            placeholder={t("assistants.enterDomain")}
                            onKeyPress={(e) =>
                              e.key === "Enter" &&
                              (e.preventDefault(), addDomain())
                            }
                          />
                          <Button type="button" onClick={addDomain} size="sm">
                            <Plus className="w-4 h-4" />
                          </Button>
                        </div>
                        {formData.allowedDomains.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-2">
                            {formData.allowedDomains.map((domain) => (
                              <Badge
                                key={domain}
                                variant="secondary"
                                className="flex items-center space-x-1"
                              >
                                <span>{domain}</span>
                                <button
                                  onClick={() => removeDomain(domain)}
                                  className="ml-1 hover:text-red-500"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Status */}
                  <Card>
                    <CardHeader>
                      <CardTitle>{t("assistants.status")}</CardTitle>
                      <CardDescription>
                        {t("assistants.controlTheAvailabilityOfYourAssistant")}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label>{t("assistants.active")}</Label>
                          <p className="text-sm text-gray-500">
                            {t("assistants.enableOrDisableTheAssistant")}
                          </p>
                        </div>
                        <Switch
                          checked={formData.isActive}
                          onCheckedChange={(checked) =>
                            handleInputChange("isActive", checked)
                          }
                          className="data-[state=checked]:bg-primary"
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label>{t("assistants.showBranding")}</Label>
                          <p className="text-sm text-gray-500">
                            {t("assistants.displayYourBrandingInTheChatWidget")}
                          </p>
                        </div>
                        <Switch
                          checked={formData.showBranding}
                          onCheckedChange={(checked) =>
                            handleInputChange("showBranding", checked)
                          }
                          className="data-[state=checked]:bg-primary"
                        />
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Preview Column */}
                <div className="space-y-6">
                  <ChatbotPreview
                    fontFamily={formData.fontFamily}
                    assistantName={formData.assistantName}
                    assistantSubtitle={formData.assistantSubtitle}
                    selectedAvatar={formData.selectedAvatar}
                    selectedAssistantIcon={formData.selectedAssistantIcon}
                    primaryColor={formData.primaryColor}
                    secondaryColor={formData.secondaryColor}
                    welcomeMessage={formData.welcomeMessage}
                    placeholderText={formData.placeholderText}
                  />
                </div>
              </div>
            </TabsContent>
          )}

          <TabsContent value="look-and-feel">
            <LookAndFeelTab ref={lookAndFeelRef} onChanges={setHasChanges} />
          </TabsContent>

          {isAdmin && (
            <TabsContent value="personality">
              <PersonalityTab ref={personalityRef} onChanges={setHasChanges} />
            </TabsContent>
          )}

          <TabsContent value="action-buttons">
            <ActionButtonsTab onChanges={setHasChanges} />
          </TabsContent>

          <TabsContent value="forms">
            <FormsTab onChanges={setHasChanges} />
          </TabsContent>

          {isAdmin && (
            <>
              <TabsContent value="integrations">
                <IntegrationsTab onChanges={setHasChanges} />
              </TabsContent>

              <TabsContent value="widget">
                <WidgetTab onChanges={setHasChanges} />
              </TabsContent>
            </>
          )}
        </Tabs>
      </div>
    </TrialGuard>
  );
}

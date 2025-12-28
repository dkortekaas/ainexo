"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
import { Badge } from "@/components/ui/badge";
import { ColorPicker } from "@/components/assistant/ColorPicker";
import { ChatbotPreview } from "@/components/assistant/ChatbotPreview";
import { useToast } from "@/components/ui/use-toast";
import { ArrowLeft, Save, X, Plus, Info } from "lucide-react";
import { useTranslations } from "next-intl";
import { PageHeader } from "@/components/layouts";
import { avatarOptions, assistantIconOptions } from "@/lib/avatar-icons";
import {
  getDefaultSystemPrompt,
  getPromptTemplates,
} from "@/lib/assistant-utils";

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

export default function NewAssistantPage() {
  const router = useRouter();
  const { toast } = useToast();
  const t = useTranslations();
  const [isSaving, setIsSaving] = useState(false);
  const [domainInput, setDomainInput] = useState("");

  const toneOptions = [
    { value: "professional", label: t("assistants.professional") },
    { value: "friendly", label: t("assistants.friendly") },
    { value: "casual", label: t("assistants.casual") },
    { value: "formal", label: t("assistants.formal") },
  ];

  const languageOptions = [
    { value: "nl", label: t("assistants.nl") },
    { value: "en", label: t("assistants.en") },
    { value: "de", label: t("assistants.de") },
    { value: "fr", label: t("assistants.fr") },
  ];

  const positionOptions = [
    { value: "bottom-right", label: t("assistants.bottom-right") },
    { value: "bottom-left", label: t("assistants.bottom-left") },
    { value: "top-right", label: t("assistants.top-right") },
    { value: "top-left", label: t("assistants.top-left") },
  ];

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
    mainPrompt: getDefaultSystemPrompt("DEFAULT"),
  });

  const handleInputChange = (
    field: string,
    value: string | boolean | number
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
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
    }
  };

  const removeDomain = (domain: string) => {
    setFormData((prev) => ({
      ...prev,
      allowedDomains: prev.allowedDomains.filter((d) => d !== domain),
    }));
  };

  const handleSave = async () => {
    // Validate required fields
    if (!formData.name.trim()) {
      toast({
        title: t("common.error"),
        description: t("error.assistantNameRequired"),
        variant: "destructive",
      });
      return;
    }

    if (!formData.welcomeMessage.trim()) {
      toast({
        title: t("common.error"),
        description: t("error.welcomeMessageRequired") || "Welkomstbericht is verplicht",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch("/api/assistants", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name,
          welcomeMessage: formData.welcomeMessage,
          placeholderText: formData.placeholderText,
          primaryColor: formData.primaryColor,
          secondaryColor: formData.secondaryColor,
          selectedAvatar: formData.selectedAvatar,
          selectedAssistantIcon: formData.selectedAssistantIcon,
          tone: formData.tone,
          language: formData.language,
          maxResponseLength: formData.maxResponseLength,
          temperature: formData.temperature,
          fallbackMessage: formData.fallbackMessage,
          position: formData.position,
          showBranding: formData.showBranding,
          isActive: formData.isActive,
          allowedDomains: formData.allowedDomains,
          rateLimit: formData.rateLimit,
          mainPrompt: formData.mainPrompt,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();

        // Check for subscription limit error
        if (
          response.status === 403 &&
          errorData.error === "Assistant limit reached"
        ) {
          toast({
            title: t("error.assistantLimitReached"),
            description:
              errorData.message || t("error.assistantLimitReachedDescription"),
            variant: "destructive",
          });
          return;
        }

        throw new Error("Failed to create assistant");
      }

      const created = await response.json();
      toast({
        title: t("common.success"),
        description: t("success.assistantCreatedSuccessfully"),
        variant: "success",
      });
      router.push(`/assistants/${created.id}/edit`);
    } catch (error) {
      // Only show generic error if it's not a subscription limit error
      if (
        error instanceof Error &&
        error.message !== "Failed to create assistant"
      ) {
        toast({
          title: t("common.error"),
          description: t("error.failedToCreateAssistant"),
          variant: "destructive",
        });
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <PageHeader
          title={t("assistants.createAssistant")}
          description={t("assistants.configureYourNewAIAssistant")}
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
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="bg-primary hover:bg-primary/80"
          >
            <Save className="w-4 h-4 mr-2" />
            {isSaving ? t("common.saving") : t("assistants.createAssistant")}
          </Button>
        </div>
      </div>

      {/* Main Content */}
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
                {t("assistants.configureTheBasicSettingsForYourAssistant")}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">{t("assistants.name")} *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
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
                  placeholder={t("assistants.enterAssistantDescription")}
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="tone">{t("assistants.tone")}</Label>
                  <Select
                    value={formData.tone}
                    onValueChange={(value) => handleInputChange("tone", value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {toneOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="language">{t("assistants.language")}</Label>
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
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Look and Feel */}
          <Card>
            <CardHeader>
              <CardTitle>{t("assistants.lookAndFeel")}</CardTitle>
              <CardDescription>
                {t("assistants.customizeTheAppearanceOfYourAssistant")}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fontFamily">
                    {t("assistants.fontFamily")}
                  </Label>
                  <Select
                    value={formData.fontFamily}
                    onValueChange={(value) =>
                      handleInputChange("fontFamily", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue>
                        <span
                          style={{
                            fontFamily: `"${formData.fontFamily}", sans-serif`,
                          }}
                        >
                          {formData.fontFamily}
                        </span>
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {fontOptions.map((font) => (
                        <SelectItem key={font} value={font}>
                          <span style={{ fontFamily: `"${font}", sans-serif` }}>
                            {font}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="position">{t("assistants.position")}</Label>
                  <Select
                    value={formData.position}
                    onValueChange={(value) =>
                      handleInputChange("position", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {positionOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t("assistants.assistantName")}</Label>
                  <Input
                    value={formData.assistantName}
                    onChange={(e) =>
                      handleInputChange("assistantName", e.target.value)
                    }
                    placeholder={t("assistants.enterAssistantName")}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t("assistants.assistantSubtitle")}</Label>
                  <Input
                    value={formData.assistantSubtitle}
                    onChange={(e) =>
                      handleInputChange("assistantSubtitle", e.target.value)
                    }
                    placeholder={t("assistants.enterAssistantSubtitle")}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>{t("assistants.avatar")}</Label>
                    <p className="text-sm text-gray-500 mb-3">
                      {t("assistants.avatarDescription")}
                    </p>
                    <div className="grid grid-cols-5 gap-3">
                      {avatarOptions.map((avatar) => {
                        const IconComponent = avatar.icon;
                        return (
                          <button
                            key={avatar.id}
                            onClick={() =>
                              handleInputChange("selectedAvatar", avatar.id)
                            }
                            className={`w-12 h-12 rounded-lg border-2 flex items-center justify-center transition-all ${
                              formData.selectedAvatar === avatar.id
                                ? "border-primary bg-purple-50 scale-105"
                                : "border-gray-200 hover:border-gray-300 hover:scale-105"
                            }`}
                            title={avatar.name}
                          >
                            <IconComponent
                              className={`w-5 h-5 ${
                                formData.selectedAvatar === avatar.id
                                  ? "text-primary"
                                  : "text-gray-600"
                              }`}
                            />
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>{t("assistants.assistantIcon")}</Label>
                    <p className="text-sm text-gray-500 mb-3">
                      {t("assistants.assistantIconDescription")}
                    </p>
                    <div className="grid grid-cols-5 gap-3">
                      {assistantIconOptions.map((icon) => {
                        const IconComponent = icon.icon;
                        return (
                          <button
                            key={icon.id}
                            onClick={() =>
                              handleInputChange(
                                "selectedAssistantIcon",
                                icon.id
                              )
                            }
                            className={`w-12 h-12 rounded-lg border-2 flex items-center justify-center transition-all ${
                              formData.selectedAssistantIcon === icon.id
                                ? "border-primary bg-purple-50 scale-105"
                                : "border-gray-200 hover:border-gray-300 hover:scale-105"
                            }`}
                            title={icon.name}
                          >
                            <IconComponent
                              className={`w-5 h-5 ${
                                formData.selectedAssistantIcon === icon.id
                                  ? "text-primary"
                                  : "text-gray-600"
                              }`}
                            />
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t("assistants.primaryColor")}</Label>
                  <ColorPicker
                    color={formData.primaryColor}
                    onChange={(color) =>
                      handleInputChange("primaryColor", color)
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t("assistants.secondaryColor")}</Label>
                  <ColorPicker
                    color={formData.secondaryColor}
                    onChange={(color) =>
                      handleInputChange("secondaryColor", color)
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Messages */}
          <Card>
            <CardHeader>
              <CardTitle>{t("assistants.messages")}</CardTitle>
              <CardDescription>
                {t("assistants.configureTheMessagesYourAssistantWillUse")}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="welcomeMessage">
                  {t("assistants.welcomeMessage")} *
                </Label>
                <Textarea
                  id="welcomeMessage"
                  value={formData.welcomeMessage}
                  onChange={(e) =>
                    handleInputChange("welcomeMessage", e.target.value)
                  }
                  placeholder={t("assistants.enterWelcomeMessage")}
                  rows={2}
                  required
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
              <div className="space-y-2">
                <Label htmlFor="mainPrompt">
                  {t("assistants.mainPrompt") || "Systeem Prompt"}
                </Label>
                <p className="text-sm text-gray-500">
                  {t("assistants.mainPromptDescription") ||
                    "Definieer hoe de assistent zich gedraagt en communiceert. Dit is de basis instructie voor de AI."}
                </p>
                <Textarea
                  id="mainPrompt"
                  value={formData.mainPrompt}
                  onChange={(e) =>
                    handleInputChange("mainPrompt", e.target.value)
                  }
                  placeholder={getDefaultSystemPrompt("DEFAULT")}
                  rows={12}
                  className="font-mono text-sm"
                />
                <div className="flex gap-2">
                  <Select
                    onValueChange={(value) => {
                      const template = getDefaultSystemPrompt(
                        value as any
                      );
                      handleInputChange("mainPrompt", template);
                    }}
                  >
                    <SelectTrigger className="w-[200px]">
                      <SelectValue placeholder="Kies template" />
                    </SelectTrigger>
                    <SelectContent>
                      {getPromptTemplates().map((template) => (
                        <SelectItem key={template.key} value={template.key}>
                          {template.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      handleInputChange("mainPrompt", getDefaultSystemPrompt("DEFAULT"));
                    }}
                  >
                    Reset naar standaard
                  </Button>
                </div>
              </div>
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
                {t("assistants.configureSecuritySettingsAndAccessControl")}
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
                    handleInputChange("rateLimit", parseInt(e.target.value))
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
                      e.key === "Enter" && (e.preventDefault(), addDomain())
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
    </div>
  );
}

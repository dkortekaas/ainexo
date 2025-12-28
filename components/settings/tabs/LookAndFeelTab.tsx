"use client";

import {
  useState,
  useEffect,
  useCallback,
  useImperativeHandle,
  forwardRef,
} from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Label,
  SaveButton,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui";
import { Info } from "lucide-react";
import { useAssistant } from "@/contexts/assistant-context";
import { useToast } from "@/components/ui/use-toast";
import { ChatbotPreview } from "@/components/assistant/ChatbotPreview";
import { ColorPicker } from "@/components/assistant/ColorPicker";
import { useTranslations } from "next-intl";
import {
  avatarOptions,
  assistantIconOptions,
  getAvatarIcon,
  getAssistantIcon,
} from "@/lib/avatar-icons";

interface LookAndFeelTabProps {
  onChanges: (hasChanges: boolean) => void;
}

export interface LookAndFeelTabRef {
  save: () => Promise<void>;
}

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

const positionOptions = [
  { value: "bottom-right", label: "Bottom Right" },
  { value: "bottom-left", label: "Bottom Left" },
  { value: "top-right", label: "Top Right" },
  { value: "top-left", label: "Top Left" },
];

export const LookAndFeelTab = forwardRef<
  LookAndFeelTabRef,
  LookAndFeelTabProps
>(({ onChanges }, ref) => {
  const { currentAssistant, refreshAssistants, setCurrentAssistant } =
    useAssistant();
  const { toast } = useToast();
  const t = useTranslations();

  const [fontFamily, setFontFamily] = useState("Inter");
  const [assistantName, setAssistantName] = useState(
    t("settings.assistantName")
  );
  const [assistantSubtitle, setAssistantSubtitle] = useState(
    t("settings.assistantSubtitle")
  );
  const [selectedAvatar, setSelectedAvatar] = useState("chat-bubble");
  const [selectedAssistantIcon, setSelectedAssistantIcon] = useState("robot");
  const [primaryColor, setPrimaryColor] = useState("#3B82F6");
  const [secondaryColor, setSecondaryColor] = useState("#1E40AF");
  const [isLoading, setIsLoading] = useState(false);

  // Load data from current assistant only on initial load
  const [hasLoaded, setHasLoaded] = useState(false);

  useEffect(() => {
    if (currentAssistant && !hasLoaded) {
      console.log("Loading assistant data:", currentAssistant);
      setFontFamily(currentAssistant.fontFamily || "Inter");
      setAssistantName(
        currentAssistant.assistantName ||
          currentAssistant.name ||
          t("settings.assistantName")
      );
      setAssistantSubtitle(
        currentAssistant.assistantSubtitle || t("settings.assistantSubtitle")
      );
      setSelectedAvatar(currentAssistant.selectedAvatar || "chat-bubble");
      setSelectedAssistantIcon(
        currentAssistant.selectedAssistantIcon || "robot"
      );
      setPrimaryColor(currentAssistant.primaryColor || "#3B82F6");
      setSecondaryColor(currentAssistant.secondaryColor || "#1E40AF");
      setHasLoaded(true);
    }
  }, [currentAssistant, t, hasLoaded]);

  // Auto-save disabled - only manual save via parent component
  // useEffect(() => {
  //   if (currentAssistant) {
  //     const timeoutId = setTimeout(() => {
  //       handleAutoSave();
  //     }, 1000); // Debounce for 1 second

  //     return () => clearTimeout(timeoutId);
  //   }
  // }, [
  //   fontFamily,
  //   assistantName,
  //   assistantSubtitle,
  //   selectedAvatar,
  //   currentAssistant,
  //   handleAutoSave,
  // ]);

  const handleSave = useCallback(async () => {
    if (!currentAssistant) {
      toast({
        title: t("settings.error"),
        description: t("settings.noAssistantSelected"),
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const updateData = {
        ...currentAssistant,
        fontFamily,
        assistantName,
        assistantSubtitle,
        selectedAvatar,
        selectedAssistantIcon,
        primaryColor,
        secondaryColor,
      };

      console.log("Sending update data:", updateData);

      const response = await fetch(`/api/assistants/${currentAssistant.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updateData),
      });

      if (response.ok) {
        const updatedAssistant = await response.json();
        console.log("Updated assistant:", updatedAssistant);
        // Update the context with the new values
        setCurrentAssistant(updatedAssistant);
        await refreshAssistants();
        onChanges(false);
        toast({
          title: t("settings.success"),
          description: t("settings.settingsSavedSuccessfully"),
        });
      } else {
        console.error("Failed to save:", response.status, response.statusText);
        throw new Error("Failed to save settings");
      }
    } catch (error) {
      console.error("Error saving settings:", error);
      toast({
        title: t("settings.error"),
        description: t("settings.failedToSaveSettings"),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [
    currentAssistant,
    fontFamily,
    assistantName,
    assistantSubtitle,
    selectedAvatar,
    selectedAssistantIcon,
    primaryColor,
    secondaryColor,
    setCurrentAssistant,
    refreshAssistants,
    onChanges,
    toast,
    t,
  ]);

  // Expose save function to parent
  useImperativeHandle(
    ref,
    () => ({
      save: handleSave,
    }),
    [handleSave]
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Settings Column */}
      <div className="space-y-6">
        {/* Font Family Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <span>{t("settings.fontFamily")}</span>
              <Info className="w-4 h-4 text-gray-400" />
            </CardTitle>
            <CardDescription>
              {t("settings.fontFamilyDescription")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="font-family">{t("settings.fontFamily")}</Label>
              <Select
                value={fontFamily}
                onValueChange={(value) => {
                  setFontFamily(value);
                  onChanges(true);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("settings.selectFontFamily")}>
                    <span style={{ fontFamily: `"${fontFamily}", sans-serif` }}>
                      {fontFamily}
                    </span>
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {fontOptions.map((font) => (
                    <SelectItem key={font} value={font}>
                      <div className="flex items-center space-x-2">
                        <span style={{ fontFamily: `"${font}", sans-serif` }}>
                          {font}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Font Preview */}
            <div className="space-y-2">
              <Label>{t("settings.preview")}</Label>
              <div
                className="p-3 border rounded-lg bg-gray-50"
                style={{ fontFamily: `"${fontFamily}", sans-serif` }}
              >
                <p className="text-sm font-medium">
                  {t("settings.assistantName")}
                </p>
                <p className="text-xs text-gray-600">
                  {t("settings.fontPreviewDescription", { fontFamily })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Assistant Name & Subtitle Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <span>
                {t("assistants.assistantName")} &{" "}
                {t("assistants.assistantSubtitle")}
              </span>
              <Info className="w-4 h-4 text-gray-400" />
            </CardTitle>
            <CardDescription>
              {t("assistants.customizeTheAppearanceOfYourAssistant")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="assistantName">
                  {t("assistants.assistantName")}
                </Label>
                <Input
                  id="assistantName"
                  value={assistantName}
                  onChange={(e) => {
                    setAssistantName(e.target.value);
                    onChanges(true);
                  }}
                  placeholder={t("assistants.enterAssistantName")}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="assistantSubtitle">
                  {t("assistants.assistantSubtitle")}
                </Label>
                <Input
                  id="assistantSubtitle"
                  value={assistantSubtitle}
                  onChange={(e) => {
                    setAssistantSubtitle(e.target.value);
                    onChanges(true);
                  }}
                  placeholder={t("assistants.enterAssistantSubtitle")}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Colors Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <span>{t("assistants.colors")}</span>
              <Info className="w-4 h-4 text-gray-400" />
            </CardTitle>
            <CardDescription>
              {t("assistants.customizeTheAppearanceOfYourAssistant")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t("assistants.primaryColor")}</Label>
                <ColorPicker
                  color={primaryColor}
                  onChange={(color) => {
                    setPrimaryColor(color);
                    onChanges(true);
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label>{t("assistants.secondaryColor")}</Label>
                <ColorPicker
                  color={secondaryColor}
                  onChange={(color) => {
                    setSecondaryColor(color);
                    onChanges(true);
                  }}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Avatar & Assistant Icons Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <span>{t("settings.avatarAndAssistantIcons")}</span>
              <Info className="w-4 h-4 text-gray-400" />
            </CardTitle>
            <CardDescription>
              {t("settings.avatarAndAssistantIconsDescription")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>{t("settings.avatar")}</Label>
                <p className="text-sm text-gray-500 mb-3">
                  {t("settings.avatarDescription")}
                </p>
                <div className="grid grid-cols-5 gap-3">
                  {avatarOptions.map((avatar) => {
                    const IconComponent = avatar.icon;
                    return (
                      <button
                        key={avatar.id}
                        onClick={() => {
                          setSelectedAvatar(avatar.id);
                          onChanges(true);
                        }}
                        className={`w-12 h-12 rounded-lg border-2 flex items-center justify-center transition-all ${
                          selectedAvatar === avatar.id
                            ? "border-primary bg-purple-50 scale-105"
                            : "border-gray-200 hover:border-gray-300 hover:scale-105"
                        }`}
                        title={avatar.name}
                      >
                        <IconComponent
                          className={`w-5 h-5 ${
                            selectedAvatar === avatar.id
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
                <Label>{t("settings.assistantIcon")}</Label>
                <p className="text-sm text-gray-500 mb-3">
                  {t("settings.assistantIconDescription")}
                </p>
                <div className="grid grid-cols-5 gap-3">
                  {assistantIconOptions.map((icon) => {
                    const IconComponent = icon.icon;
                    return (
                      <button
                        key={icon.id}
                        onClick={() => {
                          setSelectedAssistantIcon(icon.id);
                          onChanges(true);
                        }}
                        className={`w-12 h-12 rounded-lg border-2 flex items-center justify-center transition-all ${
                          selectedAssistantIcon === icon.id
                            ? "border-primary bg-purple-50 scale-105"
                            : "border-gray-200 hover:border-gray-300 hover:scale-105"
                        }`}
                        title={icon.name}
                      >
                        <IconComponent
                          className={`w-5 h-5 ${
                            selectedAssistantIcon === icon.id
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
          </CardContent>
        </Card>
      </div>

      {/* Preview Column */}
      <div className="space-y-6">
        <ChatbotPreview
          fontFamily={fontFamily}
          assistantName={assistantName}
          assistantSubtitle={assistantSubtitle}
          selectedAvatar={selectedAvatar}
          selectedAssistantIcon={selectedAssistantIcon}
          primaryColor={primaryColor}
          secondaryColor={secondaryColor}
          welcomeMessage={
            currentAssistant?.welcomeMessage || t("settings.welcomeMessage")
          }
          placeholderText={
            currentAssistant?.placeholderText || t("settings.placeholderText")
          }
        />
      </div>
    </div>
  );
});

LookAndFeelTab.displayName = "LookAndFeelTab";

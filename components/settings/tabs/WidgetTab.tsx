"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Switch,
  Input,
  Label,
} from "@/components/ui";
import { DeleteConfirmationModal } from "@/components/shared/DeleteConfirmationModal";
import {
  Copy,
  Check,
  Monitor,
  Smartphone,
  Tablet,
  AlertTriangle,
  Trash2,
  Power,
  TestTube,
  Key,
  RefreshCw,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useAssistant } from "@/contexts/assistant-context";
import { useToast } from "@/components/ui/use-toast";

interface WidgetTabProps {
  onChanges: (hasChanges: boolean) => void;
}

export function WidgetTab({ onChanges }: WidgetTabProps) {
  const [isEnabled, setIsEnabled] = useState(true);
  const [copied, setCopied] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [apiKey, setApiKey] = useState<string>("");
  const [isLoadingApiKey, setIsLoadingApiKey] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const t = useTranslations();
  const { currentAssistant, refreshAssistants } = useAssistant();
  const { toast } = useToast();
  const router = useRouter();

  // Load API key when component mounts
  useEffect(() => {
    if (currentAssistant?.apiKey) {
      setApiKey(currentAssistant.apiKey);
    } else {
      // For testing, use the test API key that fetches real data
      setApiKey("cbk_test_123456789");
    }
  }, [currentAssistant]);

  const handleRegenerateApiKey = async () => {
    setIsRegenerating(true);
    try {
      if (currentAssistant?.id) {
        // Call the real API endpoint for production
        const response = await fetch("/api/chatbot/settings/regenerate-key", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (response.ok) {
          const data = await response.json();
          setApiKey(data.apiKey);
          toast({
            title: "API Key Regenerated",
            description: "Your new API key has been generated successfully.",
          });
          onChanges(true);
        } else {
          throw new Error("Failed to regenerate API key");
        }
      } else {
        // For testing without assistant, generate a local API key
        // Use Web Crypto API for secure random values
        const array = new Uint8Array(16);
        crypto.getRandomValues(array);
        const randomPart = Array.from(array, (byte) =>
          byte.toString(16).padStart(2, "0")
        )
          .join("")
          .substring(0, 16);
        const newApiKey = `cbk_live_${Date.now()}_${randomPart}`;
        setApiKey(newApiKey);

        toast({
          title: "API Key Regenerated",
          description: "Your new API key has been generated successfully.",
        });
        onChanges(true);
      }
    } catch (error) {
      console.error("Error regenerating API key:", error);
      toast({
        title: "Error",
        description: "Failed to regenerate API key. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleCopyApiKey = async () => {
    try {
      await navigator.clipboard.writeText(apiKey);
      toast({
        title: "API Key Copied",
        description: "API key has been copied to clipboard.",
      });
    } catch (err) {
      console.error("Failed to copy API key:", err);
      toast({
        title: "Error",
        description: "Failed to copy API key to clipboard.",
        variant: "destructive",
      });
    }
  };

  const widgetCode = `<!-- Chatbot Widget -->
<script
  src="${process.env.NEXT_PUBLIC_APP_URL}/widget/loader.js"
  data-chatbot-id="${apiKey || "YOUR_API_KEY_HERE"}"
></script>`;

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(widgetCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy code:", err);
    }
  };

  const handleToggleEnabled = () => {
    setIsEnabled(!isEnabled);
    onChanges(true);
  };

  const handleDeleteAssistant = async () => {
    if (!currentAssistant?.id || isDeleting) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/assistants/${currentAssistant.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || "Failed to delete assistant");
      }
      toast({
        title: t("common.success"),
        description: t("settings.assistantDeletedSuccessfully"),
        variant: "success",
      });
      await refreshAssistants();
      setIsDeleteModalOpen(false);
      router.push("/assistants");
    } catch (error) {
      console.error("Error deleting assistant:", error);
      toast({
        title: t("common.error"),
        description: t("settings.failedToDeleteAssistant"),
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900">
          {t("settings.widgetManagement")}
        </h3>
        <p className="text-sm text-gray-600">
          {t("settings.widgetManagementDescription")}
        </p>
      </div>

      {/* Installation Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Monitor className="w-5 h-5" />
            <span>{t("settings.installAssistantOnWebsite")}</span>
          </CardTitle>
          <CardDescription>
            {t("settings.installAssistantOnWebsiteDescription")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-gray-900 text-gray-100 p-4 rounded-lg font-mono text-sm overflow-x-auto">
            <pre className="whitespace-pre-wrap">{widgetCode}</pre>
          </div>
          <div className="flex space-x-2">
            <Button
              onClick={handleCopyCode}
              className="bg-primary hover:bg-primary/80"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  {t("settings.copied")}
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 mr-2" />
                  {t("settings.copyCode")}
                </>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                const testUrl = `/widget-test.html?apiKey=${encodeURIComponent(apiKey)}`;
                window.open(testUrl, "_blank");
              }}
            >
              <TestTube className="w-4 h-4 mr-2" />
              Test Widget
            </Button>
          </div>

          {/* Instructions */}
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">
              Installatie instructies:
            </h4>
            <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
              <li>Kopieer de code hierboven.</li>
              <li>
                Plak het script in de{" "}
                <code className="bg-blue-100 px-1 rounded">&lt;/body&gt;</code>{" "}
                tag van je website
              </li>
              <li>
                Alle andere instellingen worden automatisch uit de database
                gehaald
              </li>
              <li>Test de widget met de &quot;Test Widget&quot; knop</li>
            </ol>
          </div>
        </CardContent>
      </Card>

      {/* API Key Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Key className="w-5 h-5" />
            <span>API Key</span>
          </CardTitle>
          <CardDescription>
            Je API key voor de widget integratie. Bewaar deze veilig.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="api-key">Huidige API Key</Label>
            <div className="flex space-x-2">
              <Input
                id="api-key"
                value={apiKey}
                readOnly
                className="font-mono text-sm"
                placeholder="Geen API key gevonden"
              />
              <Button
                variant="outline"
                onClick={handleCopyApiKey}
                disabled={!apiKey}
              >
                <Copy className="w-4 h-4 mr-2" />
                Kopieer
              </Button>
              <Button
                variant="outline"
                onClick={handleRegenerateApiKey}
                disabled={isRegenerating}
              >
                <RefreshCw
                  className={`w-4 h-4 mr-2 ${isRegenerating ? "animate-spin" : ""}`}
                />
                {isRegenerating ? "Regenereren..." : "Regenereren"}
              </Button>
            </div>
          </div>

          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-start space-x-2">
              <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-yellow-800">
                  Belangrijk: API Key Beveiliging
                </p>
                <p className="text-sm text-yellow-700">
                  Je API key geeft toegang tot je chatbot. Deel deze nooit
                  publiekelijk en regenereren maakt de oude key ongeldig.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Platform Examples Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Monitor className="w-5 h-5" />
            <span>Platform Voorbeelden</span>
          </CardTitle>
          <CardDescription>
            Voorbeelden voor verschillende platforms en frameworks
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* WordPress */}
          <div className="space-y-2">
            <h4 className="font-medium text-gray-900">WordPress</h4>
            <p className="text-sm text-gray-600">
              Voeg toe aan je theme&apos;s footer.php of gebruik een plugin:
            </p>
            <div className="bg-gray-900 text-gray-100 p-3 rounded-lg font-mono text-xs overflow-x-auto">
              <pre className="whitespace-pre-wrap">{`<?php wp_footer(); ?>
              <script src="https://your-app.vercel.app/widget/loader.js" data-chatbot-id="${apiKey || "YOUR_API_KEY_HERE"}"></script>
              `}</pre>
            </div>
          </div>

          {/* React */}
          <div className="space-y-2">
            <h4 className="font-medium text-gray-900">React</h4>
            <p className="text-sm text-gray-600">
              Voeg toe aan je App.js of index.html:
            </p>
            <div className="bg-gray-900 text-gray-100 p-3 rounded-lg font-mono text-xs overflow-x-auto">
              <pre className="whitespace-pre-wrap">{`// In public/index.html
              <script src="https://your-app.vercel.app/widget/loader.js" 
                      data-chatbot-id="${apiKey || "YOUR_API_KEY_HERE"}"">
              </script>`}</pre>
            </div>
          </div>

          {/* Shopify */}
          <div className="space-y-2">
            <h4 className="font-medium text-gray-900">Shopify</h4>
            <p className="text-sm text-gray-600">
              Voeg toe aan je theme.liquid in de footer:
            </p>
            <div className="bg-gray-900 text-gray-100 p-3 rounded-lg font-mono text-xs overflow-x-auto">
              <pre className="whitespace-pre-wrap">{`<!-- In theme.liquid before </body> -->
              <script src="https://your-app.vercel.app/widget/loader.js" 
                      data-chatbot-id="${apiKey || "YOUR_API_KEY_HERE"}">
              </script>`}</pre>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Enable/Disable Section */}
        <Card className="">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Power className="w-5 h-5" />
              <span>{t("settings.enableDisableAssistant")}</span>
            </CardTitle>
            <CardDescription>
              {t("settings.enableDisableAssistantDescription")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Switch
                  checked={isEnabled}
                  onCheckedChange={handleToggleEnabled}
                  className="data-[state=checked]:bg-primary"
                />
                <div>
                  <p className="font-medium text-gray-900">
                    {isEnabled ? t("settings.enabled") : t("settings.disabled")}
                  </p>
                  <p className="text-sm text-gray-600">
                    {isEnabled
                      ? t("settings.assistantActiveAndVisibleOnWebsite")
                      : t("settings.assistantHiddenFromVisitors")}
                  </p>
                </div>
              </div>
              <Badge
                variant={isEnabled ? "default" : "secondary"}
                className={isEnabled ? "bg-green-100 text-green-800" : ""}
              >
                {isEnabled ? t("settings.active") : t("settings.inactive")}
              </Badge>
            </div>

            {!isEnabled && (
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-start space-x-2">
                  <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-yellow-800">
                      {t("settings.assistantDisabled")}
                    </p>
                    <p className="text-sm text-yellow-700">
                      {t("settings.assistantDisabledDescription")}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Delete Section */}
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-red-700">
              <Trash2 className="w-5 h-5" />
              <span>{t("settings.deleteAssistant")}</span>
            </CardTitle>
            <CardDescription>
              {t("settings.deleteAssistantDescription")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              variant="destructive"
              onClick={() => setIsDeleteModalOpen(true)}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              {t("settings.yesDeleteIt")}
            </Button>
          </CardContent>
        </Card>
      </div>
      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => !isDeleting && setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteAssistant}
        title={t("settings.deleteAssistant")}
        description={t("settings.deleteAssistantDescription")}
        itemName={currentAssistant?.name || ""}
        isLoading={isDeleting}
      />
    </div>
  );
}

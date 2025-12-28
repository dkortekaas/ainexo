"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Copy, Check, Code, Loader2, ExternalLink, Info, FileCode } from "lucide-react";
import { useAssistant } from "@/contexts/assistant-context";
import { useToast } from "@/components/ui/use-toast";

export function EmbedCodeDisplay() {
  const t = useTranslations();
  const { currentAssistant } = useAssistant();
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const [embedCode, setEmbedCode] = useState<string>("");
  const [apiKey, setApiKey] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEmbedCode = async () => {
      if (!currentAssistant?.id) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const response = await fetch(
          `/api/assistants/${currentAssistant.id}/embed-code`
        );
        if (response.ok) {
          const data = await response.json();
          setEmbedCode(data.embedCode);
          setApiKey(data.apiKey || "");
        } else {
          setError("Failed to load embed code");
        }
      } catch (err) {
        console.error("Error fetching embed code:", err);
        setError("Failed to load embed code");
      } finally {
        setLoading(false);
      }
    };

    fetchEmbedCode();
  }, [currentAssistant?.id]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(embedCode);
      setCopied(true);
      toast({
        title: t("common.success") || "Success",
        description: t("assistants.embedCodeCopied") || "Embed code gekopieerd naar klembord",
        variant: "success",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
      toast({
        title: t("common.error") || "Error",
        description: t("error.failedToCopy") || "Kon embed code niet kopiëren",
        variant: "destructive",
      });
    }
  };

  const handlePreview = () => {
    if (!apiKey) return;
    const previewUrl = `/widget-preview?apiKey=${encodeURIComponent(apiKey)}`;
    window.open(previewUrl, "_blank", "width=800,height=600");
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Code className="h-5 w-5" />
            <span>{t("assistants.embedCode")}</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-600">
            {t("assistants.embedCodeDescription")}
          </p>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
            </div>
          ) : error ? (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          ) : !currentAssistant ? (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-600">
                Selecteer eerst een assistent om de embed code te zien.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="relative">
                <Textarea
                  value={embedCode}
                  readOnly
                  className="font-mono text-xs min-h-[200px] resize-none pr-24"
                />
                <Button
                  size="sm"
                  variant="outline"
                  className="absolute top-2 right-2"
                  onClick={handleCopy}
                  disabled={!embedCode}
                >
                  {copied ? (
                    <>
                      <Check className="mr-2 h-3 w-3" />
                      {t("assistants.copied") || "Gekopieerd"}
                    </>
                  ) : (
                    <>
                      <Copy className="mr-2 h-3 w-3" />
                      {t("assistants.copy") || "Kopiëren"}
                    </>
                  )}
                </Button>
              </div>
              {apiKey && (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handlePreview}
                    className="flex-1"
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    {t("assistants.previewWidget") || "Preview Widget"}
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileCode className="h-5 w-5" />
            {t("assistants.installationInstructions") || "Installatie Instructies"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            {/* Step 1 */}
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-6 h-6 bg-blue-100 text-primary rounded-full flex items-center justify-center text-sm font-medium">
                1
              </div>
              <div className="flex-1">
                <h4 className="font-medium mb-1">
                  {t("assistants.step1Title") || "Kopieer de embed code"}
                </h4>
                <p className="text-sm text-gray-600">
                  {t("assistants.step1Description") ||
                    "Klik op de kopieer knop hierboven om de embed code naar je klembord te kopiëren."}
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-6 h-6 bg-blue-100 text-primary rounded-full flex items-center justify-center text-sm font-medium">
                2
              </div>
              <div className="flex-1">
                <h4 className="font-medium mb-1">
                  {t("assistants.step2Title") || "Plak de code in je website"}
                </h4>
                <p className="text-sm text-gray-600 mb-2">
                  {t("assistants.step2Description") ||
                    "Open je website's HTML bestand en plak de code vlak voor de sluitende </body> tag."}
                </p>
                <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                  <code className="text-xs text-gray-700">
                    &lt;!-- Plak hier de embed code --&gt;<br />
                    &lt;/body&gt;
                  </code>
                </div>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-6 h-6 bg-blue-100 text-primary rounded-full flex items-center justify-center text-sm font-medium">
                3
              </div>
              <div className="flex-1">
                <h4 className="font-medium mb-1">
                  {t("assistants.step3Title") || "Test je website"}
                </h4>
                <p className="text-sm text-gray-600">
                  {t("assistants.step3Description") ||
                    "Ververs je website en controleer of de chatbot widget verschijnt. Je kunt ook de preview knop gebruiken om te testen."}
                </p>
              </div>
            </div>
          </div>

          {/* Platform-specific instructions */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <h4 className="font-medium mb-3 flex items-center gap-2">
              <Info className="w-4 h-4 text-gray-500" />
              Platform-specifieke instructies
            </h4>
            <div className="space-y-3 text-sm">
              <div>
                <strong className="text-gray-900">WordPress:</strong>
                <p className="text-gray-600 mt-1">
                  Ga naar Appearance → Theme Editor → footer.php en plak de code voor &lt;?php wp_footer(); ?&gt;
                </p>
              </div>
              <div>
                <strong className="text-gray-900">Shopify:</strong>
                <p className="text-gray-600 mt-1">
                  Ga naar Online Store → Themes → Actions → Edit code → theme.liquid en plak voor &lt;/body&gt;
                </p>
              </div>
              <div>
                <strong className="text-gray-900">Wix:</strong>
                <p className="text-gray-600 mt-1">
                  Ga naar Settings → Custom Code → Add Custom Code → Select &quot;Body - end&quot;
                </p>
              </div>
              <div>
                <strong className="text-gray-900">Squarespace:</strong>
                <p className="text-gray-600 mt-1">
                  Ga naar Settings → Advanced → Code Injection → Footer sectie
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

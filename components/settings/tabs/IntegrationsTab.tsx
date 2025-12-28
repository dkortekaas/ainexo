"use client";

import { useState } from "react";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Label,
  Switch,
} from "@/components/ui";
import {
  Mail,
  MessageSquare,
  Calendar,
  Database,
  Zap,
  Settings,
  ExternalLink,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { categoryLabels, Integration } from "@/types/integration";
import { useTranslations } from "next-intl";

interface IntegrationsTabProps {
  onChanges: (hasChanges: boolean) => void;
}

const availableIntegrations: Integration[] = [
  {
    id: "email",
    name: "Email Integration",
    description: "Send conversation summaries and notifications via email",
    icon: Mail,
    enabled: false,
    configured: false,
    category: "communication",
  },
  {
    id: "slack",
    name: "Slack",
    description: "Get notifications in your Slack channels",
    icon: MessageSquare,
    enabled: false,
    configured: false,
    category: "communication",
  },
  {
    id: "calendar",
    name: "Google Calendar",
    description:
      "Schedule meetings and appointments directly from conversations",
    icon: Calendar,
    enabled: false,
    configured: false,
    category: "automation",
  },
  {
    id: "analytics",
    name: "Google Analytics",
    description: "Track chatbot performance and user interactions",
    icon: Database,
    enabled: false,
    configured: false,
    category: "analytics",
  },
  {
    id: "zapier",
    name: "Zapier",
    description: "Connect with 5000+ apps and automate workflows",
    icon: Zap,
    enabled: false,
    configured: false,
    category: "automation",
  },
];

export function IntegrationsTab({ onChanges }: IntegrationsTabProps) {
  const [integrations, setIntegrations] = useState<Integration[]>(
    availableIntegrations
  );
  const [selectedIntegration, setSelectedIntegration] =
    useState<Integration | null>(null);
  const [isConfiguring, setIsConfiguring] = useState(false);
  const t = useTranslations();

  const handleToggleIntegration = (id: string) => {
    setIntegrations(
      integrations.map((integration) =>
        integration.id === id
          ? { ...integration, enabled: !integration.enabled }
          : integration
      )
    );
    onChanges(true);
  };

  const handleConfigureIntegration = (integration: Integration) => {
    setSelectedIntegration(integration);
    setIsConfiguring(true);
  };

  const handleSaveConfiguration = () => {
    if (selectedIntegration) {
      setIntegrations(
        integrations.map((integration) =>
          integration.id === selectedIntegration.id
            ? { ...integration, configured: true, enabled: true }
            : integration
        )
      );
      setIsConfiguring(false);
      setSelectedIntegration(null);
      onChanges(true);
    }
  };

  const groupedIntegrations = integrations.reduce(
    (acc, integration) => {
      if (!acc[integration.category]) {
        acc[integration.category] = [];
      }
      acc[integration.category].push(integration);
      return acc;
    },
    {} as Record<string, Integration[]>
  );

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900">
          {t("settings.availableIntegrations")}
        </h3>
        <p className="text-sm text-gray-600">
          {t("settings.availableIntegrationsDescription")}
        </p>
      </div>

      {/* Integration Categories */}
      {Object.entries(groupedIntegrations).map(
        ([category, categoryIntegrations]) => (
          <div key={category} className="space-y-4">
            <h4 className="text-md font-medium text-gray-800">
              {categoryLabels[category as keyof typeof categoryLabels]}
            </h4>
            <div className="grid gap-4">
              {categoryIntegrations.map((integration) => {
                const Icon = integration.icon;
                return (
                  <Card key={integration.id}>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                            <Icon className="w-6 h-6 text-gray-600" />
                          </div>
                          <div>
                            <h5 className="font-medium text-gray-900">
                              {integration.name}
                            </h5>
                            <p className="text-sm text-gray-600">
                              {integration.description}
                            </p>
                            <div className="flex items-center space-x-2 mt-1">
                              {integration.configured ? (
                                <Badge
                                  variant="default"
                                  className="bg-green-100 text-green-800"
                                >
                                  <CheckCircle className="w-3 h-3 mr-1" />
                                  {t("settings.configured")}
                                </Badge>
                              ) : (
                                <Badge variant="secondary">
                                  <AlertCircle className="w-3 h-3 mr-1" />
                                  {t("settings.notConfigured")}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          {integration.configured ? (
                            <div className="flex items-center space-x-2">
                              <Switch
                                checked={integration.enabled}
                                onCheckedChange={() =>
                                  handleToggleIntegration(integration.id)
                                }
                                className="data-[state=checked]:bg-primary"
                              />
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  handleConfigureIntegration(integration)
                                }
                              >
                                <Settings className="w-4 h-4 mr-2" />
                                {t("settings.settings")}
                              </Button>
                            </div>
                          ) : (
                            <Button
                              onClick={() =>
                                handleConfigureIntegration(integration)
                              }
                              className="bg-primary hover:bg-primary/80"
                            >
                              {t("settings.configure")}
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )
      )}

      {/* Configuration Dialog */}
      {isConfiguring && selectedIntegration && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <selectedIntegration.icon className="w-5 h-5" />
              <span>
                {t("settings.configure")} {selectedIntegration.name}
              </span>
            </CardTitle>
            <CardDescription>{selectedIntegration.description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {selectedIntegration.id === "email" && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="smtp-host">{t("settings.smtpHost")}</Label>
                  <Input id="smtp-host" placeholder="smtp.gmail.com" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="smtp-port">{t("settings.smtpPort")}</Label>
                  <Input id="smtp-port" placeholder="587" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email-username">
                    {t("settings.username")}
                  </Label>
                  <Input id="email-username" placeholder="your@email.com" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email-password">
                    {t("settings.password")}
                  </Label>
                  <Input
                    id="email-password"
                    type="password"
                    placeholder="Your password"
                  />
                </div>
              </div>
            )}

            {selectedIntegration.id === "slack" && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="slack-webhook">
                    {t("settings.slackWebhookURL")}
                  </Label>
                  <Input
                    id="slack-webhook"
                    placeholder="https://hooks.slack.com/services/..."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="slack-channel">
                    {t("settings.defaultChannel")}
                  </Label>
                  <Input id="slack-channel" placeholder="#general" />
                </div>
                <div className="p-4 bg-indigo-50 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>{t("settings.setupInstructions")}:</strong> Go to
                    your Slack workspace settings, create a new webhook, and
                    paste the URL above.
                  </p>
                </div>
              </div>
            )}

            {selectedIntegration.id === "analytics" && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="ga-tracking-id">
                    {t("settings.googleAnalyticsTrackingID")}
                  </Label>
                  <Input id="ga-tracking-id" placeholder="GA-XXXXXXXXX-X" />
                </div>
                <div className="p-4 bg-indigo-50 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>{t("settings.setupInstructions")}:</strong> Create a
                    Google Analytics property and copy the tracking ID from your
                    GA4 dashboard.
                  </p>
                </div>
              </div>
            )}

            {selectedIntegration.id === "zapier" && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="zapier-webhook">
                    {t("settings.zapierWebhookURL")}
                  </Label>
                  <Input
                    id="zapier-webhook"
                    placeholder="https://hooks.zapier.com/hooks/catch/..."
                  />
                </div>
                <div className="p-4 bg-indigo-50 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>{t("settings.setupInstructions")}:</strong> Create a
                    new Zap in Zapier, choose &quot;Webhooks&quot; as the
                    trigger, and copy the webhook URL.
                  </p>
                </div>
              </div>
            )}

            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsConfiguring(false)}>
                {t("common.cancel")}
              </Button>
              <Button
                onClick={handleSaveConfiguration}
                className="bg-primary hover:bg-primary/80"
              >
                {t("common.save")}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Help Section */}
      <Card>
        <CardHeader>
          <CardTitle>{t("settings.needHelp")}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600 mb-4">
            {t("settings.needHelpDescription")}
          </p>
          <div className="flex space-x-2">
            <Button variant="outline" size="sm">
              <ExternalLink className="w-4 h-4 mr-2" />
              {t("settings.documentation")}
            </Button>
            <Button variant="outline" size="sm">
              {t("settings.contactSupport")}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export interface Integration {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  enabled: boolean;
  configured: boolean;
  category: "communication" | "analytics" | "automation" | "data";
}

export const categoryLabels = {
  communication: "Communication",
  analytics: "Analytics",
  automation: "Automation",
  data: "Data",
};

export interface Assistant {
  id: string;
  userId: string;
  name: string;
  welcomeMessage: string;
  placeholderText: string;
  primaryColor: string;
  secondaryColor: string;
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

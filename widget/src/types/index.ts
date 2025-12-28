export interface ActionButton {
  id: string;
  buttonText: string;
  question: string;
  priority: number;
}

export interface WidgetConfig {
  apiKey: string;
  apiUrl: string;
  name: string;
  welcomeMessage: string;
  placeholderText: string;
  primaryColor: string;
  secondaryColor: string;
  avatar?: string;
  assistantIcon?: string;
  fontFamily?: string;
  position: "bottom-right" | "bottom-left";
  showBranding: boolean;
  actionButtons?: ActionButton[];
}

export interface FormField {
  id: string;
  name: string;
  type: "text" | "email" | "phone" | "textarea" | "select";
  required: boolean;
  placeholder?: string;
  options?: string[];
}

export interface FormData {
  id: string;
  name: string;
  description: string;
  fields: FormField[];
  redirectUrl?: string;
}

export interface Message {
  id: string;
  role: "user" | "assistant" | "form";
  content: string;
  timestamp: Date;
  relevantUrl?: string;
  formData?: FormData;
}

export interface ChatResponse {
  success: boolean;
  data: {
    conversationId: string;
    answer: string;
    relevantUrl?: string;
    responseTime: number;
    sessionId: string;
    formData?: FormData;
  };
}

export interface ApiError {
  success: false;
  error: string;
  details?: any;
}

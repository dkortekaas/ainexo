export interface ContactForm {
  id: string;
  name: string;
  description: string;
  fields: FormField[];
  enabled: boolean;
  redirectUrl?: string;
  triggers?: string[];
}

export interface FormField {
  id: string;
  name: string;
  type: "text" | "email" | "phone" | "textarea" | "select";
  required: boolean;
  placeholder?: string;
  options?: string[];
}

export interface FormSubmission {
  id: string;
  formId: string;
  sessionId: string;
  assistantId?: string;
  data: Record<string, string>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
}

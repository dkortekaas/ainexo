import type { ChatResponse, ApiError, WidgetConfig } from "../types";

export class ChatbotApiClient {
  private apiUrl: string;
  private apiKey: string;
  private sessionId: string | null = null;

  constructor(config: { apiUrl: string; apiKey: string }) {
    this.apiUrl = config.apiUrl;
    this.apiKey = config.apiKey;
  }

  setSessionId(sessionId: string) {
    this.sessionId = sessionId;
  }

  getSessionId(): string | null {
    return this.sessionId;
  }

  /**
   * Send a message to the chatbot
   */
  async sendMessage(question: string): Promise<ChatResponse> {
    try {
      const response = await fetch(`${this.apiUrl}/api/chat/message`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Chatbot-API-Key": this.apiKey,
        },
        body: JSON.stringify({
          question,
          sessionId: this.sessionId,
          metadata: {
            userAgent: navigator.userAgent,
            referrer: document.referrer || window.location.href,
          },
        }),
      });

      if (!response.ok) {
        const error: ApiError = await response.json();
        throw new Error(error.error || `HTTP ${response.status}`);
      }

      const data: ChatResponse = await response.json();

      // Update session ID
      if (data.data.sessionId) {
        this.sessionId = data.data.sessionId;
      }

      return data;
    } catch (error) {
      console.error("ChatbotApiClient: Send message error:", error);
      throw error;
    }
  }

  /**
   * Submit a form
   */
  async submitForm(
    formId: string,
    data: Record<string, string>
  ): Promise<{ success: boolean }> {
    try {
      const response = await fetch(`${this.apiUrl}/api/forms/${formId}/submit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Chatbot-API-Key": this.apiKey,
        },
        body: JSON.stringify({
          data,
          sessionId: this.sessionId,
          metadata: {
            userAgent: navigator.userAgent,
            referrer: document.referrer || window.location.href,
          },
        }),
      });

      if (!response.ok) {
        const error: ApiError = await response.json();
        throw new Error(error.error || `HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("ChatbotApiClient: Submit form error:", error);
      throw error;
    }
  }

  /**
   * Get public configuration
   */
  async getConfig(): Promise<Partial<WidgetConfig>> {
    try {
      const response = await fetch(`${this.apiUrl}/api/chatbot/public-config`, {
        headers: {
          "X-Chatbot-API-Key": this.apiKey,
        },
      });

      if (!response.ok) {
        console.warn("ChatbotApiClient: Failed to fetch config");
        return {};
      }

      const data = await response.json();
      return data.config || {};
    } catch (error) {
      console.warn("ChatbotApiClient: Config fetch error:", error);
      return {};
    }
  }
}

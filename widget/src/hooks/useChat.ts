import { useState, useCallback } from "react";
import { ChatbotApiClient } from "../api/client";
import type { Message } from "../types";
import { storage } from "../utils/storage";

export function useChat(apiClient: ChatbotApiClient) {
  const [messages, setMessages] = useState<Message[]>(() => {
    // Load messages from storage
    const stored = storage.getMessages();
    return stored.map((msg) => ({
      ...msg,
      timestamp: new Date(msg.timestamp),
    }));
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Send a message
   */
  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim() || isLoading) return;

      // Create user message
      const userMessage: Message = {
        id: `user_${Date.now()}`,
        role: "user",
        content: content.trim(),
        timestamp: new Date(),
      };

      // Update messages
      setMessages((prev) => {
        const updated = [...prev, userMessage];
        storage.setMessages(updated);
        return updated;
      });

      setIsLoading(true);
      setError(null);

      try {
        // Send to API
        const response = await apiClient.sendMessage(content.trim());

        // Check if response contains a form
        if (response.data.formData) {
          // Create form message
          const formMessage: Message = {
            id: `form_${Date.now()}`,
            role: "form",
            content: response.data.answer || "",
            timestamp: new Date(),
            formData: response.data.formData,
          };

          // Update messages
          setMessages((prev) => {
            const updated = [...prev, formMessage];
            storage.setMessages(updated);
            return updated;
          });
        } else {
          // Create assistant message
          const assistantMessage: Message = {
            id: response.data.conversationId,
            role: "assistant",
            content: response.data.answer,
            timestamp: new Date(),
            relevantUrl: response.data.relevantUrl,
          };

          // Update messages
          setMessages((prev) => {
            const updated = [...prev, assistantMessage];
            storage.setMessages(updated);
            return updated;
          });
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Er ging iets mis";
        setError(errorMessage);

        // Add error message
        const errorMsg: Message = {
          id: `error_${Date.now()}`,
          role: "assistant",
          content:
            "Sorry, er is een fout opgetreden. Probeer het later opnieuw.",
          timestamp: new Date(),
        };

        setMessages((prev) => {
          const updated = [...prev, errorMsg];
          storage.setMessages(updated);
          return updated;
        });
      } finally {
        setIsLoading(false);
      }
    },
    [apiClient, isLoading]
  );

  /**
   * Submit a form
   */
  const submitForm = useCallback(
    async (formId: string, data: Record<string, string>) => {
      setIsLoading(true);
      setError(null);

      try {
        // Submit form to API
        await apiClient.submitForm(formId, data);

        // Create confirmation message
        const confirmationMessage: Message = {
          id: `confirm_${Date.now()}`,
          role: "assistant",
          content: "Bedankt! Uw formulier is succesvol verzonden.",
          timestamp: new Date(),
        };

        // Update messages
        setMessages((prev) => {
          const updated = [...prev, confirmationMessage];
          storage.setMessages(updated);
          return updated;
        });
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Er ging iets mis";
        setError(errorMessage);

        // Add error message
        const errorMsg: Message = {
          id: `error_${Date.now()}`,
          role: "assistant",
          content:
            "Sorry, er is een fout opgetreden bij het verzenden. Probeer het later opnieuw.",
          timestamp: new Date(),
        };

        setMessages((prev) => {
          const updated = [...prev, errorMsg];
          storage.setMessages(updated);
          return updated;
        });
      } finally {
        setIsLoading(false);
      }
    },
    [apiClient]
  );

  /**
   * Clear chat history
   */
  const clearChat = useCallback(() => {
    setMessages([]);
    storage.clearMessages();
  }, []);

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    submitForm,
    clearChat,
  };
}

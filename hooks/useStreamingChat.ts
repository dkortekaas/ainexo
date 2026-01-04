/**
 * React Hook for Streaming Chat
 *
 * Provides real-time streaming chat responses using Server-Sent Events (SSE).
 * Handles connection management, message buffering, and error recovery.
 */

import { useState, useCallback, useRef } from "react";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp?: Date;
  messageId?: string;
}

export interface ChatSource {
  documentName: string;
  documentType: string;
  relevanceScore: number;
  url?: string;
}

interface StreamingChatState {
  messages: ChatMessage[];
  isStreaming: boolean;
  error: string | null;
  currentResponse: string;
  sources: ChatSource[];
}

interface SendMessageOptions {
  question: string;
  sessionId?: string;
  metadata?: {
    userAgent?: string;
    referrer?: string;
  };
}

/**
 * Hook to manage streaming chat conversations
 *
 * Usage:
 * ```typescript
 * const { messages, sendMessage, isStreaming, error, currentResponse } = useStreamingChat({
 *   apiKey: "cbk_...",
 *   onMessage: (message) => console.log("New message:", message),
 * });
 *
 * const handleSubmit = async () => {
 *   await sendMessage({ question: "Hello!" });
 * };
 * ```
 */
export function useStreamingChat(options: {
  apiKey: string;
  apiUrl?: string;
  onMessage?: (message: ChatMessage) => void;
  onError?: (error: Error) => void;
  onComplete?: () => void;
}) {
  const {
    apiKey,
    apiUrl = "/api/chat/stream",
    onMessage,
    onError,
    onComplete,
  } = options;

  const [state, setState] = useState<StreamingChatState>({
    messages: [],
    isStreaming: false,
    error: null,
    currentResponse: "",
    sources: [],
  });

  const abortControllerRef = useRef<AbortController | null>(null);

  /**
   * Send a message and receive streaming response
   */
  const sendMessage = useCallback(
    async (messageOptions: SendMessageOptions) => {
      const { question, sessionId, metadata } = messageOptions;

      // Add user message to state
      const userMessage: ChatMessage = {
        role: "user",
        content: question,
        timestamp: new Date(),
      };

      setState((prev) => ({
        ...prev,
        messages: [...prev.messages, userMessage],
        isStreaming: true,
        error: null,
        currentResponse: "",
        sources: [],
      }));

      // Create abort controller for this request
      abortControllerRef.current = new AbortController();

      try {
        const response = await fetch(apiUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Chatbot-API-Key": apiKey,
          },
          body: JSON.stringify({
            question,
            sessionId,
            metadata,
          }),
          signal: abortControllerRef.current.signal,
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to send message");
        }

        if (!response.body) {
          throw new Error("No response body");
        }

        // Process SSE stream
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let fullResponse = "";
        let receivedSources: ChatSource[] = [];
        let assistantMessageId: string | undefined;

        while (true) {
          const { done, value } = await reader.read();

          if (done) {
            break;
          }

          // Decode chunk
          buffer += decoder.decode(value, { stream: true });

          // Process complete SSE messages
          const lines = buffer.split("\n\n");
          buffer = lines.pop() || ""; // Keep incomplete message in buffer

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;

            const dataStr = line.substring(6); // Remove "data: " prefix

            try {
              const data = JSON.parse(dataStr);

              switch (data.type) {
                case "content":
                  // Append content chunk
                  fullResponse += data.content;
                  setState((prev) => ({
                    ...prev,
                    currentResponse: fullResponse,
                  }));
                  break;

                case "sources":
                  // Store sources
                  receivedSources = data.sources || [];
                  setState((prev) => ({
                    ...prev,
                    sources: receivedSources,
                  }));
                  break;

                case "done":
                  // Stream completed
                  assistantMessageId = data.messageId;

                  const assistantMessage: ChatMessage = {
                    role: "assistant",
                    content: fullResponse,
                    timestamp: new Date(),
                    messageId: assistantMessageId,
                  };

                  setState((prev) => ({
                    ...prev,
                    messages: [...prev.messages, assistantMessage],
                    isStreaming: false,
                    currentResponse: "",
                  }));

                  if (onMessage) {
                    onMessage(assistantMessage);
                  }

                  if (onComplete) {
                    onComplete();
                  }
                  break;

                case "error":
                  throw new Error(data.error || "Stream error");
              }
            } catch (parseError) {
              console.error("Failed to parse SSE data:", parseError);
            }
          }
        }
      } catch (error) {
        const err = error as Error;

        // Don't treat abort as error
        if (err.name === "AbortError") {
          setState((prev) => ({
            ...prev,
            isStreaming: false,
            currentResponse: "",
          }));
          return;
        }

        setState((prev) => ({
          ...prev,
          isStreaming: false,
          error: err.message,
          currentResponse: "",
        }));

        if (onError) {
          onError(err);
        }
      }
    },
    [apiKey, apiUrl, onMessage, onError, onComplete]
  );

  /**
   * Cancel ongoing streaming request
   */
  const cancelStream = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    setState((prev) => ({
      ...prev,
      isStreaming: false,
      currentResponse: "",
    }));
  }, []);

  /**
   * Clear all messages
   */
  const clearMessages = useCallback(() => {
    setState({
      messages: [],
      isStreaming: false,
      error: null,
      currentResponse: "",
      sources: [],
    });
  }, []);

  /**
   * Retry last message
   */
  const retryLastMessage = useCallback(() => {
    const lastUserMessage = [...state.messages]
      .reverse()
      .find((msg) => msg.role === "user");

    if (lastUserMessage) {
      sendMessage({ question: lastUserMessage.content });
    }
  }, [state.messages, sendMessage]);

  return {
    messages: state.messages,
    isStreaming: state.isStreaming,
    error: state.error,
    currentResponse: state.currentResponse,
    sources: state.sources,
    sendMessage,
    cancelStream,
    clearMessages,
    retryLastMessage,
  };
}

/**
 * Utility function for non-React streaming
 *
 * Usage:
 * ```typescript
 * for await (const chunk of streamChatMessage({
 *   apiKey: "cbk_...",
 *   question: "Hello!",
 * })) {
 *   console.log(chunk);
 * }
 * ```
 */
export async function* streamChatMessage(options: {
  apiKey: string;
  question: string;
  sessionId?: string;
  apiUrl?: string;
  metadata?: Record<string, unknown>;
}): AsyncGenerator<string, void, undefined> {
  const { apiKey, question, sessionId, apiUrl = "/api/chat/stream", metadata } = options;

  const response = await fetch(apiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Chatbot-API-Key": apiKey,
    },
    body: JSON.stringify({
      question,
      sessionId,
      metadata,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Failed to send message");
  }

  if (!response.body) {
    throw new Error("No response body");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      const { done, value } = await reader.read();

      if (done) {
        break;
      }

      buffer += decoder.decode(value, { stream: true });

      const lines = buffer.split("\n\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        if (!line.startsWith("data: ")) continue;

        const dataStr = line.substring(6);

        try {
          const data = JSON.parse(dataStr);

          if (data.type === "content") {
            yield data.content;
          } else if (data.type === "error") {
            throw new Error(data.error);
          } else if (data.type === "done") {
            return;
          }
        } catch (parseError) {
          console.error("Failed to parse SSE data:", parseError);
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}

export default useStreamingChat;

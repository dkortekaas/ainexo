import { useEffect, useRef } from "react";
import { MessageBubble } from "./MessageBubble";
import { FormMessage } from "./FormMessage";
import { TypingIndicator } from "./TypingIndicator";
import type { Message } from "../types";

interface MessageListProps {
  messages: Message[];
  isLoading: boolean;
  primaryColor: string;
  avatar?: string;
  onSubmitForm: (formId: string, data: Record<string, string>) => Promise<void>;
}

export function MessageList({
  messages,
  isLoading,
  primaryColor,
  avatar,
  onSubmitForm,
}: MessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  return (
    <div className="chatbot-messages">
      {messages.map((message) => {
        if (message.role === "form") {
          return (
            <FormMessage
              key={message.id}
              message={message}
              primaryColor={primaryColor}
              onSubmit={onSubmitForm}
            />
          );
        }
        return (
          <MessageBubble
            key={message.id}
            message={message}
            primaryColor={primaryColor}
            avatar={avatar}
          />
        );
      })}

      {isLoading && <TypingIndicator primaryColor={primaryColor} avatar={avatar} />}

      <div ref={messagesEndRef} />
    </div>
  );
}

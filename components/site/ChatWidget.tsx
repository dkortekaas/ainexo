import React, { useState, useEffect } from "react";
import { Send, MoreHorizontal } from "lucide-react";
import { type ChatWidget as ChatWidgetType } from "@/sanity/lib/fetch";

interface ChatWidgetProps {
  config: ChatWidgetType | null;
}

// Default fallback config
const defaultMessages = [
  {
    type: "agent" as const,
    text: "Welcome to Ainexo! How can I help you today?",
  },
  { type: "user" as const, text: "Hi can you help me to track my order?" },
  {
    type: "agent" as const,
    text: "Sure, please hold on for a second.",
  },
];

export const ChatWidget = ({ config }: ChatWidgetProps) => {
  const agentName = config?.agentName || "Ainexo";
  const agentRole = config?.agentRole || "AI Agent";
  const agentAvatar = config?.agentAvatar || "A";
  const messages = config?.messages || defaultMessages;
  const placeholderText = config?.placeholderText || "Message...";
  const cancelText = config?.actionButtons?.cancelText || "Cancel";
  const upgradeText = config?.actionButtons?.upgradeText || "Upgrade";
  const [showTyping, setShowTyping] = useState(false);
  const [currentMessages, setCurrentMessages] = useState(
    messages.slice(0, 1).map((m, idx) => ({ ...m, id: idx + 1 }))
  );

  useEffect(() => {
    const timers: NodeJS.Timeout[] = [];

    if (currentMessages.length < messages.length) {
      const timer = setTimeout(() => {
        setCurrentMessages(
          messages
            .slice(0, currentMessages.length + 1)
            .map((m, idx) => ({ ...m, id: idx + 1 }))
        );
        if (currentMessages.length === 1) {
          setShowTyping(true);
          setTimeout(() => setShowTyping(false), 1500);
        }
      }, 2000);
      timers.push(timer);
    }

    return () => timers.forEach((t) => clearTimeout(t));
  }, [currentMessages.length, messages]);

  return (
    <div className="relative">
      {/* Glow effect */}
      <div className="absolute inset-0 bg-gradient-primary opacity-20 blur-3xl rounded-3xl transform scale-110" />

      {/* Chat container */}
      <div className="relative bg-card rounded-3xl shadow-card border border-border overflow-hidden animate-float">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-full bg-gradient-primary flex items-center justify-center text-primary-foreground font-semibold">
                {agentAvatar}
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-card" />
            </div>
            <div>
              <p className="font-semibold text-foreground">{agentName}</p>
              <p className="text-xs text-muted-foreground">{agentRole}</p>
            </div>
          </div>
          <button className="p-2 text-muted-foreground hover:text-foreground transition-colors">
            <MoreHorizontal className="w-5 h-5" />
          </button>
        </div>

        {/* Messages */}
        <div className="p-4 space-y-4 min-h-[280px] bg-secondary/30">
          {currentMessages.map((message, index) => (
            <div
              key={message.id}
              className={`flex ${message.type === "user" ? "justify-end" : "justify-start"} animate-slide-up`}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              {message.type === "agent" && (
                <div className="max-w-[80%]">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-primary text-xs font-medium">
                      ✦ {agentName}
                    </span>
                  </div>
                  <div className="bg-card rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm border border-border">
                    <p className="text-sm text-foreground">{message.text}</p>
                  </div>
                </div>
              )}
              {message.type === "user" && (
                <div className="max-w-[80%]">
                  <div className="bg-primary text-primary-foreground rounded-2xl rounded-tr-sm px-4 py-3">
                    <p className="text-sm">{message.text}</p>
                  </div>
                </div>
              )}
            </div>
          ))}

          {/* Typing indicator */}
          {showTyping && (
            <div className="flex justify-start animate-fade-in">
              <div className="bg-card rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm border border-border">
                <div className="flex gap-1">
                  <span
                    className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"
                    style={{ animationDelay: "0ms" }}
                  />
                  <span
                    className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"
                    style={{ animationDelay: "150ms" }}
                  />
                  <span
                    className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"
                    style={{ animationDelay: "300ms" }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Action buttons */}
          {currentMessages.length >= 3 && (
            <div className="flex justify-center gap-3 pt-4 animate-fade-in">
              <button className="px-4 py-2 text-sm font-medium text-muted-foreground bg-card rounded-lg border border-border hover:bg-secondary transition-colors">
                {cancelText}
              </button>
              <button className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors">
                {upgradeText}
              </button>
            </div>
          )}
        </div>

        {/* Input */}
        <div className="p-4 border-t border-border bg-card">
          <div className="flex items-center gap-3 bg-secondary rounded-xl px-4 py-3">
            <input
              type="text"
              placeholder={placeholderText}
              className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
            />
            <button className="w-8 h-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 transition-colors">
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

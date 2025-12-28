"use client";

import { useState } from "react";
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
} from "@/components/ui";
import { Send, Minimize2, Maximize2 } from "lucide-react";
import { useTranslations } from "next-intl";

interface ChatbotPreviewProps {
  fontFamily: string;
  assistantName: string;
  assistantSubtitle: string;
  selectedAvatar: string;
  primaryColor: string;
  secondaryColor: string;
  welcomeMessage: string;
  placeholderText: string;
}

export function ChatbotPreview({
  fontFamily,
  assistantName,
  assistantSubtitle,
  selectedAvatar,
  primaryColor,
  welcomeMessage,
  placeholderText,
}: ChatbotPreviewProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: "assistant",
      content: welcomeMessage,
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const t = useTranslations();

  const avatarOptions = [
    { id: "chat-bubble", icon: "💬", name: t("settings.chatBubble") },
    { id: "robot", icon: "🤖", name: t("settings.robot") },
    { id: "assistant", icon: "👤", name: t("settings.assistant") },
    { id: "support", icon: "🎧", name: t("settings.support") },
    { id: "help", icon: "❓", name: t("settings.help") },
  ];

  const selectedAvatarData = avatarOptions.find(
    (avatar) => avatar.id === selectedAvatar
  );

  const handleSendMessage = () => {
    if (!inputValue.trim()) return;

    const newMessage = {
      id: messages.length + 1,
      type: "user" as const,
      content: inputValue,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, newMessage]);
    setInputValue("");

    // Simulate assistant response
    setTimeout(() => {
      const response = {
        id: messages.length + 2,
        type: "assistant" as const,
        content: t("settings.exampleAnswer"),
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, response]);
    }, 1000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-sm font-medium">
              {t("settings.chatbotPreview")}
            </CardTitle>
            <CardDescription className="text-xs">
              {t("settings.livePreviewOfYourChatbot")}
            </CardDescription>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="h-8 w-8 p-0"
          >
            {isExpanded ? (
              <Minimize2 className="h-4 w-4" />
            ) : (
              <Maximize2 className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div
          className={`bg-white border rounded-lg shadow-lg transition-all duration-300 ${
            isExpanded ? "h-96" : "h-80"
          }`}
          style={{ fontFamily: `"${fontFamily}", sans-serif` }}
        >
          {/* Chatbot Header */}
          <div
            className="p-4 rounded-t-lg text-white"
            style={{ backgroundColor: primaryColor }}
          >
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-lg">
                {selectedAvatarData?.icon}
              </div>
              <div>
                <h3 className="font-semibold text-sm">{assistantName}</h3>
                <p className="text-xs opacity-90">{assistantSubtitle}</p>
              </div>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 p-4 space-y-3 overflow-y-auto h-48">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.type === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-xs px-3 py-2 rounded-lg text-sm ${
                    message.type === "user"
                      ? "text-white"
                      : "bg-gray-100 text-gray-800"
                  }`}
                  style={{
                    backgroundColor:
                      message.type === "user" ? primaryColor : undefined,
                  }}
                >
                  {message.content}
                </div>
              </div>
            ))}
          </div>

          {/* Input Area */}
          <div className="p-4 border-t">
            <div className="flex space-x-2">
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={placeholderText}
                className="flex-1 text-sm"
                style={{ fontFamily: `"${fontFamily}", sans-serif` }}
              />
              <Button
                onClick={handleSendMessage}
                size="sm"
                className="px-3"
                style={{ backgroundColor: primaryColor }}
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

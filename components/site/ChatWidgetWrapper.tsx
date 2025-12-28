"use client";

import { ChatWidget } from "./ChatWidget";
import { type ChatWidget as ChatWidgetType } from "@/sanity/lib/fetch";

interface ChatWidgetWrapperProps {
  config: ChatWidgetType | null;
}

export const ChatWidgetWrapper = ({ config }: ChatWidgetWrapperProps) => {
  return <ChatWidget config={config} />;
};

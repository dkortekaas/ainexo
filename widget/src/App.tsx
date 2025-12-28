import { useState } from "react";
import { ChatWindow } from "./components/ChatWindow";
import { ToggleButton } from "./components/ToggleButton";
import { useChat } from "./hooks/useChat";
import { useWidget } from "./hooks/useWidget";
import { useSession } from "./hooks/useSession";
import { ChatbotApiClient } from "./api/client";
import type { WidgetConfig } from "./types";
import { t } from "./utils/i18n";

interface AppProps {
  config: WidgetConfig;
}

export function App({ config }: AppProps) {
  const [apiClient] = useState(
    () =>
      new ChatbotApiClient({
        apiUrl: config.apiUrl,
        apiKey: config.apiKey,
      })
  );

  const { isOpen, toggle, close } = useWidget();
  const { messages, isLoading, sendMessage, submitForm, clearChat } = useChat(apiClient);

  // Initialize session
  useSession(apiClient);

  const handleClearChat = () => {
    if (confirm(t("widget.confirmReset"))) {
      clearChat();
    }
  };

  return (
    <div className="chatbot-widget-container">
      {/* Toggle Button */}
      {!isOpen && (
        <ToggleButton
          onClick={toggle}
          primaryColor={config.primaryColor}
          assistantIcon={config.assistantIcon}
        />
      )}

      {/* Chat Window */}
      {isOpen && (
        <ChatWindow
          config={config}
          messages={messages}
          isLoading={isLoading}
          onSend={sendMessage}
          onClose={close}
          onClear={handleClearChat}
          onSubmitForm={submitForm}
        />
      )}
    </div>
  );
}

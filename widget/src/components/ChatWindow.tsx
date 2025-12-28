import { ChatHeader } from "./ChatHeader";
import { MessageList } from "./MessageList";
import { MessageInput } from "./MessageInput";
import type { Message, WidgetConfig } from "../types";

interface ChatWindowProps {
  config: WidgetConfig;
  messages: Message[];
  isLoading: boolean;
  onSend: (message: string) => void;
  onClose: () => void;
  onClear: () => void;
  onSubmitForm: (formId: string, data: Record<string, string>) => Promise<void>;
}

export function ChatWindow({
  config,
  messages,
  isLoading,
  onSend,
  onClose,
  onClear,
  onSubmitForm,
}: ChatWindowProps) {
  return (
    <div className={`chatbot-window chatbot-position-${config.position}`}>
      {/* Header */}
      <ChatHeader
        name={config.name}
        primaryColor={config.primaryColor}
        avatar={config.avatar}
        onClose={onClose}
        onClear={onClear}
      />

      {/* Messages or Welcome */}
      {messages.length === 0 ? (
        <div className="chatbot-welcome">
          <p className="chatbot-welcome-message">{config.welcomeMessage}</p>

          {/* Action Buttons */}
          {config.actionButtons && config.actionButtons.length > 0 && (
            <div className="chatbot-action-buttons">
              {config.actionButtons.map((button) => (
                <button
                  key={button.id}
                  className="chatbot-action-button"
                  onClick={() => onSend(button.question)}
                  style={{
                    backgroundColor: config.primaryColor,
                    borderColor: config.primaryColor,
                  }}
                >
                  {button.buttonText}
                </button>
              ))}
            </div>
          )}
        </div>
      ) : (
        <MessageList
          messages={messages}
          isLoading={isLoading}
          primaryColor={config.primaryColor}
          avatar={config.avatar}
          onSubmitForm={onSubmitForm}
        />
      )}

      {/* Input */}
      <MessageInput
        onSend={onSend}
        disabled={isLoading}
        placeholder={config.placeholderText}
        primaryColor={config.primaryColor}
      />

      {/* Branding */}
      {config.showBranding && (
        <div className="chatbot-branding">
          Powered by <strong>Ainexo</strong>
        </div>
      )}
    </div>
  );
}

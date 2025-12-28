import type { Message } from "../types";
import { formatTime } from "../utils/helpers";
import { getAvatarIconComponent } from "../utils/avatarIcons";

interface MessageBubbleProps {
  message: Message;
  primaryColor: string;
  avatar?: string;
}

export function MessageBubble({ message, primaryColor, avatar }: MessageBubbleProps) {
  const isUser = message.role === "user";

  return (
    <div
      className={`chatbot-message ${isUser ? "chatbot-message-user" : "chatbot-message-assistant"}`}
    >
      {!isUser && avatar && (
        <div className="chatbot-message-avatar">
          {(() => {
            const AvatarIcon = getAvatarIconComponent(avatar);
            return <AvatarIcon className="w-4 h-4" />;
          })()}
        </div>
      )}
      <div
        className="chatbot-message-bubble"
        style={isUser ? { backgroundColor: primaryColor } : {}}
      >
        <p className="chatbot-message-content">{message.content}</p>

        {/* Relevant URL */}
        {message.relevantUrl && (
          <div className="chatbot-message-link" style={{ marginTop: "8px" }}>
            <a
              href={message.relevantUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                color: primaryColor,
                textDecoration: "none",
                fontSize: "0.9em",
                fontWeight: 500,
              }}
            >
              → Lees meer
            </a>
          </div>
        )}
      </div>

      {/* Timestamp */}
      <span className="chatbot-message-time">
        {formatTime(message.timestamp)}
      </span>
    </div>
  );
}

import { getAvatarIconComponent } from "../utils/avatarIcons";

interface TypingIndicatorProps {
  primaryColor: string;
  avatar?: string;
}

export function TypingIndicator({ primaryColor, avatar }: TypingIndicatorProps) {
  return (
    <div className="chatbot-typing-indicator">
      {avatar && (
        <div className="chatbot-message-avatar">
          {(() => {
            const AvatarIcon = getAvatarIconComponent(avatar);
            return <AvatarIcon className="w-4 h-4" />;
          })()}
        </div>
      )}
      <div className="chatbot-typing-dots">
        <span style={{ backgroundColor: primaryColor }} />
        <span style={{ backgroundColor: primaryColor }} />
        <span style={{ backgroundColor: primaryColor }} />
      </div>
    </div>
  );
}

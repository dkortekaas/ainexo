import { getAssistantIconComponent } from "../utils/avatarIcons";

interface ToggleButtonProps {
  onClick: () => void;
  primaryColor: string;
  assistantIcon?: string;
  unreadCount?: number;
}

export function ToggleButton({
  onClick,
  primaryColor,
  assistantIcon,
  unreadCount,
}: ToggleButtonProps) {
  const AssistantIcon = getAssistantIconComponent(assistantIcon || "robot");

  return (
    <button
      onClick={onClick}
      className="chatbot-toggle-button"
      style={{ backgroundColor: primaryColor }}
      aria-label="Open chatbot"
    >
      {unreadCount && unreadCount > 0 ? (
        <span className="chatbot-unread-badge">{unreadCount}</span>
      ) : null}

      <AssistantIcon className="w-6 h-6" />
    </button>
  );
}

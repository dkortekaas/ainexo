import { getAvatarIconComponent } from "../utils/avatarIcons";

interface ChatHeaderProps {
  name: string;
  primaryColor: string;
  avatar?: string;
  onClose: () => void;
  onClear: () => void;
}

export function ChatHeader({
  name,
  primaryColor,
  avatar,
  onClose,
  onClear,
}: ChatHeaderProps) {
  return (
    <div className="chatbot-header" style={{ backgroundColor: primaryColor }}>
      <div className="chatbot-header-content">
        <div className="chatbot-header-info">
          {avatar && (
            <div className="chatbot-header-avatar">
              {(() => {
                const AvatarIcon = getAvatarIconComponent(avatar);
                return <AvatarIcon className="w-5 h-5" />;
              })()}
            </div>
          )}
          <h3 className="chatbot-header-title">{name}</h3>
        </div>

        <div className="chatbot-header-actions">
          {/* Refresh/New chat button */}
          <button
            onClick={onClear}
            className="chatbot-header-button"
            title="Nieuw gesprek"
            aria-label="Start nieuw gesprek"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <polyline points="1 4 1 10 7 10" />
              <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
            </svg>
          </button>

          {/* Close button */}
          <button
            onClick={onClose}
            className="chatbot-header-button"
            aria-label="Sluiten"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

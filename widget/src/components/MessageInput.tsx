import React, { useState, useRef, KeyboardEvent } from "react";
import { sanitizeInput } from "../utils/helpers";

interface MessageInputProps {
  onSend: (message: string) => void;
  disabled: boolean;
  placeholder: string;
  primaryColor: string;
}

export function MessageInput({
  onSend,
  disabled,
  placeholder,
  primaryColor,
}: MessageInputProps) {
  const [input, setInput] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = () => {
    const sanitizedInput = sanitizeInput(input);
    if (sanitizedInput && !disabled) {
      onSend(sanitizedInput);
      setInput("");

      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    // Send on Enter (without Shift)
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);

    // Auto-resize textarea
    e.target.style.height = "auto";
    e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
  };

  return (
    <div className="chatbot-input-container">
      <textarea
        ref={textareaRef}
        value={input}
        onChange={handleInput}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        className="chatbot-input"
        rows={1}
        aria-label="Typ je bericht"
      />

      <button
        onClick={handleSend}
        disabled={disabled || !input.trim()}
        className="chatbot-send-button"
        style={{ backgroundColor: primaryColor }}
        aria-label="Verstuur bericht"
      >
        {/* Send icon */}
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <line x1="22" y1="2" x2="11" y2="13" />
          <polygon points="22 2 15 22 11 13 2 9 22 2" />
        </svg>
      </button>
    </div>
  );
}

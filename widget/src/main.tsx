import React from "react";
import ReactDOM from "react-dom/client";
import { App } from "./App";
import type { WidgetConfig } from "./types";
import { loadFont } from "./utils/fontLoader";

// Inline CSS styles
const widgetStyles = `
/* Base styles */
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

.chatbot-widget-container {
  font-family: var(--chatbot-font-family, -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif);
  font-size: 14px;
  line-height: 1.5;
  color: #1f2937;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

/* ============================================
   TOGGLE BUTTON
============================================ */

.chatbot-toggle-button {
  position: fixed;
  bottom: 20px;
  right: 20px;
  width: 60px;
  height: 60px;
  border-radius: 50%;
  border: none;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  z-index: 999999;
}

.chatbot-toggle-button:hover {
  transform: scale(1.05);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
}

.chatbot-toggle-button:active {
  transform: scale(0.95);
}

.chatbot-unread-badge {
  position: absolute;
  top: -5px;
  right: -5px;
  background-color: #ef4444;
  color: white;
  border-radius: 50%;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: bold;
}

/* ============================================
   CHAT WINDOW
============================================ */

.chatbot-window {
  position: fixed;
  bottom: 90px;
  width: 380px;
  max-width: calc(100vw - 40px);
  height: 600px;
  max-height: calc(100vh - 120px);
  background: white;
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  z-index: 999999;
  animation: slideUp 0.3s ease-out;
}

.chatbot-position-bottom-right {
  right: 20px;
}

.chatbot-position-bottom-left {
  left: 20px;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* ============================================
   HEADER
============================================ */

.chatbot-header {
  padding: 16px;
  color: white;
  flex-shrink: 0;
}

.chatbot-header-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.chatbot-header-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.chatbot-header-avatar {
  font-size: 20px;
  line-height: 1;
}

.chatbot-header-title {
  font-size: 16px;
  font-weight: 600;
  margin: 0;
}

.chatbot-header-actions {
  display: flex;
  gap: 8px;
}

.chatbot-header-button {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  border-radius: 6px;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  cursor: pointer;
  transition: background 0.2s ease;
}

.chatbot-header-button:hover {
  background: rgba(255, 255, 255, 0.3);
}

.chatbot-header-button:active {
  background: rgba(255, 255, 255, 0.4);
}

/* ============================================
   WELCOME MESSAGE
============================================ */

.chatbot-welcome {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 20px;
  text-align: center;
  gap: 16px;
}

.chatbot-welcome-message {
  font-size: 16px;
  color: #6b7280;
  line-height: 1.6;
}

.chatbot-action-buttons {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
  max-width: 200px;
}

.chatbot-action-button {
  padding: 10px 16px;
  border: 1px solid;
  border-radius: 8px;
  background: transparent;
  color: white;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: center;
}

.chatbot-action-button:hover {
  opacity: 0.9;
  transform: translateY(-1px);
}

.chatbot-action-button:active {
  transform: translateY(0);
}

/* ============================================
   MESSAGES
============================================ */

.chatbot-messages {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  background: #f9fafb;
}

.chatbot-messages::-webkit-scrollbar {
  width: 6px;
}

.chatbot-messages::-webkit-scrollbar-track {
  background: #f3f4f6;
}

.chatbot-messages::-webkit-scrollbar-thumb {
  background: #d1d5db;
  border-radius: 3px;
}

.chatbot-messages::-webkit-scrollbar-thumb:hover {
  background: #9ca3af;
}

/* ============================================
   MESSAGE BUBBLE
============================================ */

.chatbot-message {
  display: flex;
  flex-direction: column;
  gap: 4px;
  max-width: 80%;
}

.chatbot-message-user {
  align-self: flex-end;
  align-items: flex-end;
}

.chatbot-message-assistant {
  align-self: flex-start;
  align-items: flex-start;
}

.chatbot-message-bubble {
  padding: 12px;
  border-radius: 12px;
  word-wrap: break-word;
}

.chatbot-message-user .chatbot-message-bubble {
  color: white;
  border-bottom-right-radius: 4px;
}

.chatbot-message-assistant .chatbot-message-bubble {
  background: white;
  color: #1f2937;
  border-bottom-left-radius: 4px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.chatbot-message-content {
  margin: 0;
  white-space: pre-wrap;
}

.chatbot-message-time {
  font-size: 11px;
  color: #9ca3af;
  padding: 0 4px;
}

/* ============================================
   SOURCES
============================================ */

.chatbot-message-sources {
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid rgba(255, 255, 255, 0.2);
  font-size: 12px;
}

.chatbot-message-assistant .chatbot-message-sources {
  border-top-color: #e5e7eb;
}

.chatbot-sources-label {
  margin: 0 0 4px 0;
  font-weight: 600;
  opacity: 0.9;
}

.chatbot-sources-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.chatbot-source-item {
  padding: 2px 0;
  opacity: 0.8;
}

.chatbot-source-item::before {
  content: "📄 ";
  margin-right: 4px;
}

/* ============================================
   TYPING INDICATOR
============================================ */

.chatbot-typing-indicator {
  display: flex;
  align-self: flex-start;
  padding: 12px;
  background: white;
  border-radius: 12px;
  border-bottom-left-radius: 4px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.chatbot-typing-dots {
  display: flex;
  gap: 4px;
}

.chatbot-typing-dots span {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  animation: typingDot 1.4s infinite ease-in-out;
}

.chatbot-typing-dots span:nth-child(1) {
  animation-delay: 0s;
}

.chatbot-typing-dots span:nth-child(2) {
  animation-delay: 0.2s;
}

.chatbot-typing-dots span:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes typingDot {
  0%, 60%, 100% {
    opacity: 0.3;
    transform: scale(0.8);
  }
  30% {
    opacity: 1;
    transform: scale(1);
  }
}

/* ============================================
   INPUT
============================================ */

.chatbot-input-container {
  padding: 16px;
  border-top: 1px solid #e5e7eb;
  display: flex;
  gap: 8px;
  flex-shrink: 0;
  background: white;
}

.chatbot-input {
  flex: 1;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  padding: 10px 12px;
  font-size: 14px;
  font-family: inherit;
  resize: none;
  max-height: 120px;
  overflow-y: auto;
  transition: border-color 0.2s ease;
}

.chatbot-input:focus {
  outline: none;
  border-color: #3b82f6;
}

.chatbot-input::placeholder {
  color: #9ca3af;
}

.chatbot-input:disabled {
  background: #f3f4f6;
  cursor: not-allowed;
}

.chatbot-send-button {
  width: 40px;
  height: 40px;
  border: none;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  cursor: pointer;
  transition: opacity 0.2s ease;
  flex-shrink: 0;
}

.chatbot-send-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.chatbot-send-button:not(:disabled):hover {
  opacity: 0.9;
}

.chatbot-send-button:not(:disabled):active {
  opacity: 0.8;
}

/* ============================================
   BRANDING
============================================ */

.chatbot-branding {
  padding: 8px 16px;
  text-align: center;
  font-size: 12px;
  color: #9ca3af;
  border-top: 1px solid #e5e7eb;
  background: #f9fafb;
}

/* ============================================
   MOBILE RESPONSIVE
============================================ */

@media (max-width: 480px) {
  .chatbot-window {
    width: 100vw;
    height: 100vh;
    max-width: 100vw;
    max-height: 100vh;
    bottom: 0;
    right: 0;
    left: 0;
    border-radius: 0;
  }

  .chatbot-position-bottom-left {
    left: 0;
  }

  .chatbot-toggle-button {
    bottom: 16px;
    right: 16px;
    width: 56px;
    height: 56px;
  }
}

/* ============================================
   ANIMATIONS
============================================ */

@media (prefers-reduced-motion: reduce) {
  .chatbot-window,
  .chatbot-toggle-button,
  .chatbot-typing-dots span {
    animation: none;
    transition: none;
  }
}
`;

// Expose initialization function globally
declare global {
  interface Window {
    initChatbotWidget: (config: Partial<WidgetConfig>) => Promise<void>;
  }
}

window.initChatbotWidget = async function (userConfig: Partial<WidgetConfig>) {
  // Default configuration
  const defaultConfig: WidgetConfig = {
    apiKey: "",
    apiUrl: "",
    name: "AI Assistent",
    welcomeMessage: "Hallo! Hoe kan ik je helpen?",
    placeholderText: "Stel een vraag...",
    primaryColor: "#3B82F6",
    secondaryColor: "#1E40AF",
    position: "bottom-right",
    showBranding: true,
  };

  let config = { ...defaultConfig, ...userConfig };

  // Fetch configuration from database if API key is provided
  if (config.apiKey && config.apiUrl) {
    try {
      const response = await fetch(
        `${config.apiUrl}/api/chatbot/public-config`,
        {
          headers: {
            "X-Chatbot-API-Key": config.apiKey,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.config) {
          // Merge database config with user config
          config = { ...config, ...data.config };
        }
      }
    } catch (error) {
      console.warn(
        "Chatbot Widget: Failed to fetch config from database, using defaults:",
        error
      );
    }
  }

  // Validate API key
  if (!config.apiKey) {
    console.error("Chatbot Widget: Missing API key (data-chatbot-id)");
    return;
  }

  // Create container
  const container = document.createElement("div");
  container.id = "chatbot-widget-root";
  document.body.appendChild(container);

  // Create Shadow DOM for style isolation
  const shadowRoot = container.attachShadow({ mode: "open" });

  // Create root element inside shadow DOM
  const shadowContainer = document.createElement("div");
  shadowRoot.appendChild(shadowContainer);

  // Inject styles into shadow DOM
  const style = document.createElement("style");
  style.textContent = widgetStyles;
  shadowRoot.appendChild(style);

  // Load font and then render the widget
  const initializeWidget = async () => {
    // Load the font if specified and inject it into Shadow DOM
    if (config.fontFamily) {
      try {
        await loadFont(config.fontFamily);
        console.log(`Font loaded: ${config.fontFamily}`);

        // Inject font CSS into Shadow DOM
        try {
          // Try to fetch and inject the font CSS directly
          const fontUrl = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(config.fontFamily)}:wght@400;500;600&display=swap`;
          const response = await fetch(fontUrl);
          if (response.ok) {
            const fontCSS = await response.text();
            const fontStyle = document.createElement("style");
            fontStyle.textContent = fontCSS;
            shadowRoot.appendChild(fontStyle);
            console.log(
              `Font CSS injected into Shadow DOM: ${config.fontFamily}`
            );
          } else {
            throw new Error("Failed to fetch font CSS");
          }
        } catch (error) {
          console.warn(
            `Failed to inject font CSS into Shadow DOM: ${config.fontFamily}`,
            error
          );
          // Fallback: try @import
          const fontStyle = document.createElement("style");
          fontStyle.textContent = `
            @import url('https://fonts.googleapis.com/css2?family=${encodeURIComponent(config.fontFamily)}:wght@400;500;600&display=swap');
          `;
          shadowRoot.appendChild(fontStyle);
        }
      } catch (error) {
        console.warn(`Failed to load font: ${config.fontFamily}`, error);
      }
    }

    // Set CSS custom properties for dynamic styling
    if (config.fontFamily) {
      shadowContainer.style.setProperty(
        "--chatbot-font-family",
        `"${config.fontFamily}", -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif`
      );
    }

    // Render React app
    const root = ReactDOM.createRoot(shadowContainer);
    root.render(
      <React.StrictMode>
        <App config={config} />
      </React.StrictMode>
    );
  };

  // Initialize the widget
  initializeWidget();

  console.log("✅ Chatbot Widget initialized");
};

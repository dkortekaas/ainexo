# Chatbot Widget Implementatie

## Overzicht

De chatbot widget is een standalone React applicatie die embedded kan worden in elke website via een simpel script tag. De widget is volledig geïsoleerd van de host website en communiceert met de backend API.

---

## Architectuur

┌─────────────────────────────────────────────────────────┐
│ Customer Website │
│ ┌────────────────────────────────────────────────────┐ │
│ │ <script src="https://app.com/widget/loader.js" │ │
│ │ data-chatbot-id="abc123"></script> │ │
│ └────────────────────────────────────────────────────┘ │
│ │ │
│ ▼ │
│ ┌────────────────────────────────────────────────────┐ │
│ │ Loader Script │ │
│ │ - Parse config from data attributes │ │
│ │ - Load CSS & JS bundle │ │
│ │ - Initialize widget │ │
│ └────────────────────────────────────────────────────┘ │
│ │ │
│ ▼ │
│ ┌────────────────────────────────────────────────────┐ │
│ │ Widget (Shadow DOM) │ │
│ │ - Isolated styles │ │
│ │ - React components │ │
│ │ - Local state management │ │
│ └────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
│
│ API Calls
▼
┌─────────────────────────────────────────────────────────┐
│ Backend API (your-app.com/api) │
│ - POST /api/chat/message │
│ - GET /api/chatbot/public-config │
└─────────────────────────────────────────────────────────┘

---

## 1. Project Setup

### 1.1 Folder Structure

widget/
├── src/
│ ├── main.tsx # Entry point
│ ├── App.tsx # Main widget component
│ ├── components/
│ │ ├── ChatWindow.tsx
│ │ ├── ChatHeader.tsx
│ │ ├── MessageList.tsx
│ │ ├── MessageBubble.tsx
│ │ ├── MessageInput.tsx
│ │ ├── ToggleButton.tsx
│ │ ├── TypingIndicator.tsx
│ │ └── SourcesList.tsx
│ ├── hooks/
│ │ ├── useChat.ts
│ │ ├── useSession.ts
│ │ └── useWidget.ts
│ ├── api/
│ │ └── client.ts
│ ├── types/
│ │ └── index.ts
│ ├── utils/
│ │ ├── storage.ts
│ │ └── helpers.ts
│ └── styles/
│ └── widget.css
├── public/
│ └── loader.js # Embed script
├── vite.config.ts
├── tsconfig.json
└── package.json

### 1.2 Package Configuration

**widget/package.json:**

```json
{
  "name": "chatbot-widget",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1"
  },
  "devDependencies": {
    "@types/react": "^18.3.1",
    "@types/react-dom": "^18.3.0",
    "@vitejs/plugin-react": "^4.3.0",
    "typescript": "^5.5.0",
    "vite": "^5.3.0"
  }
}
1.3 Vite Configuration
widget/vite.config.ts:
typescriptimport { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: '../public/widget',
    emptyOutDir: true,
    lib: {
      entry: path.resolve(__dirname, 'src/main.tsx'),
      name: 'ChatbotWidget',
      fileName: 'widget-bundle',
      formats: ['iife'], // Immediately Invoked Function Expression
    },
    rollupOptions: {
      output: {
        // Inline all assets into single file
        inlineDynamicImports: true,
        assetFileNames: 'widget-bundle.[ext]',
      },
    },
    // Minification
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Remove console.logs in production
      },
    },
  },
  define: {
    'process.env.NODE_ENV': JSON.stringify('production'),
  },
})
1.4 TypeScript Configuration
widget/tsconfig.json:
json{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}

2. Type Definitions
widget/src/types/index.ts:
typescriptexport interface WidgetConfig {
  apiKey: string
  apiUrl: string
  name: string
  welcomeMessage: string
  placeholderText: string
  primaryColor: string
  secondaryColor: string
  position: 'bottom-right' | 'bottom-left'
  showBranding: boolean
}

export interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  sources?: Source[]
}

export interface Source {
  documentName: string
  documentType: string
  relevanceScore: number
}

export interface ChatResponse {
  success: boolean
  data: {
    conversationId: string
    answer: string
    sources: Source[]
    responseTime: number
    sessionId: string
  }
}

export interface ApiError {
  success: false
  error: string
  details?: any
}

3. API Client
widget/src/api/client.ts:
typescriptimport type { ChatResponse, ApiError, WidgetConfig } from '../types'

export class ChatbotApiClient {
  private apiUrl: string
  private apiKey: string
  private sessionId: string | null = null

  constructor(config: { apiUrl: string; apiKey: string }) {
    this.apiUrl = config.apiUrl
    this.apiKey = config.apiKey
  }

  setSessionId(sessionId: string) {
    this.sessionId = sessionId
  }

  getSessionId(): string | null {
    return this.sessionId
  }

  /**
   * Send a message to the chatbot
   */
  async sendMessage(question: string): Promise<ChatResponse> {
    try {
      const response = await fetch(`${this.apiUrl}/api/chat/message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Chatbot-API-Key': this.apiKey,
        },
        body: JSON.stringify({
          question,
          sessionId: this.sessionId,
          metadata: {
            userAgent: navigator.userAgent,
            referrer: document.referrer || window.location.href,
          },
        }),
      })

      if (!response.ok) {
        const error: ApiError = await response.json()
        throw new Error(error.error || `HTTP ${response.status}`)
      }

      const data: ChatResponse = await response.json()

      // Update session ID
      if (data.data.sessionId) {
        this.sessionId = data.data.sessionId
      }

      return data
    } catch (error) {
      console.error('ChatbotApiClient: Send message error:', error)
      throw error
    }
  }

  /**
   * Get public configuration
   */
  async getConfig(): Promise<Partial<WidgetConfig>> {
    try {
      const response = await fetch(`${this.apiUrl}/api/chatbot/public-config`, {
        headers: {
          'X-Chatbot-API-Key': this.apiKey,
        },
      })

      if (!response.ok) {
        console.warn('ChatbotApiClient: Failed to fetch config')
        return {}
      }

      const data = await response.json()
      return data.config || {}
    } catch (error) {
      console.warn('ChatbotApiClient: Config fetch error:', error)
      return {}
    }
  }
}

4. Storage Utilities
widget/src/utils/storage.ts:
typescriptconst STORAGE_PREFIX = 'chatbot_widget_'

export const storage = {
  /**
   * Get session ID
   */
  getSessionId(): string | null {
    try {
      return localStorage.getItem(`${STORAGE_PREFIX}session_id`)
    } catch {
      return null
    }
  },

  /**
   * Set session ID
   */
  setSessionId(sessionId: string): void {
    try {
      localStorage.setItem(`${STORAGE_PREFIX}session_id`, sessionId)
    } catch (error) {
      console.warn('Storage: Failed to save session ID:', error)
    }
  },

  /**
   * Get messages for current session
   */
  getMessages(): any[] {
    try {
      const stored = localStorage.getItem(`${STORAGE_PREFIX}messages`)
      return stored ? JSON.parse(stored) : []
    } catch {
      return []
    }
  },

  /**
   * Save messages
   */
  setMessages(messages: any[]): void {
    try {
      // Only keep last 50 messages
      const limited = messages.slice(-50)
      localStorage.setItem(`${STORAGE_PREFIX}messages`, JSON.stringify(limited))
    } catch (error) {
      console.warn('Storage: Failed to save messages:', error)
    }
  },

  /**
   * Clear messages
   */
  clearMessages(): void {
    try {
      localStorage.removeItem(`${STORAGE_PREFIX}messages`)
    } catch (error) {
      console.warn('Storage: Failed to clear messages:', error)
    }
  },

  /**
   * Get widget open state
   */
  getIsOpen(): boolean {
    try {
      return localStorage.getItem(`${STORAGE_PREFIX}is_open`) === 'true'
    } catch {
      return false
    }
  },

  /**
   * Set widget open state
   */
  setIsOpen(isOpen: boolean): void {
    try {
      localStorage.setItem(`${STORAGE_PREFIX}is_open`, String(isOpen))
    } catch (error) {
      console.warn('Storage: Failed to save open state:', error)
    }
  },
}

5. Custom Hooks
5.1 useChat Hook
widget/src/hooks/useChat.ts:
typescriptimport { useState, useCallback } from 'react'
import { ChatbotApiClient } from '../api/client'
import type { Message } from '../types'
import { storage } from '../utils/storage'

export function useChat(apiClient: ChatbotApiClient) {
  const [messages, setMessages] = useState<Message[]>(() => {
    // Load messages from storage
    const stored = storage.getMessages()
    return stored.map(msg => ({
      ...msg,
      timestamp: new Date(msg.timestamp),
    }))
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  /**
   * Send a message
   */
  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim() || isLoading) return

      // Create user message
      const userMessage: Message = {
        id: `user_${Date.now()}`,
        role: 'user',
        content: content.trim(),
        timestamp: new Date(),
      }

      // Update messages
      setMessages(prev => {
        const updated = [...prev, userMessage]
        storage.setMessages(updated)
        return updated
      })

      setIsLoading(true)
      setError(null)

      try {
        // Send to API
        const response = await apiClient.sendMessage(content.trim())

        // Create assistant message
        const assistantMessage: Message = {
          id: response.data.conversationId,
          role: 'assistant',
          content: response.data.answer,
          timestamp: new Date(),
          sources: response.data.sources,
        }

        // Update messages
        setMessages(prev => {
          const updated = [...prev, assistantMessage]
          storage.setMessages(updated)
          return updated
        })
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Er ging iets mis'
        setError(errorMessage)

        // Add error message
        const errorMsg: Message = {
          id: `error_${Date.now()}`,
          role: 'assistant',
          content: 'Sorry, er is een fout opgetreden. Probeer het later opnieuw.',
          timestamp: new Date(),
        }

        setMessages(prev => {
          const updated = [...prev, errorMsg]
          storage.setMessages(updated)
          return updated
        })
      } finally {
        setIsLoading(false)
      }
    },
    [apiClient, isLoading]
  )

  /**
   * Clear chat history
   */
  const clearChat = useCallback(() => {
    setMessages([])
    storage.clearMessages()
  }, [])

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    clearChat,
  }
}
5.2 useWidget Hook
widget/src/hooks/useWidget.ts:
typescriptimport { useState, useEffect } from 'react'
import { storage } from '../utils/storage'

export function useWidget() {
  const [isOpen, setIsOpen] = useState(() => storage.getIsOpen())

  // Persist open state
  useEffect(() => {
    storage.setIsOpen(isOpen)
  }, [isOpen])

  const toggle = () => setIsOpen(prev => !prev)
  const open = () => setIsOpen(true)
  const close = () => setIsOpen(false)

  return {
    isOpen,
    toggle,
    open,
    close,
  }
}

6. Widget Components
6.1 ToggleButton
widget/src/components/ToggleButton.tsx:
typescriptimport React from 'react'

interface ToggleButtonProps {
  onClick: () => void
  primaryColor: string
  unreadCount?: number
}

export function ToggleButton({
  onClick,
  primaryColor,
  unreadCount
}: ToggleButtonProps) {
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

      {/* Chat bubble icon */}
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    </button>
  )
}
6.2 ChatHeader
widget/src/components/ChatHeader.tsx:
typescriptimport React from 'react'

interface ChatHeaderProps {
  name: string
  primaryColor: string
  onClose: () => void
  onClear: () => void
}

export function ChatHeader({
  name,
  primaryColor,
  onClose,
  onClear
}: ChatHeaderProps) {
  return (
    <div className="chatbot-header" style={{ backgroundColor: primaryColor }}>
      <div className="chatbot-header-content">
        <h3 className="chatbot-header-title">{name}</h3>

        <div className="chatbot-header-actions">
          {/* Refresh/New chat button */}
          <button
            onClick={onClear}
            className="chatbot-header-button"
            title="Nieuw gesprek"
            aria-label="Start nieuw gesprek"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}
6.3 MessageBubble
widget/src/components/MessageBubble.tsx:
typescriptimport React from 'react'
import type { Message } from '../types'

interface MessageBubbleProps {
  message: Message
  primaryColor: string
}

export function MessageBubble({ message, primaryColor }: MessageBubbleProps) {
  const isUser = message.role === 'user'

  return (
    <div className={`chatbot-message ${isUser ? 'chatbot-message-user' : 'chatbot-message-assistant'}`}>
      <div
        className="chatbot-message-bubble"
        style={isUser ? { backgroundColor: primaryColor } : {}}
      >
        <p className="chatbot-message-content">{message.content}</p>

        {/* Sources */}
        {message.sources && message.sources.length > 0 && (
          <div className="chatbot-message-sources">
            <p className="chatbot-sources-label">Bronnen:</p>
            <ul className="chatbot-sources-list">
              {message.sources.map((source, idx) => (
                <li key={idx} className="chatbot-source-item">
                  {source.documentName}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Timestamp */}
      <span className="chatbot-message-time">
        {message.timestamp.toLocaleTimeString('nl-NL', {
          hour: '2-digit',
          minute: '2-digit',
        })}
      </span>
    </div>
  )
}
6.4 TypingIndicator
widget/src/components/TypingIndicator.tsx:
typescriptimport React from 'react'

interface TypingIndicatorProps {
  primaryColor: string
}

export function TypingIndicator({ primaryColor }: TypingIndicatorProps) {
  return (
    <div className="chatbot-typing-indicator">
      <div className="chatbot-typing-dots">
        <span style={{ backgroundColor: primaryColor }} />
        <span style={{ backgroundColor: primaryColor }} />
        <span style={{ backgroundColor: primaryColor }} />
      </div>
    </div>
  )
}
6.5 MessageList
widget/src/components/MessageList.tsx:
typescriptimport React, { useEffect, useRef } from 'react'
import { MessageBubble } from './MessageBubble'
import { TypingIndicator } from './TypingIndicator'
import type { Message } from '../types'

interface MessageListProps {
  messages: Message[]
  isLoading: boolean
  primaryColor: string
}

export function MessageList({ messages, isLoading, primaryColor }: MessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  return (
    <div className="chatbot-messages">
      {messages.map(message => (
        <MessageBubble
          key={message.id}
          message={message}
          primaryColor={primaryColor}
        />
      ))}

      {isLoading && <TypingIndicator primaryColor={primaryColor} />}

      <div ref={messagesEndRef} />
    </div>
  )
}
6.6 MessageInput
widget/src/components/MessageInput.tsx:
typescriptimport React, { useState, useRef, KeyboardEvent } from 'react'

interface MessageInputProps {
  onSend: (message: string) => void
  disabled: boolean
  placeholder: string
  primaryColor: string
}

export function MessageInput({
  onSend,
  disabled,
  placeholder,
  primaryColor
}: MessageInputProps) {
  const [input, setInput] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleSend = () => {
    if (input.trim() && !disabled) {
      onSend(input)
      setInput('')

      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto'
      }
    }
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    // Send on Enter (without Shift)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value)

    // Auto-resize textarea
    e.target.style.height = 'auto'
    e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`
  }

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
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="22" y1="2" x2="11" y2="13" />
          <polygon points="22 2 15 22 11 13 2 9 22 2" />
        </svg>
      </button>
    </div>
  )
}
6.7 ChatWindow
widget/src/components/ChatWindow.tsx:
typescriptimport React from 'react'
import { ChatHeader } from './ChatHeader'
import { MessageList } from './MessageList'
import { MessageInput } from './MessageInput'
import type { Message, WidgetConfig } from '../types'

interface ChatWindowProps {
  config: WidgetConfig
  messages: Message[]
  isLoading: boolean
  onSend: (message: string) => void
  onClose: () => void
  onClear: () => void
}

export function ChatWindow({
  config,
  messages,
  isLoading,
  onSend,
  onClose,
  onClear,
}: ChatWindowProps) {
  return (
    <div className={`chatbot-window chatbot-position-${config.position}`}>
      {/* Header */}
      <ChatHeader
        name={config.name}
        primaryColor={config.primaryColor}
        onClose={onClose}
        onClear={onClear}
      />

      {/* Messages or Welcome */}
      {messages.length === 0 ? (
        <div className="chatbot-welcome">
          <p className="chatbot-welcome-message">{config.welcomeMessage}</p>
        </div>
      ) : (
        <MessageList
          messages={messages}
          isLoading={isLoading}
          primaryColor={config.primaryColor}
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
  )
}

7. Main App Component
widget/src/App.tsx:
typescriptimport React, { useEffect, useState } from 'react'
import { ChatWindow } from './components/ChatWindow'
import { ToggleButton } from './components/ToggleButton'
import { useChat } from './hooks/useChat'
import { useWidget } from './hooks/useWidget'
import { ChatbotApiClient } from './api/client'
import { storage } from './utils/storage'
import type { WidgetConfig } from './types'

interface AppProps {
  config: WidgetConfig
}

export function App({ config }: AppProps) {
  const [apiClient] = useState(() => new ChatbotApiClient({
    apiUrl: config.apiUrl,
    apiKey: config.apiKey,
  }))

  const { isOpen, toggle, close } = useWidget()
  const { messages, isLoading, sendMessage, clearChat } = useChat(apiClient)

  // Initialize session ID
  useEffect(() => {
    let sessionId = storage.getSessionId()

    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      storage.setSessionId(sessionId)
    }

    apiClient.setSessionId(sessionId)
  }, [apiClient])

  const handleClearChat = () => {
    if (confirm('Weet je zeker dat je het gesprek wilt resetten?')) {
      clearChat()
    }
  }

  return (
    <div className="chatbot-widget-container">
      {/* Toggle Button */}
      {!isOpen && (
        <ToggleButton
          onClick={toggle}
          primaryColor={config.primaryColor}
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
        />
      )}
    </div>
  )
}

8. Widget Entry Point
widget/src/main.tsx:
typescriptimport React from 'react'
import ReactDOM from 'react-dom/client'
import { App } from './App'
import type { WidgetConfig } from './types'
import widgetStyles from './styles/widget.css?inline'

// Expose initialization function globally
declare global {
  interface Window {
    initChatbotWidget: (config: Partial<WidgetConfig>) => void
  }
}

window.initChatbotWidget = function (userConfig: Partial<WidgetConfig>) {
  // Default configuration
  const defaultConfig: WidgetConfig = {
    apiKey: '',
    apiUrl: '',
    name: 'AI Assistent',
    welcomeMessage: 'Hallo! Hoe kan ik je helpen?',
    placeholderText: 'Stel een vraag...',
    primaryColor: '#3B82F6',
    secondaryColor: '#1E40AF',
    position: 'bottom-right',
    showBranding: true,
  }

  const config = { ...defaultConfig, ...userConfig }

  // Validate API key
  if (!config.apiKey) {
    console.error('Chatbot Widget: Missing API key (data-chatbot-id)')
    return
  }

  // Create container
  const container = document.createElement('div')
  container.id = 'chatbot-widget-root'
  document.body.appendChild(container)

  // Create Shadow DOM for style isolation
  const shadowRoot = container.attachShadow({ mode: 'open' })

  // Create root element inside shadow DOM
  const shadowContainer = document.createElement('div')
  shadowRoot.appendChild(shadowContainer)

  // Inject styles into shadow DOM
  const style = document.createElement('style')
  style.textContent = widgetStyles
  shadowRoot.appendChild(style)

  // Render React app
  const root = ReactDOM.createRoot(shadowContainer)
  root.render(
    <React.StrictMode>
      <App config={config} />
    </React.StrictMode>
  )

  console.log('✅ Chatbot Widget initialized')
}

9. Widget Styles
widget/src/styles/widget.css:
css/* Base styles */
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

.chatbot-widget-container {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
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
  align-items: center;
  justify-content: center;
  padding: 20px;
  text-align: center;
}

.chatbot-welcome-message {
  font-size: 16px;
  color: #6b7280;
  line-height: 1.6;
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
  content: '📄 ';
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

10. Loader Script
public/widget/loader.js:
javascript(function() {
  'use strict';

  // Prevent multiple initializations
  if (window.chatbotWidgetLoaded) {
    console.warn('Chatbot Widget: Already loaded');
    return;
  }
  window.chatbotWidgetLoaded = true;

  // Get script tag to extract configuration
  const scriptTag = document.currentScript ||
    document.querySelector('script[data-chatbot-id]');

  if (!scriptTag) {
    console.error('Chatbot Widget: Script tag not found');
    return;
  }

  // Extract configuration from data attributes
  const config = {
    apiKey: scriptTag.getAttribute('data-chatbot-id'),
    apiUrl: scriptTag.getAttribute('data-api-url') || 'https://your-app.vercel.app',
    name: scriptTag.getAttribute('data-name'),
    welcomeMessage: scriptTag.getAttribute('data-welcome'),
    placeholderText: scriptTag.getAttribute('data-placeholder'),
    primaryColor: scriptTag.getAttribute('data-primary-color'),
    secondaryColor: scriptTag.getAttribute('data-secondary-color'),
    position: scriptTag.getAttribute('data-position'),
    showBranding: scriptTag.getAttribute('data-show-branding') !== 'false',
  };

  // Validate API key
  if (!config.apiKey) {
    console.error('Chatbot Widget: Missing data-chatbot-id attribute');
    return;
  }

  // Remove null/undefined values
  Object.keys(config).forEach(key => {
    if (config[key] === null || config[key] === undefined) {
      delete config[key];
    }
  });

  // Load widget bundle
  function loadWidget() {
    // Load CSS
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = `${config.apiUrl}/widget/widget-bundle.css`;
    link.onerror = function() {
      console.error('Chatbot Widget: Failed to load CSS');
    };
    document.head.appendChild(link);

    // Load JavaScript
    const script = document.createElement('script');
    script.src = `${config.apiUrl}/widget/widget-bundle.js`;
    script.async = true;

    script.onload = function() {
      if (typeof window.initChatbotWidget === 'function') {
        // Initialize widget with configuration
        try {
          window.initChatbotWidget(config);
        } catch (error) {
          console.error('Chatbot Widget: Initialization error:', error);
        }
      } else {
        console.error('Chatbot Widget: Initialization function not found');
      }
    };

    script.onerror = function() {
      console.error('Chatbot Widget: Failed to load JavaScript bundle');
    };

    document.body.appendChild(script);
  }

  // Load when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadWidget);
  } else {
    loadWidget();
  }
})();

11. Build Process
11.1 Build Commands
bash# Install dependencies
cd widget
npm install

# Development
npm run dev

# Production build
npm run build

# Output: ../public/widget/
# - widget-bundle.js
# - widget-bundle.css
11.2 Build Script
package.json (root):
json{
  "scripts": {
    "widget:dev": "cd widget && npm run dev",
    "widget:build": "cd widget && npm run build",
    "build": "npm run widget:build && next build"
  }
}

12. Integration Examples
12.1 Basic Integration
html<!DOCTYPE html>
<html lang="nl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>My Website</title>
</head>
<body>
  <h1>Welcome to my website</h1>

  <!-- Chatbot Widget -->
  <script
    src="https://your-app.vercel.app/widget/loader.js"
    data-chatbot-id="cbk_live_abc123xyz789"
  ></script>
</body>
</html>
12.2 Custom Configuration
html<script
  src="https://your-app.vercel.app/widget/loader.js"
  data-chatbot-id="cbk_live_abc123xyz789"
  data-name="Support Bot"
  data-welcome="Welkom bij onze support!"
  data-placeholder="Hoe kunnen we je helpen?"
  data-primary-color="#FF6B6B"
  data-secondary-color="#FF5252"
  data-position="bottom-left"
  data-show-branding="false"
></script>
12.3 WordPress Integration
php<?php
// Add to theme's functions.php or use Code Snippets plugin

function add_chatbot_widget() {
  ?>
  <script
    src="https://your-app.vercel.app/widget/loader.js"
    data-chatbot-id="cbk_live_abc123xyz789"
  ></script>
  <?php
}
add_action('wp_footer', 'add_chatbot_widget');
?>
12.4 React/Next.js Integration
tsx// components/ChatbotWidget.tsx
'use client'

import { useEffect } from 'react'

export function ChatbotWidget() {
  useEffect(() => {
    const script = document.createElement('script')
    script.src = 'https://your-app.vercel.app/widget/loader.js'
    script.setAttribute('data-chatbot-id', 'cbk_live_abc123xyz789')
    script.async = true

    document.body.appendChild(script)

    return () => {
      // Cleanup
      document.body.removeChild(script)
      const root = document.getElementById('chatbot-widget-root')
      if (root) root.remove()
    }
  }, [])

  return null
}

// app/layout.tsx
import { ChatbotWidget } from '@/components/ChatbotWidget'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <ChatbotWidget />
      </body>
    </html>
  )
}
12.5 Shopify Integration
liquid<!-- theme.liquid - before </body> -->
<script
  src="https://your-app.vercel.app/widget/loader.js"
  data-chatbot-id="cbk_live_abc123xyz789"
></script>

13. Testing
13.1 Local Testing
Create public/test.html:
html<!DOCTYPE html>
<html lang="nl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Widget Test Page</title>
  <style>
    body {
      font-family: sans-serif;
      max-width: 800px;
      margin: 50px auto;
      padding: 20px;
      line-height: 1.6;
    }
    h1 { color: #333; }
    p { color: #666; }
  </style>
</head>
<body>
  <h1>Chatbot Widget Test Page</h1>
  <p>This page is used to test the chatbot widget integration.</p>
  <p>Click the button in the bottom-right corner to open the chatbot.</p>

  <!-- Widget -->
  <script
    src="http://localhost:3000/widget/loader.js"
    data-chatbot-id="YOUR_TEST_API_KEY"
    data-primary-color="#FF6B6B"
  ></script>
</body>
</html>
Visit: http://localhost:3000/test.html
13.2 Cross-Browser Testing
Test on:

✅ Chrome (latest)
✅ Firefox (latest)
✅ Safari (latest)
✅ Edge (latest)
✅ Mobile browsers (iOS Safari, Chrome Android)

13.3 Performance Testing
javascript// Measure load time
performance.mark('widget-start')

// ... widget loads ...

performance.mark('widget-end')
performance.measure('widget-load', 'widget-start', 'widget-end')

const measure = performance.getEntriesByName('widget-load')[0]
console.log(`Widget loaded in ${measure.duration}ms`)

14. Troubleshooting
14.1 Common Issues
Widget not loading:

Check console for errors
Verify API key is correct
Check CORS headers on API
Ensure script URL is correct

Styles not applied:

Check if CSS file loaded
Verify Shadow DOM is created
Check for CSS conflicts

API errors:

Check network tab
Verify API endpoint
Check API key validity
Review rate limits

14.2 Debug Mode
Enable debugging:
javascript// Add to loader.js temporarily
window.CHATBOT_DEBUG = true;

// Add console logs throughout code
if (window.CHATBOT_DEBUG) {
  console.log('Debug:', data);
}

15. Best Practices

Always use Shadow DOM - Prevents style conflicts
Minimize bundle size - Keep under 200KB
Error handling - Always handle API failures gracefully
Loading states - Show feedback during operations
Accessibility - Use semantic HTML and ARIA labels
Mobile-first - Test on mobile devices
Performance - Lazy load, code split where possible
Security - Never expose sensitive data client-side
```

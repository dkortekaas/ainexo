const STORAGE_PREFIX = "chatbot_widget_";

export const storage = {
  /**
   * Get session ID
   */
  getSessionId(): string | null {
    try {
      return localStorage.getItem(`${STORAGE_PREFIX}session_id`);
    } catch {
      return null;
    }
  },

  /**
   * Set session ID
   */
  setSessionId(sessionId: string): void {
    try {
      localStorage.setItem(`${STORAGE_PREFIX}session_id`, sessionId);
    } catch (error) {
      console.warn("Storage: Failed to save session ID:", error);
    }
  },

  /**
   * Get messages for current session
   */
  getMessages(): any[] {
    try {
      const stored = localStorage.getItem(`${STORAGE_PREFIX}messages`);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  },

  /**
   * Save messages
   */
  setMessages(messages: any[]): void {
    try {
      // Only keep last 50 messages
      const limited = messages.slice(-50);
      localStorage.setItem(
        `${STORAGE_PREFIX}messages`,
        JSON.stringify(limited)
      );
    } catch (error) {
      console.warn("Storage: Failed to save messages:", error);
    }
  },

  /**
   * Clear messages
   */
  clearMessages(): void {
    try {
      localStorage.removeItem(`${STORAGE_PREFIX}messages`);
    } catch (error) {
      console.warn("Storage: Failed to clear messages:", error);
    }
  },

  /**
   * Get widget open state
   */
  getIsOpen(): boolean {
    try {
      return localStorage.getItem(`${STORAGE_PREFIX}is_open`) === "true";
    } catch {
      return false;
    }
  },

  /**
   * Set widget open state
   */
  setIsOpen(isOpen: boolean): void {
    try {
      localStorage.setItem(`${STORAGE_PREFIX}is_open`, String(isOpen));
    } catch (error) {
      console.warn("Storage: Failed to save open state:", error);
    }
  },
};

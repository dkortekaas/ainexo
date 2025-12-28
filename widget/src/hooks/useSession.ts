import { useEffect } from "react";
import { ChatbotApiClient } from "../api/client";
import { storage } from "../utils/storage";
import { generateSessionId } from "../utils/helpers";

export function useSession(apiClient: ChatbotApiClient) {
  useEffect(() => {
    let sessionId = storage.getSessionId();

    if (!sessionId) {
      sessionId = generateSessionId();
      storage.setSessionId(sessionId);
    }

    apiClient.setSessionId(sessionId);
  }, [apiClient]);
}

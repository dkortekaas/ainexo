"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";

interface Assistant {
  id: string;
  userId: string;
  name: string;
  description?: string;
  welcomeMessage: string;
  placeholderText: string;
  primaryColor: string;
  secondaryColor: string;
  fontFamily?: string;
  assistantName?: string;
  assistantSubtitle?: string;
  selectedAvatar?: string;
  selectedAssistantIcon?: string;
  tone: string;
  language: string;
  maxResponseLength: number;
  temperature: number;
  fallbackMessage: string;
  position: string;
  showBranding: boolean;
  isActive: boolean;
  apiKey: string;
  allowedDomains: string[];
  rateLimit: number;
  projectId?: string | null;
  createdAt: string;
  updatedAt: string;
}

interface AssistantContextType {
  currentAssistant: Assistant | null;
  assistants: Assistant[];
  setCurrentAssistant: (assistant: Assistant | null) => void;
  refreshAssistants: () => Promise<void>;
  isLoading: boolean;
}

const AssistantContext = createContext<AssistantContextType | undefined>(
  undefined
);

export function AssistantProvider({ children }: { children: ReactNode }) {
  const [currentAssistant, setCurrentAssistant] = useState<Assistant | null>(
    null
  );
  const [assistants, setAssistants] = useState<Assistant[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchAssistants = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/assistants");
      if (response.ok) {
        const paginatedData = await response.json();
        // Extract the data array from the paginated response
        const assistants = paginatedData.data || [];
        setAssistants(assistants);

        // If no current assistant is set and we have assistants, set the first one
        if (!currentAssistant && assistants.length > 0) {
          setCurrentAssistant(assistants[0]);
        }
      }
    } catch (error) {
      console.error("Failed to fetch assistants:", error);
    } finally {
      setIsLoading(false);
    }
  }, [currentAssistant]);

  const refreshAssistants = async () => {
    await fetchAssistants();
  };

  useEffect(() => {
    fetchAssistants();
  }, [fetchAssistants]);

  // Update current assistant if it's no longer in the list
  useEffect(() => {
    if (
      currentAssistant &&
      !assistants.find((a) => a.id === currentAssistant.id)
    ) {
      setCurrentAssistant(assistants.length > 0 ? assistants[0] : null);
    }
  }, [assistants, currentAssistant]);

  return (
    <AssistantContext.Provider
      value={{
        currentAssistant,
        assistants,
        setCurrentAssistant,
        refreshAssistants,
        isLoading,
      }}
    >
      {children}
    </AssistantContext.Provider>
  );
}

export function useAssistant() {
  const context = useContext(AssistantContext);
  if (context === undefined) {
    throw new Error("useAssistant must be used within an AssistantProvider");
  }
  return context;
}

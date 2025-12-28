"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { useSession } from "next-auth/react";

interface SubscriptionContextType {
  hasValidSubscription: boolean;
}

const SubscriptionContext = createContext<SubscriptionContextType>({
  hasValidSubscription: true,
});

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const { data: session } = useSession();
  const [hasValidSubscription, setHasValidSubscription] = useState(true);

  useEffect(() => {
    const fetchSubscriptionStatus = async () => {
      if (session?.user?.companyId) {
        try {
          const response = await fetch(
            `/api/subscription?companyId=${session.user.companyId}`
          );
          const data = await response.json();
          setHasValidSubscription(data.hasActiveSubscription);
        } catch (error) {
          console.error("Error fetching subscription status:", error);
        }
      }
    };

    fetchSubscriptionStatus();
  }, [session?.user?.companyId]);

  return (
    <SubscriptionContext.Provider value={{ hasValidSubscription }}>
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  return useContext(SubscriptionContext);
}

"use client";

import { useEffect, useRef, useCallback } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";

const INACTIVITY_TIMEOUT = 30 * 60 * 1000; // 30 minutes in milliseconds

export default function InactivityTimer() {
  const { data: session } = useSession();
  const router = useRouter();
  const timeoutRef = useRef<NodeJS.Timeout>();

  const resetTimer = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
      if (session) {
        signOut({ redirect: false }).then(() => {
          router.push("/login");
        });
      }
    }, INACTIVITY_TIMEOUT);
  }, [session, router]);

  useEffect(() => {
    if (session) {
      // Events to track user activity
      const events = [
        "mousedown",
        "mousemove",
        "keypress",
        "scroll",
        "touchstart",
      ];

      // Add event listeners
      events.forEach((event) => {
        window.addEventListener(event, resetTimer);
      });

      // Initial timer setup
      resetTimer();

      // Cleanup
      return () => {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
        events.forEach((event) => {
          window.removeEventListener(event, resetTimer);
        });
      };
    }
  }, [session, resetTimer]);

  return null; // This component doesn't render anything
}

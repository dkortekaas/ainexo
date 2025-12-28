"use client";

import { useEffect, useCallback } from "react";

declare global {
  interface Window {
    grecaptcha?: {
      ready: (callback: () => void) => void;
      execute: (
        siteKey: string,
        options: { action: string }
      ) => Promise<string>;
    };
  }
}

/**
 * Hook to use Google reCAPTCHA v3
 * @param siteKey - The reCAPTCHA site key
 * @returns Function to execute reCAPTCHA and get a token
 */
export function useRecaptcha(siteKey: string | undefined) {
  const loadRecaptchaScript = useCallback(() => {
    if (typeof window === "undefined" || !siteKey) return;

    // Check if script is already loaded
    if (window.grecaptcha) return;

    // Check if script tag already exists
    const existingScript = document.querySelector(
      'script[src*="recaptcha/api.js"]'
    );
    if (existingScript) return;

    // Load reCAPTCHA script
    const script = document.createElement("script");
    script.src = `https://www.google.com/recaptcha/api.js?render=${siteKey}`;
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);
  }, [siteKey]);

  useEffect(() => {
    loadRecaptchaScript();
  }, [loadRecaptchaScript]);

  const executeRecaptcha = useCallback(
    async (action: string): Promise<string | null> => {
      if (typeof window === "undefined" || !siteKey) {
        // If siteKey is not configured, return null
        // The backend will handle this gracefully (allows in development)
        return null;
      }

      if (!window.grecaptcha) {
        // Wait a bit for the script to load
        await new Promise((resolve) => setTimeout(resolve, 500));
        
        if (!window.grecaptcha) {
          // If still not loaded and no site key, return null (backend handles it)
          if (!siteKey) {
            return null;
          }
          throw new Error("reCAPTCHA is not loaded");
        }
      }

      return new Promise((resolve, reject) => {
        window.grecaptcha!.ready(() => {
          window.grecaptcha!
            .execute(siteKey, { action })
            .then((token) => {
              resolve(token);
            })
            .catch((error) => {
              console.error("reCAPTCHA execution error:", error);
              reject(error);
            });
        });
      });
    },
    [siteKey]
  );

  return { executeRecaptcha };
}


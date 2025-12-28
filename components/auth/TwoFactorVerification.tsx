"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import config from "@/config";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { safeRedirect } from "@/lib/safe-redirect";

interface TwoFactorVerificationProps {
  callbackUrl: string;
}

export default function TwoFactorVerification({
  callbackUrl,
}: TwoFactorVerificationProps) {
  const t = useTranslations();
  const router = useRouter();
  const { data: session, update } = useSession();
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isUsingRecoveryCode, setIsUsingRecoveryCode] = useState(false);
  const [showEmailRecovery, setShowEmailRecovery] = useState(false);
  const [emailRecoverySent, setEmailRecoverySent] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Initialize refs array
  useEffect(() => {
    inputRefs.current = inputRefs.current.slice(0, 6);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/2fa/verify-login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token: code,
          email: session?.user?.email,
          companyId: session?.user?.companyId,
          trustDevice: false,
          isRecoveryCode: isUsingRecoveryCode && !showEmailRecovery,
          isEmailRecovery: showEmailRecovery,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Verification failed");
      }

      // Update the session with the new 2FA status
      await update({
        ...session,
        user: {
          ...session?.user,
          requires2FA: false,
          twoFactorAuthenticated: true,
        },
      });

      // Redirect to the callback URL after a short delay to ensure session is updated
      setTimeout(() => {
        safeRedirect(callbackUrl);
      }, 500);
    } catch (error) {
      console.error("2FA verification error:", error);
      setError(error instanceof Error ? error.message : "Verification failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (index: number, value: string) => {
    // Only allow digits
    const digit = value.replace(/\D/g, "");

    if (digit) {
      // Update the code state
      const newCode = code.split("");
      newCode[index] = digit;
      const updatedCode = newCode.join("");
      setCode(updatedCode);

      // Move to next input if available
      if (index < 5 && inputRefs.current[index + 1]) {
        inputRefs.current[index + 1]?.focus();
      }
    }
  };

  const handleKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    // Handle backspace
    if (e.key === "Backspace" && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, 6);

    if (pastedData) {
      setCode(pastedData);

      // Focus the appropriate input
      const focusIndex = Math.min(pastedData.length, 5);
      inputRefs.current[focusIndex]?.focus();
    }
  };

  const toggleRecoveryMode = () => {
    setIsUsingRecoveryCode(!isUsingRecoveryCode);
    setShowEmailRecovery(false);
    setCode("");
    setError("");
  };

  const requestEmailRecovery = async () => {
    if (!session?.user?.email) return;

    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/2fa/request-recovery", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: session.user.email,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to send recovery code");
      }

      setEmailRecoverySent(true);
      setShowEmailRecovery(true);
      setIsUsingRecoveryCode(false);
    } catch (error) {
      console.error("Email recovery error:", error);
      setError(
        error instanceof Error ? error.message : "Failed to send recovery code"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4 sm:px-6">
      <div className="max-w-md w-full space-y-6 sm:space-y-8 p-6 sm:p-8 bg-white dark:bg-gray-800 rounded-lg shadow-md mx-auto">
        <div className="text-center mb-6 sm:mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-primary dark:text-primary mb-2">
            {config.appTitle}
          </h2>
          <p className="text-base sm:text-lg text-gray-600 dark:text-gray-300">
            {showEmailRecovery
              ? "Voer de herstelcode in die naar je email is verstuurd"
              : isUsingRecoveryCode
                ? t("auth.twoFactorVerification.recoveryTitle")
                : t("auth.twoFactorVerification.title")}
          </p>
          {emailRecoverySent && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md p-3">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                {t("auth.twoFactorVerification.emailRecoverySent")}
              </p>
            </div>
          )}
        </div>
        <form
          className="mt-6 sm:mt-8 space-y-4 sm:space-y-6"
          onSubmit={handleSubmit}
        >
          {isUsingRecoveryCode || showEmailRecovery ? (
            <div className="space-y-4">
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder={
                  showEmailRecovery
                    ? "Bijv: A1B2C3D4"
                    : t("auth.twoFactorVerification.recoveryPlaceholder")
                }
                className="w-full px-4 py-2 text-base border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-indigo-400 focus:border-primary bg-white dark:bg-gray-700 text-gray-900 dark:text-white uppercase"
                disabled={isLoading}
                maxLength={showEmailRecovery ? 8 : undefined}
              />
            </div>
          ) : (
            <div className="flex justify-center space-x-2 sm:space-x-3">
              {[...Array(6)].map((_, index) => (
                <input
                  key={index}
                  ref={(el) => {
                    inputRefs.current[index] = el;
                  }}
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]"
                  maxLength={1}
                  className="w-10 h-12 sm:w-12 sm:h-14 text-center text-xl sm:text-2xl font-bold rounded-md border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-indigo-400 focus:border-primary bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  value={code[index] || ""}
                  onChange={(e) => handleInputChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  onPaste={handlePaste}
                  autoFocus={index === 0}
                  disabled={isLoading}
                />
              ))}
            </div>
          )}

          {error && (
            <div className="text-red-600 dark:text-red-400 text-sm sm:text-base text-center bg-red-50 dark:bg-red-900/50 p-3 rounded-md">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <Button
              type="submit"
              disabled={
                isLoading ||
                (isUsingRecoveryCode || showEmailRecovery
                  ? !code
                  : code.length !== 6)
              }
              className="w-full bg-primary hover:bg-primary/80"
            >
              {isLoading ? t("actions.verifying") : t("actions.verify")}
            </Button>

            <div className="text-center space-y-2">
              {!showEmailRecovery && (
                <button
                  type="button"
                  onClick={toggleRecoveryMode}
                  className="block w-full text-sm text-primary hover:text-primary dark:text-indigo-300 dark:hover:text-indigo-200"
                >
                  {isUsingRecoveryCode
                    ? t("auth.twoFactorVerification.useAuthenticator")
                    : t("auth.twoFactorVerification.useRecoveryCode")}
                </button>
              )}

              {!isUsingRecoveryCode && !showEmailRecovery && (
                <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                    {t("auth.twoFactorVerification.noAccessTitle")}
                  </p>
                  <button
                    type="button"
                    onClick={requestEmailRecovery}
                    disabled={isLoading || emailRecoverySent}
                    className="text-sm text-amber-600 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {t("auth.twoFactorVerification.requestEmailRecovery")}
                  </button>
                </div>
              )}

              {showEmailRecovery && !emailRecoverySent && (
                <button
                  type="button"
                  onClick={() => {
                    setShowEmailRecovery(false);
                    setCode("");
                    setError("");
                  }}
                  className="block w-full text-sm text-primary hover:text-primary dark:text-indigo-300 dark:hover:text-indigo-200"
                >
                  {t("auth.twoFactorVerification.backToAuthenticator")}
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

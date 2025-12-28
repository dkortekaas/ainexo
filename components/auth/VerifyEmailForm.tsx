"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Alert, AlertDescription } from "@/components/ui";
import Link from "next/link";
import Image from "next/image";
import { useTranslations } from "next-intl";
import config from "@/config";
import { toast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";

export function VerifyEmailForm({ token }: { token?: string }) {
  const [isLoading, setIsLoading] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const t = useTranslations();

  useEffect(() => {
    if (!token) {
      setError(t("error.invalidLink") || "Invalid verification link");
      return;
    }

    // Automatically verify email when component mounts
    const verifyEmail = async () => {
      setIsLoading(true);
      setError(null);

      try {
        console.log("[VERIFY_EMAIL] Starting verification with token:", token?.substring(0, 10) + "...");
        
        const response = await fetch(`/api/auth/verify-email?token=${encodeURIComponent(token)}`, {
          method: "GET",
          cache: "no-store",
        });

        const data = await response.json();
        
        console.log("[VERIFY_EMAIL] Response:", { ok: response.ok, data });

        if (!response.ok) {
          const errorMsg = data.error || t("error.generic") || "Verification failed";
          console.error("[VERIFY_EMAIL] Verification failed:", errorMsg);
          setError(errorMsg);
          setIsLoading(false);
          return;
        }

        // Success
        console.log("[VERIFY_EMAIL] Verification successful!");
        setIsVerified(true);
        toast({
          title: t("success.emailVerified") || "Email verified successfully",
          variant: "success",
          duration: 3000,
        });

        // Wait a bit longer to ensure database is updated, then redirect
        setTimeout(() => {
          console.log("[VERIFY_EMAIL] Redirecting to login...");
          router.push("/login?verified=true");
          router.refresh();
        }, 3000);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : t("error.generic") || "Something went wrong"
        );
      } finally {
        setIsLoading(false);
      }
    };

    verifyEmail();
  }, [token, router, t]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900 px-4 sm:px-6">
      <div className="w-full max-w-md mx-auto">
        <div className="flex justify-center mb-6">
          <Image
            src={config.appLogo}
            alt={config.appTitle}
            className="h-24 sm:h-28 w-auto object-contain"
            width={140}
            height={140}
            sizes="(max-width: 640px) 64px, 80px"
            priority
          />
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 sm:p-8 rounded-lg shadow-md">
          <div className="text-center mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">
              {t("auth.verifyEmail.title") || "Verify Email Address"}
            </h1>
            <p className="text-base sm:text-lg text-gray-600 dark:text-gray-300">
              {isLoading
                ? t("auth.verifyEmail.verifying") || "Verifying your email..."
                : isVerified
                ? t("auth.verifyEmail.success") ||
                  "Your email has been verified successfully!"
                : error
                ? t("auth.verifyEmail.error") || "Verification failed"
                : t("auth.verifyEmail.description") ||
                  "Please wait while we verify your email address..."}
            </p>
          </div>

          {isLoading && (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          )}

          {error && (
            <Alert
              variant="destructive"
              className="dark:bg-red-900 dark:border-red-700 dark:text-red-200 text-sm sm:text-base mb-6"
            >
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {isVerified && (
            <Alert className="bg-green-50 dark:bg-green-900 border-green-200 dark:border-green-700 text-green-800 dark:text-green-200 text-sm sm:text-base mb-6">
              <AlertDescription>
                {t("auth.verifyEmail.redirecting") ||
                  "Redirecting to login page..."}
              </AlertDescription>
            </Alert>
          )}

          {!isLoading && !isVerified && (
            <div className="mt-6 text-center">
              <Link href="/login">
                <Button className="w-full bg-primary hover:bg-primary/80">
                  {t("auth.verifyEmail.backToLogin") || "Back to Login"}
                </Button>
              </Link>
            </div>
          )}

          {!isLoading && error && (
            <div className="mt-6 text-center">
              <Link href="/login">
                <Button
                  variant="outline"
                  className="w-full"
                  disabled={isLoading}
                >
                  {t("auth.verifyEmail.backToLogin") || "Back to Login"}
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


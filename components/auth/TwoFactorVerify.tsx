// components/auth/TwoFactorVerify.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Smartphone, Key } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";

export default function TwoFactorVerify() {
  const t = useTranslations();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [verificationCode, setVerificationCode] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [companyId, setCompanyId] = useState<string>("");
  const [trustDevice, setTrustDevice] = useState<boolean>(false);
  const [isUsingRecoveryCode, setIsUsingRecoveryCode] =
    useState<boolean>(false);
  const [countdown, setCountdown] = useState<number>(30);
  const [isCountdownActive, setIsCountdownActive] = useState<boolean>(true);

  useEffect(() => {
    const email = searchParams.get("email");
    const companyId = searchParams.get("companyId");
    if (email) {
      setEmail(email);
    }
    if (companyId) {
      setCompanyId(companyId);
    }

    // Start countdown for code refresh
    let timer: NodeJS.Timeout;
    if (isCountdownActive) {
      timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            setCountdown(30);
            return 30;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [searchParams, isCountdownActive]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      isUsingRecoveryCode &&
      (!verificationCode || verificationCode.length < 10)
    ) {
      setError("Voer een geldige herstelcode in (minimaal 10 tekens)");
      return;
    }

    if (
      !isUsingRecoveryCode &&
      (!verificationCode || verificationCode.length !== 6)
    ) {
      setError("Voer een geldige 6-cijferige code in");
      return;
    }

    if (!email) {
      setError("E-mailadres ontbreekt");
      return;
    }

    if (!companyId) {
      setError("Bedrijfs-ID ontbreekt");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/2fa/verify-login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token: verificationCode,
          email,
          companyId,
          trustDevice,
          isRecoveryCode: isUsingRecoveryCode,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Verificatie mislukt");
      }

      // Redirect to the page user was trying to access or default to dashboard
      const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";
      router.push(callbackUrl);
    } catch (error) {
      console.error("Error verifying 2FA code:", error);
      setError(
        error instanceof Error
          ? error.message
          : "Er is een onbekende fout opgetreden"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const toggleRecoveryMode = () => {
    setIsUsingRecoveryCode(!isUsingRecoveryCode);
    setVerificationCode("");
    setError("");
    setIsCountdownActive(!isUsingRecoveryCode);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div>
          <div className="mx-auto h-12 w-12 rounded-full bg-indigo-100 flex items-center justify-center">
            {isUsingRecoveryCode ? (
              <Key className="h-6 w-6 text-primary" />
            ) : (
              <Smartphone className="h-6 w-6 text-primary" />
            )}
          </div>
          <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
            {isUsingRecoveryCode
              ? t("auth.twoFactor.recoveryCode")
              : t("auth.twoFactor.2fa")}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            {isUsingRecoveryCode
              ? t("auth.twoFactor.recoveryCodeDescription")
              : t("auth.twoFactor.2faDescription")}
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4 rounded-md shadow-sm">
            <div>
              <label htmlFor="verification-code" className="sr-only">
                {isUsingRecoveryCode
                  ? t("auth.twoFactor.recoveryCode")
                  : t("auth.twoFactor.2fa")}
              </label>
              <input
                id="verification-code"
                name="verification-code"
                type="text"
                required
                className="relative block w-full rounded-md border-0 py-1.5 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                placeholder={
                  isUsingRecoveryCode
                    ? t("auth.twoFactor.recoveryCodeDescription")
                    : t("auth.twoFactor.2faDescription")
                }
                value={verificationCode}
                onChange={(e) => {
                  if (isUsingRecoveryCode) {
                    setVerificationCode(e.target.value.trim());
                  } else {
                    // Alleen cijfers toestaan voor TOTP code
                    const value = e.target.value
                      .replace(/[^0-9]/g, "")
                      .slice(0, 6);
                    setVerificationCode(value);
                  }
                }}
                pattern={isUsingRecoveryCode ? undefined : "[0-9]{6}"}
              />
            </div>
          </div>

          {!isUsingRecoveryCode && (
            <div className="text-sm text-center text-gray-500">
              {t("auth.twoFactor.codeExpiresIn", { countdown })}
            </div>
          )}

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="trust-device"
                name="trust-device"
                type="checkbox"
                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-indigo-600"
                checked={trustDevice}
                onChange={(e) => setTrustDevice(e.target.checked)}
              />
              <label
                htmlFor="trust-device"
                className="ml-2 block text-sm text-gray-900"
              >
                {t("auth.twoFactor.rememberDevice")}
              </label>
            </div>
          </div>

          <div className="text-center">
            <button
              type="button"
              onClick={toggleRecoveryMode}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
            >
              {isUsingRecoveryCode ? (
                <>
                  <Smartphone className="h-4 w-4 mr-2" />
                  {t("auth.twoFactor.useAuthenticatorApp")}
                </>
              ) : (
                <>
                  <Key className="h-4 w-4 mr-2" />
                  {t("auth.twoFactor.useRecoveryCode")}
                </>
              )}
            </button>
          </div>

          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <div className="flex">
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">{error}</h3>
                </div>
              </div>
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative flex w-full justify-center rounded-md bg-primary/80 px-3 py-2 text-sm font-semibold text-white hover:bg-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50"
            >
              {isLoading
                ? t("auth.twoFactor.verifying")
                : t("auth.twoFactor.verify")}
            </button>
          </div>
        </form>

        <div className="text-center mt-4">
          <Link
            href="/login"
            className="font-medium text-primary hover:text-primary text-sm"
          >
            {t("auth.twoFactor.loginWithAnotherAccount")}
          </Link>
        </div>
      </div>
    </div>
  );
}

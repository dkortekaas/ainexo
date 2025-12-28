// components/auth/TwoFactorSetup.tsx
"use client";

import { useState, memo } from "react";
import {
  Shield,
  Copy,
  CheckCircle,
  Download,
  ArrowRight,
  ArrowLeft,
  EyeClosed,
  Eye,
} from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { toast } from "@/components/ui/use-toast";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
  Button,
} from "@/components/ui";
import Link from "next/link";
enum SetupStep {
  INITIAL = 0,
  QR_CODE = 1,
  VERIFY = 2,
  RECOVERY_CODES = 3,
  COMPLETE = 4,
}

interface TwoFactorSetupProps {
  onComplete?: () => void;
  onSkip?: () => void;
  showSkipOption?: boolean;
}

function TwoFactorSetupComponent({
  onComplete,
  onSkip,
  showSkipOption = false,
}: TwoFactorSetupProps) {
  const [step, setStep] = useState<SetupStep>(SetupStep.INITIAL);
  const [qrCode, setQrCode] = useState<string>("");
  const [secret, setSecret] = useState<string>("");
  const [verificationCode, setVerificationCode] = useState<string>("");
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [showSecret, setShowSecret] = useState<boolean>(false);
  const t = useTranslations();

  const startSetup = async () => {
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/2fa/setup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || t("error.twoFactorSetupError"));
      }

      const data = await response.json();
      setQrCode(data.data.qrCode);
      setSecret(data.data.secret);
      setStep(SetupStep.QR_CODE);
    } catch (error) {
      console.error("Error starting 2FA setup:", error);
      setError(
        error instanceof Error ? error.message : t("error.unknownError")
      );
    } finally {
      setIsLoading(false);
    }
  };

  const verifyCode = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      toast({
        title: t("error.invalidCode"),
        variant: "destructive",
        duration: 3000,
      });
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/2fa/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token: verificationCode }),
      });

      if (!response.ok) {
        const data = await response.json();
        toast({
          title: t("error.verificationFailed"),
          variant: "destructive",
          duration: 3000,
        });
        throw new Error(data.error || t("error.verificationFailed"));
      }

      const data = await response.json();
      setRecoveryCodes(data.data.recoveryCodes);
      setStep(SetupStep.RECOVERY_CODES);
    } catch (error) {
      console.error("Error verifying 2FA code:", error);
      toast({
        title: t("error.verificationFailed"),
        variant: "destructive",
        duration: 3000,
      });
      setError(
        error instanceof Error ? error.message : t("error.unknownError")
      );
    } finally {
      setIsLoading(false);
    }
  };

  const copyRecoveryCodes = () => {
    navigator.clipboard
      .writeText(recoveryCodes.join("\n"))
      .then(() => {
        toast({
          title: t("success.recoveryCodesCopied"),
          variant: "success",
          duration: 3000,
        });
      })
      .catch(() => {
        toast({
          title: t("error.recoveryCodesCopyFailed"),
          variant: "destructive",
          duration: 3000,
        });
      });
  };

  const downloadRecoveryCodes = () => {
    const element = document.createElement("a");
    const file = new Blob([recoveryCodes.join("\n")], { type: "text/plain" });
    element.href = URL.createObjectURL(file);
    element.download = "2fa-recovery-codes.txt";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const finishSetup = () => {
    setStep(SetupStep.COMPLETE);
    toast({
      title: t("success.twoFactorSetupSuccess"),
      variant: "success",
      duration: 3000,
    });
    // Call onComplete callback if provided
    if (onComplete) {
      setTimeout(() => {
        onComplete();
      }, 1500);
    }
  };

  const renderStepContent = () => {
    switch (step) {
      case SetupStep.INITIAL:
        return (
          <div className="text-center">
            <div className="mb-6 bg-blue-100 p-3 rounded-full inline-flex">
              <Shield className="h-12 w-12 text-primary" />
            </div>
            <h2 className="text-2xl font-bold mb-4">
              {t("settings.secureAccount")}
            </h2>
            <p className="text-gray-600 mb-6">
              {t("settings.twoFactorSetupDescription")}
            </p>
            <div className="space-y-3">
              <Button
                onClick={startSetup}
                disabled={isLoading}
                className="w-full bg-primary hover:bg-primary/80"
              >
                {isLoading
                  ? t("common.statuses.loading")
                  : t("settings.enable2FA")}
              </Button>
              {showSkipOption && onSkip && (
                <Button
                  onClick={onSkip}
                  variant="outline"
                  className="w-full"
                  disabled={isLoading}
                >
                  {t("auth.registerForm.skip2FA")}
                </Button>
              )}
            </div>
          </div>
        );

      case SetupStep.QR_CODE:
        return (
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">
              {t("settings.scanQRCode")}
            </h2>
            <p className="text-gray-600 mb-6">
              {t("settings.scanQRCodeDescription")}
            </p>

            <div className="mb-6 flex justify-center">
              {qrCode && (
                <Image
                  src={qrCode}
                  alt={t("settings.qrCodeAlt")}
                  width={256}
                  height={256}
                  className="border border-gray-200 rounded-md p-2"
                />
              )}
            </div>

            <div className="mb-6">
              <p className="text-sm text-gray-500 mb-2">
                {t("settings.scanQRCodeManual")}
              </p>
              <div className="flex items-center justify-center">
                <div className="relative">
                  <input
                    type={showSecret ? "text" : "password"}
                    value={secret}
                    readOnly
                    className="w-64 p-2 border border-gray-300 rounded-md text-center bg-gray-50"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowSecret(!showSecret)}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showSecret ? (
                      <Eye className="h-5 w-5" />
                    ) : (
                      <EyeClosed className="h-5 w-5" />
                    )}
                  </Button>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    navigator.clipboard.writeText(secret);
                    toast({
                      title: t("success.codeCopied"),
                      variant: "success",
                      duration: 3000,
                    });
                  }}
                  className="ml-2 text-gray-500 hover:text-gray-700"
                  title={t("settings.copyCode")}
                >
                  <Copy className="h-5 w-5" />
                </Button>
              </div>
            </div>

            <div className="mt-8">
              <Button
                onClick={() => setStep(SetupStep.VERIFY)}
                className="bg-primary hover:bg-primary/80"
              >
                {t("common.next")}{" "}
                <ArrowRight className="h-4 w-4 ml-1 inline" />
              </Button>
            </div>
          </div>
        );

      case SetupStep.VERIFY:
        return (
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">
              {t("settings.verifySetup")}
            </h2>
            <p className="text-gray-600 mb-6">
              {t("settings.verifySetupDescription")}
            </p>

            <div className="mb-6">
              <InputOTP
                value={verificationCode}
                onChange={(value) => setVerificationCode(value)}
                maxLength={6}
                disabled={isLoading}
                pattern="[0-9]*"
                inputMode="numeric"
                containerClassName="justify-center"
              >
                <InputOTPGroup>
                  <InputOTPSlot index={0} />
                  <InputOTPSlot index={1} />
                  <InputOTPSlot index={2} />
                </InputOTPGroup>
                <InputOTPSeparator />
                <InputOTPGroup>
                  <InputOTPSlot index={3} />
                  <InputOTPSlot index={4} />
                  <InputOTPSlot index={5} />
                </InputOTPGroup>
              </InputOTP>
            </div>

            <div className="flex justify-between mt-8">
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep(SetupStep.QR_CODE)}
                disabled={isLoading}
              >
                <ArrowLeft className="h-4 w-4 mr-1 inline" />
                {t("common.previous")}
              </Button>
              <Button
                type="button"
                onClick={verifyCode}
                disabled={isLoading || verificationCode.length !== 6}
                className="bg-primary hover:bg-primary/80"
              >
                {isLoading ? t("common.verifying") : t("common.verify")}
              </Button>
            </div>
          </div>
        );

      case SetupStep.RECOVERY_CODES:
        return (
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">
              {t("settings.saveRecoveryCodes")}
            </h2>
            <p className="text-gray-600 mb-6">
              {t("settings.recoveryCodesDescription")}
            </p>

            <div className="mb-6 bg-gray-50 border border-gray-200 rounded-md p-4 text-left">
              <div className="grid grid-cols-2 gap-2">
                {recoveryCodes.map((code, index) => (
                  <div key={index} className="font-mono text-sm">
                    {code}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-center space-x-4 mb-8">
              <Button
                type="button"
                variant="outline"
                onClick={copyRecoveryCodes}
                className="flex items-center"
              >
                <Copy className="h-4 w-4 mr-2" />{" "}
                {t("settings.copyRecoveryCodes")}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={downloadRecoveryCodes}
                className="flex items-center"
              >
                <Download className="h-4 w-4 mr-2" />{" "}
                {t("settings.downloadRecoveryCodes")}
              </Button>
            </div>

            <div className="mt-8">
              <Button
                type="button"
                onClick={finishSetup}
                className="bg-primary hover:bg-primary/80"
              >
                {t("common.complete")}
              </Button>
            </div>
          </div>
        );

      case SetupStep.COMPLETE:
        return (
          <div className="text-center">
            <div className="mb-6 bg-green-100 p-3 rounded-full inline-flex">
              <CheckCircle className="h-12 w-12 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold mb-4">
              {t("success.twoFactorSetupSuccess")}
            </h2>
            <p className="text-gray-600 mb-6">
              {t("success.twoFactorSetupSuccessDescription")}
            </p>
            {onComplete ? (
              <Button
                onClick={onComplete}
                className="bg-primary hover:bg-primary/80"
              >
                {t("common.continue")}
              </Button>
            ) : (
              <Link
                href="/settings"
                className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-white hover:bg-primary h-10 px-4 py-2"
              >
                {t("settings.backToSettings")}
              </Link>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-8 max-w-md mx-auto">
      {/* Progress indicator */}
      {step !== SetupStep.COMPLETE && (
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {[
              SetupStep.INITIAL,
              SetupStep.QR_CODE,
              SetupStep.VERIFY,
              SetupStep.RECOVERY_CODES,
            ].map((s) => (
              <div
                key={s}
                className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  s === step
                    ? "bg-primary text-white"
                    : s < step
                      ? "bg-blue-100 text-primary"
                      : "bg-gray-100 text-gray-400"
                }`}
              >
                {s < step ? (
                  <CheckCircle className="h-5 w-5" />
                ) : (
                  <span>{s + 1}</span>
                )}
              </div>
            ))}
          </div>
          <div className="flex mt-2">
            <div
              className={`h-1 flex-1 ${step > SetupStep.INITIAL ? "bg-primary" : "bg-gray-200"}`}
            ></div>
            <div
              className={`h-1 flex-1 ${step > SetupStep.QR_CODE ? "bg-primary" : "bg-gray-200"}`}
            ></div>
            <div
              className={`h-1 flex-1 ${step > SetupStep.VERIFY ? "bg-primary" : "bg-gray-200"}`}
            ></div>
          </div>
        </div>
      )}

      {renderStepContent()}
    </div>
  );
}

TwoFactorSetupComponent.displayName = "TwoFactorSetup";

export default memo(TwoFactorSetupComponent);

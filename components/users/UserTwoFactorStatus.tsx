// components/users/UserTwoFactorStatus.tsx
"use client";

import { useState } from "react";
import { Shield, AlertCircle, RefreshCw } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "../ui/use-toast";

type UserTwoFactorStatusProps = {
  userId: string;
  userName: string;
  twoFactorEnabled: boolean;
  isAdmin: boolean;
  onStatusChange?: () => void;
};

export default function UserTwoFactorStatus({
  userId,
  userName,
  twoFactorEnabled,
  isAdmin,
  onStatusChange,
}: UserTwoFactorStatusProps) {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showResetConfirm, setShowResetConfirm] = useState<boolean>(false);
  const t = useTranslations("users.twoFactorStatus");
  const handleReset2FA = async () => {
    if (!isAdmin) return;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/users/${userId}/reset-2fa`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || t("errorResetting2FA"));
      }

      toast({
        title: t("successResetting2FA"),
        variant: "success",
        duration: 3000,
      });
      setShowResetConfirm(false);
      if (onStatusChange) onStatusChange();
    } catch (error) {
      console.error("Error resetting 2FA:", error);
      toast({
        title: t("errorResetting2FA"),
        variant: "destructive",
        duration: 3000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <div className="p-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <div
              className={`p-2 rounded-full ${twoFactorEnabled ? "bg-green-100" : "bg-yellow-100"}`}
            >
              <Shield
                className={`h-6 w-6 ${twoFactorEnabled ? "text-green-600" : "text-yellow-600"}`}
              />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">{userName}</h3>
              <div className="flex items-center mt-1">
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    twoFactorEnabled
                      ? "bg-green-100 text-green-800"
                      : "bg-yellow-100 text-yellow-800"
                  }`}
                >
                  {twoFactorEnabled ? t("enabled") : t("disabled")}
                </span>
              </div>
            </div>
          </div>

          {isAdmin && (
            <div>
              {twoFactorEnabled ? (
                !showResetConfirm ? (
                  <button
                    onClick={() => setShowResetConfirm(true)}
                    className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm leading-5 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-400"
                  >
                    <RefreshCw className="h-4 w-4 mr-1.5" />
                    {t("reset2FA")}
                  </button>
                ) : (
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={handleReset2FA}
                      disabled={isLoading}
                      className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm leading-5 font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                    >
                      {isLoading
                        ? t("common.statuses.loading")
                        : t("common.confirm")}
                    </button>
                    <button
                      onClick={() => setShowResetConfirm(false)}
                      className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm leading-5 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-400"
                      disabled={isLoading}
                    >
                      {t("cancel")}
                    </button>
                  </div>
                )
              ) : (
                <div className="flex items-center">
                  <AlertCircle className="h-5 w-5 text-yellow-500 mr-2" />
                  <span className="text-sm text-yellow-600">
                    {t("userMustSetup2FA")}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {showResetConfirm && (
          <div className="mt-4 p-4 bg-red-50 rounded-md">
            <div className="flex">
              <div className="flex-shrink-0">
                <AlertCircle className="h-5 w-5 text-red-400" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">
                  {t("reset2FAConfirmation")}
                </h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{t("reset2FAConfirmationDescription")}</p>
                  <ul className="list-disc pl-5 mt-1 space-y-1">
                    <li>{t("reset2FAConfirmationDescription1")}</li>
                    <li>{t("reset2FAConfirmationDescription2")}</li>
                    <li>{t("reset2FAConfirmationDescription3")}</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import dynamic from "next/dynamic";
import {
  Input,
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Button,
  Alert,
  AlertDescription,
} from "@/components/ui";
import { useToast } from "@/components/ui/use-toast";
import { useTranslations } from "next-intl";
import { Shield, ShieldCheck, ShieldOff, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

// Lazy load TwoFactorSetup for better performance
const TwoFactorSetup = dynamic(
  () => import("@/components/auth/TwoFactorSetup"),
  {
    loading: () => (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    ),
    ssr: false,
  }
);

export function TwoFactorTab() {
  const { data: session, update } = useSession();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [isDisabling, setIsDisabling] = useState(false);
  const [showDisableDialog, setShowDisableDialog] = useState(false);
  const [showSetup, setShowSetup] = useState(false);
  const t = useTranslations();

  // Schema for disable password confirmation
  const disableSchema = z.object({
    password: z.string().min(1, { message: t("error.passwordRequired") }),
  });

  const form = useForm<z.infer<typeof disableSchema>>({
    resolver: zodResolver(disableSchema),
    defaultValues: {
      password: "",
    },
  });

  // Fetch 2FA status
  useEffect(() => {
    const fetch2FAStatus = async () => {
      if (!session?.user?.id) return;

      setIsLoading(true);
      try {
        // Try to get from session first
        const sessionResponse = await fetch("/api/auth/session");
        if (sessionResponse.ok) {
          const sessionData = await sessionResponse.json();
          if (sessionData?.user?.twoFactorEnabled !== undefined) {
            setTwoFactorEnabled(sessionData.user.twoFactorEnabled);
          }
        }

        // Also fetch from user profile API for accuracy
        const profileResponse = await fetch("/api/users/profile");
        if (profileResponse.ok) {
          const profileData = await profileResponse.json();
          if (profileData?.twoFactorEnabled !== undefined) {
            setTwoFactorEnabled(profileData.twoFactorEnabled);
          }
        }
      } catch (err) {
        console.error("Error fetching 2FA status:", err);
        // Status will remain at default (false) if fetch fails
      } finally {
        setIsLoading(false);
      }
    };

    fetch2FAStatus();
  }, [session?.user?.id]);

  const handleDisable2FA = async (data: z.infer<typeof disableSchema>) => {
    setIsDisabling(true);

    try {
      // Disable 2FA
      const response = await fetch("/api/auth/2fa/disable", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ password: data.password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || t("error.failedToDisable2FA"));
      }

      toast({
        title: t("common.success"),
        description: t("success.twoFactorDisabled"),
        variant: "success",
      });

      setTwoFactorEnabled(false);
      setShowDisableDialog(false);
      form.reset();

      // Update session
      await update({
        user: {
          ...session?.user,
          twoFactorEnabled: false,
        },
      });
    } catch (err) {
      toast({
        title: t("error.error"),
        description:
          err instanceof Error ? err.message : t("error.failedToDisable2FA"),
        variant: "destructive",
      });
    } finally {
      setIsDisabling(false);
    }
  };

  const handleSetupComplete = async () => {
    setShowSetup(false);
    setTwoFactorEnabled(true);

    // Update session
    await update();

    toast({
      title: t("common.success"),
      description: t("success.twoFactorEnabled"),
      variant: "success",
    });
  };

  if (isLoading) {
    return (
      <div className="max-w-2xl space-y-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h2 className="text-lg font-medium text-gray-900 mb-6">
          {t("account.twoFactorAuthentication")}
        </h2>

        {twoFactorEnabled ? (
          <div className="space-y-4">
            <Alert className="bg-green-50 border-green-200">
              <ShieldCheck className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                {t("account.twoFactorEnabled")}
              </AlertDescription>
            </Alert>

            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <p className="text-sm text-gray-600 mb-4">
                {t("account.twoFactorEnabledDescription")}
              </p>

              <Dialog
                open={showDisableDialog}
                onOpenChange={setShowDisableDialog}
              >
                <DialogTrigger asChild>
                  <Button variant="destructive" className="w-full sm:w-auto">
                    <ShieldOff className="h-4 w-4 mr-2" />
                    {t("account.disable2FA")}
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{t("account.confirmDisable2FA")}</DialogTitle>
                    <DialogDescription>
                      {t("account.confirmDisable2FADescription")}
                    </DialogDescription>
                  </DialogHeader>
                  <Form {...form}>
                    <form
                      onSubmit={form.handleSubmit(handleDisable2FA)}
                      className="space-y-4"
                    >
                      <FormField
                        control={form.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              {t("account.currentPassword")} *
                            </FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                type="password"
                                disabled={isDisabling}
                                placeholder={t("account.enterPassword")}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="flex justify-end gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            setShowDisableDialog(false);
                            form.reset();
                          }}
                          disabled={isDisabling}
                        >
                          {t("common.cancel")}
                        </Button>
                        <Button
                          type="submit"
                          variant="destructive"
                          disabled={isDisabling}
                        >
                          {isDisabling ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              {t("common.disabling")}...
                            </>
                          ) : (
                            t("account.disable2FA")
                          )}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <Alert>
              <Shield className="h-4 w-4" />
              <AlertDescription>
                {t("account.twoFactorDisabled")}
              </AlertDescription>
            </Alert>

            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <p className="text-sm text-gray-600 mb-4">
                {t("account.twoFactorDescription")}
              </p>

              {!showSetup ? (
                <Button
                  onClick={() => setShowSetup(true)}
                  className="bg-primary hover:bg-primary/80"
                >
                  <Shield className="h-4 w-4 mr-2" />
                  {t("account.enable2FA")}
                </Button>
              ) : (
                <div className="mt-4">
                  <TwoFactorSetup
                    onComplete={handleSetupComplete}
                    showSkipOption={false}
                  />
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

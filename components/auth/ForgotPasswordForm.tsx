"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import Image from "next/image";
import { useTranslations } from "next-intl";
import config from "@/config";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import RequiredIndicator from "@/components/ui/RequiredIndicator";
import { Loader2 } from "lucide-react";
import { useRecaptcha } from "@/lib/hooks/useRecaptcha";

export default function ForgotPasswordForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const t = useTranslations();

  // Initialize reCAPTCHA
  const recaptchaSiteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;
  const { executeRecaptcha } = useRecaptcha(recaptchaSiteKey);

  const forgotPasswordSchema = z.object({
    email: z.string().email({ message: t("error.emailInvalid") }),
  });

  type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

  const form = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = async (data: ForgotPasswordFormValues) => {
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Execute reCAPTCHA
      let recaptchaToken: string | null = null;
      try {
        recaptchaToken = await executeRecaptcha("forgot_password");
      } catch (recaptchaError) {
        console.error("reCAPTCHA error:", recaptchaError);
        // If reCAPTCHA is configured but fails, show error
        // If not configured, backend will handle it gracefully
        if (recaptchaSiteKey) {
          setError("reCAPTCHA verification failed. Please try again.");
          setIsLoading(false);
          return;
        }
        // If no site key, continue without token (backend allows in development)
      }

      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...data,
          recaptchaToken,
        }),
      });

      const responseData = await response.json();

      if (!response.ok) {
        // Use the error message from the API if available, otherwise use generic error
        const errorMessage = responseData.error || t("error.generic");
        setError(errorMessage);
        return;
      }

      setSuccess(responseData.message || t("success.forgotPassword"));
    } catch (error) {
      // Network errors or JSON parsing errors
      console.error("Error in forgot password form:", error);
      setError(t("error.generic"));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900 px-4 sm:px-6">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-2">
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
        <Card>
          <CardHeader className="text-center">
            <CardDescription className="text-base sm:text-xl">
              {t("auth.forgotPasswordForm.title")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert variant="success" className="mb-4">
                <AlertDescription>{success}</AlertDescription>
              </Alert>
            )}

            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-6"
              >
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {t("auth.email")}
                        <RequiredIndicator />
                      </FormLabel>
                      <FormMessage />
                      <FormControl>
                        <Input type="email" disabled={isLoading} {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  className="w-full bg-primary hover:bg-primary/80"
                  disabled={isLoading || !form.formState.isValid}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {t("common.statuses.loading")}
                    </>
                  ) : (
                    t("auth.forgotPasswordForm.submitButton")
                  )}
                </Button>
              </form>
            </Form>

            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                    {t("auth.forgotPasswordForm.orLogin")}
                  </span>
                </div>
              </div>

              <div className="mt-6">
                <Button
                  variant="outline"
                  onClick={() => router.push("/login")}
                  className="w-full"
                  disabled={isLoading}
                >
                  {t("auth.forgotPasswordForm.backToLogin")}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

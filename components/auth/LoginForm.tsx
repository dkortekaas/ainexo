"use client";

import { useState, useEffect, useCallback } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import Image from "next/image";
import { useTranslations } from "next-intl";
import config from "@/config";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { debounce } from "lodash";
import RequiredIndicator from "@/components/ui/RequiredIndicator";

type LoginFormValues = {
  email: string;
  password: string;
  rememberMe?: boolean;
};

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const t = useTranslations();

  const loginSchema = z.object({
    email: z.string().email({ message: t("error.emailInvalid") }),
    password: z
      .string()
      .min(6, { message: t("error.passwordInvalid") })
      .max(128, { message: t("error.passwordTooLong") }),
    rememberMe: z.boolean().optional(),
  });

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
      rememberMe: false,
    },
    mode: "onChange",
  });

  // Check localStorage availability
  const isLocalStorageAvailable = () =>
    typeof window !== "undefined" && window.localStorage;

  // Set remembered email after mount
  useEffect(() => {
    if (isLocalStorageAvailable()) {
      const rememberedEmail = localStorage.getItem("rememberedEmail");
      if (rememberedEmail) {
        form.setValue("email", rememberedEmail);
        form.setValue("rememberMe", true);
      }
    }
  }, [form]);

  // Check for registration success and email verification
  useEffect(() => {
    if (searchParams.get("registered") === "true") {
      setSuccess(t("auth.registrationSuccess"));
    }
    if (searchParams.get("verified") === "true") {
      setSuccess(t("success.emailVerified") || "Your email has been verified successfully! You can now log in.");
    }
    // Check for error in URL (from NextAuth redirect)
    const errorParam = searchParams.get("error");
    if (
      errorParam === "CredentialsSignin" ||
      errorParam === "EMAIL_NOT_VERIFIED"
    ) {
      // Check if it's specifically an email not verified error
      // NextAuth doesn't pass the message, so we check the error type
      // For now, we'll show a generic error, but the backend should log the specific reason
      setError(t("error.invalidCredentials"));
    }
  }, [searchParams, t]);

  // Debounced submit handler
  const debouncedSubmit = useCallback(
    async (data: LoginFormValues) => {
      setIsLoading(true);
      setError(null);

      if (data.rememberMe && isLocalStorageAvailable()) {
        localStorage.setItem("rememberedEmail", data.email);
      } else if (isLocalStorageAvailable()) {
        localStorage.removeItem("rememberedEmail");
      }

      try {
        const response = await signIn("credentials", {
          email: data.email,
          password: data.password,
          redirect: false,
        });

        if (response?.error) {
          // Enhanced error handling
          // Check if error message contains EMAIL_NOT_VERIFIED
          const errorMessage = response.error;
          let errorText = t("error.invalidCredentials");

          if (errorMessage.includes("EMAIL_NOT_VERIFIED")) {
            errorText = t("error.emailNotVerified");
          } else {
            const errorMap: Record<string, string> = {
              CredentialsSignin: t("error.invalidCredentials"),
              RateLimit: t("error.rateLimit"),
              default: t("error.generic"),
            };
            errorText = errorMap[errorMessage] || errorMap.default;
          }

          setError(errorText);
          setIsLoading(false);
          return;
        }

        const sessionResponse = await fetch("/api/auth/session");
        if (!sessionResponse.ok) {
          throw new Error("Failed to fetch session");
        }
        const session = await sessionResponse.json();

        if (session?.user?.role === "SUPERUSER") {
          router.push("/admindashboard");
        } else {
          router.push("/dashboard");
        }
        router.refresh();
      } catch (error) {
        setError(t("error.generic"));
        setIsLoading(false);
      }
    },
    [router, t, setIsLoading, setError]
  );

  const onSubmit = (data: LoginFormValues) => {
    debounce(debouncedSubmit, 500)(data);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900 px-4 sm:px-6">
      <div className="w-full max-w-md mx-auto">
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
        <div className="bg-white dark:bg-gray-800 p-6 sm:p-8 rounded-lg shadow-md">
          <div className="text-center mb-6 sm:mb-8">
            <p className="text-base sm:text-xl text-gray-600 dark:text-gray-300">
              {t("auth.loginForm.title")}
            </p>
          </div>

          {success && (
            <Alert className="mb-4 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
              <AlertDescription className="text-green-800 dark:text-green-200">
                {success}
              </AlertDescription>
            </Alert>
          )}

          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-4 sm:space-y-6"
              aria-label={t("auth.loginForm.title")}
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
                      <Input
                        type="email"
                        {...field}
                        disabled={isLoading}
                        autoFocus
                        aria-required="true"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {t("auth.password")}
                      <RequiredIndicator />
                    </FormLabel>
                    <FormMessage />
                    <FormControl>
                      <div className="relative">
                        <Input
                          type={showPassword ? "text" : "password"}
                          {...field}
                          disabled={isLoading}
                          aria-required="true"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-2 top-1/2 transform -translate-y-1/2"
                          onClick={() => setShowPassword(!showPassword)}
                          aria-label={
                            showPassword
                              ? t("auth.hidePassword")
                              : t("auth.showPassword")
                          }
                        >
                          {showPassword ? (
                            <EyeOff size={20} />
                          ) : (
                            <Eye size={20} />
                          )}
                        </Button>
                      </div>
                    </FormControl>
                  </FormItem>
                )}
              />

              <div className="flex items-center justify-between">
                <FormField
                  control={form.control}
                  name="rememberMe"
                  render={({ field }) => (
                    <FormItem className="flex items-center space-x-2">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          disabled={isLoading}
                          className="data-[state=checked]:bg-primary data-[state=checked]:text-white"
                          aria-label={t("auth.rememberMe")}
                        />
                      </FormControl>
                      <FormLabel className="!mt-0">
                        {t("auth.rememberMe")}
                      </FormLabel>
                    </FormItem>
                  )}
                />

                <Link
                  href="/forgot-password"
                  className="text-sm font-medium text-primary hover:text-primary"
                  aria-label={t("auth.forgotPassword")}
                >
                  {t("auth.forgotPassword")}
                </Link>
              </div>

              <Button
                type="submit"
                className="w-full bg-primary hover:bg-primary/80"
                disabled={isLoading || !form.formState.isValid}
                aria-label={t("auth.loginForm.loginButton")}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t("common.statuses.loading")}
                  </>
                ) : (
                  t("auth.loginForm.loginButton")
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
                  {t("auth.loginForm.orRegister")}
                </span>
              </div>
            </div>

            <div className="mt-6">
              <Button
                variant="outline"
                onClick={() => router.push("/register")}
                className="w-full"
                disabled={isLoading}
                aria-label={t("auth.loginForm.registerButton")}
              >
                {t("auth.loginForm.registerButton")}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

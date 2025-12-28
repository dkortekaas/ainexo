"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Lock } from "lucide-react";
import { useTranslations } from "next-intl";
import { useSession } from "next-auth/react";
import { toast } from "@/components/ui/use-toast";
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Input,
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Skeleton,
} from "@/components/ui";
import { logger } from "@/lib/logger";

export default function PasswordSettings() {
  const t = useTranslations();
  const { data: session } = useSession();

  const passwordSchema = z
    .object({
      currentPassword: z
        .string()
        .min(6, { message: t("error.currentPasswordRequired") }),
      newPassword: z
        .string()
        .min(8, { message: t("error.newPasswordRequired") }),
      confirmPassword: z.string(),
    })
    .refine((data) => data.newPassword === data.confirmPassword, {
      message: t("error.passwordsDoNotMatch"),
      path: ["confirmPassword"],
    });

  type PasswordFormValues = z.infer<typeof passwordSchema>;

  const [isPasswordSaving, setIsPasswordSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center">
            <div className="rounded-full bg-blue-100 dark:bg-blue-900 p-3 mr-4">
              <Skeleton className="h-6 w-6 rounded-full" />
            </div>
            <div>
              <Skeleton className="h-6 w-48 mb-2" />
              <Skeleton className="h-4 w-64" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ))}
            </div>
            <div className="flex justify-end">
              <Skeleton className="h-10 w-32" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const onPasswordSubmit = async (data: PasswordFormValues) => {
    setIsPasswordSaving(true);

    try {
      const response = await fetch("/api/users/password", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          currentPassword: data.currentPassword,
          newPassword: data.newPassword,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        toast({
          title: t("error.errorUpdatingPassword"),
          description:
            errorData.error || t("error.errorUpdatingPasswordDescription"),
          variant: "destructive",
          duration: 3000,
        });
        logger.error("Error updating password:", {
          context: { error: errorData.error },
          userId: session?.user.id,
        });
      }

      toast({
        description: t("success.passwordUpdated"),
        variant: "success",
        duration: 3000,
      });
      form.reset();
    } catch (error) {
      logger.error("Error updating password:", {
        context: {
          error: error instanceof Error ? error.message : String(error),
        },
        userId: session?.user.id,
      });
      toast({
        title: t("error.errorUpdatingPassword"),
        description: t("error.errorUpdatingPasswordDescription"),
        variant: "destructive",
        duration: 3000,
      });
    } finally {
      setIsPasswordSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="rounded-full bg-indigo-50 dark:bg-indigo-900 p-3 mr-4">
              <Lock className="h-6 w-6 text-primary dark:text-primary" />
            </div>
            <div>
              <CardTitle>{t("settings.passwordSettings")}</CardTitle>
              <CardDescription>
                {t("settings.passwordSettingsDescription")}
              </CardDescription>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onPasswordSubmit)}
            className="space-y-6"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
              <FormField
                control={form.control}
                name="currentPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("settings.currentPassword")}</FormLabel>
                    <FormMessage />
                    <FormControl>
                      <Input
                        type="password"
                        {...field}
                        disabled={isPasswordSaving}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="newPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("settings.newPassword")}</FormLabel>
                    <FormMessage />
                    <FormControl>
                      <Input
                        type="password"
                        {...field}
                        disabled={isPasswordSaving}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("settings.confirmPassword")}</FormLabel>
                    <FormMessage />
                    <FormControl>
                      <Input
                        type="password"
                        {...field}
                        disabled={isPasswordSaving}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end">
              <Button
                type="submit"
                className="bg-primary hover:bg-primary/80"
                disabled={isPasswordSaving}
              >
                {isPasswordSaving
                  ? t("common.saving")
                  : t("common.changePassword")}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

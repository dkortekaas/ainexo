"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Input,
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  SaveButton,
} from "@/components/ui";
import { useToast } from "@/components/ui/use-toast";
import { useTranslations } from "next-intl";

export function ChangePasswordTab() {
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const t = useTranslations();

  // Zod schema for validation
  const changePasswordSchema = z
    .object({
      currentPassword: z
        .string()
        .min(1, { message: t("error.currentPasswordRequired") }),
      newPassword: z
        .string()
        .min(8, { message: t("error.passwordMinLength") })
        .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
          message: t("error.passwordComplexity"),
        }),
      confirmPassword: z
        .string()
        .min(1, { message: t("error.confirmPasswordRequired") }),
    })
    .refine((data) => data.newPassword === data.confirmPassword, {
      message: t("error.passwordsDoNotMatch"),
      path: ["confirmPassword"],
    });

  // React Hook Form setup
  const form = useForm<z.infer<typeof changePasswordSchema>>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (data: z.infer<typeof changePasswordSchema>) => {
    setIsSaving(true);

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

      if (response.ok) {
        toast({
          title: t("common.success"),
          description: t("success.passwordChanged"),
          variant: "success",
        });

        // Reset form
        form.reset();
      } else {
        const errorData = await response.json();
        toast({
          title: t("error.error"),
          description: errorData.error || t("error.errorChangingPassword"),
          variant: "destructive",
        });
      }
    } catch (err) {
      toast({
        title: t("error.error"),
        description: t("error.errorChangingPassword"),
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-md space-y-6">
      <div>
        <h2 className="text-lg font-medium text-gray-900 mb-6">
          {t("account.changePassword")}
        </h2>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="currentPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-gray-700">
                    {t("account.currentPassword")} *
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="password"
                      className="mt-1"
                      disabled={isSaving}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="newPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-gray-700">
                    {t("account.newPassword")} *
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="password"
                      className="mt-1"
                      disabled={isSaving}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-gray-700">
                    {t("account.confirmNewPassword")} *
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="password"
                      className="mt-1"
                      disabled={isSaving}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="pt-4">
              <SaveButton
                type="submit"
                disabled={isSaving}
                className="bg-primary border border-gray-300 text-white hover:bg-primary/80"
              >
                {isSaving ? t("common.saving") : t("account.changePassword")}
              </SaveButton>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}

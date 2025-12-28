"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
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

export function EmailSettingsTab() {
  const { data: session, update } = useSession();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const t = useTranslations();

  // Zod schema for validation
  const changeEmailSchema = z.object({
    newEmail: z
      .string()
      .min(1, { message: t("error.emailRequired") })
      .email({ message: t("error.invalidEmail") }),
    currentPassword: z
      .string()
      .min(1, { message: t("error.currentPasswordRequired") }),
  });

  // React Hook Form setup
  const form = useForm<z.infer<typeof changeEmailSchema>>({
    resolver: zodResolver(changeEmailSchema),
    defaultValues: {
      newEmail: "",
      currentPassword: "",
    },
  });

  // Get current email
  useEffect(() => {
    const fetchCurrentEmail = async () => {
      if (!session?.user?.id) return;

      setIsLoading(true);
      try {
        const response = await fetch("/api/users/profile");
        if (response.ok) {
          const userData = await response.json();
          if (userData.email) {
            form.setValue("newEmail", userData.email);
          }
        } else {
          toast({
            title: t("error.error"),
            description: t("error.couldNotFetchUserData"),
            variant: "destructive",
          });
        }
      } catch (err) {
        toast({
          title: t("error.error"),
          description: t("error.errorFetchingUserData"),
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchCurrentEmail();
  }, [session?.user?.id, t, toast, form]);

  const onSubmit = async (data: z.infer<typeof changeEmailSchema>) => {
    setIsSaving(true);

    try {
      const response = await fetch("/api/users/email", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          newEmail: data.newEmail,
          currentPassword: data.currentPassword,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        toast({
          title: t("common.success"),
          description: t("success.emailChanged"),
          variant: "success",
        });

        // Update session with new email
        await update({
          user: {
            ...session?.user,
            email: data.newEmail,
          },
        });

        // Reset current password field
        form.setValue("currentPassword", "");
      } else {
        const errorData = await response.json();
        toast({
          title: t("error.error"),
          description: errorData.error || t("error.errorChangingEmail"),
          variant: "destructive",
        });
      }
    } catch (err) {
      toast({
        title: t("error.error"),
        description: t("error.errorChangingEmail"),
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-md space-y-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="space-y-4">
            <div>
              <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
              <div className="h-10 bg-gray-200 rounded"></div>
            </div>
            <div>
              <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
              <div className="h-10 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md space-y-6">
      <div>
        <h2 className="text-lg font-medium text-gray-900 mb-6">
          {t("account.emailSettings")}
        </h2>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="newEmail"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-gray-700">
                    {t("account.newEmail")} *
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="email"
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

            <div className="pt-4">
              <SaveButton
                type="submit"
                disabled={isSaving}
                className="bg-primary border border-gray-300 text-white hover:bg-primary/80"
              >
                {isSaving ? t("common.saving") : t("account.changeEmail")}
              </SaveButton>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}

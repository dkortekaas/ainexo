"use client";

import { useState, useCallback } from "react";
import { Bell } from "lucide-react";
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
  Checkbox,
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { useDebouncedCallback } from "use-debounce";
import { logger } from "@/lib/logger";

const formSchema = z.object({
  emailNotifications: z.boolean(),
  declarationUpdates: z.boolean(),
  securityAlerts: z.boolean(),
});

export default function NotificationSettings() {
  const t = useTranslations();
  const { data: session } = useSession();
  const [isNotificationSaving, setIsNotificationSaving] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      emailNotifications: true,
      declarationUpdates: true,
      securityAlerts: true,
    },
  });

  const debouncedSubmit = useDebouncedCallback(
    async (values: z.infer<typeof formSchema>) => {
      setIsNotificationSaving(true);

      try {
        const response = await fetch("/api/users/notifications", {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(values),
        });

        if (!response.ok) {
          logger.error("Error saving notification preferences:", {
            userId: session?.user.id,
            context: { error: response.statusText },
          });
          toast({
            title: t("error.errorSavingPreferences"),
            description:
              t("error.errorSavingPreferencesDescription") ||
              "Failed to update notification preferences.",
            variant: "destructive",
            duration: 3000,
          });
          return;
        }

        toast({
          title: t("success.preferencesUpdated"),
          description: t("success.preferencesUpdatedDescription"),
          variant: "success",
          duration: 3000,
        });
      } catch (error) {
        logger.error("Error saving notification preferences:", {
          userId: session?.user.id,
          context: {
            error: error instanceof Error ? error.message : String(error),
          },
        });
        toast({
          title: t("error.errorSavingPreferences"),
          description:
            t("error.errorSavingPreferencesDescription") ||
            "Failed to update notification preferences.",
          variant: "destructive",
          duration: 3000,
        });
        return;
      } finally {
        setIsNotificationSaving(false);
      }
    },
    500
  );

  const onSubmit = useCallback(
    (values: z.infer<typeof formSchema>) => {
      debouncedSubmit(values);
    },
    [debouncedSubmit]
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="rounded-full bg-indigo-50 dark:bg-indigo-900 p-3 mr-4">
              <Bell className="h-6 w-6 text-primary dark:text-primary" />
            </div>
            <div>
              <CardTitle>{t("settings.notifications.title")}</CardTitle>
              <CardDescription>
                {t("settings.notifications.description")}
              </CardDescription>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="emailNotifications"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      className="data-[state=checked]:bg-primary data-[state=checked]:border-primary [&>svg]:text-white"
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>
                      {t("settings.notifications.emailNotifications")}
                    </FormLabel>
                    <FormDescription>
                      {t("settings.notifications.emailNotificationsDesc")}
                    </FormDescription>
                    <FormMessage />
                  </div>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="declarationUpdates"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      className="data-[state=checked]:bg-primary data-[state=checked]:border-primary [&>svg]:text-white"
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>
                      {t("settings.notifications.declarationUpdates")}
                    </FormLabel>
                    <FormDescription>
                      {t("settings.notifications.declarationUpdatesDesc")}
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="securityAlerts"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      className="data-[state=checked]:bg-primary data-[state=checked]:border-primary [&>svg]:text-white"
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>
                      {t("settings.notifications.securityAlerts")}
                    </FormLabel>
                    <FormDescription>
                      {t("settings.notifications.securityAlertsDesc")}
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />
            <div className="flex justify-end">
              <Button
                type="submit"
                className="bg-primary hover:bg-primary/80"
                disabled={isNotificationSaving}
              >
                {isNotificationSaving ? t("common.saving") : t("common.save")}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

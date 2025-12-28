"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslations } from "next-intl";
import { toast } from "@/components/ui/use-toast";
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui";
import { User } from "lucide-react";

export default function ProfileSettings() {
  const { data: session, update } = useSession();
  const router = useRouter();
  const t = useTranslations();

  const languages = [
    { code: "nl", name: t("languageSelector.dutch") },
    { code: "en", name: t("languageSelector.english") },
    { code: "de", name: t("languageSelector.german") },
    { code: "fr", name: t("languageSelector.french") },
    { code: "es", name: t("languageSelector.spanish") },
  ];

  const [isProfileSaving, setIsProfileSaving] = useState(false);
  const [language, setLanguage] = useState(session?.user?.language || "nl");

  const profileSchema = z.object({
    name: z.string().min(1, { message: t("error.nameRequired") }),
    email: z.string().email({ message: t("error.invalidEmail") }),
    department: z.string().optional(),
  });

  type ProfileFormValues = z.infer<typeof profileSchema>;

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: session?.user?.name || "",
      email: session?.user?.email || "",
      department: session?.user?.department || "",
    },
  });

  const onProfileSubmit = async (data: ProfileFormValues) => {
    setIsProfileSaving(true);

    try {
      const response = await fetch("/api/users/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...data,
          language: language,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || t("error.somethingWentWrong"));
      }

      await update({
        ...session,
        user: {
          ...session?.user,
          name: data.name,
          department: data.department,
          language: language,
        },
      });

      document.cookie = `NEXT_LOCALE=${language}; path=/; max-age=31536000`;
      router.refresh();

      toast({
        title: t("success.profileUpdated"),
        description: t("success.profileUpdatedDescription"),
        variant: "success",
        duration: 3000,
      });
    } catch (error) {
      console.error("Error updating profile:", error);
      toast({
        title: t("error.somethingWentWrong"),
        description:
          error instanceof Error ? error.message : t("error.unknown"),
        variant: "destructive",
      });
    } finally {
      setIsProfileSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="rounded-full bg-indigo-50 dark:bg-indigo-900 p-3 mr-4">
              <User className="h-6 w-6 text-primary dark:text-primary" />
            </div>
            <div>
              <CardTitle>{t("settings.profileSettings")}</CardTitle>
              <CardDescription>
                {t("settings.profileSettingsDescription")}
              </CardDescription>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onProfileSubmit)}
            className="space-y-6"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>{t("settings.name")}</FormLabel>
                    <FormControl>
                      <Input {...field} disabled={isProfileSaving} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>{t("settings.email")}</FormLabel>
                    <FormControl>
                      <Input {...field} disabled />
                    </FormControl>
                    <FormMessage />
                    <p className="text-xs text-muted-foreground mt-1">
                      {t("settings.emailCannotBeChanged")}
                    </p>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="department"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>{t("settings.department")}</FormLabel>
                    <FormControl>
                      <Input {...field} disabled={isProfileSaving} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormItem className="flex flex-col">
                <FormLabel>{t("settings.language")}</FormLabel>
                <Select
                  value={language}
                  onValueChange={setLanguage}
                  disabled={isProfileSaving}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={t("settings.selectLanguage")} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {languages.map((lang) => (
                      <SelectItem key={lang.code} value={lang.code}>
                        {lang.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">
                  {t("settings.languageDescription")}
                </p>
              </FormItem>
            </div>

            <div className="flex justify-end">
              <Button
                type="submit"
                className="bg-primary hover:bg-primary/80"
                disabled={isProfileSaving}
              >
                {isProfileSaving ? t("common.saving") : t("common.saveChanges")}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

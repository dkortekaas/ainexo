"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { ColorPicker } from "@/components/assistant/ColorPicker";
import { useToast } from "@/components/ui/use-toast";

const createSettingsSchema = (t: any) =>
  z.object({
    name: z.string().min(1, t("assistant.nameRequired")),
    welcomeMessage: z.string().min(1, t("assistant.welcomeMessageRequired")),
    placeholderText: z.string().min(1, t("assistant.placeholderRequired")),
    primaryColor: z
      .string()
      .regex(/^#[0-9A-F]{6}$/i, t("assistant.invalidColor")),
    secondaryColor: z
      .string()
      .regex(/^#[0-9A-F]{6}$/i, t("assistant.invalidColor")),
    tone: z.enum(["professional", "friendly", "casual"]),
    temperature: z.number().min(0).max(1),
    maxResponseLength: z.number().min(100).max(2000),
    fallbackMessage: z.string().min(1),
  });

type SettingsFormData = z.infer<ReturnType<typeof createSettingsSchema>>;

export function SettingsForm({
  initialData,
}: {
  initialData: SettingsFormData;
}) {
  const t = useTranslations();
  const { toast } = useToast();
  const settingsSchema = createSettingsSchema(t);
  const form = useForm<SettingsFormData>({
    resolver: zodResolver(settingsSchema),
    defaultValues: initialData,
  });

  const onSubmit = async (data: SettingsFormData) => {
    try {
      const response = await fetch("/api/chatbot/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) throw new Error("Failed to save");

      toast({
        title: t("common.success"),
        description: t("assistant.settingsSaved"),
      });
    } catch (error) {
      console.error("Error saving settings:", error);
      toast({
        title: t("common.error"),
        description: t("assistant.settingsSaveFailed"),
        variant: "destructive",
      });
    }
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      {/* Basis instellingen */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">{t("assistant.basicSettings")}</h3>

        <div>
          <label className="text-sm font-medium">
            {t("assistant.botName")}
          </label>
          <Input {...form.register("name")} />
          {form.formState.errors.name && (
            <p className="text-sm text-red-600 mt-1">
              {form.formState.errors.name.message}
            </p>
          )}
        </div>

        <div>
          <label className="text-sm font-medium">
            {t("assistant.welcomeMessage")}
          </label>
          <Textarea {...form.register("welcomeMessage")} rows={3} />
        </div>

        <div>
          <label className="text-sm font-medium">
            {t("assistant.placeholderText")}
          </label>
          <Input {...form.register("placeholderText")} />
        </div>
      </div>

      {/* Kleuren */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">{t("assistant.colors")}</h3>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium">
              {t("assistant.primaryColor")}
            </label>
            <ColorPicker
              color={form.watch("primaryColor")}
              onChange={(color) => form.setValue("primaryColor", color)}
            />
          </div>

          <div>
            <label className="text-sm font-medium">
              {t("assistant.secondaryColor")}
            </label>
            <ColorPicker
              color={form.watch("secondaryColor")}
              onChange={(color) => form.setValue("secondaryColor", color)}
            />
          </div>
        </div>
      </div>

      {/* Gedrag */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">{t("assistant.behavior")}</h3>

        <div>
          <label className="text-sm font-medium">{t("assistant.tone")}</label>
          <Select {...form.register("tone")}>
            <option value="professional">{t("assistant.professional")}</option>
            <option value="friendly">{t("assistant.friendly")}</option>
            <option value="casual">{t("assistant.casual")}</option>
          </Select>
        </div>

        <div>
          <label className="text-sm font-medium">
            {t("assistant.temperature")} ({form.watch("temperature")})
          </label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            {...form.register("temperature", { valueAsNumber: true })}
            className="w-full"
          />
          <p className="text-xs text-gray-500 mt-1">
            {t("assistant.temperatureDescription")}
          </p>
        </div>

        <div>
          <label className="text-sm font-medium">
            {t("assistant.maxResponseLength")} (
            {form.watch("maxResponseLength")})
          </label>
          <input
            type="range"
            min="100"
            max="2000"
            step="50"
            {...form.register("maxResponseLength", { valueAsNumber: true })}
            className="w-full"
          />
          <p className="text-xs text-gray-500 mt-1">
            {t("assistant.maxResponseLengthDescription")}
          </p>
        </div>

        <div>
          <label className="text-sm font-medium">
            {t("assistant.fallbackMessage")}
          </label>
          <Textarea
            {...form.register("fallbackMessage")}
            rows={2}
            placeholder={t("assistant.fallbackMessagePlaceholder")}
          />
        </div>
      </div>

      <Button type="submit" disabled={form.formState.isSubmitting}>
        {form.formState.isSubmitting
          ? t("common.saving")
          : t("assistant.saveSettings")}
      </Button>
    </form>
  );
}

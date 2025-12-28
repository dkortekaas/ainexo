"use client";

import { useEffect, useState } from "react";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Label,
  SaveButton,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Switch,
  Textarea,
} from "@/components/ui";
import { Plus, Save, Trash2 } from "lucide-react";
import { useRouter, useParams } from "next/navigation";
import { useAssistant } from "@/contexts/assistant-context";
import { useToast } from "@/components/ui/use-toast";
import { useTranslations } from "next-intl";

export interface FormField {
  id: string;
  name: string;
  type: "text" | "email" | "phone" | "textarea" | "select";
  required: boolean;
  placeholder?: string;
  options?: string[];
}

export interface ContactForm {
  id: string;
  name: string;
  description: string;
  fields: FormField[];
  enabled: boolean;
  redirectUrl?: string;
  triggers?: string[];
}

interface FormEditorProps {
  mode: "create" | "edit";
  initialForm?: ContactForm;
}

export function FormEditor({ mode, initialForm }: FormEditorProps) {
  const t = useTranslations();
  const router = useRouter();
  const params = useParams();
  const { currentAssistant } = useAssistant();
  const { toast } = useToast();
  const [form, setForm] = useState<ContactForm>(
    initialForm ?? {
      id: Date.now().toString(),
      name: mode === "create" ? t("settings.newForm") : t("settings.editForm"),
      description: "",
      fields: [],
      enabled: true,
      redirectUrl: "",
      triggers: [],
    }
  );
  const [triggerInput, setTriggerInput] = useState("");

  useEffect(() => {
    if (mode === "edit" && !initialForm) {
      const id = params?.id as string | undefined;
      if (!id) return;
      (async () => {
        try {
          const res = await fetch(`/api/forms/${id}`);
          if (res.ok) {
            const data = await res.json();
            setForm(data);
          } else {
            toast({
              title: t("common.error"),
              description: t("settings.formNotFound"),
              variant: "destructive",
            });
          }
        } catch (e) {
          console.error("Failed to load form", e);
          toast({
            title: t("common.error"),
            description: t("settings.loadFailed"),
            variant: "destructive",
          });
        }
      })();
    }
  }, [mode, initialForm, params, toast, t]);

  const handleAddField = () => {
    const newField: FormField = {
      id: Date.now().toString(),
      name: t("settings.newField"),
      type: "text",
      required: false,
      placeholder: t("settings.enterValue"),
    };
    setForm({
      ...form,
      fields: [...form.fields, newField],
    });
  };

  const handleRemoveField = (fieldId: string) => {
    setForm({
      ...form,
      fields: form.fields.filter((f) => f.id !== fieldId),
    });
  };

  const handleUpdateField = (fieldId: string, updates: Partial<FormField>) => {
    setForm({
      ...form,
      fields: form.fields.map((f) =>
        f.id === fieldId ? { ...f, ...updates } : f
      ),
    });
  };

  const handleSave = async () => {
    if (!currentAssistant?.id) return;
    try {
      const normalizedRedirect =
        form.redirectUrl && form.redirectUrl.trim().length > 0
          ? form.redirectUrl.trim()
          : undefined;
      if (mode === "create") {
        await fetch("/api/forms", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            assistantId: currentAssistant.id,
            name: form.name,
            description: form.description,
            enabled: form.enabled,
            ...(normalizedRedirect ? { redirectUrl: normalizedRedirect } : {}),
            fields: form.fields,
            triggers: form.triggers || [],
          }),
        });
        toast({
          title: t("settings.created"),
          description: t("settings.formCreated"),
        });
      } else {
        await fetch(`/api/forms/${form.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: form.name,
            description: form.description,
            enabled: form.enabled,
            ...(normalizedRedirect !== undefined
              ? { redirectUrl: normalizedRedirect }
              : {}),
            fields: form.fields,
            triggers: form.triggers || [],
          }),
        });
        toast({
          title: t("settings.saved"),
          description: t("settings.formUpdated"),
        });
      }
      router.push("/settings?tab=forms");
    } catch (e) {
      console.error("Failed to save form", e);
      toast({
        title: t("common.error"),
        description: t("settings.saveFailed"),
        variant: "destructive",
      });
    }
  };

  const handleCancel = () => {
    router.push("/settings?tab=forms");
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>
            {mode === "create"
              ? t("settings.createForm")
              : t("settings.editForm", { name: form.name })}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="form-name">{t("settings.formName")}</Label>
              <Input
                id="form-name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="redirect-url">{t("settings.redirectUrl")}</Label>
              <Input
                id="redirect-url"
                value={form.redirectUrl || ""}
                onChange={(e) =>
                  setForm({ ...form, redirectUrl: e.target.value })
                }
                placeholder="https://example.com/thank-you"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="form-description">
              {t("settings.description")}
            </Label>
            <Textarea
              id="form-description"
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              placeholder={t("settings.describeThePurposeOfThisForm")}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="triggers">Triggers (trefwoorden)</Label>
            <p className="text-sm text-gray-500">
              Voeg trefwoorden toe die dit formulier activeren in de chat.
              Bijvoorbeeld: &quot;contact&quot;, &quot;offerte&quot;,
              &quot;demo&quot;
            </p>
            <div className="flex gap-2">
              <Input
                id="triggers"
                value={triggerInput}
                onChange={(e) => setTriggerInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === "Enter" && triggerInput.trim()) {
                    e.preventDefault();
                    setForm({
                      ...form,
                      triggers: [...(form.triggers || []), triggerInput.trim()],
                    });
                    setTriggerInput("");
                  }
                }}
                placeholder="Voeg een trigger toe en druk op Enter"
              />
              <Button
                type="button"
                onClick={() => {
                  if (triggerInput.trim()) {
                    setForm({
                      ...form,
                      triggers: [...(form.triggers || []), triggerInput.trim()],
                    });
                    setTriggerInput("");
                  }
                }}
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {(form.triggers || []).map((trigger, index) => (
                <div
                  key={index}
                  className="inline-flex items-center gap-1 px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm"
                >
                  <span>{trigger}</span>
                  <button
                    type="button"
                    onClick={() => {
                      setForm({
                        ...form,
                        triggers: (form.triggers || []).filter(
                          (_, i) => i !== index
                        ),
                      });
                    }}
                    className="hover:text-indigo-900"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">{t("settings.formFields")}</h4>
              <Button onClick={handleAddField} size="sm">
                <Plus className="w-4 h-4 mr-2" />
                {t("settings.addField")}
              </Button>
            </div>

            <div className="space-y-3">
              {form.fields.map((field) => (
                <div key={field.id} className="p-4 border rounded-lg space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="space-y-2">
                      <Label>{t("settings.fieldName")}</Label>
                      <Input
                        value={field.name}
                        onChange={(e) =>
                          handleUpdateField(field.id, { name: e.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>{t("settings.fieldType")}</Label>
                      <Select
                        value={field.type}
                        onValueChange={(value: FormField["type"]) =>
                          handleUpdateField(field.id, { type: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="text">
                            {t("settings.text")}
                          </SelectItem>
                          <SelectItem value="email">
                            {t("settings.email")}
                          </SelectItem>
                          <SelectItem value="phone">
                            {t("settings.phone")}
                          </SelectItem>
                          <SelectItem value="textarea">
                            {t("settings.textarea")}
                          </SelectItem>
                          <SelectItem value="select">
                            {t("settings.select")}
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>{t("settings.placeholder")}</Label>
                      <Input
                        value={field.placeholder || ""}
                        onChange={(e) =>
                          handleUpdateField(field.id, {
                            placeholder: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={field.required}
                        onCheckedChange={(checked) =>
                          handleUpdateField(field.id, { required: checked })
                        }
                        className="data-[state=checked]:bg-primary"
                      />
                      <Label>{t("settings.requiredField")}</Label>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRemoveField(field.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={handleCancel}>
              {t("common.cancel")}
            </Button>
            <SaveButton
              onClick={handleSave}
              icon={<Save className="w-4 h-4 mr-2" />}
            >
              {mode === "create"
                ? t("settings.createForm")
                : t("settings.saveForm")}
            </SaveButton>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

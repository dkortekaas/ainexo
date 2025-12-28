"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Switch,
} from "@/components/ui";
import { Plus, Trash2, FileText } from "lucide-react";
import { DeleteConfirmationModal } from "@/components/shared/DeleteConfirmationModal";
import { useAssistant } from "@/contexts/assistant-context";
import { useToast } from "@/components/ui/use-toast";
import { useTranslations } from "next-intl";
import { ContactForm } from "@/types/form";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface FormsTabProps {
  onChanges: (hasChanges: boolean) => void;
}

// Loaded from API
export function FormsTab({ onChanges }: FormsTabProps) {
  const router = useRouter();
  const { currentAssistant } = useAssistant();
  const { toast } = useToast();
  const [forms, setForms] = useState<ContactForm[]>([]);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [formToDelete, setFormToDelete] = useState<ContactForm | null>(null);
  const [submissionsModalOpen, setSubmissionsModalOpen] = useState(false);
  const [selectedFormId, setSelectedFormId] = useState<string | null>(null);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loadingSubmissions, setLoadingSubmissions] = useState(false);
  const t = useTranslations();
  // const [isLoading, setIsLoading] = useState(false)

  const fetchForms = async () => {
    if (!currentAssistant?.id) return;
    try {
      // setIsLoading(true)
      const res = await fetch(`/api/forms?assistantId=${currentAssistant.id}`);
      if (res.ok) {
        const response = await res.json();
        // API returns paginated response with { data: [...], meta: {...} }
        setForms(response.data || []);
      } else {
        toast({
          title: t("common.error"),
          description: t("error.failedToLoadForms"),
          variant: "destructive",
        });
      }
    } catch (e) {
      console.error("Failed to fetch forms", e);
      toast({
        title: t("common.error"),
        description: t("error.failedToLoadForms"),
        variant: "destructive",
      });
    } finally {
      // setIsLoading(false)
    }
  };

  useEffect(() => {
    fetchForms();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentAssistant?.id]);

  const handleToggleForm = async (id: string) => {
    const target = forms.find((f) => f.id === id);
    if (!target) return;
    const updated = { ...target, enabled: !target.enabled };
    setForms(forms.map((f) => (f.id === id ? updated : f)));
    try {
      await fetch(`/api/forms/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: updated.enabled }),
      });
      onChanges(true);
      toast({
        title: t("common.success"),
        description: t("success.formUpdated"),
      });
    } catch (e) {
      console.error("Failed to toggle form", e);
      // revert
      setForms(forms);
      toast({
        title: t("common.error"),
        description: t("error.failedToUpdateForm"),
        variant: "destructive",
      });
    }
  };

  const handleDeleteForm = (form: ContactForm) => {
    setFormToDelete(form);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!formToDelete) return;
    try {
      await fetch(`/api/forms/${formToDelete.id}`, { method: "DELETE" });
      setForms(forms.filter((form) => form.id !== formToDelete.id));
      onChanges(true);
      toast({
        title: t("common.success"),
        description: t("success.formDeleted"),
      });
    } catch (e) {
      console.error("Failed to delete form", e);
      toast({
        title: t("common.error"),
        description: t("error.failedToDeleteForm"),
        variant: "destructive",
      });
    } finally {
      setIsDeleteModalOpen(false);
      setFormToDelete(null);
    }
  };

  const handleDeleteModalClose = () => {
    setIsDeleteModalOpen(false);
    setFormToDelete(null);
  };

  const handleEditForm = (form: ContactForm) => {
    router.push(`/settings/forms/${form.id}/edit`);
  };

  const handleViewSubmissions = async (formId: string) => {
    setSelectedFormId(formId);
    setSubmissionsModalOpen(true);
    setLoadingSubmissions(true);

    try {
      const res = await fetch(`/api/forms/${formId}/submissions`);
      if (res.ok) {
        const data = await res.json();
        setSubmissions(data.submissions || []);
      } else {
        toast({
          title: t("common.error"),
          description: t("error.failedToLoadSubmissions"),
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Failed to load submissions:", error);
      toast({
        title: t("common.error"),
        description: t("error.failedToLoadSubmissions"),
        variant: "destructive",
      });
    } finally {
      setLoadingSubmissions(false);
    }
  };

  // Inline editor handlers removed; editing happens on dedicated pages

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium text-gray-900">
            {t("settings.contactForms")}
          </h3>
          <p className="text-sm text-gray-600">
            {t("settings.contactFormsDescription")}
          </p>
        </div>
        <Button
          onClick={() => router.push("/settings/forms/new")}
          className="bg-primary hover:bg-primary/80"
        >
          <Plus className="w-4 h-4 mr-2" />
          {t("common.add")}
        </Button>
      </div>

      {/* Forms List */}
      <div className="grid gap-4">
        {forms.map((form) => (
          <Card key={form.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">{form.name}</CardTitle>
                  <CardDescription>{form.description}</CardDescription>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={form.enabled}
                    onCheckedChange={() => handleToggleForm(form.id)}
                    className="data-[state=checked]:bg-primary"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleViewSubmissions(form.id)}
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    {t("settings.submissions")}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditForm(form)}
                  >
                    {t("common.edit")}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteForm(form)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <h4 className="font-medium text-sm text-gray-700">
                  {t("settings.formFields")}:
                </h4>
                <div className="flex flex-wrap gap-2">
                  {form.fields.map((field) => (
                    <span
                      key={field.id}
                      className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-sm"
                    >
                      {field.name} ({field.type})
                      {field.required && (
                        <span className="text-red-500 ml-1">*</span>
                      )}
                    </span>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Editor moved to dedicated pages */}

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={handleDeleteModalClose}
        onConfirm={handleConfirmDelete}
        title={t("settings.deleteForm")}
        description={t("settings.deleteFormDescription")}
        itemName={formToDelete?.name || ""}
        isLoading={false}
      />

      {/* Submissions Modal */}
      <Dialog
        open={submissionsModalOpen}
        onOpenChange={setSubmissionsModalOpen}
      >
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t("settings.formSubmissions")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {loadingSubmissions ? (
              <p className="text-center py-4 text-gray-500">
                {t("common.loading")}
              </p>
            ) : submissions.length === 0 ? (
              <p className="text-center py-4 text-gray-500">
                {t("settings.noSubmissionsFound")}
              </p>
            ) : (
              <div className="space-y-4">
                {submissions.map((submission) => (
                  <Card key={submission.id}>
                    <CardHeader>
                      <CardTitle className="text-sm">
                        {new Date(submission.createdAt).toLocaleString("nl-NL")}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {Object.entries(
                          submission.data as Record<string, string>
                        ).map(([key, value]) => (
                          <div key={key} className="flex gap-2">
                            <span className="font-medium text-sm">{key}:</span>
                            <span className="text-sm text-gray-700">
                              {value}
                            </span>
                          </div>
                        ))}
                        {submission.ipAddress && (
                          <div className="text-xs text-gray-500 mt-2">
                            IP: {submission.ipAddress}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

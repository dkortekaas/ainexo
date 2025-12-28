"use client";

import { useState, useEffect } from "react";
import { useCallback } from "react";
import {
  Button,
  Card,
  CardContent,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  SaveButton,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui";
import { Plus, Edit, Trash2, Loader2 } from "lucide-react";
import { useAssistant } from "@/contexts/assistant-context";
import { useToast } from "@/components/ui/use-toast";
import { useTranslations } from "next-intl";

interface ActionButtonsTabProps {
  onChanges: (hasChanges: boolean) => void;
}

interface ActionButton {
  id: string;
  buttonText: string;
  question: string;
  priority: number;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export function ActionButtonsTab({ onChanges }: ActionButtonsTabProps) {
  const [buttons, setButtons] = useState<ActionButton[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingButton, setEditingButton] = useState<ActionButton | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [formData, setFormData] = useState({
    buttonText: "",
    question: "",
    priority: 50,
    enabled: true,
  });
  const t = useTranslations();

  const { currentAssistant } = useAssistant();
  const { toast } = useToast();

  // Fetch action buttons on component mount
  const fetchActionButtons = useCallback(async () => {
    if (!currentAssistant?.id) return;

    try {
      setIsLoading(true);
      const response = await fetch(
        `/api/action-buttons?assistantId=${currentAssistant.id}`
      );
      if (response.ok) {
        const data = await response.json();
        setButtons(data);
      } else {
        toast({
          title: t("common.error"),
          description: t("error.failedToFetchActionButtons"),
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error fetching action buttons:", error);
      toast({
        title: t("common.error"),
        description: t("error.failedToFetchActionButtons"),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [currentAssistant?.id, toast, t]);

  useEffect(() => {
    if (currentAssistant?.id) {
      fetchActionButtons();
    }
  }, [currentAssistant?.id, fetchActionButtons, t]);

  const handleAddButton = () => {
    setEditingButton(null);
    setFormData({
      buttonText: "",
      question: "",
      priority: 50,
      enabled: true,
    });
    setIsDialogOpen(true);
  };

  const handleEditButton = (button: ActionButton) => {
    setEditingButton(button);
    setFormData({
      buttonText: button.buttonText,
      question: button.question,
      priority: button.priority,
      enabled: button.enabled,
    });
    setIsDialogOpen(true);
  };

  const handleSaveButton = async () => {
    if (!currentAssistant?.id) return;

    setIsSaving(true);
    try {
      const url = editingButton
        ? `/api/action-buttons/${editingButton.id}`
        : "/api/action-buttons";

      const method = editingButton ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...(editingButton ? {} : { assistantId: currentAssistant.id }),
          ...formData,
        }),
      });

      if (response.ok) {
        toast({
          title: t("common.success"),
          description: t("success.actionButton", {
            action: editingButton ? "updated" : "created",
          }),
        });
        setIsDialogOpen(false);
        fetchActionButtons(); // Refresh the list
        onChanges(true);
      } else {
        const error = await response.json();
        toast({
          title: t("common.error"),
          description:
            error.error ||
            t("error.failedToSaveActionButton", {
              action: editingButton ? "update" : "create",
            }),
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error saving action button:", error);
      toast({
        title: t("common.error"),
        description: t("error.failedToSaveActionButton", {
          action: editingButton ? "update" : "create",
        }),
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteButton = (id: string) => {
    setDeletingId(id);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deletingId) return;
    try {
      setIsDeleting(true);
      const response = await fetch(`/api/action-buttons/${deletingId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast({
          title: t("common.success"),
          description: t("success.actionButtonDeleted"),
        });
        setIsDeleteDialogOpen(false);
        setDeletingId(null);
        fetchActionButtons();
        onChanges(true);
      } else {
        const error = await response.json();
        toast({
          title: t("common.error"),
          description: error.error || t("error.failedToDeleteActionButton"),
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error deleting action button:", error);
      toast({
        title: t("common.error"),
        description: t("error.failedToDeleteActionButton"),
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleToggleEnabled = async (id: string) => {
    const button = buttons.find((btn) => btn.id === id);
    if (!button) return;

    try {
      const response = await fetch(`/api/action-buttons/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          enabled: !button.enabled,
        }),
      });

      if (response.ok) {
        toast({
          title: t("common.success"),
          description: t("success.actionButtonUpdated"),
        });
        fetchActionButtons(); // Refresh the list
        onChanges(true);
      } else {
        const error = await response.json();
        toast({
          title: t("common.error"),
          description: error.error || t("error.failedToUpdateActionButton"),
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error updating action button:", error);
      toast({
        title: t("common.error"),
        description: t("error.failedToUpdateActionButton"),
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin" />
        <span className="ml-2">{t("common.statuses.loading")}</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium text-gray-900">
            {t("settings.actionButtons")}
          </h3>
          <p className="text-sm text-gray-600">
            {t("settings.actionButtonsDescription")}
          </p>
        </div>
        <Button
          onClick={handleAddButton}
          className="bg-primary hover:bg-primary/80"
        >
          <Plus className="w-4 h-4 mr-2" />
          {t("common.add")}
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {buttons.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">{t("settings.noActionButtons")}</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("settings.button")}</TableHead>
                  <TableHead>{t("settings.question")}</TableHead>
                  <TableHead className="cursor-pointer">
                    {t("settings.priority")}
                    <span className="ml-1">▼</span>
                  </TableHead>
                  <TableHead className="cursor-pointer">
                    {t("common.enabled")}
                    <span className="ml-1">▼</span>
                  </TableHead>
                  <TableHead>{t("common.actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {buttons.map((button) => (
                  <TableRow key={button.id}>
                    <TableCell className="font-medium">
                      {button.buttonText}
                    </TableCell>
                    <TableCell>{button.question}</TableCell>
                    <TableCell>{button.priority}</TableCell>
                    <TableCell>
                      <Switch
                        checked={button.enabled}
                        onCheckedChange={() => handleToggleEnabled(button.id)}
                        className="data-[state=checked]:bg-primary"
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditButton(button)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteButton(button.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Edit/Add Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingButton
                ? t("settings.editActionButton")
                : t("settings.addActionButton")}
            </DialogTitle>
            <DialogDescription>
              {t("settings.actionButtonSettings")}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="button-text">{t("settings.buttonText")} *</Label>
              <Input
                id="button-text"
                value={formData.buttonText}
                onChange={(e) =>
                  setFormData({ ...formData, buttonText: e.target.value })
                }
                placeholder={t("settings.enterButtonText")}
                disabled={isSaving}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="question">{t("settings.question")} *</Label>
              <Input
                id="question"
                value={formData.question}
                onChange={(e) =>
                  setFormData({ ...formData, question: e.target.value })
                }
                placeholder={t("settings.enterAssociatedQuestion")}
                disabled={isSaving}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="priority">{t("settings.priority")}</Label>
              <Input
                id="priority"
                type="number"
                min="1"
                max="100"
                value={formData.priority}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    priority: parseInt(e.target.value) || 50,
                  })
                }
                placeholder={t("settings.enterPriority")}
                disabled={isSaving}
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="enabled"
                checked={formData.enabled}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, enabled: checked })
                }
                className="data-[state=checked]:bg-primary"
                disabled={isSaving}
              />
              <Label htmlFor="enabled">{t("common.enabled")}</Label>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
              disabled={isSaving}
            >
              {t("common.cancel")}
            </Button>
            <SaveButton
              onClick={handleSaveButton}
              isLoading={isSaving}
              disabled={
                !formData.buttonText.trim() || !formData.question.trim()
              }
            />
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("settings.deleteActionButton")}</DialogTitle>
            <DialogDescription>
              {t("settings.deleteActionButtonDescription")}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsDeleteDialogOpen(false);
                setDeletingId(null);
              }}
              disabled={isDeleting}
            >
              {t("common.cancel")}
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
              className="bg-red-600 hover:bg-red-700"
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {t("common.deleting")}
                </>
              ) : (
                t("common.delete")
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

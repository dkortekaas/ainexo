"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslations } from "next-intl";
import { toast } from "@/components/ui/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { TeamMember } from "@/types/account";

interface EditMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  member: TeamMember | null;
  onSuccess: () => void;
}

export function EditMemberModal({
  isOpen,
  onClose,
  member,
  onSuccess,
}: EditMemberModalProps) {
  const t = useTranslations();
  const [isSaving, setIsSaving] = useState(false);

  const editMemberSchema = z.object({
    role: z.enum(["USER", "ADMIN", "SUPERUSER"], {
      required_error: t("error.roleRequired"),
    }),
    isActive: z.boolean(),
  });

  const form = useForm<z.infer<typeof editMemberSchema>>({
    resolver: zodResolver(editMemberSchema),
    defaultValues: {
      role: "USER",
      isActive: true,
    },
  });

  useEffect(() => {
    if (member) {
      form.setValue("role", member.role as "USER" | "ADMIN" | "SUPERUSER");
      form.setValue("isActive", member.isActive);
    }
  }, [member, form]);

  const onSubmit = async (data: z.infer<typeof editMemberSchema>) => {
    if (!member) return;

    setIsSaving(true);

    try {
      const response = await fetch(`/api/team/members/${member.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        toast({
          title: t("common.success"),
          description: t("account.team.memberUpdated"),
          variant: "success",
        });
        onSuccess();
        onClose();
      } else {
        const errorData = await response.json();
        toast({
          title: t("error.error"),
          description: errorData.error || t("error.errorUpdatingMember"),
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: t("error.error"),
        description: t("error.errorUpdatingMember"),
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (!member) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{t("account.team.editMember")}</DialogTitle>
          <DialogDescription>
            {t("account.team.editMemberDescription", { name: member.name })}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700">
                  {t("common.email")}
                </label>
                <div className="mt-1 text-sm text-gray-900 bg-gray-50 p-2 rounded border">
                  {member.email}
                </div>
              </div>

              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("common.role")} *</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t("common.selectRole")} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="USER">
                          {t("common.roles.user")}
                        </SelectItem>
                        <SelectItem value="ADMIN">
                          {t("common.roles.admin")}
                        </SelectItem>
                        <SelectItem value="SUPERUSER">
                          {t("common.roles.superuser")}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">
                        {t("common.statuses.active")}
                      </FormLabel>
                      <div className="text-sm text-gray-500">
                        {t("account.team.activeDescription")}
                      </div>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isSaving}
              >
                {t("common.cancel")}
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? t("common.saving") : t("common.save")}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

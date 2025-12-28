"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { toast } from "@/components/ui/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import { logger } from "@/lib/logger";

interface InviteTeamMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function InviteTeamMemberModal({
  isOpen,
  onClose,
}: InviteTeamMemberModalProps) {
  const t = useTranslations();

  const inviteSchema = z.object({
    email: z.string().email(t("error.invalidEmail")),
    role: z.enum(["USER", "ADMIN"]),
  });
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof inviteSchema>>({
    resolver: zodResolver(inviteSchema),
    defaultValues: {
      email: "",
      role: "USER",
    },
  });

  const setupCompany = async () => {
    try {
      const response = await fetch("/api/team/setup-company", {
        method: "POST",
      });
      if (!response.ok) {
        throw new Error("Failed to setup company");
      }
      return true;
    } catch (error) {
      logger.error("Error setting up company:", {
        context: {
          error: error instanceof Error ? error.message : String(error),
        },
      });
      return false;
    }
  };

  const onSubmit = async (values: z.infer<typeof inviteSchema>) => {
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/invitations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        const errorData = await response.json();

        if (
          response.status === 400 &&
          errorData.error === "User not associated with a company"
        ) {
          // Try to setup company and retry
          const setupSuccess = await setupCompany();
          if (setupSuccess) {
            const retryResponse = await fetch("/api/invitations", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify(values),
            });

            if (!retryResponse.ok) {
              const retryErrorData = await retryResponse.json();
              throw new Error(
                retryErrorData.error || "Failed to send invitation"
              );
            }
          } else {
            throw new Error("Failed to setup company");
          }
        } else {
          throw new Error(errorData.error || "Failed to send invitation");
        }
      }

      toast({
        title: t("account.invitationSent"),
        description: t("account.invitationSentDescription", {
          email: values.email,
        }),
        variant: "success",
        duration: 5000,
      });

      form.reset();
      onClose();
      router.refresh();
    } catch (error) {
      logger.error("Error sending invitation:", {
        context: {
          error: error instanceof Error ? error.message : String(error),
        },
      });
      toast({
        title: t("error.unknownError"),
        variant: "destructive",
        description:
          error instanceof Error ? error.message : t("error.unknownError"),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{t("account.inviteMember")}</DialogTitle>
          <DialogDescription>
            {t("account.inviteMemberDescription")}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("common.email")} *</FormLabel>
                  <FormControl>
                    <Input type="email" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

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
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="USER">
                        {t("common.roles.user")}
                      </SelectItem>
                      <SelectItem value="ADMIN">
                        {t("common.roles.admin")}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isSubmitting}
              >
                {t("common.cancel")}
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-primary hover:bg-primary/80"
              >
                {isSubmitting
                  ? t("common.sending")
                  : t("account.sendInvitation")}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

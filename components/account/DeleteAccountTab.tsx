"use client";

import { useState } from "react";
import { useSession, signOut } from "next-auth/react";
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
  Button,
} from "@/components/ui";
import { useToast } from "@/components/ui/use-toast";
import { useTranslations } from "next-intl";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { AlertTriangle } from "lucide-react";

export function DeleteAccountTab() {
  const { data: session } = useSession();
  const { toast } = useToast();
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const t = useTranslations();

  // Zod schema for validation
  const deleteAccountSchema = z.object({
    confirmation: z
      .string()
      .min(1, { message: t("account.deleteAccount.confirmationRequired") })
      .refine((val) => val === "DELETE", {
        message: t("account.deleteAccount.confirmationMustBeDelete"),
      }),
    reason: z.string().optional(),
  });

  // Type for form input (allows empty string)
  type DeleteAccountFormInput = {
    confirmation: string;
    reason?: string;
  };

  // Type for validated form output (confirmation must be "DELETE")
  type DeleteAccountFormOutput = {
    confirmation: "DELETE";
    reason?: string;
  };

  // React Hook Form setup
  const form = useForm<DeleteAccountFormInput, any, DeleteAccountFormOutput>({
    resolver: zodResolver(deleteAccountSchema),
    defaultValues: {
      confirmation: "",
      reason: "",
    },
  });

  const onSubmit = async (data: DeleteAccountFormOutput) => {
    if (!session?.user?.id) return;

    setIsDeleting(true);

    try {
      const response = await fetch(
        `/api/users/${session.user.id}/delete-account`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            confirmation: data.confirmation,
            reason: data.reason || undefined,
          }),
        }
      );

      if (response.ok) {
        toast({
          title: t("common.success"),
          description: t("account.deleteAccount.accountDeletedSuccess"),
          variant: "success",
        });

        // Sign out and redirect to home page
        setTimeout(() => {
          signOut({ callbackUrl: "/" });
        }, 2000);
      } else {
        const errorData = await response.json();
        toast({
          title: t("error.error"),
          description:
            errorData.error || t("account.deleteAccount.errorDeletingAccount"),
          variant: "destructive",
        });
        setIsDeleting(false);
      }
    } catch (err) {
      toast({
        title: t("error.error"),
        description: t("account.deleteAccount.errorDeletingAccount"),
        variant: "destructive",
      });
      setIsDeleting(false);
    }
  };

  return (
    <div className="max-w-2xl space-y-6">
      <div className="border-l-4 border-red-500 bg-red-50 p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <AlertTriangle className="h-5 w-5 text-red-500" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">
              {t("account.deleteAccount.warning")}
            </h3>
            <div className="mt-2 text-sm text-red-700">
              <p>{t("account.deleteAccount.warningDescription")}</p>
            </div>
          </div>
        </div>
      </div>

      <div>
        <h2 className="text-lg font-medium text-gray-900 mb-4">
          {t("account.deleteAccount.title")}
        </h2>
        <p className="text-sm text-gray-600 mb-6">
          {t("account.deleteAccount.description")}
        </p>

        <div className="bg-gray-50 p-4 rounded-md mb-6">
          <h3 className="text-sm font-medium text-gray-900 mb-2">
            {t("account.deleteAccount.whatWillBeDeleted")}
          </h3>
          <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
            <li>{t("account.deleteAccount.deletedItems.profile")}</li>
            <li>{t("account.deleteAccount.deletedItems.assistants")}</li>
            <li>{t("account.deleteAccount.deletedItems.conversations")}</li>
            <li>{t("account.deleteAccount.deletedItems.settings")}</li>
            <li>{t("account.deleteAccount.deletedItems.subscription")}</li>
          </ul>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-gray-700">
                    {t("account.deleteAccount.reason")} ({t("common.optional")})
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="text"
                      placeholder={t("account.deleteAccount.reasonPlaceholder")}
                      className="mt-1"
                      disabled={isDeleting}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="confirmation"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-gray-700">
                    {t("account.deleteAccount.confirmationLabel")} *
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="text"
                      placeholder="DELETE"
                      className="mt-1 font-mono"
                      disabled={isDeleting}
                    />
                  </FormControl>
                  <p className="text-xs text-gray-500 mt-1">
                    {t("account.deleteAccount.confirmationHint")}
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="pt-4">
              <AlertDialog
                open={showConfirmDialog}
                onOpenChange={setShowConfirmDialog}
              >
                <AlertDialogTrigger asChild>
                  <Button
                    type="button"
                    variant="destructive"
                    disabled={isDeleting || !form.formState.isValid}
                    onClick={() => {
                      // Validate form before showing dialog
                      form.trigger().then((isValid) => {
                        if (isValid) {
                          setShowConfirmDialog(true);
                        }
                      });
                    }}
                  >
                    {isDeleting
                      ? t("account.deleteAccount.deleting")
                      : t("account.deleteAccount.deleteButton")}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-red-500" />
                      {t("account.deleteAccount.finalConfirmation")}
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      {t("account.deleteAccount.finalConfirmationDescription")}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel disabled={isDeleting}>
                      {t("common.cancel")}
                    </AlertDialogCancel>
                    <AlertDialogAction
                      onClick={(e) => {
                        e.preventDefault();
                        form.handleSubmit(onSubmit)();
                        setShowConfirmDialog(false);
                      }}
                      disabled={isDeleting}
                      className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
                    >
                      {t("account.deleteAccount.confirmDelete")}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect, useRef } from "react";
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
  Button,
  Avatar,
  AvatarImage,
  AvatarFallback,
} from "@/components/ui";
import { useToast } from "@/components/ui/use-toast";
import { useTranslations } from "next-intl";
import { Camera, X } from "lucide-react";

export function PersonalDetailsTab() {
  const { data: session, update } = useSession();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const t = useTranslations();

  // Zod schema for validation
  const personalDetailsSchema = z.object({
    firstName: z
      .string()
      .min(1, { message: t("error.firstNameRequired") })
      .max(50, { message: t("error.firstNameTooLong") }),
    lastName: z
      .string()
      .max(50, { message: t("error.lastNameTooLong") })
      .optional(),
  });

  // React Hook Form setup
  const form = useForm<z.infer<typeof personalDetailsSchema>>({
    resolver: zodResolver(personalDetailsSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
    },
  });

  // Get user data
  useEffect(() => {
    const fetchUserData = async () => {
      if (!session?.user?.id) return;

      setIsLoading(true);
      try {
        const response = await fetch("/api/users/profile");
        if (response.ok) {
          const userData = await response.json();
          if (userData.name) {
            const nameParts = userData.name.split(" ");
            form.setValue("firstName", nameParts[0] || "");
            form.setValue("lastName", nameParts.slice(1).join(" ") || "");
          }
          if (userData.image) {
            setAvatarUrl(userData.image);
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

    fetchUserData();
  }, [session?.user?.id, t, toast, form]);

  const onSubmit = async (data: z.infer<typeof personalDetailsSchema>) => {
    setIsSaving(true);

    try {
      const fullName =
        `${data.firstName.trim()} ${data.lastName?.trim() || ""}`.trim();

      const response = await fetch("/api/users/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: fullName,
        }),
      });

      if (response.ok) {
        toast({
          title: t("common.success"),
          description: t("success.personalDetailsSaved"),
          variant: "success",
        });

        // Update session with new name
        await update({
          user: {
            ...session?.user,
            name: fullName,
          },
        });
      } else {
        const errorData = await response.json();
        toast({
          title: t("error.error"),
          description: errorData.error || t("error.errorSavingPersonalDetails"),
          variant: "destructive",
        });
      }
    } catch (err) {
      toast({
        title: t("error.error"),
        description: t("error.errorSavingPersonalDetails"),
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast({
        title: t("error.error"),
        description: t("error.invalidImageFile") || "Only image files are allowed",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: t("error.error"),
        description: t("error.fileTooLarge") || "File size must be less than 2MB",
        variant: "destructive",
      });
      return;
    }

    setIsUploadingAvatar(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/users/avatar", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        setAvatarUrl(result.imageUrl);

        // Update session with new image
        await update({
          user: {
            ...session?.user,
            image: result.imageUrl,
          },
        });

        toast({
          title: t("common.success"),
          description: t("success.avatarUploaded") || "Avatar uploaded successfully",
          variant: "success",
        });
      } else {
        const errorData = await response.json();
        toast({
          title: t("error.error"),
          description: errorData.error || t("error.errorUploadingAvatar") || "Failed to upload avatar",
          variant: "destructive",
        });
      }
    } catch (err) {
      toast({
        title: t("error.error"),
        description: t("error.errorUploadingAvatar") || "Failed to upload avatar",
        variant: "destructive",
      });
    } finally {
      setIsUploadingAvatar(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleRemoveAvatar = async () => {
    try {
      // Update user to remove image
      const response = await fetch("/api/users/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: session?.user?.name,
          image: null,
        }),
      });

      if (response.ok) {
        setAvatarUrl(null);
        await update({
          user: {
            ...session?.user,
            image: null,
          },
        });

        toast({
          title: t("common.success"),
          description: t("success.avatarRemoved") || "Avatar removed successfully",
          variant: "success",
        });
      }
    } catch (err) {
      toast({
        title: t("error.error"),
        description: t("error.errorRemovingAvatar") || "Failed to remove avatar",
        variant: "destructive",
      });
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

  const displayAvatarUrl = avatarUrl || session?.user?.image || null;
  const userInitials = session?.user?.name
    ? session.user.name
        .split(" ")
        .map((name) => name.charAt(0))
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "U";

  return (
    <div className="max-w-md space-y-6">
      <div>
        <h2 className="text-lg font-medium text-gray-900 mb-6">
          {t("account.personalDetails")}
        </h2>

        {/* Avatar Upload Section */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t("account.profilePicture") || "Profile Picture"}
          </label>
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Avatar className="w-20 h-20">
                {displayAvatarUrl && (
                  <AvatarImage
                    src={displayAvatarUrl}
                    alt={session?.user?.name || "Avatar"}
                  />
                )}
                <AvatarFallback className="bg-primary text-white text-xl font-medium">
                  {userInitials}
                </AvatarFallback>
              </Avatar>
              {isUploadingAvatar && (
                <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                </div>
              )}
            </div>
            <div className="flex flex-col space-y-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                className="hidden"
                id="avatar-upload"
                disabled={isUploadingAvatar}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploadingAvatar}
              >
                <Camera className="w-4 h-4 mr-2" />
                {isUploadingAvatar
                  ? t("common.uploading") || "Uploading..."
                  : t("account.changeAvatar") || "Change"}
              </Button>
              {displayAvatarUrl && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleRemoveAvatar}
                  disabled={isUploadingAvatar}
                >
                  <X className="w-4 h-4 mr-2" />
                  {t("account.removeAvatar") || "Remove"}
                </Button>
              )}
            </div>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="firstName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-gray-700">
                    {t("account.firstName")} *
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="text"
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
              name="lastName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-gray-700">
                    {t("account.lastName")}
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="text"
                      className="mt-1"
                      disabled={isSaving}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="pt-4">
              <SaveButton type="submit" disabled={isSaving}>
                {isSaving ? "Opslaan..." : t("common.save")}
              </SaveButton>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "@/components/ui/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { logger } from "@/lib/logger";

const acceptInvitationSchema = z
  .object({
    name: z.string().min(1, "Naam is verplicht"),
    password: z
      .string()
      .min(6, "Wachtwoord moet minimaal 6 karakters bevatten"),
    confirmPassword: z.string().min(6, "Bevestig wachtwoord is verplicht"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Wachtwoorden komen niet overeen",
    path: ["confirmPassword"],
  });

interface InvitationInfo {
  email: string;
  role: string;
  companyName: string;
  inviterName: string;
}

export function AcceptInvitationForm() {
  const t = useTranslations();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [invitationInfo, setInvitationInfo] = useState<InvitationInfo | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const token = searchParams.get("token");

  const form = useForm<z.infer<typeof acceptInvitationSchema>>({
    resolver: zodResolver(acceptInvitationSchema),
    defaultValues: {
      name: "",
      password: "",
      confirmPassword: "",
    },
  });

  useEffect(() => {
    if (!token) {
      setError("Geen uitnodigingstoken gevonden");
      setLoading(false);
      return;
    }

    // In a real implementation, you would fetch invitation details here
    // For now, we'll simulate the invitation info
    setInvitationInfo({
      email: "user@example.com",
      role: "USER",
      companyName: "Example Company",
      inviterName: "Admin User",
    });
    setLoading(false);
  }, [token]);

  const onSubmit = async (values: z.infer<typeof acceptInvitationSchema>) => {
    if (!token) {
      toast({
        title: "Fout",
        variant: "destructive",
        description: "Geen uitnodigingstoken gevonden",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/invitations/accept", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token,
          name: values.name,
          password: values.password,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to accept invitation");
      }

      toast({
        title: "Account aangemaakt",
        description: "Je account is succesvol aangemaakt. Je kunt nu inloggen.",
        variant: "success",
        duration: 5000,
      });

      // Redirect to login page
      router.push("/login?message=account-created");
    } catch (error) {
      logger.error("Error accepting invitation:", {
        context: {
          error: error instanceof Error ? error.message : String(error),
        },
      });
      toast({
        title: "Fout",
        variant: "destructive",
        description:
          error instanceof Error ? error.message : "Er is een fout opgetreden",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-8">
            <div className="text-gray-500">Laden...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !invitationInfo) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-red-600">Fout</CardTitle>
          <CardDescription>
            {error || "Kon uitnodiging niet laden"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => router.push("/login")} className="w-full">
            Terug naar inloggen
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Account aanmaken</CardTitle>
        <CardDescription>
          Je bent uitgenodigd door <strong>{invitationInfo.inviterName}</strong>{" "}
          om deel te nemen aan <strong>{invitationInfo.companyName}</strong> als{" "}
          <strong>{invitationInfo.role}</strong>.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="bg-gray-50 p-3 rounded-md">
              <p className="text-sm text-gray-600">
                <strong>E-mail:</strong> {invitationInfo.email}
              </p>
            </div>

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Volledige naam *</FormLabel>
                  <FormControl>
                    <Input placeholder="Je volledige naam" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Wachtwoord *</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="Kies een veilig wachtwoord"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Wachtwoord bevestigen *</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="Bevestig je wachtwoord"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-primary hover:bg-primary/80"
            >
              {isSubmitting ? "Account aanmaken..." : "Account aanmaken"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

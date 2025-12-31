"use client";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Mail } from "lucide-react";
import React, { useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { useTranslations } from "next-intl";
import config from "@/config";

const ContactPage = () => {
  const t = useTranslations("contact");

  const contactMethods = [
    {
      icon: Mail,
      title: t("email"),
      description: config.email,
      action: t("sendEmail"),
    },
    // {
    //   icon: Phone,
    //   title: t("phone"),
    //   description: t("phoneDescription"),
    //   action: t("callUs"),
    //   disabled: true,
    // },
  ];

  const Contact = () => {
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({
      name: "",
      email: "",
      company: "",
      message: "",
    });
    const [errors, setErrors] = useState({
      name: "",
      email: "",
      company: "",
      message: "",
    });

    const validateEmail = (email: string) => {
      const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return re.test(email);
    };

    const validateForm = () => {
      const newErrors = {
        name: "",
        email: "",
        company: "",
        message: "",
      };

      if (!formData.name.trim()) {
        newErrors.name = t("nameRequired");
      }

      if (!formData.email.trim()) {
        newErrors.email = t("emailRequired");
      } else if (!validateEmail(formData.email)) {
        newErrors.email = t("emailInvalid");
      }

      // Company is optional
      // if (!formData.company.trim()) {
      //   newErrors.company = t("companyRequired");
      // }

      if (!formData.message.trim()) {
        newErrors.message = t("messageRequired");
      } else if (formData.message.trim().length < 10) {
        newErrors.message = t("messageTooShort");
      }

      setErrors(newErrors);
      return !Object.values(newErrors).some((error) => error !== "");
    };

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();

      // Validate form
      if (!validateForm()) {
        return;
      }

      setIsSubmitting(true);

      try {
        const response = await fetch("/api/contact", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formData),
        });

        if (!response.ok) {
          throw new Error("Failed to submit form");
        }

        toast({
          title: t("messageSent"),
          description: t("messageSentDescription"),
          variant: "success",
        });

        // Reset form
        setFormData({ name: "", email: "", company: "", message: "" });
        setErrors({ name: "", email: "", company: "", message: "" });
      } catch (error) {
        console.error("Error submitting contact form:", error);
        toast({
          title: t("errorSending") || "Error",
          description:
            t("errorSendingDescription") ||
            "Failed to send your message. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsSubmitting(false);
      }
    };

    const handleChange = (
      e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => {
      const { name, value } = e.target;
      setFormData({ ...formData, [name]: value });
      // Clear error when user starts typing
      if (errors[name as keyof typeof errors]) {
        setErrors({ ...errors, [name]: "" });
      }
    };

    return (
      <section className="relative pt-32 pb-20 lg:pt-40 lg:pb-32 overflow-hidden">
        <div className="container max-w-2xl mx-auto px-4">
          {/* Header */}
          <div className="text-center mb-12">
            <span className="text-primary font-medium">Contact</span>
            <h1 className="text-4xl md:text-5xl font-bold mt-4 mb-6">
              {t("title")}
            </h1>
            <p className="text-muted-foreground text-lg">{t("description")}</p>
          </div>

          {/* Contact Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Input
                name="name"
                placeholder={t("namePlaceholder")}
                value={formData.name}
                onChange={handleChange}
                required
                className={`h-14 text-base ${errors.name ? 'border-red-500' : ''}`}
              />
              {errors.name && (
                <p className="text-red-500 text-sm mt-1">{errors.name}</p>
              )}
            </div>
            <div>
              <Input
                name="email"
                type="email"
                placeholder={t("emailPlaceholder")}
                value={formData.email}
                onChange={handleChange}
                required
                className={`h-14 text-base ${errors.email ? 'border-red-500' : ''}`}
              />
              {errors.email && (
                <p className="text-red-500 text-sm mt-1">{errors.email}</p>
              )}
            </div>
            <div>
              <Textarea
                name="message"
                placeholder={t("messagePlaceholder")}
                value={formData.message}
                onChange={handleChange}
                required
                rows={6}
                className={`text-base resize-none ${errors.message ? 'border-red-500' : ''}`}
              />
              {errors.message && (
                <p className="text-red-500 text-sm mt-1">{errors.message}</p>
              )}
            </div>
            <Button
              type="submit"
              size="lg"
              className="w-full h-14 text-base"
              disabled={isSubmitting}
            >
              {isSubmitting ? t("sending") : t("sendMessage")}
            </Button>
          </form>
        </div>
      </section>
    );
  };

  return <Contact />;
};
export default ContactPage;

"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { LandingPageFormField } from "@/sanity/lib/landingPage";

interface LeadFormProps {
  headline?: string;
  description?: string;
  fields?: LandingPageFormField[];
  submitButtonText?: string;
  successMessage?: string;
}

export const LeadForm = ({
  headline = "Get Started Today",
  description,
  fields = [],
  submitButtonText = "Submit",
  successMessage = "Thank you! We'll be in touch soon.",
}: LeadFormProps) => {
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // TODO: Implement actual form submission logic here
    // This could be an API call to save the lead to a database or CRM
    await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulate API call

    setIsSubmitting(false);
    setIsSuccess(true);

    // Reset form after 3 seconds
    setTimeout(() => {
      setIsSuccess(false);
      setFormData({});
    }, 3000);
  };

  if (isSuccess) {
    return (
      <div className="text-center py-16">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-6">
          <svg
            className="w-8 h-8 text-primary"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
        <p className="text-xl font-semibold text-foreground">{successMessage}</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      {headline && (
        <h2 className="font-display text-3xl font-bold text-foreground text-center mb-4">
          {headline}
        </h2>
      )}
      {description && (
        <p className="text-muted-foreground text-center mb-8">{description}</p>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {fields.map((field, index) => (
          <div key={index}>
            <label
              htmlFor={field.fieldName}
              className="block text-sm font-medium text-foreground mb-2"
            >
              {field.fieldName}
              {field.required && <span className="text-destructive ml-1">*</span>}
            </label>
            {field.fieldType === "textarea" ? (
              <Textarea
                id={field.fieldName}
                name={field.fieldName}
                placeholder={field.placeholder}
                required={field.required}
                value={formData[field.fieldName] || ""}
                onChange={handleChange}
                rows={4}
              />
            ) : (
              <Input
                id={field.fieldName}
                name={field.fieldName}
                type={field.fieldType}
                placeholder={field.placeholder}
                required={field.required}
                value={formData[field.fieldName] || ""}
                onChange={handleChange}
              />
            )}
          </div>
        ))}

        <Button
          type="submit"
          size="lg"
          className="w-full"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Submitting..." : submitButtonText}
        </Button>
      </form>
    </div>
  );
};

import { useState } from "react";
import type { Message, FormField } from "../types";
import { formatTime } from "../utils/helpers";
import { t } from "../utils/i18n";

interface FormMessageProps {
  message: Message;
  primaryColor: string;
  onSubmit: (formId: string, data: Record<string, string>) => void;
}

export function FormMessage({
  message,
  primaryColor,
  onSubmit,
}: FormMessageProps) {
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!message.formData) return null;

  const { formData } = message;

  const handleFieldChange = (fieldId: string, value: string) => {
    setFormValues((prev) => ({ ...prev, [fieldId]: value }));
    // Clear error when user starts typing
    if (errors[fieldId]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[fieldId];
        return newErrors;
      });
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    formData.fields.forEach((field) => {
      const value = formValues[field.id] || "";

      if (field.required && !value.trim()) {
        newErrors[field.id] = t("forms.required");
        return;
      }

      // Email validation
      if (field.type === "email" && value) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
          newErrors[field.id] = t("forms.email");
        }
      }

      // Phone validation (basic)
      if (field.type === "phone" && value) {
        const phoneRegex = /^[0-9\s\-\+\(\)]{10,}$/;
        if (!phoneRegex.test(value)) {
          newErrors[field.id] = t("forms.phone");
        }
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(formData.id, formValues);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderField = (field: FormField) => {
    const value = formValues[field.id] || "";
    const error = errors[field.id];

    const baseInputStyle = {
      width: "100%",
      padding: "8px 12px",
      border: `1px solid ${error ? "#ef4444" : "#d1d5db"}`,
      borderRadius: "6px",
      fontSize: "14px",
      fontFamily: "inherit",
      outline: "none",
      transition: "border-color 0.2s",
    };

    const commonProps = {
      id: field.id,
      name: field.id,
      required: field.required,
      placeholder: field.placeholder || "",
      value,
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
        handleFieldChange(field.id, e.target.value),
      style: baseInputStyle,
      onFocus: (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        e.target.style.borderColor = primaryColor;
      },
      onBlur: (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        e.target.style.borderColor = error ? "#ef4444" : "#d1d5db";
      },
    };

    switch (field.type) {
      case "textarea":
        return (
          <textarea
            {...commonProps}
            rows={3}
            style={{ ...baseInputStyle, resize: "vertical" }}
          />
        );

      case "select":
        return (
          <select {...commonProps}>
            <option value="">{t("forms.selectPlaceholder")}</option>
            {field.options?.map((option, index) => (
              <option key={index} value={option}>
                {option}
              </option>
            ))}
          </select>
        );

      default:
        return <input {...commonProps} type={field.type} />;
    }
  };

  return (
    <div className="chatbot-message chatbot-message-assistant">
      <div className="chatbot-message-bubble">
        {/* Form description */}
        {message.content && (
          <p className="chatbot-message-content" style={{ marginBottom: "12px" }}>
            {message.content}
          </p>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {formData.fields.map((field) => (
              <div key={field.id}>
                <label
                  htmlFor={field.id}
                  style={{
                    display: "block",
                    marginBottom: "4px",
                    fontSize: "13px",
                    fontWeight: 500,
                    color: "#374151",
                  }}
                >
                  {field.name}
                  {field.required && (
                    <span style={{ color: "#ef4444", marginLeft: "2px" }}>*</span>
                  )}
                </label>
                {renderField(field)}
                {errors[field.id] && (
                  <p
                    style={{
                      marginTop: "4px",
                      fontSize: "12px",
                      color: "#ef4444",
                    }}
                  >
                    {errors[field.id]}
                  </p>
                )}
              </div>
            ))}

            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                backgroundColor: isSubmitting ? "#9ca3af" : primaryColor,
                color: "white",
                padding: "10px 16px",
                border: "none",
                borderRadius: "6px",
                fontSize: "14px",
                fontWeight: 500,
                cursor: isSubmitting ? "not-allowed" : "pointer",
                transition: "opacity 0.2s",
                marginTop: "4px",
              }}
              onMouseEnter={(e) => {
                if (!isSubmitting) {
                  e.currentTarget.style.opacity = "0.9";
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.opacity = "1";
              }}
            >
              {isSubmitting ? t("forms.submitting") : t("forms.submit")}
            </button>
          </div>
        </form>
      </div>

      {/* Timestamp */}
      <span className="chatbot-message-time">
        {formatTime(message.timestamp)}
      </span>
    </div>
  );
}

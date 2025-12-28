// Improved useDeclarationForm hook implementation
// Put this in your hooks/useDeclarationForm.ts file

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslations } from "next-intl";

export interface UseDeclarationFormProps {
  initialValues?: {
    title?: string;
    amount?: string | number;
    date?: string;
    categoryItemId?: string;
    description?: string | null;
    approverId?: string | null;
  };
}

export function useDeclarationForm({
  initialValues = {},
}: UseDeclarationFormProps) {
  const t = useTranslations();

  const formSchema = z.object({
    title: z.string().min(1, { message: t("error.titleRequired") }),
    amount: z.string().refine(
      (val) => {
        const num = parseFloat(val.replace(",", "."));
        return !isNaN(num) && num > 0;
      },
      { message: t("error.amountRequired") }
    ),
    date: z.string().min(1, { message: t("error.dateRequired") }),
    categoryItemId: z.string().min(1, { message: t("error.categoryRequired") }),
    description: z.string().optional(),
    approverId: z.string().min(1, { message: t("error.approverRequired") }),
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: initialValues.title || "",
      amount:
        typeof initialValues.amount === "number"
          ? initialValues.amount.toString().replace(".", ",")
          : initialValues.amount || "",
      date: initialValues.date || "",
      categoryItemId: initialValues.categoryItemId || "",
      description: initialValues.description || "",
      approverId: initialValues.approverId || "",
    },
  });

  return form;
}

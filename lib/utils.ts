import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string, locale: string = "en-US") {
  return new Date(date).toLocaleDateString(locale, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function formatCurrency(
  amount: number,
  locale: string = "en-US",
  currency: string = "EUR"
) {
  return amount.toLocaleString(locale, {
    style: "currency",
    currency,
  });
}

export const languages = {
  en: { name: 'English', code: 'en', flag: '🇬🇧' },
  nl: { name: 'Nederlands', code: 'nl', flag: '🇳🇱' },
  de: { name: 'Deutsch', code: 'de', flag: '🇩🇪' },
  fr: { name: 'Français', code: 'fr', flag: '🇫🇷' },
  es: { name: 'Español', code: 'es', flag: '🇪🇸' },
} as const;

export type Language = keyof typeof languages;

export const defaultLanguage: Language = 'en';

export const languageCodes = Object.keys(languages) as Language[];

export function isValidLanguage(lang: string): lang is Language {
  return languageCodes.includes(lang as Language);
}

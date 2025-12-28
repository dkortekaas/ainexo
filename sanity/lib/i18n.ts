// Sanity i18n configuration
export const supportedLanguages = [
  { id: "nl", title: "Nederlands" },
  { id: "en", title: "English" },
  { id: "de", title: "Deutsch" },
  { id: "fr", title: "Français" },
  { id: "es", title: "Español" },
];

export const baseLanguage = supportedLanguages.find((lang) => lang.id === "nl");

export const languageField = {
  name: "language",
  type: "string" as const,
  readOnly: true,
  hidden: true,
};

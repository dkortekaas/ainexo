type SupportedLocale = "nl" | "en" | "de" | "fr" | "es";

const messages: Record<SupportedLocale, Record<string, string>> = {
  nl: {
    "widget.confirmReset": "Weet je zeker dat je het gesprek wilt resetten?",
    "forms.required": "Dit veld is verplicht",
    "forms.email": "Voer een geldig e-mailadres in",
    "forms.phone": "Voer een geldig telefoonnummer in",
    "forms.selectPlaceholder": "Selecteer een optie...",
    "forms.submit": "Verzenden",
    "forms.submitting": "Verzenden...",
  },
  en: {
    "widget.confirmReset": "Are you sure you want to reset the conversation?",
    "forms.required": "This field is required",
    "forms.email": "Please enter a valid email address",
    "forms.phone": "Please enter a valid phone number",
    "forms.selectPlaceholder": "Select an option...",
    "forms.submit": "Submit",
    "forms.submitting": "Submitting...",
  },
  de: {
    "widget.confirmReset": "Sind Sie sicher, dass Sie die Unterhaltung zurücksetzen möchten?",
    "forms.required": "Dieses Feld ist erforderlich",
    "forms.email": "Bitte geben Sie eine gültige E-Mail-Adresse ein",
    "forms.phone": "Bitte geben Sie eine gültige Telefonnummer ein",
    "forms.selectPlaceholder": "Wählen Sie eine Option...",
    "forms.submit": "Senden",
    "forms.submitting": "Senden...",
  },
  fr: {
    "widget.confirmReset": "Êtes-vous sûr de vouloir réinitialiser la conversation ?",
    "forms.required": "Ce champ est requis",
    "forms.email": "Veuillez saisir une adresse e-mail valide",
    "forms.phone": "Veuillez saisir un numéro de téléphone valide",
    "forms.selectPlaceholder": "Sélectionnez une option...",
    "forms.submit": "Envoyer",
    "forms.submitting": "Envoi...",
  },
  es: {
    "widget.confirmReset": "¿Seguro que deseas restablecer la conversación?",
    "forms.required": "Este campo es obligatorio",
    "forms.email": "Introduce una dirección de correo válida",
    "forms.phone": "Introduce un número de teléfono válido",
    "forms.selectPlaceholder": "Selecciona una opción...",
    "forms.submit": "Enviar",
    "forms.submitting": "Enviando...",
  },
};

export function getLocale(): SupportedLocale {
  const nav = (typeof navigator !== "undefined" && navigator.language) || "en";
  const base = nav.toLowerCase().split("-")[0] as SupportedLocale;
  return (Object.keys(messages) as SupportedLocale[]).includes(base) ? base : "en";
}

export function t(key: string, locale?: SupportedLocale): string {
  const loc = locale || getLocale();
  return messages[loc][key] || messages.en[key] || key;
}



/**
 * Formatteer een bedrag als valuta (€)
 */
export function formatCurrency(amount: number): string {
    return amount.toLocaleString("nl-NL", {
        style: "currency",
        currency: "EUR",
    });
}

/**
 * Formatteer een datum naar NL formaat (dd-mm-yyyy)
 */
export function formatDate(date: Date | string): string {
    const dateObj = typeof date === "string" ? new Date(date) : date;

    return dateObj.toLocaleDateString("nl-NL", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
    });
}

/**
 * Formatteer een datum inclusief tijd (dd-mm-yyyy HH:MM)
 */
export function formatDateTime(date: Date | string): string {
    const dateObj = typeof date === "string" ? new Date(date) : date;

    return dateObj.toLocaleString("nl-NL", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}

/**
 * Formatteer een bestandsgrootte naar de juiste eenheid
 */
export function formatFileSize(bytes: number): string {
    if (bytes < 1024) {
        return `${bytes} bytes`;
    } else if (bytes < 1024 * 1024) {
        return `${(bytes / 1024).toFixed(1)} KB`;
    } else {
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    }
}

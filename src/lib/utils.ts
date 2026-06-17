export const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
        .then(() => {
        })
        .catch(err => {
            console.error('Failed to copy: ', err);
        });
};

/**
 * Formats a date string (YYYY-MM-DD or ISO) into a more readable format.
 * @param dateString The date string to format.
 * @param options Intl.DateTimeFormat options.
 * @returns Formatted date string or 'N/A' if invalid.
 */
export function formatDate(
    dateString: string | null | undefined,
    options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'short', day: 'numeric' }
): string {
    if (!dateString) return 'N/A';
    try {
        const date = new Date(dateString);
        // Check if the date is valid after parsing
        if (isNaN(date.getTime())) {
            return 'N/A';
        }
        return date.toLocaleDateString(undefined, options);
    } catch (e) {
        console.error("Error formatting date:", dateString, e);
        return 'N/A';
    }
}

/**
 * Formats a timestamp string (ISO) into a more readable format including time.
 * @param timestampString The timestamp string to format.
 * @param options Intl.DateTimeFormat options.
 * @returns Formatted timestamp string or 'N/A' if invalid.
 */
export function formatTimestamp(
    timestampString: string | null | undefined,
    options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }
): string {
    if (!timestampString) return 'N/A';
    try {
        const date = new Date(timestampString);
        if (isNaN(date.getTime())) {
            return 'N/A';
        }
        return date.toLocaleString(undefined, options);
    } catch (e) {
        console.error("Error formatting timestamp:", timestampString, e);
        return 'N/A';
    }
}
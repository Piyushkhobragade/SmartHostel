/**
 * Sanitizes AI-generated text to remove Markdown formatting,
 * ensuring plain text delivery for the frontend.
 * 
 * Removes:
 * - Bold/Italics: **, __, *, _
 * - Headers: #, ##, ###, ####
 * - Lists: -, +, *, 1., 2., etc. (Wait, if we remove list bullets, it becomes an unreadable blob. Let's convert them to plain text bullets or spaces? Actually, the requirement: "Remove: **, ##, ###, ---, markdown tables, markdown links")
 */
export function sanitizeMarkdown(text: string): string {
    if (!text) return text;

    let sanitized = text;

    // Remove Bold/Italics (**text** -> text, *text* -> text, __text__ -> text, _text_ -> text)
    sanitized = sanitized.replace(/(\*\*|__)(.*?)\1/g, '$2');
    sanitized = sanitized.replace(/(\*|_)(.*?)\1/g, '$2');

    // Remove Headers (### Header -> Header)
    sanitized = sanitized.replace(/^(#{1,6})\s*(.*)/gm, '$2');

    // Remove Horizontal Rules (---, ***, ___)
    sanitized = sanitized.replace(/^(\s*[-*_]){3,}\s*$/gm, '');

    // Remove Markdown Links ([Text](URL) -> Text)
    sanitized = sanitized.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1');

    // Remove Markdown Tables
    // Tables usually look like:
    // | Header | Header |
    // |--------|--------|
    // | Cell   | Cell   |
    // This regex matches lines that start and end with |, and optionally contain --
    // We will strip the | characters and replace with spaces to keep it somewhat readable,
    // or just strip the | character completely.
    sanitized = sanitized.replace(/^\|?(.+?)\|?$/gm, (match, content) => {
        if (content.match(/^[-:| ]+$/)) {
            // Remove the separator line completely
            return '';
        }
        if (match.includes('|')) {
            // Clean up row contents by replacing | with spaces
            return content.split('|').map((s: string) => s.trim()).join('   ');
        }
        return match;
    });

    // Remove stray empty lines caused by table separator removal
    sanitized = sanitized.replace(/\n{3,}/g, '\n\n');

    return sanitized.trim();
}

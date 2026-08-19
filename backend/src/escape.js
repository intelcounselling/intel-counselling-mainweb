// Escape a user-supplied value for safe interpolation into HTML content.
export function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Sanitize a user-supplied value for a plain-text context (e.g. email subject):
// no HTML entities, just strip line breaks to prevent header injection.
export function plainText(value) {
  return String(value ?? '').replace(/[\r\n]+/g, ' ').trim();
}

import SanitizeHTML from 'sanitize-html';

/**
 * Meddelandetexten är HTML från en skrivruta — vår egen eller handläggarens. Den renderas som HTML
 * i båda apparna, så den måste saneras i båda riktningarna: innan den skickas och innan den visas.
 *
 * Taggarna är de skrivrutan kan producera. Länkar tillåts inte: ett meddelande i tråden är inte en
 * plats där någon ska kunna leda mottagaren vidare med ett klick.
 */
const MESSAGE_TAGS = ['p', 'br', 'b', 'i', 'strong', 'em', 'u', 's', 'strike', 'del', 'ul', 'ol', 'li', 'blockquote'];

export const sanitizeMessage = (unsafeHtml: string): string =>
  SanitizeHTML(unsafeHtml, {
    allowedTags: MESSAGE_TAGS,
    allowedAttributes: {},
  });

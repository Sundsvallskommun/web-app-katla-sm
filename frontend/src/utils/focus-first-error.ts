/**
 * Fältkontroller som visar ett valideringsfel märks med det här attributet. Felnavigeringen
 * kan då hitta första felet i dokumentordning utan att känna till formulärens uppbyggnad,
 * vilket krävs eftersom felen kommer både från JSON-schemat och från handskrivna fält.
 */
export const INVALID_FIELD_ATTRIBUTE = 'data-invalid-field';

const FOCUSABLE_SELECTOR = [
  'input:not([type="hidden"]):not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  'button:not([disabled])',
  '[contenteditable="true"]',
  '[tabindex]:not([tabindex="-1"])',
].join(', ');

function scrollIntoView(element: HTMLElement): void {
  // jsdom saknar scrollIntoView, och äldre webbläsare saknar stöd för optionsobjektet.
  if (typeof element.scrollIntoView !== 'function') return;
  element.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

/** Returnerar false när fältet inte gick att fokusera, t.ex. för att det ännu inte är monterat. */
function revealField(field: HTMLElement): boolean {
  const focusTarget = field.querySelector<HTMLElement>(FOCUSABLE_SELECTOR);
  focusTarget?.focus({ preventScroll: true });
  scrollIntoView(focusTarget ?? field);

  return focusTarget !== null && document.activeElement === focusTarget;
}

/**
 * Flyttar fokus till första fältet som visar ett valideringsfel och rullar fram det.
 * Returnerar false när inget felmarkerat fält finns.
 */
export function focusFirstInvalidField(root: ParentNode = document): boolean {
  const field = root.querySelector<HTMLElement>(`[${INVALID_FIELD_ATTRIBUTE}]`);
  if (!field) return false;

  if (!revealField(field)) {
    // Ett fält som villkoren visar först i en senare uppdatering hinner inte bli fokuserbart.
    requestAnimationFrame(() => {
      revealField(field);
    });
  }

  return true;
}

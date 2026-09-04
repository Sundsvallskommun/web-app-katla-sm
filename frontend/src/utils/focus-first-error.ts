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
 * Ett fel på en nästlad egenskap namnger den egenskapen — `root_plats_enhet` — men ett eget
 * fält kan rendera hela objektet som en enda kontroll med bara `root_plats` i dokumentet.
 * Uppslaget skalar därför av ett led i taget tills något finns att rulla fram till.
 */
function findFieldByIdOrAncestor(fieldId: string, root: ParentNode): HTMLElement | null {
  let candidate = fieldId;

  while (candidate) {
    const field =
      root.querySelector<HTMLElement>(`[${INVALID_FIELD_ATTRIBUTE}="${CSS.escape(candidate)}"]`) ??
      root.querySelector<HTMLElement>(`#${CSS.escape(candidate)}`);
    if (field) return field;

    const lastSeparator = candidate.lastIndexOf('_');
    if (lastSeparator <= 0) return null;
    candidate = candidate.slice(0, lastSeparator);
  }

  return null;
}

/**
 * Flyttar fokus till ett namngivet felmarkerat fält och rullar fram det. Används av
 * felsammanfattningen, där varje rad pekar ut sitt eget fält.
 * Returnerar false när fältet inte finns på sidan.
 */
export function focusInvalidField(fieldId: string, root: ParentNode = document): boolean {
  const field = findFieldByIdOrAncestor(fieldId, root);
  if (!field) return false;

  if (!revealField(field)) {
    requestAnimationFrame(() => {
      revealField(field);
    });
  }

  return true;
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

import { sanitizeMessage } from '@utils/sanitize-message';
import { describe, expect, it } from 'vitest';

/**
 * Meddelandetexten renderas som HTML i båda apparna. Den kommer från en skrivruta, men vad som
 * faktiskt ligger i fältet när det når hit är inget vi kan ta för givet.
 */
describe('sanitizeMessage', () => {
  it('behåller formateringen från skrivrutan', () => {
    expect(sanitizeMessage('<p>Hej <strong>Hanna</strong></p><ul><li>Ett</li></ul>')).toBe(
      '<p>Hej <strong>Hanna</strong></p><ul><li>Ett</li></ul>'
    );
  });

  it('tar bort skript', () => {
    expect(sanitizeMessage('<p>Hej</p><script>alert(1)</script>')).toBe('<p>Hej</p>');
  });

  it('tar bort händelseattribut men behåller texten', () => {
    expect(sanitizeMessage('<p onclick="stealData()">Hej</p>')).toBe('<p>Hej</p>');
  });

  it('lämnar inga länkar kvar att klicka på', () => {
    expect(sanitizeMessage('<p>Se <a href="https://example.test">här</a></p>')).toBe('<p>Se här</p>');
  });

  it('tar bort inbäddat innehåll', () => {
    expect(sanitizeMessage('<iframe src="https://example.test"></iframe><p>Hej</p>')).toBe('<p>Hej</p>');
  });
});

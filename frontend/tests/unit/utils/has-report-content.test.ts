import { ErrandFormDTO } from '@interfaces/errand-form';
import { hasReportContent } from '@utils/errand-helpers';
import { describe, expect, it } from 'vitest';

const errand = (values: Partial<ErrandFormDTO>): ErrandFormDTO => ({
  title: 'Empty errand',
  priority: 'MEDIUM',
  status: 'DRAFT',
  channel: 'ESERVICE',
  resolution: 'INFORMED',
  ...values,
});

/**
 * Avgör om varningen vid stängd flik ska visas. Ett falskt positivt är dyrare än det ser ut:
 * varningen kommer då på en registrering användaren aldrig rört, och lär sig snabbt att
 * klickas bort — även den gång den gäller riktigt innehåll.
 */
describe('hasReportContent', () => {
  it('treats a freshly opened registration as empty', () => {
    expect(hasReportContent(errand({}))).toBe(false);
  });

  it('does not count the reporter, which is filled in automatically', () => {
    expect(hasReportContent(errand({ stakeholders: [{ role: 'REPORTER', firstName: 'Test' }] }))).toBe(false);
  });

  it.each([
    ['an empty object', '{}'],
    // Objektfält som platsen ligger i posten redan vid montering, med ett tomt objekt som värde.
    ['the structure the schema form writes for object fields', '{"facilityInfo":{}}'],
    ['blank strings', '{"eventDescription":"   ","actionsTaken":""}'],
  ])('does not count %s as content', (_label, data) => {
    expect(hasReportContent(errand({ errandFormData: [{ schemaName: 'avvikelse', data }] }))).toBe(false);
  });

  it.each([
    ['a chosen event type', { parameters: [{ key: 'eventType', values: ['AVVIKELSE'] }] }],
    ['filled-in form data', { errandFormData: [{ schemaName: 'avvikelse', data: '{"eventDate":"2026-09-01"}' }] }],
    [
      'a chosen place inside an object field',
      { errandFormData: [{ schemaName: 'avvikelse', data: '{"facilityInfo":{"orgName":"Solhaga"}}' }] },
    ],
    ['an added client', { stakeholders: [{ role: 'REPORTER' }, { role: 'PRIMARY', firstName: 'Brukare' }] }],
  ])('counts %s as content worth warning about', (_label, values) => {
    expect(hasReportContent(errand(values))).toBe(true);
  });
});

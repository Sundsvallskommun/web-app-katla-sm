import { SupportNotificationDTO, SupportNotificationEventDTO } from '@data-contracts/backend/data-contracts';
import { eventLabel, newestFirst, notificationHref, notificationSummary, subTypeLabel } from '@utils/notifications';
import { createInstance, type TFunction } from 'i18next';
import { beforeAll, describe, expect, it } from 'vitest';

import commonSv from '../../../locales/sv/common.json';

const i18n = createInstance();
let t: TFunction;

const notification = (
  events: SupportNotificationEventDTO[],
  created = '2026-10-01T08:00:00Z'
): SupportNotificationDTO => ({
  id: `notification-${created}`,
  created,
  acknowledged: false,
  errandId: 'errand-1',
  errandNumber: 'VOF-1',
  events,
});

describe('notification texts', () => {
  beforeAll(async () => {
    await i18n.init({ lng: 'sv', resources: { sv: { common: commonSv } }, defaultNS: 'common' });
    t = i18n.t;
  });

  it('names an event by its description first', () => {
    expect(eventLabel({ subType: 'MESSAGE', description: 'Meddelande mottaget' }, t)).toBe('Meddelande mottaget');
    expect(eventLabel({ subType: 'MESSAGE' }, t)).toBe('Nytt meddelande');
    expect(eventLabel({ subType: 'OKAND' }, t)).toBe('Händelse på ärendet');
    expect(eventLabel(undefined, t)).toBe('Händelse på ärendet');
  });

  it('does not call a removal something new', () => {
    expect(subTypeLabel({ subType: 'ATTACHMENT', eventType: 'DELETE' }, t)).toBe('Bilaga borttagen');
    expect(subTypeLabel({ subType: 'ATTACHMENT', eventType: 'CREATE' }, t)).toBe('Ny bilaga');
    // En borttagning som saknar egen text faller tillbaka på subtypens.
    expect(subTypeLabel({ subType: 'ERRAND', eventType: 'DELETE' }, t)).toBe('Ärende uppdaterat');
    expect(subTypeLabel({}, t)).toBeUndefined();
  });

  it('summarises several events of one kind with their own noun', () => {
    const messages = notification([
      { subType: 'MESSAGE', description: 'Meddelande mottaget' },
      { subType: 'MESSAGE', description: 'Meddelande mottaget' },
      { subType: 'MESSAGE', description: 'Meddelande mottaget' },
    ]);

    expect(notificationSummary(messages, t)).toBe('3 nya meddelanden');
  });

  it('summarises mixed events, and events that include a removal, as events', () => {
    const mixed = notification([{ subType: 'MESSAGE' }, { subType: 'ATTACHMENT' }]);
    const withRemoval = notification([
      { subType: 'ATTACHMENT', eventType: 'CREATE' },
      { subType: 'ATTACHMENT', eventType: 'DELETE' },
    ]);

    expect(notificationSummary(mixed, t)).toBe('2 nya händelser');
    expect(notificationSummary(withRemoval, t)).toBe('2 nya händelser');
  });

  it('names a notification with one or no event by that event', () => {
    expect(notificationSummary(notification([{ subType: 'MESSAGE', description: 'Meddelande mottaget' }]), t)).toBe(
      'Meddelande mottaget'
    );
    expect(notificationSummary(notification([]), t)).toBe('Händelse på ärendet');
  });

  it('lists the newest notification first and links to its errand', () => {
    const older = notification([], '2026-10-01T08:00:00Z');
    const newer = notification([], '2026-10-02T08:00:00Z');

    expect(newestFirst([older, newer])).toEqual([newer, older]);
    expect(notificationHref(older)).toBe('/arende/VOF-1/meddelanden');
  });
});

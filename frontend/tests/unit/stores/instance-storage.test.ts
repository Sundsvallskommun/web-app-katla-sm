import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

/** Re-importing models loading another instance on the same browser origin. */
const openInstance = async (katlaId: string, basePath: string) => {
  vi.stubEnv('NEXT_PUBLIC_APP_MODE', 'katla');
  vi.stubEnv('NEXT_PUBLIC_KATLA_ID', katlaId);
  vi.stubEnv('NEXT_PUBLIC_ALLOW_TEST_DEFINITIONS', 'true');
  vi.stubEnv('NEXT_PUBLIC_BASE_PATH', basePath);
  vi.resetModules();
  const [{ useFilterStore }, { useNotificationStore }] = await Promise.all([
    import('src/stores/filter-store'),
    import('src/stores/notification-store'),
  ]);
  return { filters: useFilterStore, notifications: useNotificationStore };
};

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe('stored state belongs to one Katla instance', () => {
  it('keeps notifications and filters separate between Katlas and mount paths', async () => {
    const first = await openInstance('avvikelse-test', '/first');
    first.filters.getState().setActiveStatus('DRAFT');
    first.filters.getState().setStatuses(['DRAFT', 'NEW']);
    first.notifications
      .getState()
      .setNotifications([{ id: 'notification-first', errandNumber: 'FIRST-1', acknowledged: false }]);

    for (const [id, basePath] of [
      ['schema-test', '/first'],
      ['avvikelse-test', '/second'],
    ]) {
      const other = await openInstance(id, basePath);
      expect(other.filters.getState().activeStatus).toBeNull();
      expect(other.filters.getState().statuses).toEqual([]);
      expect(other.notifications.getState().activeNotifications).toEqual([]);
      other.filters.getState().setActiveStatus('SOLVED');
      other.notifications.getState().setNotifications([{ id: 'notification-other', errandNumber: 'OTHER-1' }]);
    }

    const reopened = await openInstance('avvikelse-test', '/first');
    expect(reopened.filters.getState().activeStatus).toBe('DRAFT');
    expect(reopened.filters.getState().statuses).toEqual(['DRAFT', 'NEW']);
    expect(
      reopened.notifications.getState().activeNotifications.map((notification) => notification.errandNumber)
    ).toEqual(['FIRST-1']);
  });
});

import { ErrandTableFooter } from '@components/errand-table/errand-table-footer.component';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createInstance } from 'i18next';
import { I18nextProvider } from 'react-i18next';
import { useSortStore } from 'src/stores/sort-store';
import { beforeAll, beforeEach, describe, expect, it } from 'vitest';

import commonSv from '../../../locales/sv/common.json';

const i18n = createInstance();

beforeAll(async () => {
  await i18n.init({ lng: 'sv', resources: { sv: { common: commonSv } }, defaultNS: 'common' });
});
beforeEach(() => {
  useSortStore.getState().reset();
});

const renderFooter = () =>
  render(
    <I18nextProvider i18n={i18n}>
      <ErrandTableFooter totalPages={3} />
    </I18nextProvider>
  );

describe('ErrandTableFooter', () => {
  it('keeps pagination in sync with the zero-based overview page and stops at each boundary', async () => {
    const user = userEvent.setup();
    renderFooter();
    const previous = screen.getByRole('button', { name: 'Go to previous page' });
    const next = screen.getByRole('button', { name: 'Go to next page' });
    expect(previous).toBeDisabled();
    await user.click(next);
    expect(useSortStore.getState().page).toBe(1);
    await user.click(next);
    expect(useSortStore.getState().page).toBe(2);
    expect(next).toBeDisabled();
    await user.click(previous);
    expect(useSortStore.getState().page).toBe(1);
  });

  it('resets the page when the page size changes and retains the row density control', async () => {
    const user = userEvent.setup();
    useSortStore.getState().setPage(2);
    renderFooter();
    const sizeInput = screen.getByLabelText(commonSv['errand-table'].rows_per_page);
    await user.clear(sizeInput);
    await user.type(sizeInput, '25');
    await user.tab();
    expect(useSortStore.getState()).toMatchObject({ size: 25, page: 0 });
    await user.click(screen.getByRole('combobox', { name: commonSv['errand-table'].row_height }));
    await user.click(screen.getByRole('option', { name: commonSv['errand-table'].row_height_dense }));
    expect(useSortStore.getState().rowHeight).toBe('dense');
  });
});

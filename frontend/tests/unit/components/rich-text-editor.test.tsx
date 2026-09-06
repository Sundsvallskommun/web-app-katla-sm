import { RichTextEditor } from '@components/rich-text-editor/rich-text-editor.component';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createInstance } from 'i18next';
import Quill from 'quill';
import { StrictMode } from 'react';
import { I18nextProvider } from 'react-i18next';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import editorSv from '../../../locales/sv/editor.json';

const i18n = createInstance();

beforeEach(async () => {
  await i18n.init({ lng: 'sv', resources: { sv: { editor: editorSv } } });
});

Range.prototype.getBoundingClientRect = () => new DOMRect();
Range.prototype.getClientRects = () => Object.assign([], { item: () => null });

describe('RichTextEditor accessibility', () => {
  it('connects the editing surface to its label and descriptions and clears stale validation attributes', async () => {
    const user = userEvent.setup();
    const editor = (withValidation: boolean) => (
      <>
        <label id="message-label" htmlFor="message">
          Meddelande
        </label>
        <p id="message-help">Max 10 000 tecken</p>
        <p id="message-error">Meddelandet är för långt</p>
        <RichTextEditor
          id="message"
          labelledBy="message-label"
          describedBy={withValidation ? 'message-help message-error' : undefined}
          invalid={withValidation}
          required={withValidation}
        />
      </>
    );

    const { rerender } = render(editor(true));
    const textbox = await screen.findByRole('textbox', { name: 'Meddelande' });

    expect(textbox).toHaveAttribute('id', 'message');
    expect(textbox).toHaveAttribute('aria-multiline', 'true');
    expect(textbox).toHaveAccessibleDescription('Max 10 000 tecken Meddelandet är för långt');
    expect(textbox).toBeInvalid();
    expect(textbox).toBeRequired();
    expect(textbox).not.toHaveAttribute('aria-label');
    await user.click(screen.getByText('Meddelande'));
    expect(textbox).toHaveFocus();
    expect(textbox.parentElement?.parentElement).not.toHaveAttribute('tabindex');

    rerender(editor(false));

    expect(textbox).toHaveAttribute('aria-invalid', 'false');
    expect(textbox).not.toHaveAttribute('aria-required');
    expect(textbox).not.toHaveAttribute('aria-describedby');
    expect(textbox).not.toHaveAccessibleDescription();
  });

  it('keeps disabled and readonly states distinct while preventing editing in both states', async () => {
    const editor = (disabled: boolean, readOnly: boolean) => (
      <>
        <label id="message-label" htmlFor="message">
          Meddelande
        </label>
        <RichTextEditor id="message" labelledBy="message-label" disabled={disabled} readOnly={readOnly} />
      </>
    );
    const { rerender } = render(editor(true, false));
    const textbox = await screen.findByRole('textbox', { name: 'Meddelande' });

    expect(textbox).toHaveAttribute('contenteditable', 'false');
    expect(textbox).toHaveAttribute('aria-disabled', 'true');
    expect(textbox).toHaveAttribute('aria-readonly', 'true');

    rerender(editor(false, true));

    expect(textbox).toHaveAttribute('contenteditable', 'false');
    expect(textbox).toHaveAttribute('aria-disabled', 'false');
    expect(textbox).toHaveAttribute('aria-readonly', 'true');

    rerender(editor(false, false));

    expect(textbox).toHaveAttribute('contenteditable', 'true');
    expect(textbox).toHaveAttribute('aria-disabled', 'false');
    expect(textbox).toHaveAttribute('aria-readonly', 'false');
  });

  it('exports semantic lists and inline formatting, accepts external reset and uses the latest callback', async () => {
    const user = userEvent.setup();
    const firstChange = vi.fn();
    const latestChange = vi.fn();
    const editor = (markup: string, onChange = firstChange) => (
      <I18nextProvider i18n={i18n}>
        <label id="message-label" htmlFor="message">
          Meddelande
        </label>
        <RichTextEditor id="message" labelledBy="message-label" value={{ markup }} onChange={onChange} />
      </I18nextProvider>
    );
    const { rerender } = render(editor('<ul><li>Första</li><li>Andra</li></ul>'));
    const textbox = await screen.findByRole('textbox', { name: 'Meddelande' });
    await waitFor(() => {
      expect(textbox).toHaveTextContent('FörstaAndra');
    });
    if (!textbox.parentElement) throw new Error('Expected an editor container');
    const instance = Quill.find(textbox.parentElement);
    if (!(instance instanceof Quill)) throw new Error('Expected a mounted Quill editor');
    expect(instance.getSemanticHTML()).toBe('<ul><li>Första</li><li>Andra</li></ul>');

    act(() => {
      instance.setSelection(0, 6);
    });
    await user.click(screen.getByRole('button', { name: 'Fet' }));
    expect(firstChange).toHaveBeenLastCalledWith({
      markup: '<ul><li><strong>Första</strong></li><li>Andra</li></ul>',
      plainText: 'Första\nAndra\n',
    });

    rerender(editor('', latestChange));
    await waitFor(() => {
      expect(textbox).toHaveTextContent('');
    });
    expect(instance.getText()).toBe('\n');
    expect(latestChange).not.toHaveBeenCalled();
    fireEvent.input(textbox, { target: { textContent: 'Nytt' } });
    await waitFor(() => {
      expect(latestChange).toHaveBeenLastCalledWith({ markup: '<p>Nytt</p>', plainText: 'Nytt\n' });
    });
  });

  it('owns one editor through StrictMode remounts and stops publishing changes after unmount', async () => {
    const onChange = vi.fn();
    const { unmount } = render(
      <StrictMode>
        <label id="message-label" htmlFor="message">
          Meddelande
        </label>
        <RichTextEditor id="message" labelledBy="message-label" onChange={onChange} />
      </StrictMode>
    );
    const textbox = await screen.findByRole('textbox', { name: 'Meddelande' });
    expect(screen.getAllByRole('textbox')).toHaveLength(1);
    if (!textbox.parentElement) throw new Error('Expected an editor container');
    const instance = Quill.find(textbox.parentElement);
    if (!(instance instanceof Quill)) throw new Error('Expected a mounted Quill editor');
    unmount();
    act(() => {
      instance.setText('After unmount');
    });
    expect(onChange).not.toHaveBeenCalled();
    expect(document.querySelector('.ql-container')).toBeNull();
  });
});

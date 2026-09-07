import { RichTextEditor } from '@components/rich-text-editor/rich-text-editor.component';
import type { TextEditorProps } from '@sk-web-gui/text-editor';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

vi.mock('next/dynamic', () => ({
  default: () => {
    function TextEditorStub({ className, readOnly }: TextEditorProps) {
      return (
        <div className={className}>
          <div className="ql-editor" contentEditable={!readOnly} aria-label="Text editor" />
        </div>
      );
    }

    return TextEditorStub;
  },
}));

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
    const textbox = screen.getByRole('textbox', { name: 'Meddelande' });

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

  it('keeps disabled and readonly states distinct while preventing editing in both states', () => {
    const editor = (disabled: boolean, readOnly: boolean) => (
      <>
        <label id="message-label" htmlFor="message">
          Meddelande
        </label>
        <RichTextEditor id="message" labelledBy="message-label" disabled={disabled} readOnly={readOnly} />
      </>
    );
    const { rerender } = render(editor(true, false));
    const textbox = screen.getByRole('textbox', { name: 'Meddelande' });

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

  it('applies the accessible name and description when Quill replaces its editing surface', async () => {
    render(
      <>
        <label id="message-label" htmlFor="message">
          Meddelande
        </label>
        <p id="message-help">Max 10 000 tecken</p>
        <RichTextEditor id="message" labelledBy="message-label" describedBy="message-help" />
      </>
    );
    const previousTextbox = screen.getByRole('textbox', { name: 'Meddelande' });
    const replacement = document.createElement('div');
    replacement.className = 'ql-editor';
    replacement.setAttribute('contenteditable', 'true');

    previousTextbox.replaceWith(replacement);

    await waitFor(() => {
      expect(screen.getByRole('textbox', { name: 'Meddelande' })).toBe(replacement);
      expect(replacement).toHaveAccessibleDescription('Max 10 000 tecken');
    });
  });
});

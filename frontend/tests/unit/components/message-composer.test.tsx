import { MessageComposer } from '@components/messages/message-composer.component';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createInstance } from 'i18next';
import { useEffect, useRef } from 'react';
import { I18nextProvider } from 'react-i18next';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import formsEn from '../../../locales/en/forms.json';
import messagesEn from '../../../locales/en/messages.json';
import formsSv from '../../../locales/sv/forms.json';
import messagesSv from '../../../locales/sv/messages.json';

const services = vi.hoisted(() => ({
  createConversation: vi.fn(),
  sendConversationMessage: vi.fn(),
  snackbar: vi.fn(),
}));

vi.mock('@services/conversation-service/conversation-service', () => services);

vi.mock('@sk-web-gui/react', async (importOriginal) => {
  const original = await importOriginal<typeof import('@sk-web-gui/react')>();
  return { ...original, useSnackbar: () => services.snackbar };
});

interface EditorStubProps {
  value: { markup: string };
  className?: string;
  readOnly?: boolean;
  onChange: (event: { target: { value: { markup: string; plainText: string } } }) => void;
}

// Behåll den riktiga app-adaptern: endast Quill ersätts, eftersom jsdom saknar dess layout-API:er.
vi.mock('next/dynamic', () => ({
  default: () =>
    function EditorStub({ value, className, readOnly, onChange }: EditorStubProps) {
      const editorRef = useRef<HTMLDivElement>(null);
      useEffect(() => {
        if (editorRef.current) editorRef.current.innerHTML = value.markup;
      }, [value.markup]);
      return (
        <div className={className}>
          <div
            ref={editorRef}
            className="ql-editor"
            contentEditable={!readOnly}
            onInput={(event) => {
              const plainText = event.currentTarget.textContent ?? '';
              onChange({ target: { value: { markup: event.currentTarget.innerHTML, plainText } } });
            }}
          />
        </div>
      );
    },
}));

const i18n = createInstance();

beforeEach(async () => {
  vi.clearAllMocks();
  await i18n.init({
    lng: 'sv',
    resources: {
      sv: { forms: formsSv, messages: messagesSv },
      en: { forms: formsEn, messages: messagesEn },
    },
  });
});

function renderComposer(onSent = vi.fn()) {
  return render(
    <I18nextProvider i18n={i18n}>
      <MessageComposer errandId="test-errand" errandNumber="KATLA-1" onSent={onSent} />
    </I18nextProvider>
  );
}

function enterMessage(value: string) {
  fireEvent.input(screen.getByRole('textbox'), { target: { textContent: value } });
}

describe('message editor accessibility', () => {
  it.each([
    ['sv', 'Skriv ett meddelande (obligatoriskt)', 'Max 10000 tecken. 0 av 10000 tecken använda.'],
    ['en', 'Write a message (required)', 'Max 10000 characters. 0 of 10000 characters used.'],
  ])('connects the label and readable character guidance in %s', async (locale, name, description) => {
    await i18n.changeLanguage(locale);
    renderComposer();

    const editor = screen.getByRole('textbox', { name });
    expect(editor).toHaveAccessibleDescription(description);
    expect(editor).toHaveAttribute('aria-multiline', 'true');
    expect(editor).toBeRequired();
    expect(editor).toHaveAttribute('aria-invalid', 'false');
    expect(screen.getByRole('status')).toBeEmptyDOMElement();
  });

  it('focuses the editor from its label and does not add tab stops for the guidance', async () => {
    const user = userEvent.setup();
    renderComposer();
    const editor = screen.getByRole('textbox');

    await user.click(screen.getByText('Skriv ett meddelande'));
    expect(editor).toHaveFocus();
    const limit = screen.getByText('Max 10000 tecken.');
    const count = screen.getByText('0 av 10000 tecken använda.');
    expect(limit).not.toHaveAttribute('tabindex');
    expect(count).not.toHaveAttribute('tabindex');
    await user.tab();
    expect(editor).not.toHaveFocus();
    expect(limit).not.toHaveFocus();
    expect(count).not.toHaveFocus();
  });

  it('updates the count without live-announcing each keystroke', async () => {
    renderComposer();
    enterMessage('Hej');

    await waitFor(() => {
      expect(screen.getByRole('textbox')).toHaveAccessibleDescription('Max 10000 tecken. 3 av 10000 tecken använda.');
    });
    expect(screen.getByText('3/10000')).toHaveAttribute('aria-hidden', 'true');
    expect(screen.getByRole('status')).toBeEmptyDOMElement();
  });

  it('describes and announces an exceeded limit, then clears the error at exactly 10000', async () => {
    renderComposer();
    enterMessage('a'.repeat(10001));

    const editor = screen.getByRole('textbox');
    const send = screen.getByRole('button', { name: 'Skicka meddelande' });
    await waitFor(() => {
      expect(editor).toHaveAttribute('aria-invalid', 'true');
      expect(editor).toHaveAccessibleDescription(
        'Max 10000 tecken. 10001 av 10000 tecken använda. Meddelandet får vara högst 10000 tecken.'
      );
    });
    expect(send).toBeDisabled();
    expect(screen.getByRole('status')).toHaveTextContent('Meddelandet får vara högst 10000 tecken.');
    expect(screen.getByRole('status')).toHaveAttribute('aria-live', 'polite');

    enterMessage('a'.repeat(10000));
    await waitFor(() => {
      expect(editor).toHaveAttribute('aria-invalid', 'false');
      expect(editor).toHaveAccessibleDescription('Max 10000 tecken. 10000 av 10000 tecken använda.');
    });
    expect(send).toBeEnabled();
    expect(screen.getByRole('status')).toBeEmptyDOMElement();
    expect(document.getElementById('message-body-error')).not.toBeInTheDocument();
  });

  it('connects and announces the required-field error without attempting to send', async () => {
    const user = userEvent.setup();
    renderComposer();
    await user.click(screen.getByRole('button', { name: 'Skicka meddelande' }));

    await waitFor(() => {
      expect(screen.getByRole('textbox')).toHaveAccessibleDescription(
        'Max 10000 tecken. 0 av 10000 tecken använda. Skriv ett meddelande innan du skickar.'
      );
    });
    expect(screen.getByRole('textbox')).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByRole('status')).toHaveTextContent('Skriv ett meddelande innan du skickar.');
    expect(services.createConversation).not.toHaveBeenCalled();
    expect(services.sendConversationMessage).not.toHaveBeenCalled();
  });
});

it('locks text and attachments during sending and clears only after success', async () => {
  const pending = Promise.withResolvers<undefined>();
  services.createConversation.mockResolvedValue({ id: 'conv-1' });
  services.sendConversationMessage.mockReturnValue(pending.promise);
  const onSent = vi.fn();
  const { container } = renderComposer(onSent);
  enterMessage('First message');
  fireEvent.click(screen.getByRole('button', { name: 'Skicka meddelande' }));
  await waitFor(() => {
    expect(services.sendConversationMessage).toHaveBeenCalledWith('test-errand', 'conv-1', 'First message', []);
  });
  const editor = screen.getByRole('textbox');
  expect(editor).toHaveAttribute('contenteditable', 'false');
  expect(editor).toHaveAttribute('aria-readonly', 'true');
  expect(container.querySelector('input[type="file"]')).toBeDisabled();
  await userEvent.type(editor, ' unsent addition');
  expect(editor).toHaveTextContent('First message');
  await act(async () => {
    pending.resolve(undefined);
    await pending.promise;
  });
  expect(editor).toBeEmptyDOMElement();
  expect(editor).toHaveAttribute('contenteditable', 'true');
  expect(onSent).toHaveBeenCalledTimes(1);
});

it('preserves text and unlocks after failure so the same message can be retried', async () => {
  services.createConversation.mockResolvedValue({ id: 'conv-1' });
  services.sendConversationMessage.mockRejectedValueOnce(new Error('offline')).mockResolvedValue(undefined);
  const onSent = vi.fn();
  renderComposer(onSent);
  enterMessage('Keep this');
  fireEvent.click(screen.getByRole('button', { name: 'Skicka meddelande' }));
  await screen.findByText(messagesSv.send_error);
  const editor = screen.getByRole('textbox');
  expect(editor).toHaveTextContent('Keep this');
  expect(editor).toHaveAttribute('contenteditable', 'true');
  expect(onSent).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button', { name: 'Skicka meddelande' }));
  await waitFor(() => {
    expect(onSent).toHaveBeenCalledTimes(1);
  });
  expect(services.sendConversationMessage).toHaveBeenCalledTimes(2);
});

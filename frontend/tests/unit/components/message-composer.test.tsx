import { MessageComposer } from '@components/messages/message-composer.component';
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createInstance } from 'i18next';
import { I18nextProvider } from 'react-i18next';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import editorEn from '../../../locales/en/editor.json';
import formsEn from '../../../locales/en/forms.json';
import messagesEn from '../../../locales/en/messages.json';
import editorSv from '../../../locales/sv/editor.json';
import formsSv from '../../../locales/sv/forms.json';
import messagesSv from '../../../locales/sv/messages.json';

const services = vi.hoisted(() => ({
  createConversation: vi.fn(),
  sendConversationMessage: vi.fn(),
  toast: vi.fn(),
}));

vi.mock('@services/conversation-service/conversation-service', () => services);

vi.mock('@astryxdesign/core/Toast', () => ({ useToast: () => services.toast }));

// Quill runs in these tests. Only geometry absent in jsdom is supplied;
// keyboard focus, selection and layout also have browser coverage.
Range.prototype.getBoundingClientRect = () => new DOMRect();
Range.prototype.getClientRects = () => Object.assign([], { item: () => null });

const i18n = createInstance();

beforeEach(async () => {
  vi.clearAllMocks();
  await i18n.init({
    lng: 'sv',
    resources: {
      sv: { forms: formsSv, messages: messagesSv, editor: editorSv },
      en: { forms: formsEn, messages: messagesEn, editor: editorEn },
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

async function enterMessage(value: string) {
  await screen.findByRole('textbox');
  await act(async () => {
    fireEvent.input(screen.getByRole('textbox'), { target: { textContent: value } });
    await Promise.resolve();
  });
}

describe('message editor accessibility', () => {
  it.each([
    ['sv', 'Skriv ett meddelande (obligatoriskt)', 'Max 10000 tecken. 0 av 10000 tecken använda.'],
    ['en', 'Write a message (required)', 'Max 10000 characters. 0 of 10000 characters used.'],
  ])('connects the label and readable character guidance in %s', async (locale, name, description) => {
    await i18n.changeLanguage(locale);
    renderComposer();

    const editor = await screen.findByRole('textbox', { name });
    expect(editor).toHaveAccessibleDescription(description);
    expect(editor).toHaveAttribute('aria-multiline', 'true');
    expect(editor).toBeRequired();
    expect(editor).toHaveAttribute('aria-invalid', 'false');
    expect(screen.getByRole('status', { name: i18n.t('messages:validation_status') })).toBeEmptyDOMElement();
  });

  it('focuses the editor from its label and does not add tab stops for the guidance', async () => {
    const user = userEvent.setup();
    renderComposer();
    const editor = await screen.findByRole('textbox');

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
    await enterMessage('Hej');

    await waitFor(() => {
      expect(screen.getByRole('textbox')).toHaveAccessibleDescription('Max 10000 tecken. 3 av 10000 tecken använda.');
    });
    expect(screen.getByText('3/10000')).toHaveAttribute('aria-hidden', 'true');
    expect(screen.getByRole('status', { name: i18n.t('messages:validation_status') })).toBeEmptyDOMElement();
  });

  it('describes and announces an exceeded limit, then clears the error at exactly 10000', async () => {
    renderComposer();
    await enterMessage('a'.repeat(10001));

    const editor = await screen.findByRole('textbox');
    const send = screen.getByRole('button', { name: 'Skicka meddelande' });
    await waitFor(() => {
      expect(editor).toHaveAttribute('aria-invalid', 'true');
      expect(editor).toHaveAccessibleDescription(
        'Max 10000 tecken. 10001 av 10000 tecken använda. Meddelandet får vara högst 10000 tecken.'
      );
    });
    expect(send).toBeDisabled();
    expect(screen.getByRole('status', { name: i18n.t('messages:validation_status') })).toHaveTextContent(
      'Meddelandet får vara högst 10000 tecken.'
    );
    expect(screen.getByRole('status', { name: i18n.t('messages:validation_status') })).toHaveAttribute(
      'aria-live',
      'polite'
    );

    await enterMessage('a'.repeat(10000));
    await waitFor(() => {
      expect(editor).toHaveAttribute('aria-invalid', 'false');
      expect(editor).toHaveAccessibleDescription('Max 10000 tecken. 10000 av 10000 tecken använda.');
    });
    expect(send).toBeEnabled();
    expect(screen.getByRole('status', { name: i18n.t('messages:validation_status') })).toBeEmptyDOMElement();
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
    expect(screen.getByRole('status', { name: i18n.t('messages:validation_status') })).toHaveTextContent(
      'Skriv ett meddelande innan du skickar.'
    );
    expect(services.createConversation).not.toHaveBeenCalled();
    expect(services.sendConversationMessage).not.toHaveBeenCalled();
  });

  it('appends attachments, rejects files over 25 MiB without losing existing files, removes one and sends metadata intact', async () => {
    const user = userEvent.setup();
    const onSent = vi.fn();
    services.createConversation.mockResolvedValue({ id: 'conversation-1' });
    services.sendConversationMessage.mockResolvedValue(undefined);
    const { container } = renderComposer(onSent);
    await enterMessage('Hej');
    const input = container.querySelector<HTMLInputElement>('input[type="file"]');
    if (!input) throw new Error('Expected the attachment picker');
    const first = new File(['PDF'], 'första.pdf', { type: 'application/pdf', lastModified: 1234 });
    const tooLarge = new File(['large'], 'för-stor.pdf', { type: 'application/pdf' });
    Object.defineProperty(tooLarge, 'size', { value: 25 * 1024 * 1024 + 1 });
    const atLimit = new File(['boundary'], 'andra.pdf', { type: 'application/pdf', lastModified: 5678 });
    Object.defineProperty(atLimit, 'size', { value: 25 * 1024 * 1024 });

    await user.upload(input, first);
    expect(screen.getByRole('list', { name: 'Bifogade filer' })).toHaveTextContent('första.pdf');
    await user.upload(input, tooLarge);
    expect(screen.getByRole('list', { name: 'Bifogade filer' })).toHaveTextContent('första.pdf');
    expect(screen.queryByRole('button', { name: 'Ta bort för-stor.pdf' })).not.toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('för-stor.pdf');
    });

    await user.upload(input, atLimit);
    await user.click(screen.getByRole('button', { name: 'Ta bort första.pdf' }));
    expect(screen.getByRole('list', { name: 'Bifogade filer' })).not.toHaveTextContent('första.pdf');
    await user.click(screen.getByRole('button', { name: 'Skicka meddelande' }));
    await waitFor(() => {
      expect(onSent).toHaveBeenCalledOnce();
    });
    expect(services.sendConversationMessage).toHaveBeenCalledWith('test-errand', 'conversation-1', '<p>Hej</p>', [
      atLimit,
    ]);
    expect(services.toast).toHaveBeenCalledWith({ body: 'Meddelandet skickades', type: 'info' });
    expect(screen.queryByRole('list', { name: 'Bifogade filer' })).not.toBeInTheDocument();
    expect(screen.getByRole('textbox')).toHaveAccessibleDescription('Max 10000 tecken. 0 av 10000 tecken använda.');
    expect(within(container).queryByRole('alert')).not.toBeInTheDocument();
  });

  it('keeps the draft and attachments available when sending fails', async () => {
    const user = userEvent.setup();
    services.createConversation.mockResolvedValue({ id: 'conversation-1' });
    services.sendConversationMessage.mockRejectedValue(new Error('Unavailable'));
    const onSent = vi.fn();
    const { container } = renderComposer(onSent);
    await enterMessage('Mitt utkast');
    const input = container.querySelector<HTMLInputElement>('input[type="file"]');
    if (!input) throw new Error('Expected the attachment picker');
    await user.upload(input, new File(['draft'], 'bilaga.pdf', { type: 'application/pdf' }));
    await user.click(screen.getByRole('button', { name: 'Skicka meddelande' }));
    await waitFor(() => {
      expect(within(container).getByRole('alert')).toHaveTextContent('Något gick fel');
    });
    expect(screen.getByRole('textbox')).toHaveTextContent('Mitt utkast');
    expect(screen.getByRole('list', { name: 'Bifogade filer' })).toHaveTextContent('bilaga.pdf');
    expect(screen.getByRole('button', { name: 'Skicka meddelande' })).toBeEnabled();
    expect(onSent).not.toHaveBeenCalled();
  });
});

it('locks text and attachments during sending and clears only after success', async () => {
  const pending = Promise.withResolvers<undefined>();
  services.createConversation.mockResolvedValue({ id: 'conv-1' });
  services.sendConversationMessage.mockReturnValue(pending.promise);
  const onSent = vi.fn();
  const { container } = renderComposer(onSent);
  await enterMessage('First message');
  fireEvent.click(screen.getByRole('button', { name: 'Skicka meddelande' }));
  await waitFor(() => {
    expect(services.sendConversationMessage).toHaveBeenCalledWith(
      'test-errand',
      'conv-1',
      expect.stringMatching(/^<p>First\smessage<\/p>$/),
      []
    );
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
  expect(editor.textContent).toBe('');
  expect(editor).toHaveAttribute('contenteditable', 'true');
  expect(onSent).toHaveBeenCalledTimes(1);
});

it('preserves text and unlocks after failure so the same message can be retried', async () => {
  services.createConversation.mockResolvedValue({ id: 'conv-1' });
  services.sendConversationMessage.mockRejectedValueOnce(new Error('offline')).mockResolvedValue(undefined);
  const onSent = vi.fn();
  renderComposer(onSent);
  await enterMessage('Keep this');
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

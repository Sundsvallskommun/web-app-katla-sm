import { MessageComposer } from '@components/messages/message-composer.component';
import { createConversation, sendConversationMessage } from '@services/conversation-service/conversation-service';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ snackbar: vi.fn(), t: (key: string) => key }));
vi.mock('@services/conversation-service/conversation-service', () => ({
  createConversation: vi.fn(),
  sendConversationMessage: vi.fn(),
}));
vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: mocks.t }) }));
vi.mock('@sk-web-gui/react', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@sk-web-gui/react')>()),
  useSnackbar: () => mocks.snackbar,
}));
vi.mock('next/dynamic', () => ({
  default:
    () =>
    ({
      value,
      readOnly,
      onChange,
    }: {
      value: { markup: string };
      readOnly: boolean;
      onChange: (event: { target: { value: { markup: string; plainText: string } } }) => void;
    }) => (
      <textarea
        aria-label="Editor"
        value={value.markup}
        readOnly={readOnly}
        onChange={(event) => {
          onChange({
            target: {
              value: {
                markup: event.target.value,
                plainText: event.target.value,
              },
            },
          });
        }}
      />
    ),
}));

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(createConversation).mockResolvedValue({ id: 'conv-1' });
});

it('låser text och bilagor under skickandet och tömmer endast efter framgång', async () => {
  const pending = Promise.withResolvers<undefined>();
  vi.mocked(sendConversationMessage).mockReturnValue(pending.promise);
  const onSent = vi.fn();
  const { container } = render(<MessageComposer errandId="errand-1" errandNumber="REPORT-1" onSent={onSent} />);
  const editor = screen.getByRole('textbox', { name: 'Editor' });
  fireEvent.change(editor, { target: { value: 'First message' } });
  fireEvent.click(screen.getByRole('button', { name: 'messages:send' }));
  await waitFor(() => {
    expect(sendConversationMessage).toHaveBeenCalledWith('errand-1', 'conv-1', 'First message', []);
  });
  expect(editor).toHaveAttribute('readonly');
  expect(container.querySelector('input[type="file"]')).toBeDisabled();
  await userEvent.type(editor, ' unsent addition');
  expect(editor).toHaveValue('First message');
  await act(async () => {
    pending.resolve(undefined);
    await pending.promise;
  });
  expect(editor).toHaveValue('');
  expect(editor).not.toHaveAttribute('readonly');
  expect(onSent).toHaveBeenCalledTimes(1);
});

it('bevarar texten och låser upp formuläret vid fel så samma meddelande kan skickas igen', async () => {
  vi.mocked(sendConversationMessage).mockRejectedValueOnce(new Error('offline')).mockResolvedValue(undefined);
  const onSent = vi.fn();
  render(<MessageComposer errandId="errand-1" errandNumber="REPORT-1" onSent={onSent} />);
  const editor = screen.getByRole('textbox', { name: 'Editor' });
  fireEvent.change(editor, { target: { value: 'Keep this' } });
  fireEvent.click(screen.getByRole('button', { name: 'messages:send' }));
  await screen.findByText('messages:send_error');
  expect(editor).toHaveValue('Keep this');
  expect(editor).not.toHaveAttribute('readonly');
  expect(onSent).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button', { name: 'messages:send' }));
  await waitFor(() => {
    expect(onSent).toHaveBeenCalledTimes(1);
  });
  expect(sendConversationMessage).toHaveBeenCalledTimes(2);
});

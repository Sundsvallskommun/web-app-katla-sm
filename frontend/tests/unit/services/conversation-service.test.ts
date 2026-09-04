import { ConversationMessageDTO } from '@data-contracts/backend/data-contracts';
import {
  byNewestFirst,
  markMessagesAsRead,
  sendConversationMessage,
  unreadMessageIds,
} from '@services/conversation-service/conversation-service';
import { UploadFile } from '@sk-web-gui/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const apiMocks = vi.hoisted(() => ({
  get: vi.fn(),
  patch: vi.fn(),
  post: vi.fn(),
}));

vi.mock('@services/api-service', () => ({
  apiService: apiMocks,
}));

beforeEach(() => {
  vi.clearAllMocks();
  apiMocks.post.mockResolvedValue({ data: undefined });
});

const message = (values: Partial<ConversationMessageDTO>): ConversationMessageDTO => ({
  conversationId: 'conv-1',
  message: 'Hej',
  viewed: false,
  attachments: [],
  ...values,
});

describe('conversation service', () => {
  it('skickar meddelandet som JSON i ett multipartfält, med bilagorna bredvid', async () => {
    const file = { file: new File(['innehåll'], 'bilaga.pdf', { type: 'application/pdf' }) } as UploadFile;

    await sendConversationMessage('errand-1', 'conv-1', '<p>Hej</p>', [file]);

    const [url, formData, config] = apiMocks.post.mock.calls[0] as [string, FormData, { headers: unknown }];
    expect(url).toBe('supportmanagement/errand/errand-1/conversations/conv-1/messages');
    expect(formData.get('message')).toBe(JSON.stringify({ content: '<p>Hej</p>' }));
    expect(formData.getAll('attachments')).toHaveLength(1);
    expect(config.headers).toEqual({ 'Content-Type': 'multipart/form-data' });
  });

  it('gör inget anrop när det inte finns något oläst att markera', async () => {
    await markMessagesAsRead('errand-1', 'conv-1', []);

    expect(apiMocks.post).not.toHaveBeenCalled();
  });

  it('markerar de meddelanden som anges', async () => {
    await markMessagesAsRead('errand-1', 'conv-1', ['msg-1']);

    expect(apiMocks.post).toHaveBeenCalledWith(
      'supportmanagement/errand/errand-1/conversations/conv-1/messages/mark-as-read',
      { messageIds: ['msg-1'] },
      { signal: undefined }
    );
  });
});

describe('unreadMessageIds', () => {
  it('tar med olästa med id och utelämnar lästa', () => {
    const messages = [
      message({ messageId: 'msg-1', viewed: false }),
      message({ messageId: 'msg-2', viewed: true }),
      message({ viewed: false }),
    ];

    expect(unreadMessageIds(messages)).toEqual(['msg-1']);
  });
});

describe('byNewestFirst', () => {
  it('lägger det senaste meddelandet överst', () => {
    const messages = [
      message({ messageId: 'aldst', sent: '2026-09-01T08:00:00Z' }),
      message({ messageId: 'nyast', sent: '2026-09-03T08:00:00Z' }),
      message({ messageId: 'mitten', sent: '2026-09-02T08:00:00Z' }),
    ];

    expect(byNewestFirst(messages).map((item) => item.messageId)).toEqual(['nyast', 'mitten', 'aldst']);
  });

  it('lämnar ursprungslistan orörd', () => {
    const messages = [message({ messageId: 'a', sent: '2026-09-01T08:00:00Z' })];
    const sorted = byNewestFirst(messages);

    expect(sorted).not.toBe(messages);
  });
});

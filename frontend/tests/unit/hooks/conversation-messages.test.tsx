import {
  getConversationMessages,
  getConversations,
  markMessagesAsRead,
} from '@services/conversation-service/conversation-service';
import { renderHook, waitFor } from '@testing-library/react';
import { useConversationMessages } from 'src/hooks/use-conversation-messages';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const conversationMocks = vi.hoisted(() => ({
  getConversations: vi.fn(),
  getConversationMessages: vi.fn(),
  markMessagesAsRead: vi.fn(),
  unreadMessageIds: (messages: { viewed: boolean; messageId?: string }[]) =>
    messages.flatMap((message) => (!message.viewed && message.messageId ? [message.messageId] : [])),
  byNewestFirst: <T,>(messages: T[]) => messages,
}));
const i18nMocks = vi.hoisted(() => ({ t: (key: string) => key }));

vi.mock('@services/conversation-service/conversation-service', () => conversationMocks);
vi.mock('react-i18next', () => ({ useTranslation: () => i18nMocks }));

const getConversationsMock = vi.mocked(getConversations);
const getConversationMessagesMock = vi.mocked(getConversationMessages);
const markMessagesAsReadMock = vi.mocked(markMessagesAsRead);

beforeEach(() => {
  vi.clearAllMocks();
  markMessagesAsReadMock.mockResolvedValue(undefined);
});

/**
 * Tråden hämtas i två steg: samtalet först, meddelandena sedan. Att den visats är det som gör
 * meddelandena lästa, vilket är det handläggarens vy räknar olästa på.
 */
describe('useConversationMessages', () => {
  it('hämtar meddelandena i ärendets samtal', async () => {
    getConversationsMock.mockResolvedValue([{ id: 'conv-1', topic: 'Rapport' }]);
    getConversationMessagesMock.mockResolvedValue([
      { conversationId: 'conv-1', messageId: 'msg-1', message: 'Hej', viewed: true, attachments: [] },
    ]);

    const { result } = renderHook(() => useConversationMessages('errand-1'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    expect(result.current.messages).toHaveLength(1);
    expect(result.current.conversationId).toBe('conv-1');
  });

  it('markerar de olästa som lästa när tråden visats', async () => {
    getConversationsMock.mockResolvedValue([{ id: 'conv-1' }]);
    getConversationMessagesMock.mockResolvedValue([
      { conversationId: 'conv-1', messageId: 'msg-1', message: 'Hej', viewed: false, attachments: [] },
      { conversationId: 'conv-1', messageId: 'msg-2', message: 'Läst', viewed: true, attachments: [] },
    ]);

    const { result } = renderHook(() => useConversationMessages('errand-1'));

    await waitFor(() => {
      expect(markMessagesAsReadMock).toHaveBeenCalledWith('errand-1', 'conv-1', ['msg-1']);
    });
    expect(result.current.error).toBeNull();
  });

  it('visar tråden även när läsmarkeringen misslyckas', async () => {
    getConversationsMock.mockResolvedValue([{ id: 'conv-1' }]);
    getConversationMessagesMock.mockResolvedValue([
      { conversationId: 'conv-1', messageId: 'msg-1', message: 'Hej', viewed: false, attachments: [] },
    ]);
    markMessagesAsReadMock.mockRejectedValue(new Error('mark failed'));

    const { result } = renderHook(() => useConversationMessages('errand-1'));

    await waitFor(() => {
      expect(result.current.messages).toHaveLength(1);
    });
    expect(result.current.error).toBeNull();
  });

  it('hämtar inga meddelanden innan samtalet finns', async () => {
    getConversationsMock.mockResolvedValue([]);

    const { result } = renderHook(() => useConversationMessages('errand-1'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    expect(getConversationMessagesMock).not.toHaveBeenCalled();
    expect(result.current.messages).toEqual([]);
    expect(result.current.conversationId).toBeNull();
  });

  it('rapporterar ett fel när tråden inte kan hämtas', async () => {
    getConversationsMock.mockRejectedValue(new Error('upstream unavailable'));

    const { result } = renderHook(() => useConversationMessages('errand-1'));

    await waitFor(() => {
      expect(result.current.error).toBe('messages:load_error');
    });
  });

  it('hämtar ingenting innan ärendet är känt', () => {
    renderHook(() => useConversationMessages(undefined));

    expect(getConversationsMock).not.toHaveBeenCalled();
  });
});

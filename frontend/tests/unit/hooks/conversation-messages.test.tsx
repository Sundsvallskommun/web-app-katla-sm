import { ConversationMessageDTO, ConversationMessagesPageDTO } from '@data-contracts/backend/data-contracts';
import {
  getConversationMessages,
  getConversations,
  markMessagesAsRead,
} from '@services/conversation-service/conversation-service';
import { act, renderHook, waitFor } from '@testing-library/react';
import { useConversationMessages } from 'src/hooks/use-conversation-messages';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@services/conversation-service/conversation-service', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@services/conversation-service/conversation-service')>()),
  getConversations: vi.fn(),
  getConversationMessages: vi.fn(),
  markMessagesAsRead: vi.fn(),
}));
const translations = vi.hoisted(() => ({ t: (key: string) => key }));
vi.mock('react-i18next', () => ({ useTranslation: () => translations }));
const conversations = vi.mocked(getConversations);
const messages = vi.mocked(getConversationMessages);
const markRead = vi.mocked(markMessagesAsRead);
const message = (id: string, conversationId = 'conv-1'): ConversationMessageDTO => ({
  conversationId,
  messageId: id,
  message: id,
  viewed: false,
  attachments: [],
});
const page = (items: ConversationMessageDTO[], page = 0, hasMore = false): ConversationMessagesPageDTO => ({
  messages: items,
  page,
  hasMore,
});

beforeEach(() => {
  vi.resetAllMocks();
  conversations.mockResolvedValue([{ id: 'conv-1' }]);
  messages.mockResolvedValue(page([message('msg-1')]));
  markRead.mockResolvedValue(undefined);
});
afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

const settled = async (result: { current: ReturnType<typeof useConversationMessages> }) => {
  await waitFor(() => {
    expect(result.current.isLoading || result.current.isRefreshing || result.current.isLoadingMore).toBe(false);
  });
};

describe('conversation history', () => {
  it('läser historik från samtliga rapportörssamtal och kvitterar rätt tråd', async () => {
    conversations.mockResolvedValue([{ id: 'conv-1' }, { id: 'conv-2' }]);
    messages.mockImplementation((_id, conversationId) =>
      Promise.resolve(page([message('same-message-id', conversationId)]))
    );
    const { result } = renderHook(() => useConversationMessages('errand-1'));
    await settled(result);
    expect(result.current.messages.map((m) => m.conversationId)).toEqual(['conv-1', 'conv-2']);
    expect(markRead).toHaveBeenCalledWith('errand-1', 'conv-1', ['same-message-id'], expect.any(AbortSignal));
    expect(markRead).toHaveBeenCalledWith('errand-1', 'conv-2', ['same-message-id'], expect.any(AbortSignal));
  });

  it('låter en sida med enbart systemhändelser följas av äldre meddelanden', async () => {
    messages.mockImplementation((_errand, _conversation, requestedPage) =>
      Promise.resolve(requestedPage === 0 ? page([], 0, true) : page([message('older')], 1))
    );
    const { result } = renderHook(() => useConversationMessages('errand-1'));
    await settled(result);
    expect(result.current.hasMore).toBe(true);
    expect(result.current.messages).toEqual([]);
    act(() => {
      result.current.loadMore();
    });
    await waitFor(() => {
      expect(result.current.messages.map((m) => m.messageId)).toEqual(['older']);
    });
    await settled(result);
    expect(result.current.hasMore).toBe(false);
  });

  it('läser om sidgränser efter nya svar och visar varje meddelande en gång', async () => {
    messages.mockImplementation((_e, _c, requestedPage) =>
      Promise.resolve(requestedPage === 0 ? page([message('a')], 0, true) : page([message('b')], 1))
    );
    const { result } = renderHook(() => useConversationMessages('errand-1'));
    await settled(result);
    act(() => {
      result.current.loadMore();
    });
    await waitFor(() => {
      expect(result.current.messages).toHaveLength(2);
    });
    await settled(result);
    messages.mockImplementation((_e, _c, requestedPage) =>
      Promise.resolve(
        requestedPage === 0 ? page([message('new'), message('a')], 0, true) : page([message('a'), message('b')], 1)
      )
    );
    act(() => {
      result.current.reload();
    });
    await waitFor(() => {
      expect(result.current.messages.map((m) => m.messageId)).toEqual(['new', 'a', 'b']);
    });
  });

  it('försöker ett misslyckat läskvitto igen men upprepar inte kvitterade läsningar', async () => {
    markRead.mockRejectedValueOnce(new Error('offline'));
    const { result } = renderHook(() => useConversationMessages('errand-1'));
    await settled(result);
    expect(result.current.messages).toHaveLength(1);
    expect(result.current.error).toBeNull();
    act(() => {
      result.current.reload();
    });
    await waitFor(() => {
      expect(markRead).toHaveBeenCalledTimes(2);
    });
    await settled(result);
    act(() => {
      result.current.reload();
    });
    await waitFor(() => {
      expect(messages).toHaveBeenCalledTimes(3);
    });
    await settled(result);
    expect(markRead).toHaveBeenCalledTimes(2);
  });

  it('behåller historiken vid uppdateringsfel och tillåter nytt försök', async () => {
    const { result } = renderHook(() => useConversationMessages('errand-1'));
    await settled(result);
    messages.mockRejectedValueOnce(new Error('offline'));
    act(() => {
      result.current.reload();
    });
    await waitFor(() => {
      expect(result.current.error).toBe('messages:load_error');
    });
    expect(result.current.messages).toHaveLength(1);
    act(() => {
      result.current.reload();
    });
    await settled(result);
    expect(result.current.error).toBeNull();
  });

  it('hämtar inget när ärendet saknas och avslutar laddningen för ett tomt ärende', async () => {
    const { result, rerender } = renderHook(({ id }) => useConversationMessages(id), {
      initialProps: { id: undefined as string | undefined },
    });
    expect(conversations).not.toHaveBeenCalled();
    expect(result.current.isLoading).toBe(false);
    conversations.mockResolvedValue([]);
    rerender({ id: 'errand-1' });
    await settled(result);
    expect(result.current.messages).toEqual([]);
    expect(messages).not.toHaveBeenCalled();
  });

  it('avbryter gammal hämtning och ignorerar sena svar vid byte av ärende', async () => {
    const pending = Promise.withResolvers<ConversationMessagesPageDTO>();
    messages.mockReturnValueOnce(pending.promise);
    const { result, rerender } = renderHook(({ id }) => useConversationMessages(id), {
      initialProps: { id: 'errand-1' },
    });
    await waitFor(() => {
      expect(messages).toHaveBeenCalledTimes(1);
    });
    const signal = messages.mock.calls[0]?.[3];
    conversations.mockResolvedValue([]);
    rerender({ id: 'errand-2' });
    await settled(result);
    expect(signal?.aborted).toBe(true);
    await act(async () => {
      pending.resolve(page([message('old')]));
      await pending.promise;
    });
    expect(result.current.messages).toEqual([]);
    expect(markRead).not.toHaveBeenCalled();
  });

  it('köar uppdateringen efter skickande när en hämtning redan pågår', async () => {
    const pending = Promise.withResolvers<ConversationMessagesPageDTO>();
    messages.mockReturnValueOnce(pending.promise);
    const { result } = renderHook(() => useConversationMessages('errand-1'));
    await waitFor(() => {
      expect(messages).toHaveBeenCalledTimes(1);
    });
    act(() => {
      result.current.reload();
    });
    await act(async () => {
      pending.resolve(page([]));
      await pending.promise;
    });
    await waitFor(() => {
      expect(result.current.messages.map((m) => m.messageId)).toEqual(['msg-1']);
    });
    expect(messages).toHaveBeenCalledTimes(2);
  });

  it('hämtar nya svar vid fokus och återanslutning', async () => {
    const { result } = renderHook(() => useConversationMessages('errand-1'));
    await settled(result);
    messages.mockResolvedValue(page([message('reply')]));
    act(() => {
      window.dispatchEvent(new Event('focus'));
    });
    await waitFor(() => {
      expect(result.current.messages[0]?.messageId).toBe('reply');
    });
    await settled(result);
    act(() => {
      window.dispatchEvent(new Event('online'));
    });
    await waitFor(() => {
      expect(messages).toHaveBeenCalledTimes(3);
    });
  });

  it('pollning hoppar över dold sida och upphör efter avmontering', async () => {
    const { result, unmount } = renderHook(() => useConversationMessages('errand-1'));
    await settled(result);
    vi.useFakeTimers();
    // Montera om med timerkontrollen aktiv.
    unmount();
    const second = renderHook(() => useConversationMessages('errand-1'));
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });
    const before = messages.mock.calls.length;
    vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('hidden');
    await act(async () => {
      await vi.advanceTimersByTimeAsync(30_000);
    });
    expect(messages).toHaveBeenCalledTimes(before);
    vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('visible');
    await act(async () => {
      await vi.advanceTimersByTimeAsync(30_000);
    });
    expect(messages).toHaveBeenCalledTimes(before + 1);
    second.unmount();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(60_000);
    });
    expect(messages).toHaveBeenCalledTimes(before + 1);
  });
});

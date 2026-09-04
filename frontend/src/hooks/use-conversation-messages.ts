'use client';

import { ConversationMessageDTO, ConversationMessagesPageDTO } from '@data-contracts/backend/data-contracts';
import {
  byNewestFirst,
  getConversationMessages,
  getConversations,
  markMessagesAsRead,
  unreadMessageIds,
} from '@services/conversation-service/conversation-service';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

type LoadKind = 'refresh' | 'more';
type HistoryPages = Map<string, ConversationMessagesPageDTO[]>;

interface HistoryState {
  errandId?: string;
  messages: ConversationMessageDTO[];
  hasMore: boolean;
  activity: 'initial' | LoadKind | null;
  failed: boolean;
}

const messageKey = (message: ConversationMessageDTO): string => `${message.conversationId}:${message.messageId ?? ''}`;

async function loadConversationPages(
  errandId: string,
  conversationId: string,
  previousPages: ConversationMessagesPageDTO[] | undefined,
  kind: LoadKind,
  signal: AbortSignal
): Promise<ConversationMessagesPageDTO[]> {
  const lastPage = previousPages?.at(-1);
  const count = (previousPages?.length ?? 1) + (kind === 'more' && lastPage?.hasMore ? 1 : 0);
  const loaded: ConversationMessagesPageDTO[] = [];
  for (let page = 0; page < count; page += 1) {
    const result = await getConversationMessages(errandId, conversationId, page, signal);
    signal.throwIfAborted();
    loaded.push(result);
    if (!result.hasMore) break;
  }
  return loaded;
}

async function acknowledgeHistory(
  errandId: string,
  pages: HistoryPages,
  messages: ConversationMessageDTO[],
  read: Set<string>,
  signal: AbortSignal
): Promise<void> {
  for (const [conversationId] of pages) {
    if (signal.aborted || document.visibilityState !== 'visible') return;
    const unread = unreadMessageIds(messages.filter((message) => message.conversationId === conversationId));
    if (unread.length === 0) continue;
    try {
      await markMessagesAsRead(errandId, conversationId, unread, signal);
      if (signal.aborted) return;
      // Bara kvitterade läsningar spärrar nya försök. Fel provas igen vid nästa uppdatering.
      unread.forEach((id) => read.add(`${conversationId}:${id}`));
    } catch {
      // Historiken är användbar även när läskvittot inte nådde fram.
    }
  }
}

/**
 * Äger historik, sidladdning och läskvitton för ett ärende. Varje uppdatering läser om de sidor
 * som redan visas: nya meddelanden förskjuter sidgränserna, så äldre sidor får inte fogas till
 * en inaktuell förstasida. Samtalens identiteter följer med hela vägen till bilagor och läskvitton.
 */
export function useConversationMessages(errandId: string | undefined) {
  const { t } = useTranslation();
  const [state, setState] = useState<HistoryState>({ messages: [], hasMore: false, activity: null, failed: false });
  const [request, setRequest] = useState<{ sequence: number; kind: LoadKind }>({ sequence: 0, kind: 'refresh' });
  const history = useRef<{ errandId: string; pages: HistoryPages; read: Set<string> } | null>(null);
  const busy = useRef(false);
  const refreshQueued = useRef(false);

  const requestLoad = useCallback((kind: LoadKind, queue = false) => {
    if (busy.current) {
      if (queue) refreshQueued.current = true;
      return;
    }
    busy.current = true;
    setRequest((previous) => ({ sequence: previous.sequence + 1, kind }));
  }, []);

  const reload = useCallback(() => {
    requestLoad('refresh', true);
  }, [requestLoad]);
  const loadMore = useCallback(() => {
    requestLoad('more');
  }, [requestLoad]);

  useEffect(() => {
    if (!errandId) return;
    const controller = new AbortController();
    const { signal } = controller;
    const previous = history.current?.errandId === errandId ? history.current : null;
    const read = previous?.read ?? new Set<string>();
    busy.current = true;
    setState((current) => ({
      errandId,
      messages: current.errandId === errandId ? current.messages : [],
      hasMore: current.errandId === errandId && current.hasMore,
      activity: previous ? request.kind : 'initial',
      failed: false,
    }));

    const load = async () => {
      const conversations = await getConversations(errandId, signal);
      const pages: HistoryPages = new Map();
      for (const conversation of conversations) {
        if (signal.aborted) return;
        if (!conversation.id) throw new Error('Conversation without id');
        const loaded = await loadConversationPages(
          errandId,
          conversation.id,
          previous?.pages.get(conversation.id),
          request.kind,
          signal
        );
        pages.set(conversation.id, loaded);
      }
      if (signal.aborted) return;

      // Samma meddelande kan hamna på två sidor om ett nytt anländer mellan anropen.
      const distinct = new Map<string, ConversationMessageDTO>();
      for (const page of [...pages.values()].flat()) {
        for (const message of page.messages) {
          distinct.set(messageKey(message), read.has(messageKey(message)) ? { ...message, viewed: true } : message);
        }
      }
      const messages = byNewestFirst([...distinct.values()]);
      history.current = { errandId, pages, read };
      setState({
        errandId,
        messages,
        hasMore: [...pages.values()].some((items) => items.at(-1)?.hasMore),
        activity: request.kind,
        failed: false,
      });

      await acknowledgeHistory(errandId, pages, messages, read, signal);
    };

    void load()
      .catch(() => {
        if (!signal.aborted) setState((current) => ({ ...current, failed: true }));
      })
      .finally(() => {
        if (signal.aborted) return;
        busy.current = false;
        setState((current) => ({ ...current, activity: null }));
        // Ett skickat meddelande måste följas av en färsk hämtning även om en annan pågick.
        if (refreshQueued.current) {
          refreshQueued.current = false;
          requestLoad('refresh');
        }
      });

    return () => {
      controller.abort();
      busy.current = false;
      refreshQueued.current = false;
    };
  }, [errandId, request, requestLoad]);

  useEffect(() => {
    if (!errandId) return;
    const refreshVisible = () => {
      if (document.visibilityState === 'visible') requestLoad('refresh');
    };
    const interval = window.setInterval(refreshVisible, 30_000);
    window.addEventListener('focus', refreshVisible);
    window.addEventListener('online', refreshVisible);
    document.addEventListener('visibilitychange', refreshVisible);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener('focus', refreshVisible);
      window.removeEventListener('online', refreshVisible);
      document.removeEventListener('visibilitychange', refreshVisible);
    };
  }, [errandId, requestLoad]);

  const current = state.errandId === errandId;
  return {
    messages: current ? state.messages : [],
    isLoading: !!errandId && (!current || state.activity === 'initial'),
    isRefreshing: current && state.activity === 'refresh',
    isLoadingMore: current && state.activity === 'more',
    hasMore: current && state.hasMore,
    error: current && state.failed ? t('messages:load_error') : null,
    reload,
    loadMore,
  };
}

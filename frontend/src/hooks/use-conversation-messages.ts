'use client';

import { ConversationMessageDTO } from '@data-contracts/backend/data-contracts';
import {
  byNewestFirst,
  getConversationMessages,
  getConversations,
  markMessagesAsRead,
  unreadMessageIds,
} from '@services/conversation-service/conversation-service';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

interface UseConversationMessagesResult {
  messages: ConversationMessageDTO[];
  conversationId: string | null;
  isLoading: boolean;
  error: string | null;
  reload: () => void;
}

/**
 * Tråden på ärendet. Ärendet har ett samtal, men listan hämtas ändå: samtalet finns inte förrän
 * någon skrivit det första meddelandet, och det kan lika gärna vara handläggaren som gjort det.
 */
export function useConversationMessages(errandId: string | undefined): UseConversationMessagesResult {
  const { t } = useTranslation();
  const [messages, setMessages] = useState<ConversationMessageDTO[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);
  // Läsmarkeringen görs en gång per tråd och laddning, inte om vid varje omrendering.
  const markedAsReadRef = useRef<string | null>(null);

  const reload = useCallback(() => {
    setReloadToken((token) => token + 1);
  }, []);

  useEffect(() => {
    if (!errandId) return;

    let active = true;
    setIsLoading(true);
    setError(null);

    const load = async () => {
      const conversations = await getConversations(errandId);
      const conversation = conversations[0];
      if (!conversation?.id) {
        return { conversationId: null, messages: [] as ConversationMessageDTO[] };
      }

      const loaded = await getConversationMessages(errandId, conversation.id);
      return { conversationId: conversation.id, messages: loaded };
    };

    void load()
      .then((result) => {
        if (!active) return;
        setConversationId(result.conversationId);
        setMessages(byNewestFirst(result.messages));

        // Att tråden visats är det som gör meddelandena lästa. Misslyckas markeringen är det inte
        // värt ett felmeddelande: meddelandena syns, och nästa besök försöker igen.
        const unread = unreadMessageIds(result.messages);
        const markKey = `${result.conversationId ?? ''}:${unread.join(',')}`;
        if (result.conversationId && unread.length > 0 && markedAsReadRef.current !== markKey) {
          markedAsReadRef.current = markKey;
          void markMessagesAsRead(errandId, result.conversationId, unread).catch(() => undefined);
        }
      })
      .catch(() => {
        if (active) setError(t('messages:load_error'));
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [errandId, reloadToken, t]);

  return { messages, conversationId, isLoading, error, reload };
}

'use client';

import { Button } from '@astryxdesign/core/Button';
import { Divider } from '@astryxdesign/core/Divider';
import { Heading } from '@astryxdesign/core/Heading';
import { IconButton } from '@astryxdesign/core/IconButton';
import { SegmentedControl, SegmentedControlItem } from '@astryxdesign/core/SegmentedControl';
import { Stack } from '@astryxdesign/core/Stack';
import { Text } from '@astryxdesign/core/Text';
import { MessageComposer } from '@components/messages/message-composer.component';
import { MessageItem } from '@components/messages/message-item.component';
import { ErrorAlertList } from '@components/misc/error-alert.component';
import { LinkButton } from '@components/navigation/link-button.component';
import { ErrandFormDTO } from '@interfaces/errand-form';
import { PenLine, RefreshCw } from 'lucide-react';
import { useState } from 'react';
import { useFormContext } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useConversationMessages } from 'src/hooks/use-conversation-messages';

import { MessageListSkeleton } from './message-list-skeleton.component';

const MESSAGE_FILTERS = ['ALL', 'INBOUND', 'OUTBOUND'] as const;
type MessageFilter = (typeof MESSAGE_FILTERS)[number];

const FILTER_LABEL_KEYS: Record<MessageFilter, string> = {
  ALL: 'messages:filter_all',
  INBOUND: 'messages:filter_received',
  OUTBOUND: 'messages:filter_sent',
};

export const ErrandMessages: React.FC = () => {
  const { t } = useTranslation();
  const { watch } = useFormContext<ErrandFormDTO>();
  const errandId = watch('id');
  const errandNumber = watch('errandNumber');
  const [filter, setFilter] = useState<MessageFilter>('ALL');
  const [attachmentError, setAttachmentError] = useState<string | null>(null);

  const { messages, isLoading, isRefreshing, isLoadingMore, hasMore, error, reload, loadMore } =
    useConversationMessages(errandId);

  const visibleMessages = filter === 'ALL' ? messages : messages.filter((message) => message.direction === filter);
  const showEmptyState = visibleMessages.length === 0 && !hasMore && !error;
  const errors = [error, attachmentError].filter((message): message is string => message !== null);

  return (
    <Stack gap={6}>
      <Stack gap={3}>
        <Heading level={2}>{t('messages:title')}</Heading>
        <Text color="secondary">{t('messages:description')}</Text>
        <Stack direction="horizontal" align="center" justify="between" gap={3} wrap="wrap">
          <LinkButton
            href="#message-body"
            variant="secondary"
            size="lg"
            icon={<PenLine aria-hidden="true" />}
            label={t('messages:compose_action')}
          />
          <IconButton
            variant="ghost"
            size="lg"
            icon={<RefreshCw aria-hidden="true" />}
            label={t('messages:refresh')}
            onClick={reload}
            isDisabled={isLoading || isRefreshing || isLoadingMore}
            isLoading={isRefreshing}
          />
        </Stack>
        <SegmentedControl
          data-cy="message-filter"
          label={t('messages:filter_label')}
          value={filter}
          size="lg"
          layout="fill"
          onChange={(value) => {
            const selected = MESSAGE_FILTERS.find((option) => option === value);
            if (selected) setFilter(selected);
          }}
        >
          {MESSAGE_FILTERS.map((option) => (
            <SegmentedControlItem key={option} value={option} label={t(FILTER_LABEL_KEYS[option])} />
          ))}
        </SegmentedControl>
      </Stack>
      <ErrorAlertList messages={errors} />
      <Text role="status" className="sr-only">
        {isLoading ? t('messages:loading') : ''}
      </Text>
      <Stack role="region" aria-label={t('messages:title')} aria-busy={isLoading}>
        {isLoading ?
          <MessageListSkeleton />
        : showEmptyState ?
          <Text data-cy="no-messages" color="secondary">
            {t('messages:empty')}
          </Text>
        : <Stack data-cy="message-list" className="divide-y divide-default">
            {visibleMessages.map((message) => (
              <MessageItem
                key={`${message.conversationId}:${message.messageId ?? message.sent}`}
                message={message}
                errandId={errandId ?? ''}
                onError={setAttachmentError}
              />
            ))}
          </Stack>
        }
      </Stack>
      {hasMore && (
        <Button
          variant="secondary"
          size="lg"
          label={t('messages:load_more')}
          onClick={loadMore}
          isLoading={isLoadingMore}
          isDisabled={isLoading || isRefreshing || isLoadingMore}
        />
      )}
      <Divider />
      {errandId && errandNumber && <MessageComposer errandId={errandId} errandNumber={errandNumber} onSent={reload} />}
    </Stack>
  );
};

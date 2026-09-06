'use client';

import { Button } from '@astryxdesign/core/Button';
import { Divider } from '@astryxdesign/core/Divider';
import { RadioList, RadioListItem } from '@astryxdesign/core/RadioList';
import { Spinner } from '@astryxdesign/core/Spinner';
import { MessageComposer } from '@components/messages/message-composer.component';
import { MessageItem } from '@components/messages/message-item.component';
import { ErrorAlertList } from '@components/misc/error-alert.component';
import { SectionHeader } from '@components/misc/section-header.component';
import { ErrandFormDTO } from '@interfaces/errand-form';
import { RefreshCw } from 'lucide-react';
import { useState } from 'react';
import { useFormContext } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useConversationMessages } from 'src/hooks/use-conversation-messages';

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
    <div className="flex flex-col gap-8">
      <SectionHeader title={t('messages:title')} description={t('messages:description')} />

      <ErrorAlertList messages={errors} />

      {errandId && errandNumber && <MessageComposer errandId={errandId} errandNumber={errandNumber} onSent={reload} />}

      <Divider />

      <div>
        <Button
          variant="secondary"
          icon={<RefreshCw aria-hidden="true" />}
          label={t('messages:refresh')}
          onClick={reload}
          isDisabled={isLoading || isRefreshing || isLoadingMore}
          isLoading={isRefreshing}
        />
      </div>
      <div data-cy="message-filter">
        <RadioList
          label={t('messages:filter_label')}
          className="[&_[role=radiogroup]]:flex-wrap"
          isLabelHidden
          orientation="horizontal"
          value={filter}
          onChange={(value) => {
            const selected = MESSAGE_FILTERS.find((option) => option === value);
            if (selected) setFilter(selected);
          }}
        >
          {MESSAGE_FILTERS.map((option) => (
            <RadioListItem key={option} value={option} label={t(FILTER_LABEL_KEYS[option])} />
          ))}
        </RadioList>
      </div>

      {isLoading ?
        <div role="status" aria-live="polite" className="flex justify-center py-10">
          <Spinner aria-hidden="true" />
          <span className="sr-only">{t('messages:loading')}</span>
        </div>
      : showEmptyState ?
        <p data-cy="no-messages" className="text-muted py-6">
          {t('messages:empty')}
        </p>
      : <div className="flex flex-col gap-4" data-cy="message-list">
          {visibleMessages.map((message) => (
            <MessageItem
              key={`${message.conversationId}:${message.messageId ?? message.sent}`}
              message={message}
              errandId={errandId ?? ''}
              onError={setAttachmentError}
            />
          ))}
        </div>
      }
      {hasMore && (
        <div>
          <Button
            variant="secondary"
            label={t('messages:load_more')}
            onClick={loadMore}
            isLoading={isLoadingMore}
            isDisabled={isLoading || isRefreshing || isLoadingMore}
          />
        </div>
      )}
    </div>
  );
};

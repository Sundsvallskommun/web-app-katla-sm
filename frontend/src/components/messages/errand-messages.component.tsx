'use client';

import { MessageComposer } from '@components/messages/message-composer.component';
import { MessageItem } from '@components/messages/message-item.component';
import { ErrorAlertList } from '@components/misc/error-alert.component';
import { SectionHeader } from '@components/misc/section-header.component';
import { ErrandFormDTO } from '@interfaces/errand-form';
import { Divider, RadioButton, Spinner } from '@sk-web-gui/react';
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

  const { messages, isLoading, error, reload } = useConversationMessages(errandId);

  const visibleMessages = filter === 'ALL' ? messages : messages.filter((message) => message.direction === filter);
  const errors = [error, attachmentError].filter((message): message is string => message !== null);

  return (
    <div className="flex flex-col gap-32">
      <SectionHeader title={t('messages:title')} description={t('messages:description')} />

      <ErrorAlertList messages={errors} />

      {errandId && errandNumber && <MessageComposer errandId={errandId} errandNumber={errandNumber} onSent={reload} />}

      <Divider />

      <RadioButton.Group inline data-cy="message-filter">
        {MESSAGE_FILTERS.map((option) => (
          <RadioButton
            key={option}
            value={option}
            checked={filter === option}
            onChange={() => {
              setFilter(option);
            }}
          >
            {t(FILTER_LABEL_KEYS[option])}
          </RadioButton>
        ))}
      </RadioButton.Group>

      {isLoading ?
        <div role="status" aria-live="polite" className="flex justify-center py-40">
          <Spinner aria-hidden="true" />
          <span className="sr-only">{t('messages:loading')}</span>
        </div>
      : visibleMessages.length === 0 ?
        <p data-cy="no-messages" className="text-dark-secondary py-24">
          {t('messages:empty')}
        </p>
      : <div className="flex flex-col gap-16" data-cy="message-list">
          {visibleMessages.map((message) => (
            <MessageItem
              key={message.messageId ?? message.sent}
              message={message}
              errandId={errandId ?? ''}
              onError={setAttachmentError}
            />
          ))}
        </div>
      }
    </div>
  );
};

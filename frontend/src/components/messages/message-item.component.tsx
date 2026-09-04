'use client';

import { ConversationMessageAttachmentDTO, ConversationMessageDTO } from '@data-contracts/backend/data-contracts';
import { getConversationAttachment } from '@services/conversation-service/conversation-service';
import { Avatar, Button, Label } from '@sk-web-gui/react';
import { sanitizeMessage } from '@utils/sanitize-message';
import dayjs from 'dayjs';
import { Paperclip } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

const initials = (firstName?: string, lastName?: string): string =>
  `${firstName?.[0] ?? ''}${lastName?.[0] ?? ''}`.toUpperCase();

/** Filen kommer base64-kodad; webbläsaren behöver en blob för att kunna spara den. */
const toBlob = (base64: string, contentType: string): Blob => {
  const binary = atob(base64);
  const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
  return new Blob([bytes], { type: contentType });
};

const AttachmentButton: React.FC<{
  attachment: ConversationMessageAttachmentDTO;
  errandId: string;
  message: ConversationMessageDTO;
  onError: (message: string) => void;
}> = ({ attachment, errandId, message, onError }) => {
  const { t } = useTranslation();
  const [isDownloading, setIsDownloading] = useState(false);

  const download = async () => {
    if (!message.messageId) return;
    setIsDownloading(true);
    try {
      const file = await getConversationAttachment(
        errandId,
        message.conversationId,
        message.messageId,
        attachment.attachmentId
      );
      const url = URL.createObjectURL(toBlob(file.content, attachment.contentType ?? 'application/octet-stream'));
      const link = document.createElement('a');
      link.href = url;
      link.download = attachment.name ?? t('messages:attachment_fallback_name');
      link.click();
      URL.revokeObjectURL(url);
    } catch {
      onError(t('messages:attachment_error'));
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <Button
      data-cy="message-attachment"
      variant="tertiary"
      size="sm"
      leftIcon={<Paperclip size={16} aria-hidden="true" />}
      loading={isDownloading}
      onClick={() => {
        void download();
      }}
    >
      {attachment.name ?? t('messages:attachment_fallback_name')}
    </Button>
  );
};

export const MessageItem: React.FC<{
  message: ConversationMessageDTO;
  errandId: string;
  onError: (message: string) => void;
}> = ({ message, errandId, onError }) => {
  const { t } = useTranslation();
  const isOutbound = message.direction === 'OUTBOUND';
  const senderName = [message.firstName, message.lastName].filter(Boolean).join(' ');

  return (
    <article
      data-cy="message"
      className="bg-background-content border-1 rounded-utility flex w-full flex-col gap-16 p-16 md:p-24"
    >
      <header className="flex flex-wrap items-center gap-12">
        <Avatar size="sm" initials={initials(message.firstName, message.lastName)} aria-hidden="true" />
        <div className="flex min-w-0 flex-col">
          <span className="font-semibold break-words">{senderName || t('messages:unknown_sender')}</span>
          {message.sent && (
            <time className="text-small text-dark-secondary" dateTime={message.sent}>
              {dayjs(message.sent).format('YYYY-MM-DD, HH:mm')}
            </time>
          )}
        </div>
        <Label rounded inverted color={isOutbound ? 'vattjom' : 'gronsta'} className="ml-auto whitespace-nowrap">
          {isOutbound ? t('messages:direction_sent') : t('messages:direction_received')}
        </Label>
      </header>

      {/* Texten är HTML från en skrivruta och saneras innan den renderas. */}
      <div
        data-cy="message-body"
        className="break-words [&_p]:mb-8 [&_ul]:list-disc [&_ol]:list-decimal [&_li]:ml-24"
        dangerouslySetInnerHTML={{ __html: sanitizeMessage(message.message) }}
      />

      {message.attachments.length > 0 && (
        <div className="flex flex-wrap gap-8">
          {message.attachments.map((attachment) => (
            <AttachmentButton
              key={attachment.attachmentId}
              attachment={attachment}
              errandId={errandId}
              message={message}
              onError={onError}
            />
          ))}
        </div>
      )}
    </article>
  );
};

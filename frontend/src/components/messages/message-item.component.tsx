'use client';

import { Avatar } from '@astryxdesign/core/Avatar';
import { Badge } from '@astryxdesign/core/Badge';
import { Button } from '@astryxdesign/core/Button';
import { Card } from '@astryxdesign/core/Card';
import { ConversationMessageAttachmentDTO, ConversationMessageDTO } from '@data-contracts/backend/data-contracts';
import { getConversationAttachment } from '@services/conversation-service/conversation-service';
import { sanitizeMessage } from '@utils/sanitize-message';
import dayjs from 'dayjs';
import { Paperclip } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

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
      variant="secondary"
      size="sm"
      icon={<Paperclip size={16} aria-hidden="true" />}
      isLoading={isDownloading}
      onClick={() => {
        void download();
      }}
      label={attachment.name ?? t('messages:attachment_fallback_name')}
    />
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
    <article data-cy="message">
      <Card padding={6}>
        <div className="flex min-w-0 flex-col gap-4">
          <header className="flex flex-wrap items-center gap-3">
            <Avatar size="sm" name={senderName} tooltip={false} aria-hidden="true" />
            <div className="flex min-w-0 flex-col">
              <span className="font-semibold break-words">{senderName || t('messages:unknown_sender')}</span>
              {message.sent && (
                <time className="text-sm text-muted" dateTime={message.sent}>
                  {dayjs(message.sent).format('YYYY-MM-DD, HH:mm')}
                </time>
              )}
            </div>
            <Badge
              variant={isOutbound ? 'info' : 'neutral'}
              className="ml-auto whitespace-nowrap"
              label={isOutbound ? t('messages:direction_sent') : t('messages:direction_received')}
            />
          </header>

          {/* Texten är HTML från en skrivruta och saneras innan den renderas. */}
          <div
            data-cy="message-body"
            className="break-words [&_p]:mb-2 [&_ul]:list-disc [&_ol]:list-decimal [&_li]:ml-6"
            dangerouslySetInnerHTML={{ __html: sanitizeMessage(message.message) }}
          />

          {message.attachments.length > 0 && (
            <div className="flex flex-wrap gap-2">
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
        </div>
      </Card>
    </article>
  );
};

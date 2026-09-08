'use client';

import { Avatar } from '@astryxdesign/core/Avatar';
import { Button } from '@astryxdesign/core/Button';
import { Stack } from '@astryxdesign/core/Stack';
import { Text } from '@astryxdesign/core/Text';
import { Token } from '@astryxdesign/core/Token';
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
    <Stack as="article" data-cy="message" gap={4} paddingBlock={4}>
      <Stack as="header" direction="horizontal" wrap="wrap" align="center" gap={3}>
        <Avatar size="sm" name={senderName} tooltip={false} aria-hidden="true" />
        <Stack gap={1} className="min-w-0">
          <Text weight="semibold" className="break-words">
            {senderName || t('messages:unknown_sender')}
          </Text>
          {message.sent && (
            <Text color="secondary" type="supporting">
              <time dateTime={message.sent}>{dayjs(message.sent).format('YYYY-MM-DD, HH:mm')}</time>
            </Text>
          )}
        </Stack>
        <Token
          color={isOutbound ? 'blue' : 'default'}
          className="ml-auto whitespace-nowrap"
          label={isOutbound ? t('messages:direction_sent') : t('messages:direction_received')}
        />
      </Stack>

      {/* Texten är HTML från en skrivruta och saneras innan den renderas. */}
      <section
        data-cy="message-body"
        className="break-words [&_p]:mb-2 [&_ul]:list-disc [&_ol]:list-decimal [&_li]:ml-6"
        dangerouslySetInnerHTML={{ __html: sanitizeMessage(message.message) }}
      />

      {message.attachments.length > 0 && (
        <Stack direction="horizontal" wrap="wrap" gap={2}>
          {message.attachments.map((attachment) => (
            <AttachmentButton
              key={attachment.attachmentId}
              attachment={attachment}
              errandId={errandId}
              message={message}
              onError={onError}
            />
          ))}
        </Stack>
      )}
    </Stack>
  );
};

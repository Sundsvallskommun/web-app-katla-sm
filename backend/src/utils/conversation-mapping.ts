import { IdentifierTypeEnum, Message, MessageTypeEnum } from '@/data-contracts/supportmanagement/data-contracts';
import { ConversationMessageAttachmentDTO, ConversationMessageDTO, MessageDirection } from '@/responses/conversation.response';

/** Namnet på den som skrev, uppslaget ur employee- eller citizen-API:t. */
export interface SenderName {
  firstName?: string;
  lastName?: string;
}

interface ConversationMessageContext {
  conversationId: string;
  topic?: string;
  /** Den inloggades AD-konto, som avgör riktning och om meddelandet är läst. */
  username: string;
  sender: SenderName;
}

/**
 * Systemmeddelanden beskriver händelser i handläggarens flöde, inte något någon skrivit till
 * rapportören. De hör inte hemma i tråden.
 */
export const isSystemMessage = (message: Message): boolean => message.type === MessageTypeEnum.SYSTEM_CREATED;

const isWrittenByUser = (message: Message, username: string): boolean =>
  message.createdBy?.type === IdentifierTypeEnum.AdAccount && message.createdBy.value === username;

const isReadByUser = (message: Message, username: string): boolean => message.readBy?.some(reader => reader.identifier?.value === username) ?? false;

const toMessageAttachments = (message: Message): ConversationMessageAttachmentDTO[] =>
  (message.attachments ?? []).flatMap(attachment =>
    attachment.id
      ? [
          {
            attachmentId: attachment.id,
            name: attachment.fileName,
            contentType: attachment.mimeType,
            size: attachment.fileSize,
          },
        ]
      : [],
  );

/**
 * Ett meddelande så som tråden visar det. Egna meddelanden räknas alltid som lästa — annars skulle
 * det man själv nyss skickat räknas som oläst tills API:t hunnit registrera läsningen.
 */
export const toConversationMessage = (message: Message, context: ConversationMessageContext): ConversationMessageDTO => {
  const ownMessage = isWrittenByUser(message, context.username);
  const direction: MessageDirection = ownMessage ? 'OUTBOUND' : 'INBOUND';

  return {
    conversationId: context.conversationId,
    messageId: message.id,
    sent: message.created,
    message: message.content ?? '',
    subject: context.topic,
    firstName: context.sender.firstName,
    lastName: context.sender.lastName,
    direction,
    viewed: ownMessage || isReadByUser(message, context.username),
    attachments: toMessageAttachments(message),
  };
};

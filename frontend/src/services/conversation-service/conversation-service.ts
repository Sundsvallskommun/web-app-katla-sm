import {
  ConversationAttachmentDTO,
  ConversationDTO,
  ConversationMessageDTO,
  ConversationMessagesPageDTO,
} from '@data-contracts/backend/data-contracts';
import { apiService } from '@services/api-service';
import { UploadFile } from '@sk-web-gui/react';

const errandPath = (errandId: string) => `supportmanagement/errand/${errandId}/conversations`;

export const getConversations = async (errandId: string, signal?: AbortSignal): Promise<ConversationDTO[]> =>
  apiService.get<ConversationDTO[]>(errandPath(errandId), { signal }).then((res) => res.data);

export const getConversationMessages = async (
  errandId: string,
  conversationId: string,
  page = 0,
  signal?: AbortSignal
): Promise<ConversationMessagesPageDTO> =>
  apiService
    .get<ConversationMessagesPageDTO>(`${errandPath(errandId)}/${conversationId}/messages`, {
      params: { page },
      signal,
    })
    .then((res) => res.data);

/**
 * Katlas backend återanvänder ett befintligt rapportörssamtal eller skapar ett via SupportManagement.
 */
export const createConversation = async (errandId: string, topic: string): Promise<ConversationDTO> =>
  apiService.post<ConversationDTO>(errandPath(errandId), { topic }).then((res) => res.data);

export const sendConversationMessage = async (
  errandId: string,
  conversationId: string,
  message: string,
  files: UploadFile[] = []
): Promise<void> => {
  const formData = new FormData();
  // API:t läser meddelandet som JSON i ett eget fält, samma form som handläggarens app skickar.
  formData.append('message', JSON.stringify({ content: message }));
  files.forEach((file) => {
    formData.append('attachments', file.file);
  });

  await apiService.post(`${errandPath(errandId)}/${conversationId}/messages`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

export const markMessagesAsRead = async (
  errandId: string,
  conversationId: string,
  messageIds: string[],
  signal?: AbortSignal
): Promise<void> => {
  if (messageIds.length === 0) return;

  await apiService.post(`${errandPath(errandId)}/${conversationId}/messages/mark-as-read`, { messageIds }, { signal });
};

export const getConversationAttachment = async (
  errandId: string,
  conversationId: string,
  messageId: string,
  attachmentId: string
): Promise<ConversationAttachmentDTO> =>
  apiService
    .get<ConversationAttachmentDTO>(
      `${errandPath(errandId)}/${conversationId}/messages/${messageId}/attachments/${attachmentId}`
    )
    .then((res) => res.data);

/** Meddelanden den inloggade inte läst än — de som ska markeras som lästa när tråden visas. */
export const unreadMessageIds = (messages: ConversationMessageDTO[]): string[] =>
  messages.flatMap((message) => (!message.viewed && message.messageId ? [message.messageId] : []));

/** Nyast först: det senaste i en dialog är det man är där för att läsa. */
export const byNewestFirst = (messages: ConversationMessageDTO[]): ConversationMessageDTO[] =>
  [...messages].sort((a, b) => new Date(b.sent ?? 0).getTime() - new Date(a.sent ?? 0).getTime());

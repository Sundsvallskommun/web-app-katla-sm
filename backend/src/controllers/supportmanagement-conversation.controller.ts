import { Body, Controller, Get, HttpCode, OnUndefined, Param, Post, QueryParams, Req, UploadedFiles, UseBefore } from 'routing-controllers';
import { OpenAPI, ResponseSchema } from 'routing-controllers-openapi';

import { MUNICIPALITY_ID, NAMESPACE } from '@/config';
import { getApiBase } from '@/config/api-config';
import { CitizenExtended } from '@/data-contracts/citizen/data-contracts';
import { PortalPersonData } from '@/data-contracts/employee/data-contracts';
import {
  Conversation,
  ConversationType,
  Identifier,
  IdentifierTypeEnum,
  MarkAsReadRequest,
  Message,
  PageMessage,
} from '@/data-contracts/supportmanagement/data-contracts';
import { HttpException } from '@/exceptions/HttpException';
import { RequestWithUser } from '@/interfaces/auth.interface';
import authMiddleware from '@/middlewares/auth.middleware';
import {
  ConversationAttachmentDTO,
  ConversationDTO,
  ConversationMessagesPageDTO,
  ConversationMessagesQueryDTO,
  CreateConversationDTO,
  MarkMessagesAsReadDTO,
} from '@/responses/conversation.response';
import ApiService from '@/services/api.service';
import { isSystemMessage, SenderName, toConversationMessage } from '@/utils/conversation-mapping';
import { assertAllowedAttachments, attachmentUploadOptions } from '@/utils/file-upload';
import { apiURL } from '@/utils/util';

/**
 * Samtalet mellan rapportören och handläggaren i Draken. Kanalen är INTERNAL: båda parter är
 * anställda och identifieras med sina AD-konton. Draken använder EXTERNAL för medborgardialogen i
 * Mina sidor, och de två kanalerna ska inte blandas.
 */
const REPORTER_CONVERSATION_TYPE = ConversationType.INTERNAL;

/**
 * Samtalet som hör till rapporten själv, till skillnad från samtal som handläggaren knutit till
 * något annat. Samma urval som Katla gör mot CaseData, så att båda apparna hittar samma tråd.
 */
const isReporterConversation = (conversation: Conversation): boolean =>
  conversation.type === REPORTER_CONVERSATION_TYPE && (conversation.relationIds?.length ?? 0) === 0;

@Controller()
export class SupportManagementConversationController {
  private apiService = new ApiService();
  private apiBase = getApiBase('supportmanagement');
  private employeeBase = getApiBase('employee');
  private citizenBase = getApiBase('citizen');

  private conversationsPath(errandId: string): string {
    return `${MUNICIPALITY_ID}/${NAMESPACE}/errands/${errandId}/communication/conversations`;
  }

  private async readConversations(req: RequestWithUser, errandId: string): Promise<Conversation[]> {
    const res = await this.apiService.get<Conversation[]>({ baseURL: apiURL(this.apiBase), url: this.conversationsPath(errandId) }, req);

    if (!Array.isArray(res.data)) throw new HttpException(502, 'Invalid response when reading conversations');
    return res.data;
  }

  /** Samma samtalsgräns gäller för text, bilagor och alla skrivoperationer. */
  private async requireReporterConversation(req: RequestWithUser, errandId: string, conversationId: string): Promise<Conversation> {
    const conversation = (await this.readConversations(req, errandId)).find(candidate => candidate.id === conversationId);
    if (!conversation || !isReporterConversation(conversation)) throw new HttpException(404, 'Conversation not found');
    return conversation;
  }

  /**
   * Namnet på den som skrev. Ett AD-konto slås upp i employee-API:t och ett partyId i citizen-API:t.
   * Misslyckas uppslaget visas meddelandet utan namn i stället för att hela tråden fallerar — det
   * som står i meddelandet är viktigare än vem som står som avsändare.
   */
  private async lookupSender(req: RequestWithUser, createdBy: Identifier | undefined): Promise<SenderName> {
    // API:erna svarar med null för ett namn som saknas; SenderName skiljer inte på saknat och tomt.
    const toName = (value: string | null | undefined): string | undefined => value ?? undefined;

    if (!createdBy?.value) return {};

    try {
      if (createdBy.type === IdentifierTypeEnum.AdAccount) {
        const url = `${this.employeeBase}/${MUNICIPALITY_ID}/portalpersondata/personal/${createdBy.value}`;
        const res = await this.apiService.get<PortalPersonData>({ url }, req);
        return { firstName: toName(res.data?.givenname), lastName: toName(res.data?.lastname) };
      }

      const url = `${this.citizenBase}/${MUNICIPALITY_ID}/${createdBy.value}`;
      const res = await this.apiService.get<CitizenExtended>({ url }, req);
      return { firstName: toName(res.data?.givenname), lastName: toName(res.data?.lastname) };
    } catch {
      return {};
    }
  }

  @Get('/supportmanagement/errand/:errandId/conversations')
  @OpenAPI({ summary: 'Read the conversations between the reporter and the case worker' })
  @UseBefore(authMiddleware)
  @ResponseSchema(ConversationDTO, { isArray: true })
  async getConversations(@Req() req: RequestWithUser, @Param('errandId') errandId: string): Promise<ConversationDTO[]> {
    const conversations = await this.readConversations(req, errandId);

    return conversations.filter(isReporterConversation);
  }

  @Get('/supportmanagement/errand/:errandId/conversations/:conversationId/messages')
  @OpenAPI({ summary: 'Read the messages in a conversation, with senders resolved' })
  @UseBefore(authMiddleware)
  @ResponseSchema(ConversationMessagesPageDTO)
  async getConversationMessages(
    @Req() req: RequestWithUser,
    @Param('errandId') errandId: string,
    @Param('conversationId') conversationId: string,
    @QueryParams() query: ConversationMessagesQueryDTO,
  ): Promise<ConversationMessagesPageDTO> {
    const conversation = await this.requireReporterConversation(req, errandId, conversationId);

    const res = await this.apiService.get<PageMessage>(
      {
        baseURL: apiURL(this.apiBase),
        url: `${this.conversationsPath(errandId)}/${conversationId}/messages`,
        params: { page: query.page, size: 50, sort: ['created,desc', 'id,desc'] },
        paramsSerializer: { indexes: null },
      },
      req,
    );

    if (!Array.isArray(res.data?.content) || res.data.number !== query.page || typeof res.data.last !== 'boolean') {
      throw new HttpException(502, 'Invalid response when reading conversation messages');
    }
    const messages = res.data.content.filter(message => !isSystemMessage(message));
    if (messages.some(message => !message.id)) throw new HttpException(502, 'Conversation message without id');

    // Uppslagen görs en gång per avsändare: en tråd har ofta många meddelanden från samma två personer.
    const senders = new Map<string, Promise<SenderName>>();
    const senderFor = (message: Message): Promise<SenderName> => {
      const key = `${message.createdBy?.type ?? ''}:${message.createdBy?.value ?? ''}`;
      const cached = senders.get(key);
      if (cached) return cached;

      const lookup = this.lookupSender(req, message.createdBy);
      senders.set(key, lookup);
      return lookup;
    };

    const mappedMessages = await Promise.all(
      messages.map(async message =>
        toConversationMessage(message, {
          conversationId,
          topic: conversation.topic,
          username: req.user.username,
          sender: await senderFor(message),
        }),
      ),
    );
    return { messages: mappedMessages, page: query.page, hasMore: !res.data.last };
  }

  @Post('/supportmanagement/errand/:errandId/conversations')
  @OpenAPI({ summary: 'Start the conversation with the case worker' })
  @UseBefore(authMiddleware)
  @ResponseSchema(ConversationDTO)
  async createConversation(
    @Req() req: RequestWithUser,
    @Param('errandId') errandId: string,
    @Body() body: CreateConversationDTO,
  ): Promise<ConversationDTO> {
    // SupportManagement äger atomärt skapande/återanvändning under ärendets databaslås.
    // En lokal kontroll före POST skyddar inte mot andra processer eller handläggarens app.
    const conversation: Conversation = {
      topic: body.topic,
      type: REPORTER_CONVERSATION_TYPE,
      participants: [{ type: IdentifierTypeEnum.AdAccount, value: req.user.username }],
    };

    const res = await this.apiService.put<Conversation>(
      { baseURL: apiURL(this.apiBase), url: `${this.conversationsPath(errandId)}/internal`, data: conversation },
      req,
    );
    if (!res.data?.id || !isReporterConversation(res.data)) throw new HttpException(502, 'Invalid response when creating conversation');

    return res.data;
  }

  @Post('/supportmanagement/errand/:errandId/conversations/:conversationId/messages')
  @OpenAPI({ summary: 'Send a message to the case worker' })
  @UseBefore(authMiddleware)
  @HttpCode(201)
  async sendMessage(
    @Req() req: RequestWithUser,
    @Param('errandId') errandId: string,
    @Param('conversationId') conversationId: string,
    @Body() body: { message?: string },
    @UploadedFiles('attachments', { options: attachmentUploadOptions, required: false }) files: Express.Multer.File[],
  ): Promise<{ message: string }> {
    const message = body.message?.trim();
    if (!message) throw new HttpException(400, 'Message content is required');

    assertAllowedAttachments(files);
    await this.requireReporterConversation(req, errandId, conversationId);

    // Samma multipart-form som handläggarens app skickar, så att API:t tar emot båda likadant.
    const formData = new FormData();
    formData.append('message', message);
    (files ?? []).forEach(file => {
      formData.append('attachments', new Blob([new Uint8Array(file.buffer)], { type: file.mimetype }), file.originalname);
    });

    await this.apiService.post<unknown>(
      {
        baseURL: apiURL(this.apiBase),
        url: `${this.conversationsPath(errandId)}/${conversationId}/messages`,
        data: formData,
        headers: { 'Content-Type': 'multipart/form-data' },
      },
      req,
    );

    return { message: 'success' };
  }

  @Post('/supportmanagement/errand/:errandId/conversations/:conversationId/messages/mark-as-read')
  @OpenAPI({ summary: 'Mark messages as read for the signed-in user' })
  @UseBefore(authMiddleware)
  @OnUndefined(204)
  async markMessagesAsRead(
    @Req() req: RequestWithUser,
    @Param('errandId') errandId: string,
    @Param('conversationId') conversationId: string,
    @Body() body: MarkMessagesAsReadDTO,
  ): Promise<void> {
    await this.requireReporterConversation(req, errandId, conversationId);
    const request: MarkAsReadRequest = { messageIds: body.messageIds };

    await this.apiService.post<unknown>(
      {
        baseURL: apiURL(this.apiBase),
        url: `${this.conversationsPath(errandId)}/${conversationId}/messages/mark-as-read`,
        data: request,
      },
      req,
    );
  }

  @Get('/supportmanagement/errand/:errandId/conversations/:conversationId/messages/:messageId/attachments/:attachmentId')
  @OpenAPI({ summary: 'Download an attachment from a message' })
  @UseBefore(authMiddleware)
  @ResponseSchema(ConversationAttachmentDTO)
  async getAttachment(
    @Req() req: RequestWithUser,
    @Param('errandId') errandId: string,
    @Param('conversationId') conversationId: string,
    @Param('messageId') messageId: string,
    @Param('attachmentId') attachmentId: string,
  ): Promise<ConversationAttachmentDTO> {
    await this.requireReporterConversation(req, errandId, conversationId);
    const res = await this.apiService.get<ArrayBuffer>(
      {
        baseURL: apiURL(this.apiBase),
        url: `${this.conversationsPath(errandId)}/${conversationId}/messages/${messageId}/attachments/${attachmentId}`,
        responseType: 'arraybuffer',
      },
      req,
    );
    if (!res.data) throw new HttpException(502, 'Invalid response when reading attachment');

    return { content: Buffer.from(res.data).toString('base64') };
  }
}

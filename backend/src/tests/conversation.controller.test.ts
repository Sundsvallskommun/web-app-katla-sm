import type { NextFunction, Request, Response } from 'express';
import request from 'supertest';
import { afterEach, describe, expect, it, vi } from 'vitest';

import App from '@/app';
import { SupportManagementConversationController } from '@/controllers/supportmanagement-conversation.controller';
import ApiService from '@/services/api.service';

vi.mock('@/middlewares/auth.middleware', () => ({
  default: (req: Request, _res: Response, next: NextFunction) => {
    Object.defineProperty(req, 'user', {
      configurable: true,
      value: { username: 'rapportor', firstName: 'Rapp', lastName: 'Ortor' },
    });
    next();
  },
}));

const app = new App([SupportManagementConversationController]).getServer();

const REPORTER_CONVERSATION = { id: 'conv-1', topic: 'Ärende: #VOF-1', type: 'INTERNAL', relationIds: [] };
const OTHER_CONVERSATIONS = [
  { id: 'conv-2', topic: 'Mina sidor', type: 'EXTERNAL', relationIds: [] },
  { id: 'conv-3', topic: 'Knutet till annat', type: 'INTERNAL', relationIds: ['relation-1'] },
];

/** Svarar på konversationslistan, meddelandesidan och namnuppslagen efter vilken adress som frågas. */
const mockUpstream = (messages: unknown[] = []) =>
  vi.spyOn(ApiService.prototype, 'get').mockImplementation((config: { url?: string }) => {
    const url = config.url ?? '';
    if (url.includes('/messages')) return Promise.resolve({ data: { content: messages }, message: 'success' });
    if (url.includes('portalpersondata')) return Promise.resolve({ data: { givenname: 'Hanna', lastname: 'Handläggare' }, message: 'success' });
    return Promise.resolve({ data: [REPORTER_CONVERSATION, ...OTHER_CONVERSATIONS], message: 'success' });
  });

/** supertest typar svarskroppen som any; den här läser ut ett meddelande med typen kvar. */
const firstMessage = (body: unknown): Record<string, unknown> => {
  const [message] = body as Record<string, unknown>[];
  if (!message) throw new Error('Inget meddelande i svaret');
  return message;
};

afterEach(() => {
  vi.restoreAllMocks();
});

describe('conversations', () => {
  it('visar bara rapportörens egen tråd, inte medborgardialogen eller knutna samtal', async () => {
    mockUpstream();

    const response = await request(app).get('/api/supportmanagement/errand/errand-1/conversations').expect(200);

    expect(response.body).toEqual([REPORTER_CONVERSATION]);
  });

  it('vägrar läsa meddelanden i ett samtal som inte är rapportörens', async () => {
    mockUpstream();

    const response = await request(app).get('/api/supportmanagement/errand/errand-1/conversations/conv-2/messages').expect(404);

    expect(response.body).toEqual({ message: 'Conversation not found' });
  });

  it('återanvänder den befintliga tråden i stället för att starta en till', async () => {
    mockUpstream();
    const postSpy = vi.spyOn(ApiService.prototype, 'post');

    const response = await request(app).post('/api/supportmanagement/errand/errand-1/conversations').send({ topic: 'Ärende: #VOF-1' }).expect(200);

    expect(response.body).toEqual(REPORTER_CONVERSATION);
    expect(postSpy).not.toHaveBeenCalled();
  });

  it('startar tråden som intern med den inloggade som deltagare', async () => {
    vi.spyOn(ApiService.prototype, 'get').mockResolvedValue({ data: OTHER_CONVERSATIONS, message: 'success' });
    const postSpy = vi.spyOn(ApiService.prototype, 'post').mockResolvedValue({ data: { id: 'conv-new' }, message: 'success' });

    await request(app).post('/api/supportmanagement/errand/errand-1/conversations').send({ topic: 'Ärende: #VOF-1' }).expect(200);

    const [config] = postSpy.mock.calls[0] ?? [];
    expect((config as { data?: unknown }).data).toEqual({
      topic: 'Ärende: #VOF-1',
      type: 'INTERNAL',
      participants: [{ type: 'adAccount', value: 'rapportor' }],
    });
  });

  it('avvisar ett samtal utan ämne', async () => {
    mockUpstream();

    await request(app).post('/api/supportmanagement/errand/errand-1/conversations').send({}).expect(400);
  });
});

describe('conversation messages', () => {
  it('utelämnar systemmeddelanden och slår upp avsändaren', async () => {
    mockUpstream([
      { id: 'msg-system', type: 'SYSTEM_CREATED', content: 'Ärendet skapades' },
      {
        id: 'msg-1',
        type: 'USER_CREATED',
        content: '<p>Hej</p>',
        created: '2026-09-03T09:00:00Z',
        createdBy: { type: 'adAccount', value: 'handlaggare' },
        attachments: [{ id: 'att-1', fileName: 'bilaga.pdf', mimeType: 'application/pdf', fileSize: 12 }],
      },
    ]);

    const response = await request(app).get('/api/supportmanagement/errand/errand-1/conversations/conv-1/messages').expect(200);

    expect(response.body).toEqual([
      {
        conversationId: 'conv-1',
        messageId: 'msg-1',
        sent: '2026-09-03T09:00:00Z',
        message: '<p>Hej</p>',
        subject: 'Ärende: #VOF-1',
        firstName: 'Hanna',
        lastName: 'Handläggare',
        direction: 'INBOUND',
        viewed: false,
        attachments: [{ attachmentId: 'att-1', name: 'bilaga.pdf', contentType: 'application/pdf', size: 12 }],
      },
    ]);
  });

  it('räknar egna meddelanden som skickade och lästa', async () => {
    mockUpstream([{ id: 'msg-2', type: 'USER_CREATED', content: 'Mitt svar', createdBy: { type: 'adAccount', value: 'rapportor' } }]);

    const response = await request(app).get('/api/supportmanagement/errand/errand-1/conversations/conv-1/messages').expect(200);

    expect(firstMessage(response.body)).toMatchObject({ direction: 'OUTBOUND', viewed: true });
  });

  it('visar meddelandet utan namn när avsändaruppslaget fallerar', async () => {
    vi.spyOn(ApiService.prototype, 'get').mockImplementation((config: { url?: string }) => {
      const url = config.url ?? '';
      if (url.includes('/messages'))
        return Promise.resolve({
          data: { content: [{ id: 'msg-3', type: 'USER_CREATED', content: 'Hej', createdBy: { type: 'adAccount', value: 'okand' } }] },
          message: 'success',
        });
      if (url.includes('portalpersondata')) return Promise.reject(new Error('employee unavailable'));
      return Promise.resolve({ data: [REPORTER_CONVERSATION], message: 'success' });
    });

    const response = await request(app).get('/api/supportmanagement/errand/errand-1/conversations/conv-1/messages').expect(200);

    // Namnfälten utelämnas helt i JSON när uppslaget inte gav något.
    expect(firstMessage(response.body)).toMatchObject({ message: 'Hej' });
    expect(firstMessage(response.body)).not.toHaveProperty('firstName');
    expect(firstMessage(response.body)).not.toHaveProperty('lastName');
  });
});

describe('sending messages', () => {
  it('avvisar ett tomt meddelande', async () => {
    const postSpy = vi.spyOn(ApiService.prototype, 'post');

    const response = await request(app)
      .post('/api/supportmanagement/errand/errand-1/conversations/conv-1/messages')
      .field('message', '   ')
      .expect(400);

    expect(response.body).toEqual({ message: 'Message content is required' });
    expect(postSpy).not.toHaveBeenCalled();
  });

  it('avvisar en bilaga av otillåten filtyp i stället för att tappa den tyst', async () => {
    const postSpy = vi.spyOn(ApiService.prototype, 'post');

    const response = await request(app)
      .post('/api/supportmanagement/errand/errand-1/conversations/conv-1/messages')
      .field('message', JSON.stringify({ content: 'Hej' }))
      .attach('attachments', Buffer.from('MZ'), { filename: 'skadlig.exe', contentType: 'application/x-msdownload' })
      .expect(400);

    expect(response.body).toEqual({ message: 'Attachment file type is not allowed' });
    expect(postSpy).not.toHaveBeenCalled();
  });

  it('skickar meddelandet och bilagan som multipart', async () => {
    const postSpy = vi.spyOn(ApiService.prototype, 'post').mockResolvedValue({ data: undefined, message: 'success' });

    await request(app)
      .post('/api/supportmanagement/errand/errand-1/conversations/conv-1/messages')
      .field('message', JSON.stringify({ content: '<p>Hej</p>' }))
      .attach('attachments', Buffer.from('%PDF-'), { filename: 'bilaga.pdf', contentType: 'application/pdf' })
      .expect(201);

    const [config] = postSpy.mock.calls[0] ?? [];
    const { data, headers } = config as { data?: FormData; headers?: Record<string, string> };
    expect(headers?.['Content-Type']).toBe('multipart/form-data');
    expect(data?.get('message')).toBe(JSON.stringify({ content: '<p>Hej</p>' }));
    expect(data?.getAll('attachments')).toHaveLength(1);
  });

  it('markerar meddelanden som lästa', async () => {
    const postSpy = vi.spyOn(ApiService.prototype, 'post').mockResolvedValue({ data: undefined, message: 'success' });

    await request(app)
      .post('/api/supportmanagement/errand/errand-1/conversations/conv-1/messages/mark-as-read')
      .send({ messageIds: ['msg-1', 'msg-2'] })
      .expect(204);

    const [config] = postSpy.mock.calls[0] ?? [];
    expect((config as { data?: unknown }).data).toEqual({ messageIds: ['msg-1', 'msg-2'] });
  });

  it('avvisar en tom lista av meddelanden att markera', async () => {
    await request(app).post('/api/supportmanagement/errand/errand-1/conversations/conv-1/messages/mark-as-read').send({ messageIds: [] }).expect(400);
  });
});

describe('attachments', () => {
  it('svarar med bilagan base64-kodad', async () => {
    vi.spyOn(ApiService.prototype, 'get').mockResolvedValue({ data: Buffer.from('filinnehåll'), message: 'success' });

    const response = await request(app)
      .get('/api/supportmanagement/errand/errand-1/conversations/conv-1/messages/msg-1/attachments/att-1')
      .expect(200);

    const { content } = response.body as { content: string };
    expect(Buffer.from(content, 'base64').toString('utf8')).toBe('filinnehåll');
  });
});

import type { NextFunction, Request, Response } from 'express';
import request from 'supertest';
import { afterEach, describe, expect, it, vi } from 'vitest';

import App from '@/app';
import { SupportManagementConversationController } from '@/controllers/supportmanagement-conversation.controller';
import { HttpException } from '@/exceptions/HttpException';
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
    if (url.includes('/messages')) return Promise.resolve({ data: { content: messages, number: 0, last: true }, message: 'success' });
    if (url.includes('portalpersondata')) return Promise.resolve({ data: { givenname: 'Hanna', lastname: 'Handläggare' }, message: 'success' });
    return Promise.resolve({ data: [REPORTER_CONVERSATION, ...OTHER_CONVERSATIONS], message: 'success' });
  });

/** supertest typar svarskroppen som any; den här läser ut ett meddelande med typen kvar. */
const firstMessage = (body: unknown): Record<string, unknown> => {
  const { messages } = body as { messages: Record<string, unknown>[] };
  const [message] = messages;
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

  it('låter upstream återanvända samtalet atomärt', async () => {
    const getSpy = vi.spyOn(ApiService.prototype, 'get');
    const putSpy = vi.spyOn(ApiService.prototype, 'put').mockResolvedValue({ data: REPORTER_CONVERSATION, message: 'success' });

    const response = await request(app).post('/api/supportmanagement/errand/errand-1/conversations').send({ topic: 'Ärende: #VOF-1' }).expect(200);

    expect(response.body).toEqual(REPORTER_CONVERSATION);
    expect(putSpy).toHaveBeenCalledTimes(1);
    expect(putSpy.mock.calls[0]?.[0].url).toBe('2281/test/errands/errand-1/communication/conversations/internal');
    expect(getSpy).not.toHaveBeenCalled();
  });

  it('startar tråden som intern med den inloggade som deltagare', async () => {
    const putSpy = vi.spyOn(ApiService.prototype, 'put').mockResolvedValue({ data: { id: 'conv-new', type: 'INTERNAL' }, message: 'success' });

    await request(app).post('/api/supportmanagement/errand/errand-1/conversations').send({ topic: 'Ärende: #VOF-1' }).expect(200);

    const [config] = putSpy.mock.calls[0] ?? [];
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

    expect(response.body).toEqual({
      page: 0,
      hasMore: false,
      messages: [
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
      ],
    });
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
          data: {
            number: 0,
            last: true,
            content: [{ id: 'msg-3', type: 'USER_CREATED', content: 'Hej', createdBy: { type: 'adAccount', value: 'okand' } }],
          },
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
    mockUpstream();
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
    mockUpstream();
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
    vi.spyOn(ApiService.prototype, 'get')
      .mockResolvedValueOnce({ data: [REPORTER_CONVERSATION], message: 'success' })
      .mockResolvedValueOnce({ data: Buffer.from('filinnehåll'), message: 'success' });

    const response = await request(app)
      .get('/api/supportmanagement/errand/errand-1/conversations/conv-1/messages/msg-1/attachments/att-1')
      .expect(200);

    const { content } = response.body as { content: string };
    expect(Buffer.from(content, 'base64').toString('utf8')).toBe('filinnehåll');
  });
});

describe('conversation boundary', () => {
  it.each(['conv-2', 'conv-3', 'missing'])('nekar alla operationer utanför rapportörens samtal: %s', async id => {
    const getSpy = mockUpstream();
    const postSpy = vi.spyOn(ApiService.prototype, 'post');
    const path = `/api/supportmanagement/errand/errand-1/conversations/${id}/messages`;
    await request(app).get(path).expect(404);
    await request(app)
      .post(path)
      .field('message', JSON.stringify({ content: 'Hej' }))
      .expect(404);
    await request(app)
      .post(`${path}/mark-as-read`)
      .send({ messageIds: ['msg-1'] })
      .expect(404);
    await request(app).get(`${path}/msg-1/attachments/att-1`).expect(404);
    expect(postSpy).not.toHaveBeenCalled();
    expect(getSpy.mock.calls.every(([config]) => config.url?.endsWith('/conversations'))).toBe(true);
  });

  it('tolkar inte ett trasigt listsvar som ett tomt samtal', async () => {
    vi.spyOn(ApiService.prototype, 'get').mockResolvedValue({ data: undefined, message: 'success' });
    await request(app).get('/api/supportmanagement/errand/errand-1/conversations').expect(502);
  });
});

describe('message pages', () => {
  const path = '/api/supportmanagement/errand/errand-1/conversations/conv-1/messages';

  it('behåller fortsättningen när en sida bara innehåller systemmeddelanden', async () => {
    const getSpy = vi
      .spyOn(ApiService.prototype, 'get')
      .mockResolvedValueOnce({ data: [REPORTER_CONVERSATION], message: 'success' })
      .mockResolvedValueOnce({ data: { number: 2, last: false, content: [{ type: 'SYSTEM_CREATED' }] }, message: 'success' });
    const response = await request(app).get(`${path}?page=2`).expect(200);
    expect(response.body).toEqual({ page: 2, hasMore: true, messages: [] });
    expect(getSpy.mock.calls[1]?.[0].params).toEqual({ page: 2, size: 50, sort: ['created,desc', 'id,desc'] });
  });

  it.each(['-1', '1.5', 'NaN'])('avvisar ogiltigt sidnummer %s', async page => {
    const getSpy = vi.spyOn(ApiService.prototype, 'get');
    await request(app).get(`${path}?page=${page}`).expect(400);
    expect(getSpy).not.toHaveBeenCalled();
  });

  it.each([{ content: [], number: 1, last: true }, { content: [], number: 0 }, undefined])(
    'avvisar ofullständigt eller felaktigt sidsvar',
    async data => {
      vi.spyOn(ApiService.prototype, 'get')
        .mockResolvedValueOnce({ data: [REPORTER_CONVERSATION], message: 'success' })
        .mockResolvedValueOnce({ data, message: 'success' });
      await request(app).get(path).expect(502);
    },
  );
});

it('avvisar skickande mot ett API som saknar atomärt skapande', async () => {
  vi.spyOn(ApiService.prototype, 'put').mockRejectedValue(new HttpException(404, 'Not found'));
  const post = vi.spyOn(ApiService.prototype, 'post');
  await request(app).post('/api/supportmanagement/errand/errand-1/conversations').send({ topic: 'Report' }).expect(404);
  expect(post).not.toHaveBeenCalled();
});

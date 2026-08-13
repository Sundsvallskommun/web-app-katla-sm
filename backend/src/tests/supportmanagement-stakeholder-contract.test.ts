import type { NextFunction, Request, Response } from 'express';
import request from 'supertest';
import { afterEach, describe, expect, it, vi } from 'vitest';

import App from '@/app';
import { SupportManagementController } from '@/controllers/supportmanagement.controller';
import type { ContactChannel, Errand, Stakeholder } from '@/data-contracts/supportmanagement/data-contracts';
import type { RequestWithUser } from '@/interfaces/auth.interface';
import type { ErrandDTO, ErrandMutationRequestDTO } from '@/responses/supportmanagement.response';
import ApiService from '@/services/api.service';

import primaryPhoneEditContract from '../../../test-contracts/stakeholder-primary-phone-edit.json';

vi.mock('@/middlewares/auth.middleware', () => ({
  default: (req: Request, _res: Response, next: NextFunction) => {
    Object.defineProperty(req, 'user', {
      configurable: true,
      value: {
        username: 'test-user',
        name: 'Test User',
        givenName: 'Test',
        surname: 'User',
      },
    });
    next();
  },
}));

interface ChannelWithMetadata extends ContactChannel {
  source: string;
}

const upstreamContactChannels: ChannelWithMetadata[] = primaryPhoneEditContract.initialStakeholder.contactChannels;

const upstreamStakeholder: Stakeholder = {
  role: 'CONTACT',
  firstName: 'Ada',
  lastName: 'Lovelace',
  contactChannels: upstreamContactChannels,
  parameters: [
    { key: 'referenceNumber', displayName: 'Referensnummer', values: ['REF-123'] },
    { key: 'title', displayName: 'Titel', values: ['Analytiker', 'Reservtitel'] },
    { key: 'department', displayName: 'Avdelning', values: ['Analys'] },
  ],
};

const upstreamErrand: Partial<Errand> = {
  id: 'errand-id',
  errandNumber: 'ERRAND-1',
  title: 'Testärende',
  stakeholders: [upstreamStakeholder],
};

const expectedUpstreamStakeholder = {
  role: 'CONTACT',
  firstName: 'Ada',
  lastName: 'Lovelace',
  contactChannels: upstreamContactChannels,
  parameters: upstreamStakeholder.parameters,
};

const app = new App([SupportManagementController]).getServer();

afterEach(() => {
  vi.restoreAllMocks();
});

describe('SupportManagement stakeholder wire contract', () => {
  it('sends create stakeholders in upstream format and keeps the frontend response format', async () => {
    const postSpy = vi.spyOn(ApiService.prototype, 'post').mockResolvedValue({ data: upstreamErrand, message: 'success' });
    const frontendRequest: ErrandDTO = {
      title: 'Testärende',
      stakeholders: [
        {
          role: 'CONTACT',
          firstName: 'Ada',
          lastName: 'Lovelace',
          personNumber: '19900101-1234',
          phoneNumbers: ['+46701111111', '+46702222222'],
          title: 'Analytiker',
          department: 'Analys',
          contactChannels: upstreamStakeholder.contactChannels,
          parameters: upstreamStakeholder.parameters,
        },
      ],
    };

    const response = await request(app).post('/api/supportmanagement/errand/create').send(frontendRequest).expect(200);
    const responseBody = response.body as ErrandDTO;

    const upstreamBody = postSpy.mock.calls[0]?.[0].data as Errand | undefined;
    expect(upstreamBody).toEqual({
      title: 'Testärende',
      reporterUserId: 'test-user',
      stakeholders: [expectedUpstreamStakeholder],
    });
    expect(responseBody.stakeholders?.[0]).toMatchObject({
      phoneNumbers: ['+46701111111', '+46702222222'],
      title: 'Analytiker',
      department: 'Analys',
      contactChannels: upstreamStakeholder.contactChannels,
      parameters: upstreamStakeholder.parameters,
    });
  });

  it('preserves unknown parameters through GET, update and save', async () => {
    vi.spyOn(ApiService.prototype, 'get').mockResolvedValue({
      data: { content: [upstreamErrand] },
      message: 'success',
    });
    const patchSpy = vi.spyOn(ApiService.prototype, 'patch').mockResolvedValue({ data: upstreamErrand, message: 'success' });

    const frontendResponse = await request(app).get('/api/supportmanagement/errand/ERRAND-1').expect(200);
    const frontendErrand = frontendResponse.body as ErrandDTO;
    expect(frontendErrand.stakeholders?.[0]).toMatchObject({
      phoneNumbers: ['+46701111111', '+46702222222'],
      title: 'Analytiker',
      department: 'Analys',
      contactChannels: upstreamStakeholder.contactChannels,
      parameters: upstreamStakeholder.parameters,
    });

    const updateResponse = await request(app).patch('/api/supportmanagement/errand/errand-id').send(frontendErrand).expect(200);
    const saveResponse = await request(app).patch('/api/supportmanagement/errand/save').send(frontendErrand).expect(200);
    const updateResponseBody = updateResponse.body as ErrandDTO;
    const saveResponseBody = saveResponse.body as ErrandDTO;

    for (const call of patchSpy.mock.calls) {
      const upstreamBody = call[0].data as Partial<Errand> | undefined;
      expect(upstreamBody?.stakeholders).toEqual([expectedUpstreamStakeholder]);
      expect(upstreamBody).not.toHaveProperty('id');
      expect(upstreamBody).not.toHaveProperty('errandNumber');
    }
    expect(patchSpy).toHaveBeenCalledTimes(2);
    expect(updateResponseBody.stakeholders?.[0]).toMatchObject({
      title: 'Analytiker',
      parameters: upstreamStakeholder.parameters,
    });
    expect(saveResponseBody.stakeholders?.[0]).toMatchObject({
      title: 'Analytiker',
      parameters: upstreamStakeholder.parameters,
    });
  });

  it('changes only the primary phone after the modal preserves its secondary projection', async () => {
    const patchSpy = vi.spyOn(ApiService.prototype, 'patch').mockResolvedValue({ data: upstreamErrand, message: 'success' });

    await request(app)
      .patch('/api/supportmanagement/errand/errand-id')
      .send({
        stakeholders: [
          {
            role: 'CONTACT',
            firstName: 'Ada',
            lastName: 'Lovelace',
            phoneNumbers: primaryPhoneEditContract.frontendAfterPrimaryEdit.phoneNumbers,
            contactChannels: upstreamContactChannels,
            parameters: upstreamStakeholder.parameters,
          },
        ],
      })
      .expect(200);

    const upstreamBody = patchSpy.mock.calls[0]?.[0].data as Partial<Errand> | undefined;
    expect(upstreamBody?.stakeholders?.[0]?.contactChannels).toEqual(primaryPhoneEditContract.upstreamAfterPrimaryEdit);
  });

  it('keeps a successful update successful when Citizen enrichment fails and matches fallback by externalId', async () => {
    const externalId = 'person-id';
    const secondExternalId = 'second-person-id';
    const patchSpy = vi.spyOn(ApiService.prototype, 'patch').mockResolvedValue({
      data: {
        id: 'errand-id',
        stakeholders: [
          { externalId: secondExternalId, role: 'CONTACT', firstName: 'Grace' },
          { externalId, role: 'CONTACT', firstName: 'Ada' },
        ],
      },
      message: 'success',
    });
    vi.spyOn(ApiService.prototype, 'get').mockRejectedValue(new Error('Citizen API unavailable'));

    const response = await request(app)
      .patch('/api/supportmanagement/errand/errand-id')
      .send({
        stakeholders: [
          {
            externalId,
            personNumber: '19900101-1234',
            role: 'CONTACT',
            firstName: 'Ada',
          },
          {
            externalId: secondExternalId,
            personNumber: '19851224-5678',
            role: 'CONTACT',
            firstName: 'Grace',
          },
        ],
      })
      .expect(200);

    const responseBody = response.body as ErrandDTO;
    expect(responseBody.stakeholders?.[0]).toMatchObject({
      externalId: secondExternalId,
      personNumber: '19851224-5678',
      firstName: 'Grace',
    });
    expect(responseBody.stakeholders?.[1]).toMatchObject({
      externalId,
      personNumber: '19900101-1234',
      role: 'CONTACT',
      firstName: 'Ada',
    });
    const upstreamBody = patchSpy.mock.calls[0]?.[0].data as Partial<Errand> | undefined;
    expect(upstreamBody?.stakeholders?.[0]).toMatchObject({ externalId, role: 'CONTACT', firstName: 'Ada' });
    expect(upstreamBody?.stakeholders?.[0]).not.toHaveProperty('personNumber');
  });

  it.each([
    ['save', '/api/supportmanagement/errand/save', { id: 'errand-id', stakeholders: [{ firstName: 123 }] }],
    ['update', '/api/supportmanagement/errand/errand-id', { stakeholders: [{ firstName: 123 }] }],
  ])('validates the concrete %s PATCH body before calling upstream', async (_operation, path, body) => {
    const patchSpy = vi.spyOn(ApiService.prototype, 'patch').mockResolvedValue({ data: upstreamErrand, message: 'success' });

    const response = await request(app).patch(path).send(body);

    expect(response.status).toBe(400);
    expect(response.text).toContain('Invalid body');
    expect(patchSpy).not.toHaveBeenCalled();
  });

  it('does not mutate the exact save request reference while removing read-only fields upstream', async () => {
    const patchSpy = vi.spyOn(ApiService.prototype, 'patch').mockResolvedValue({ data: upstreamErrand, message: 'success' });
    const frontendErrand: ErrandMutationRequestDTO = {
      id: 'errand-id',
      errandNumber: 'ERRAND-1',
      created: '2026-08-12T08:00:00Z',
      touched: '2026-08-12T08:00:00Z',
      stakeholders: [
        {
          firstName: 'Ada',
          emails: ['ada@example.com'],
          parameters: [{ key: 'referenceNumber', values: ['REF-123'] }],
        },
      ],
    };
    const snapshot = structuredClone(frontendErrand);
    const controllerRequest = {
      user: { username: 'test-user' },
    } as RequestWithUser;
    const controller = new SupportManagementController();

    await controller.saveErrand(controllerRequest, frontendErrand);

    expect(frontendErrand).toEqual(snapshot);
    const upstreamBody = patchSpy.mock.calls[0]?.[0].data as Partial<Errand> | undefined;
    expect(upstreamBody).not.toHaveProperty('id');
    expect(upstreamBody).not.toHaveProperty('errandNumber');
    expect(upstreamBody).not.toHaveProperty('created');
    expect(upstreamBody).not.toHaveProperty('touched');
  });
});

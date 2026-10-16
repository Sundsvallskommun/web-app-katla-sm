import type { NextFunction, Request, Response } from 'express';
import request from 'supertest';
import { afterEach, describe, expect, it, vi } from 'vitest';

import App from '@/app';
import { CitizenController } from '@/controllers/citizen.controller';
import { EmployeeController } from '@/controllers/employee.controller';
import ApiService from '@/services/api.service';
import { EXTERNAL_ID_TYPE_EMPLOYEE, EXTERNAL_ID_TYPE_PRIVATE } from '@/utils/external-id-type';

vi.mock('@/middlewares/auth.middleware', () => ({
  default: (req: Request, _res: Response, next: NextFunction) => {
    Object.defineProperty(req, 'user', { configurable: true, value: { username: 'rapportor' } });
    next();
  },
}));

const app = new App([CitizenController, EmployeeController]).getServer();

const PARTY_ID = '1a2b3c4d-5e6f-4a7b-8c9d-0e1f2a3b4c5d';

/** Svarar på Citizen- och Employee-uppslagen efter vilken adress som frågas. */
const mockUpstream = () =>
  vi.spyOn(ApiService.prototype, 'get').mockImplementation((config: { url?: string }) => {
    const url = config.url ?? '';
    const respond = (data: unknown) => Promise.resolve({ data, message: 'success' });
    if (url.endsWith('/guid/')) return respond(PARTY_ID);
    if (url.endsWith('/accounts')) return respond([{ loginname: 'kimkol01' }]);
    if (url.includes('portalpersondata')) return respond({ personid: PARTY_ID, givenname: 'Kim', lastname: 'Kollega' });
    if (url.includes('employments'))
      return respond([{ employments: [{ isMainEmployment: true, title: 'Undersköterska', orgName: 'Hemtjänst Centrum' }] }]);
    return respond({
      personId: PARTY_ID,
      givenname: 'Kim',
      lastname: 'Exempelsson',
      addresses: [{ address: 'Exempelvägen 1', postalCode: '123 45', city: 'Sundsvall' }],
    });
  });

afterEach(() => {
  vi.restoreAllMocks();
});

/**
 * externalId är ett partyId, och typen säger vems det är. Bara uppslaget vet om personen hittades
 * bland privatpersonerna eller de anställda, så det är där typen sätts.
 */
describe('stakeholder externalIdType', () => {
  it('marks a person found by person number in Citizen as private', async () => {
    mockUpstream();

    const response = await request(app).get('/api/citizen/person/199001012385').expect(200);

    expect(response.body).toMatchObject({ externalId: PARTY_ID, externalIdType: EXTERNAL_ID_TYPE_PRIVATE });
  });

  it.each([
    ['username', '/api/employee/personal/kimkol01'],
    ['person number', '/api/employee/personnumber/199001012385'],
  ])('marks an employee found by %s as an employee', async (_label, url) => {
    mockUpstream();

    const response = await request(app).get(url).expect(200);

    expect(response.body).toMatchObject({ externalId: PARTY_ID, externalIdType: EXTERNAL_ID_TYPE_EMPLOYEE });
  });
});

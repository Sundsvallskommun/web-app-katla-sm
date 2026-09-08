import type { AppContextDTO, ApplicationSummaryDTO } from '@data-contracts/backend/data-contracts';

import { ApiResponse, apiService } from './api-service';

export class AppContextMismatchError extends Error {
  constructor() {
    super('Frontend and backend application identities do not match.');
    this.name = 'AppContextMismatchError';
  }
}

/** Public deployment identity. Compare before mounting views that can fetch case data. */
export const verifyApplicationContext = async (
  expected: Pick<AppContextDTO, 'mode' | 'katlaId' | 'definitionRevision'>,
  signal?: AbortSignal
): Promise<void> => {
  const response = await apiService.get<ApiResponse>('/app-context', { signal });
  const context = response.data.data;
  if (
    typeof context !== 'object' ||
    context === null ||
    !('mode' in context) ||
    context.mode !== expected.mode ||
    ('katlaId' in context ? context.katlaId : undefined) !== expected.katlaId ||
    ('definitionRevision' in context ? context.definitionRevision : undefined) !== expected.definitionRevision
  ) {
    throw new AppContextMismatchError();
  }
};

/** Only complete HTTP(S) destinations without embedded credentials may become links. */
export const isApplicationUrl = (value: unknown): value is string => {
  if (typeof value !== 'string' || !/^https?:\/\//i.test(value)) return false;
  try {
    const url = new URL(value);
    return ['http:', 'https:'].includes(url.protocol) && url.username === '' && url.password === '';
  } catch {
    return false;
  }
};

const isApplicationSummary = (value: unknown): value is ApplicationSummaryDTO => {
  if (typeof value !== 'object' || value === null) return false;
  return (
    'id' in value &&
    typeof value.id === 'string' &&
    value.id.trim().length > 0 &&
    'applicationName' in value &&
    typeof value.applicationName === 'string' &&
    value.applicationName.trim().length > 0 &&
    (!('description' in value) || value.description === undefined || typeof value.description === 'string') &&
    'url' in value &&
    isApplicationUrl(value.url)
  );
};

/** The backend filters both publication and access; the browser never receives group policies. */
export const getApplications = async (signal?: AbortSignal): Promise<ApplicationSummaryDTO[]> => {
  const response = await apiService.get<ApiResponse>('/applications', { signal });
  const applications = response.data.data;
  if (!Array.isArray(applications) || !applications.every(isApplicationSummary)) {
    throw new Error('Invalid application catalogue response.');
  }
  const ids = new Set(applications.map((application) => application.id));
  if (ids.size !== applications.length) throw new Error('Duplicate application catalogue entries.');
  return applications;
};

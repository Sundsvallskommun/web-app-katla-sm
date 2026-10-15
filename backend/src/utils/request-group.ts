import { randomUUID } from 'node:crypto';
import type { IncomingHttpHeaders } from 'node:http';

/**
 * SupportManagement samlar händelserna från en och samma användarhandling under ett gemensamt id, så
 * att den som följer ärendet får en notis för handlingen i stället för en per anrop.
 */
export const REQUEST_GROUP_HEADER = 'X-Request-Group-Id';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Det id webbläsaren skickade för sin handling när det är ett UUID, annars ett nytt. */
export const resolveRequestGroupId = (incoming: unknown): string =>
  typeof incoming === 'string' && UUID_PATTERN.test(incoming) ? incoming : randomUUID();

interface RequestWithHeaders {
  headers?: IncomingHttpHeaders;
}

const requestGroupIds = new WeakMap<object, string>();

/**
 * Gruppen för den request som hanteras. Läses ur requesten i stället för ur en asynkron kontext:
 * varje anrop till ApiService får redan requesten, och multer tappar en asynkron kontext på vägen in
 * i en uppladdning. Ett id som saknas skapas en gång per request, så att alla anrop som görs medan
 * den hanteras hör till samma grupp.
 */
export const requestGroupIdFor = (req: RequestWithHeaders): string => {
  const existing = requestGroupIds.get(req);
  if (existing) return existing;

  const requestGroupId = resolveRequestGroupId(req.headers?.[REQUEST_GROUP_HEADER.toLowerCase()]);
  requestGroupIds.set(req, requestGroupId);
  return requestGroupId;
};

import multer from 'multer';

import { HttpException } from '@/exceptions/HttpException';

/** Samma tak som skrivrutan lovar, så att en fil aldrig avvisas efter att den skickats iväg. */
export const MAX_ATTACHMENT_SIZE_BYTES = 25 * 1024 * 1024;

/** Filtyperna handläggarens vy kan öppna. Samma lista som Katla använder mot CaseData. */
export const ALLOWED_ATTACHMENT_MIME_TYPES = [
  'image/jpeg',
  'image/gif',
  'image/png',
  'image/tiff',
  'image/bmp',
  'application/pdf',
  'application/rtf',
  'application/msword',
  'text/plain',
  'text/html',
  'application/vnd.ms-excel',
  'application/vnd.ms-outlook',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.oasis.opendocument.text',
  'application/vnd.oasis.opendocument.spreadsheet',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
];

/**
 * Filerna hålls i minnet och skickas vidare direkt — ingenting sparas på disk hos oss.
 *
 * Filtypen filtreras inte bort här utan avvisas i controllern. Ett tyst bortfall skulle se ut som
 * att bilagan följde med meddelandet, och den som skickat skulle aldrig få veta att den inte gjorde det.
 */
export const attachmentUploadOptions = {
  limits: {
    fieldNameSize: 255,
    fileSize: MAX_ATTACHMENT_SIZE_BYTES,
  },
  storage: multer.memoryStorage(),
};

export const assertAllowedAttachments = (files: Express.Multer.File[] | undefined): void => {
  const rejected = (files ?? []).find(file => !ALLOWED_ATTACHMENT_MIME_TYPES.includes(file.mimetype));
  if (rejected) {
    throw new HttpException(400, 'Attachment file type is not allowed');
  }
};

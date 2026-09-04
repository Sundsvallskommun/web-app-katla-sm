import { Type } from 'class-transformer';
import { ArrayNotEmpty, IsArray, IsBoolean, IsIn, IsNumber, IsOptional, IsString, MaxLength, ValidateNested } from 'class-validator';

import { Conversation, ConversationType, Identifier, KeyValues } from '@/data-contracts/supportmanagement/data-contracts';

/** Riktning sett från den inloggade: OUTBOUND är skrivet av en själv, INBOUND av någon annan. */
export const MESSAGE_DIRECTIONS = ['INBOUND', 'OUTBOUND'] as const;
export type MessageDirection = (typeof MESSAGE_DIRECTIONS)[number];

export class IdentifierDTO implements Identifier {
  @IsString()
  type!: Identifier['type'];
  @IsString()
  value!: string;
}

export class KeyValuesDTO implements KeyValues {
  @IsString()
  @IsOptional()
  key?: string;
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  values?: string[];
}

export class ConversationDTO implements Conversation {
  @IsString()
  @IsOptional()
  id?: string;
  @IsString()
  @IsOptional()
  topic?: string;
  @IsIn(Object.values(ConversationType))
  @IsOptional()
  type?: ConversationType;
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  relationIds?: string[];
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => IdentifierDTO)
  participants?: IdentifierDTO[];
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => KeyValuesDTO)
  metadata?: KeyValuesDTO[];
}

export class ConversationMessageAttachmentDTO {
  @IsString()
  attachmentId!: string;
  @IsString()
  @IsOptional()
  name?: string;
  @IsString()
  @IsOptional()
  contentType?: string;
  @IsNumber()
  @IsOptional()
  size?: number;
}

/**
 * Ett meddelande så som tråden visar det. Avsändaren är redan uppslagen här: klienten ska inte
 * behöva veta att ett AD-konto och ett personnummer slås upp i två olika API:er.
 */
export class ConversationMessageDTO {
  @IsString()
  conversationId!: string;
  @IsString()
  @IsOptional()
  messageId?: string;
  @IsString()
  @IsOptional()
  sent?: string;
  @IsString()
  message!: string;
  @IsString()
  @IsOptional()
  subject?: string;
  @IsString()
  @IsOptional()
  firstName?: string;
  @IsString()
  @IsOptional()
  lastName?: string;
  @IsIn(MESSAGE_DIRECTIONS)
  @IsOptional()
  direction?: MessageDirection;
  @IsBoolean()
  viewed!: boolean;
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ConversationMessageAttachmentDTO)
  attachments!: ConversationMessageAttachmentDTO[];
}

/**
 * Bara ämnet kommer från klienten. Typen och deltagaren sätts på serversidan: samtalet ska alltid
 * bli den interna kanalen mot handläggaren, med den inloggade som deltagare.
 */
export class CreateConversationDTO {
  @IsString()
  @MaxLength(255)
  topic!: string;
}

export class MarkMessagesAsReadDTO {
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  messageIds!: string[];
}

export class ConversationAttachmentDTO {
  /** Innehållet base64-kodat, så att det kan laddas ner utan en andra runda mot API:t. */
  @IsString()
  content!: string;
  @IsString()
  @IsOptional()
  fileName?: string;
  @IsString()
  @IsOptional()
  mimeType?: string;
}

import { Type } from 'class-transformer';
import { ArrayMaxSize, ArrayNotEmpty, IsArray, IsBoolean, IsOptional, IsString, IsUUID, ValidateNested } from 'class-validator';

/**
 * Det mesta en användare kan kvittera i en och samma begäran. Panelen kvitterar de notiser
 * användaren kryssat i, och SupportManagement tar dem en i taget.
 */
export const MAX_ACKNOWLEDGED_NOTIFICATIONS = 100;

/** Något som hänt på ärendet. */
export class SupportNotificationEventDTO {
  @IsString()
  @IsOptional()
  created?: string;
  /** CREATE, UPDATE eller DELETE: vad som hände med det som händelsen gäller. */
  @IsString()
  @IsOptional()
  eventType?: string;
  /** Vad händelsen gäller, till exempel MESSAGE eller ATTACHMENT. */
  @IsString()
  @IsOptional()
  subType?: string;
  @IsString()
  @IsOptional()
  description?: string;
}

/**
 * En notis per ärende och användare. SupportManagement samlar allt som hänt sedan användaren senast
 * kvitterade i samma notis, så notisen bär en lista med händelser i stället för en egen händelse.
 */
export class SupportNotificationDTO {
  @IsString()
  id!: string;
  @IsString()
  created!: string;
  @IsBoolean()
  acknowledged!: boolean;
  @IsString()
  errandId!: string;
  @IsString()
  errandNumber!: string;
  /** Senaste händelsen först. Kan vara tom: SupportManagement lovar ingen händelse per notis. */
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SupportNotificationEventDTO)
  events!: SupportNotificationEventDTO[];
}

export class AcknowledgeNotificationsDTO {
  @IsArray()
  @ArrayNotEmpty()
  @ArrayMaxSize(MAX_ACKNOWLEDGED_NOTIFICATIONS)
  @IsUUID('all', { each: true })
  ids!: string[];
}

/** Vilka notiser som kvitterades och vilka som inte gick att kvittera. */
export class AcknowledgeNotificationsResultDTO {
  @IsArray()
  @IsString({ each: true })
  acknowledged!: string[];
  @IsArray()
  @IsString({ each: true })
  failed!: string[];
}

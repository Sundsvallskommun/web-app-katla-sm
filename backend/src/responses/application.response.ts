import { Type } from 'class-transformer';
import { IsArray, IsIn, IsOptional, IsString, ValidateNested } from 'class-validator';

export class ApplicationSummaryDTO {
  @IsString()
  id!: string;
  @IsString()
  applicationName!: string;
  @IsOptional()
  @IsString()
  description?: string;
  @IsString()
  url!: string;
}
export class ApplicationsResponseDTO {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ApplicationSummaryDTO)
  data!: ApplicationSummaryDTO[];
  @IsString()
  message!: string;
}
export class AppContextDTO {
  @IsIn(['katla', 'catalogue'])
  mode!: 'katla' | 'catalogue';
  @IsOptional()
  @IsString()
  katlaId?: string;
  @IsOptional()
  @IsString()
  definitionRevision?: string;
  @IsOptional()
  @IsString()
  catalogueUrl?: string;
}
export class AppContextResponseDTO {
  @ValidateNested()
  @Type(() => AppContextDTO)
  data!: AppContextDTO;
  @IsString()
  message!: string;
}

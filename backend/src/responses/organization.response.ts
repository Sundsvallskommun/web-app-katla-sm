import { Type } from 'class-transformer';
import { IsArray, IsBoolean, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';

export class OrgSearchResultDTO {
  @IsNumber()
  @IsOptional()
  orgId?: number;

  @IsString()
  @IsOptional()
  orgName?: string;

  @IsNumber()
  @IsOptional()
  parentId?: number;

  @IsBoolean()
  @IsOptional()
  isLeafLevel?: boolean;
}

export class OrgSearchResponseDTO {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrgSearchResultDTO)
  @IsOptional()
  organizations?: OrgSearchResultDTO[];

  @IsArray()
  @IsOptional()
  persons?: unknown[];

  @IsArray()
  @IsOptional()
  responsibilities?: unknown[];
}

export class OrgTreeNodeDTO {
  @IsNumber()
  @IsOptional()
  orgId?: number;

  @IsString()
  @IsOptional()
  orgName?: string;

  @IsNumber()
  @IsOptional()
  parentId?: number;

  @IsNumber()
  @IsOptional()
  level?: number;

  @IsBoolean()
  @IsOptional()
  isLeafLevel?: boolean;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrgTreeNodeDTO)
  @IsOptional()
  organizations?: OrgTreeNodeDTO[];
}

export class OrgLeafNodeDTO {
  @IsNumber()
  orgId: number;

  @IsString()
  orgName: string;

  @IsNumber()
  @IsOptional()
  parentId?: number;
}
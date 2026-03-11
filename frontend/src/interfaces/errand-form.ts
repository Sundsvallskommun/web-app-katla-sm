import { ErrandDTO } from '@data-contracts/backend/data-contracts';

export interface ErrandFormDataItem {
  schemaName: string;
  schemaId?: string;
  data: string; // JSON string
}

export interface ErrandFormDTO extends ErrandDTO {
  errandFormData?: ErrandFormDataItem[];
}

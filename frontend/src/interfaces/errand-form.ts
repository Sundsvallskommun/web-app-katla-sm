import { ErrandDTO } from '@data-contracts/backend/data-contracts';

export interface ErrandFormDataItem {
  schemaName: string;
  schemaId?: string;
  data: string; // JSON string
}

export interface ErrandFormDTO extends ErrandDTO {
  errandFormData?: ErrandFormDataItem[];
  /**
   * Rapporteras ärendet åt en kollega. Valet finns bara i gränssnittet — kollegan sparas som
   * part — men valideringen måste se det för att kunna kräva att kollegan faktiskt fylls i.
   */
  reportingForColleague?: boolean;
}

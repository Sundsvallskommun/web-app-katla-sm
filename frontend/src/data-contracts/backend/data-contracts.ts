/* eslint-disable */
/* tslint:disable */
// @ts-nocheck
/*
 * ---------------------------------------------------------------
 * ## THIS FILE WAS GENERATED VIA SWAGGER-TYPESCRIPT-API        ##
 * ##                                                           ##
 * ## AUTHOR: acacode                                           ##
 * ## SOURCE: https://github.com/acacode/swagger-typescript-api ##
 * ---------------------------------------------------------------
 */

export interface User {
  name: string;
  username: string;
  initials: string;
}

export interface UserApiResponse {
  data: User;
  message: string;
}

export interface TypeDTO {
  name: string;
  displayName?: string;
  escalationEmail?: string;
  created?: string;
  modified?: string;
}

export interface CategoryDTO {
  name?: string;
  displayName?: string;
  types?: TypeDTO[];
  created?: string;
  modified?: string;
}

export interface ExternalIdTypeDTO {
  name: string;
  created?: string;
  modified?: string;
}

export interface LabelDTO {
  id?: string;
  classification: string;
  displayName?: string;
  resourcePath?: string;
  resourceName: string;
  labels?: LabelDTO[];
}

export interface LabelsDTO {
  labelStructure?: LabelDTO[];
}

export interface StatusDTO {
  name: string;
  created?: string;
  modified?: string;
}

export interface RoleDTO {
  name: string;
  displayName?: string;
  created?: string;
  modified?: string;
}

export interface ContactReasonDTO {
  id?: string;
  reason: string;
  created?: string;
  modified?: string;
}

export interface MetadataResponseDTO {
  categories?: CategoryDTO[];
  externalIdTypes?: ExternalIdTypeDTO[];
  labels?: LabelsDTO[];
  statuses?: StatusDTO[];
  roles?: RoleDTO[];
  contactReasons?: ContactReasonDTO[];
}

export interface ErrandsQueryDTO {
  page?: number;
  size?: number;
  sort?: string;
  status?: string;
}

export interface ContactChannelDTO {
  type?: string;
  value?: string;
}

export interface StakeholderDTO {
  externalId?: string;
  personNumber?: string;
  externalIdType?: string;
  role?: string;
  city?: string;
  organizationName?: string;
  firstName?: string;
  lastName?: string;
  address?: string;
  careOf?: string;
  zipCode?: string;
  country?: string;
  contactChannels?: ContactChannelDTO[];
}

export interface ClassificationDTO {
  category?: string;
  type?: string;
}

export interface ParameterDTO {
  key: string;
  displayName?: string;
  group?: string;
  values?: any[];
}

export interface ExternalTagDTO {
  key: string;
  value: string;
}

export interface ErrandDTO {
  id?: string;
  errandNumber?: string;
  title?: string;
  priority?: "LOW" | "MEDIUM" | "HIGH";
  stakeholders?: StakeholderDTO[];
  externalTags?: ExternalTagDTO[];
  parameters?: ParameterDTO[];
  classification?: ClassificationDTO;
  status?: string;
  resolution?: string;
  description?: string;
  channel?: string;
  reporterUserId?: string;
  assignedUserId?: string;
  assignedGroupId?: string;
  escalationEmail?: string;
  contactReason?: string;
  contactReasonDescription?: string;
  businessRelated?: boolean;
  created?: string;
  modified?: string;
  touched?: string;
}

export interface SortObjectDTO {
  sorted?: boolean;
  empty?: boolean;
  unsorted?: boolean;
}

export interface PageableObjectDTO {
  paged?: boolean;
  pageNumber?: number;
  pageSize?: number;
  offset?: number;
  sort?: SortObjectDTO;
  unpaged?: boolean;
}

export interface PageErrandDTO {
  totalElements?: number;
  totalPages?: number;
  pageable?: PageableObjectDTO;
  size?: number;
  content?: ErrandDTO[];
  number?: number;
  sort?: SortObjectDTO;
  numberOfElements?: number;
  first?: boolean;
  last?: boolean;
  empty?: boolean;
}

export interface OrgManagerDTO {
  personId?: string;
  givenname?: string;
  lastname?: string;
  emailAddress?: string;
}

export interface UserEmploymentDTO {
  orgId?: number;
  orgName?: string;
  topOrgId?: number;
  isMainEmployment?: boolean;
  manager?: OrgManagerDTO;
}

export interface FacilityInfoDTO {
  orgId?: number;
  orgName?: string;
  parentOrgId?: number;
  parentOrgName?: string;
  manager?: OrgManagerDTO;
  floor?: string;
  hasSubUnits?: boolean;
}

export interface OrgSearchResultDTO {
  orgId?: number;
  orgName?: string;
  parentId?: number;
  isLeafLevel?: boolean;
}

export interface OrgSearchResponseDTO {
  organizations?: OrgSearchResultDTO[];
  persons?: any[];
  responsibilities?: any[];
}

export interface OrgTreeNodeDTO {
  orgId?: number;
  orgName?: string;
  parentId?: number;
  level?: number;
  isLeafLevel?: boolean;
  organizations?: OrgTreeNodeDTO[];
}

export interface OrgLeafNodeDTO {
  orgId: number;
  orgName: string;
  parentId?: number;
}

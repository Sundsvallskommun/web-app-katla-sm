/* eslint-disable */
/* tslint:disable */
/*
 * ---------------------------------------------------------------
 * ## THIS FILE WAS GENERATED VIA SWAGGER-TYPESCRIPT-API        ##
 * ##                                                           ##
 * ## AUTHOR: acacode                                           ##
 * ## SOURCE: https://github.com/acacode/swagger-typescript-api ##
 * ---------------------------------------------------------------
 */

export interface Email {
  smtpAddress?: string | null;
  /** @minLength 1 */
  emailSystem: string;
}

export interface Login {
  loginname?: string | null;
  /** @minLength 1 */
  displayname: string;
}

export interface MDVEmployee {
  /** @format uuid */
  personId?: string;
  personNumber?: string | null;
  classified?: string | null;
  givenname?: string | null;
  lastname?: string | null;
  friendlyGivenname?: string | null;
  /** @format int32 */
  orgId?: number;
  workPhone?: string | null;
  workMobile?: string | null;
  loginname?: string | null;
  title?: string | null;
  isManual?: boolean;
  logins?: Login[] | null;
  emails?: Email[] | null;
  employments?: MDVEmployment[] | null;
}

export interface MDVEmployment {
  title?: string | null;
  /** @format date-time */
  hireDate?: string | null;
  /** @format date-time */
  retireDate?: string | null;
  paTeam?: string | null;
  department?: string | null;
  managerName?: string | null;
}

export interface ObjectSearchResult {
  objectType?: string | null;
  subObjectType?: string | null;
  /** @format uuid */
  id?: string;
  /** @format int32 */
  subId?: number | null;
  header?: string | null;
  text?: string | null;
  /** @format int32 */
  companyOrgId?: number;
}

export interface OrgOperation {
  /** @format uuid */
  orgOperationId?: string;
  /** @format int32 */
  orgId?: number;
  operationCode?: string | null;
  operationDescription?: string | null;
}

export interface Organization {
  /** @format uuid */
  organizationId?: string;
  /** @format int32 */
  orgId?: number;
  orgName?: string | null;
  orgNameShort?: string | null;
  abbreviation?: string | null;
  concatAbbreviation?: string | null;
  /** @format int32 */
  parentId?: number | null;
  isLeafLevel?: boolean;
  /** @format int32 */
  treeLevel?: number;
  responsibilityCode?: string | null;
  responsibilityCodePartList?: string | null;
  /** @format int32 */
  companyId?: number;
}

export interface OrganizationResponsibility {
  /** @format uuid */
  orgResponsibilityId?: string;
  responsibilityCode?: string | null;
  /** @format int32 */
  orgId?: number;
  responsibilityText?: string | null;
  /** @format date-time */
  responsibilityValidFrom?: string;
  /** @format int32 */
  companyId?: number;
  typeOfResponsibility?: ResponsibilityType;
  orgName?: string | null;
  orgFromName?: string | null;
}

export interface OrganizationTree {
  /** @format uuid */
  organizationId?: string;
  /** @format int32 */
  orgId?: number;
  /** @format int32 */
  treeLevel?: number;
  orgName?: string | null;
  orgNameShort?: string | null;
  abbreviation?: string | null;
  orgDisplayName?: string | null;
  /** @format int32 */
  parentId?: number;
  isLeafLevel?: boolean;
  responsibilityCode?: string | null;
  responsibilityList?: string | null;
  organizations?: OrganizationTree[] | null;
}

export interface ProblemDetails {
  type?: string | null;
  title?: string | null;
  /** @format int32 */
  status?: number | null;
  detail?: string | null;
  instance?: string | null;
  [key: string]: any;
}

export enum ResponsibilityType {
  ANSVAR = 'ANSVAR',
  LONEANSVAR = 'LÖNEANSVAR',
  PSEUDOANSVAR = 'PSEUDOANSVAR',
}

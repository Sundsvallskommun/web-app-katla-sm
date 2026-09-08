import { ADRole, InternalRole, Permissions } from '@interfaces/auth.interface';

import { canAccessApplication, CataloguePolicy, normalizeGroups } from '@/config/catalogue-policy';
import { loadRuntimeConfiguration, readCataloguePolicy, RuntimeConfiguration } from '@/config/katla-config';
import { HttpException } from '@/exceptions/HttpException';

export { validateCataloguePolicy } from '@/config/catalogue-policy';

/** SAML-strategin är ensam om att skapa dessa claims efter verifierad inloggning. */
export interface VerifiedSessionClaims {
  groups: string[];
  groupsVerifiedAt: number;
  sessionInstanceId: string;
}

export const createVerifiedSessionClaims = (groups: string[], configuration: RuntimeConfiguration, now = Date.now()): VerifiedSessionClaims => ({
  groups: normalizeGroups(groups),
  groupsVerifiedAt: now,
  sessionInstanceId: configuration.sessionInstanceId,
});

export function authorizeGroups(groups: string): boolean {
  const configuration = loadRuntimeConfiguration();
  const policy = readCataloguePolicy(configuration);
  return configuration.mode === 'catalogue' || canAccessApplication(policy, configuration.katlaId, groups.split(','));
}

/** Även direktanrop kontrolleras. Äldre gruppclaims kräver ny SAML-inloggning. */
export const assertSessionAccess = (user: unknown, configuration: RuntimeConfiguration, policy: CataloguePolicy, now = Date.now()): void => {
  if (!user || typeof user !== 'object') throw new HttpException(401, 'NOT_AUTHORIZED');
  const claims = user as Partial<VerifiedSessionClaims>;
  if (claims.sessionInstanceId !== configuration.sessionInstanceId) throw new HttpException(401, 'SESSION_INSTANCE_MISMATCH');
  if (
    typeof claims.groupsVerifiedAt !== 'number' ||
    !Number.isFinite(claims.groupsVerifiedAt) ||
    claims.groupsVerifiedAt > now ||
    now - claims.groupsVerifiedAt >= policy.sessionMaxAgeSeconds * 1000
  ) {
    throw new HttpException(401, 'SESSION_CLAIMS_EXPIRED');
  }
  if (!Array.isArray(claims.groups) || !claims.groups.every(group => typeof group === 'string'))
    throw new HttpException(401, 'SESSION_INVALID_GROUPS');
  if (configuration.mode === 'katla' && !canAccessApplication(policy, configuration.katlaId, claims.groups))
    throw new HttpException(403, 'KATLA_ACCESS_DENIED');
};

export const defaultPermissions: () => Permissions = () => ({
  canEditSystemMessages: false,
});

enum RoleOrderEnum {
  app_read,
  app_admin,
}

const roles = new Map<InternalRole, Partial<Permissions>>([
  [
    'app_admin',
    {
      canEditSystemMessages: true,
    },
  ],
  ['app_read', {}],
]);

type RoleADMapping = Record<ADRole, InternalRole>;
const roleADMapping: RoleADMapping = {
  sg_appl_app_read: 'app_read',
  sg_appl_app_admin: 'app_admin',
};
// Uppslag med okänd nyckel (t.ex. en grupp utanför mappningen) ska ge undefined, därav den vidare typen.
const roleADMappingLookup: Partial<Record<string, InternalRole>> = roleADMapping;

/**
 *
 * @param groups Array of groups/roles
 * @param internalGroups Whether to use internal groups or external group-mappings
 * @returns collected permissions for all matching role groups
 */
export const getPermissions = (groups: string[], internalGroups = false): Permissions => {
  const permissions: Permissions = defaultPermissions();
  groups.forEach(group => {
    const groupLower = group.toLowerCase();
    const role = internalGroups ? (groupLower as InternalRole) : roleADMappingLookup[groupLower];
    if (role === undefined) return;
    const groupPermissions = roles.get(role);
    if (!groupPermissions) return;
    (Object.keys(groupPermissions) as (keyof Permissions)[]).forEach(permission => {
      if (groupPermissions[permission] === true) {
        permissions[permission] = true;
      }
    });
  });
  return permissions;
};

/**
 * Ensures to return only the role with most permissions
 * @param groups List of AD roles
 * @returns role with most permissions
 */
export const getRole = (groups: string[]): InternalRole | undefined => {
  const [firstGroup] = groups;
  if (groups.length == 1 && firstGroup !== undefined) return roleADMapping[firstGroup as ADRole]; // app_read

  const roles: InternalRole[] = [];
  groups.forEach(group => {
    const groupLower = group.toLowerCase();
    const role = roleADMappingLookup[groupLower];
    if (role) {
      roles.push(role);
    }
  });

  return roles.sort((a, b) => (RoleOrderEnum[a] > RoleOrderEnum[b] ? 1 : 0))[0];
};

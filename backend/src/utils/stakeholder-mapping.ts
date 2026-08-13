import { MUNICIPALITY_ID } from '@/config';
import { ContactChannel, Parameter, Stakeholder } from '@/data-contracts/supportmanagement/data-contracts';
import { RequestWithUser } from '@/interfaces/auth.interface';
import { StakeholderDTO } from '@/responses/supportmanagement.response';
import ApiService from '@/services/api.service';
import { logger } from '@/utils/logger';

import { apiURL } from './util';

const stakeholderParameterDisplayNames = {
  department: 'Avdelning',
  title: 'Titel',
} as const;

type ManagedStakeholderParameter = keyof typeof stakeholderParameterDisplayNames;
type ManagedContactChannelType = 'email' | 'phone';

const cloneJsonCompatible = <Value>(value: Value): Value => structuredClone(value);

const cloneContactChannel = (contactChannel: ContactChannel): ContactChannel => cloneJsonCompatible(contactChannel);

const cloneParameter = (parameter: Parameter): Parameter => cloneJsonCompatible(parameter);

const getManagedContactChannelType = (contactChannel: ContactChannel): ManagedContactChannelType | undefined => {
  const type = contactChannel.type?.toLocaleLowerCase();
  return type === 'email' || type === 'phone' ? type : undefined;
};

const getProjectedContactChannelValue = (contactChannel: ContactChannel, type: ManagedContactChannelType): string | undefined => {
  if (getManagedContactChannelType(contactChannel) !== type || !contactChannel.value) return undefined;
  return type === 'email' ? contactChannel.value.toLocaleLowerCase() : contactChannel.value;
};

const mergeManagedContactChannels = (
  contactChannels: ContactChannel[],
  type: ManagedContactChannelType,
  projectedValues: string[] | undefined,
): ContactChannel[] => {
  if (projectedValues === undefined) return contactChannels.map(cloneContactChannel);

  let projectedIndex = 0;
  const merged = contactChannels.flatMap(contactChannel => {
    const originalProjectedValue = getProjectedContactChannelValue(contactChannel, type);
    if (originalProjectedValue === undefined) return [cloneContactChannel(contactChannel)];

    const requestedValue = projectedValues[projectedIndex];
    projectedIndex += 1;

    // Frontend exponerar bara det primära värdet. Saknade efterföljande projektioner
    // betyder därför "inte ändrat", inte "ta bort resterande uppströmskanaler".
    if (requestedValue === undefined || requestedValue === originalProjectedValue) {
      return [cloneContactChannel(contactChannel)];
    }
    if (requestedValue.trim() === '') return [];

    return [{ ...cloneContactChannel(contactChannel), value: requestedValue }];
  });

  projectedValues.slice(projectedIndex).forEach(value => {
    if (value.trim() !== '') merged.push({ type, value });
  });

  return merged;
};

const mergeContactChannels = (
  originalContactChannels: ContactChannel[] | undefined,
  emails: string[] | undefined,
  phoneNumbers: string[] | undefined,
): ContactChannel[] | undefined => {
  const original = originalContactChannels ?? [];
  const withEmails = mergeManagedContactChannels(original, 'email', emails);
  const merged = mergeManagedContactChannels(withEmails, 'phone', phoneNumbers);

  return merged.length ? merged : undefined;
};

// Äldre poster bar värdet i displayName utan values. Uppströms kan serialisera
// en tom lista antingen som utelämnad eller som [], så båda formerna måste falla
// tillbaka på displayName. Annars försvinner värdet ur gränssnittet och en
// efterföljande sparning tolkar det som "inte ändrat" och tappar det permanent.
const getParameterValueFromParameter = (parameter: Parameter | undefined): string | undefined =>
  parameter?.values?.[0] ?? (parameter?.values?.length ? undefined : parameter?.displayName);

const getParameterValue = (parameters: Parameter[] | undefined, key: ManagedStakeholderParameter): string | undefined => {
  const parameter = parameters?.find(candidate => candidate.key === key);
  return getParameterValueFromParameter(parameter);
};

const replaceFirstParameterByKey = (parameters: Parameter[], key: ManagedStakeholderParameter, replacement: Parameter | undefined): Parameter[] => {
  let handled = false;

  return parameters.flatMap(parameter => {
    if (handled || parameter.key !== key) return [cloneParameter(parameter)];
    handled = true;
    return replacement ? [cloneParameter(replacement)] : [];
  });
};

const updateManagedParameter = (parameters: Parameter[], key: ManagedStakeholderParameter, value: string | undefined): Parameter[] => {
  const existingParameter = parameters.find(parameter => parameter.key === key);
  if (value === undefined || value === getParameterValueFromParameter(existingParameter)) return parameters.map(cloneParameter);

  if (!existingParameter) {
    const clonedParameters = parameters.map(cloneParameter);
    if (value.trim() === '') return clonedParameters;

    return [
      ...clonedParameters,
      {
        key,
        displayName: stakeholderParameterDisplayNames[key],
        values: [value],
      },
    ];
  }

  const remainingValues = existingParameter.values?.slice(1) ?? [];
  if (value.trim() === '') {
    return replaceFirstParameterByKey(
      parameters,
      key,
      remainingValues.length > 0 ? { ...cloneParameter(existingParameter), values: remainingValues } : undefined,
    );
  }

  return replaceFirstParameterByKey(parameters, key, {
    ...cloneParameter(existingParameter),
    key,
    ...(existingParameter.values?.length ? {} : { displayName: stakeholderParameterDisplayNames[key] }),
    values: [value, ...remainingValues],
  });
};

export function mapStakeholderToStakeholderDTO(stakeholder: Stakeholder, personNumber = ''): StakeholderDTO {
  const clonedStakeholder = cloneJsonCompatible(stakeholder);
  const { contactChannels, ...rest } = clonedStakeholder;

  const { emails, phoneNumbers } = (contactChannels ?? []).reduce<{
    emails: string[];
    phoneNumbers: string[];
  }>(
    (acc, { type, value }) => {
      if (!value) return acc;

      if (type?.toLocaleLowerCase() === 'email') acc.emails.push(value.toLocaleLowerCase());
      if (type?.toLocaleLowerCase() === 'phone') acc.phoneNumbers.push(value);

      return acc;
    },
    { emails: [], phoneNumbers: [] },
  );

  return {
    ...rest,
    contactChannels,
    parameters: clonedStakeholder.parameters,
    personNumber: addHyphenToPersonNumber(personNumber),
    title: getParameterValue(clonedStakeholder.parameters, 'title'),
    department: getParameterValue(clonedStakeholder.parameters, 'department'),
    emails: emails.length ? emails : undefined,
    phoneNumbers: phoneNumbers.length ? phoneNumbers : undefined,
  };
}

export function mapStakeholderDTOToStakeholder(stakeholder: StakeholderDTO): Stakeholder {
  const clonedStakeholder = cloneJsonCompatible(stakeholder);
  const { personNumber: _personNumber, emails, phoneNumbers, title, department, contactChannels, parameters = [], ...rest } = clonedStakeholder;

  const upstreamContactChannels = mergeContactChannels(contactChannels, emails, phoneNumbers);
  const parametersWithTitle = updateManagedParameter(parameters, 'title', title);
  const upstreamParameters = updateManagedParameter(parametersWithTitle, 'department', department);

  return {
    ...rest,
    contactChannels: upstreamContactChannels,
    parameters: upstreamParameters,
  };
}

export async function mapStakeholdersToStakeholderDTOs(
  stakeholders: Stakeholder[],
  req: RequestWithUser,
  requestStakeholders?: StakeholderDTO[],
): Promise<StakeholderDTO[]> {
  const apiService = new ApiService();
  const personNumberByExternalId = new Map<string, string>();
  requestStakeholders?.forEach(stakeholder => {
    if (stakeholder.externalId && stakeholder.personNumber) {
      personNumberByExternalId.set(stakeholder.externalId, stakeholder.personNumber);
    }
  });

  return Promise.all(
    stakeholders.map(async stakeholder => {
      let personNumber = stakeholder.externalId ? (personNumberByExternalId.get(stakeholder.externalId) ?? '') : '';

      if (stakeholder.externalId) {
        const citizenUrl = `${MUNICIPALITY_ID}/${stakeholder.externalId}/personnumber`;
        const baseURL = apiURL('citizen');

        try {
          const citizenResponse = await apiService.get<unknown>({ url: citizenUrl, baseURL }, req);
          if (typeof citizenResponse.data === 'string') {
            personNumber = citizenResponse.data || personNumber;
          } else {
            logger.warn('Citizen API returned an invalid person number while enriching a stakeholder');
          }
        } catch {
          logger.warn('Could not enrich stakeholder with a person number from the Citizen API');
        }
      }

      return mapStakeholderToStakeholderDTO(stakeholder, personNumber);
    }),
  );
}

export function addHyphenToPersonNumber(personNumber: string): string {
  if (!personNumber) return personNumber;

  const digitsOnly = personNumber.replace(/\D/g, '');

  if (digitsOnly.length !== 12) return personNumber;

  return `${digitsOnly.slice(0, 8)}-${digitsOnly.slice(8)}`;
}

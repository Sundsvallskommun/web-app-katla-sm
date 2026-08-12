import { describe, expect, it } from 'vitest';

import type { ContactChannel, Parameter, Stakeholder } from '@/data-contracts/supportmanagement/data-contracts';
import type { StakeholderDTO } from '@/responses/supportmanagement.response';
import { mapStakeholderDTOToStakeholder, mapStakeholderToStakeholderDTO } from '@/utils/stakeholder-mapping';

interface NestedPassThroughMetadata {
  audit: {
    flags: string[];
    owner: { name: string };
  };
  events: { label: string }[];
}

interface ContactChannelWithNestedMetadata extends ContactChannel {
  metadata: NestedPassThroughMetadata;
}

interface ParameterWithNestedMetadata extends Parameter {
  metadata: NestedPassThroughMetadata;
}

interface StakeholderWithNestedMetadata extends Stakeholder {
  metadata: NestedPassThroughMetadata;
  contactChannels?: ContactChannelWithNestedMetadata[];
  parameters?: ParameterWithNestedMetadata[];
}

interface StakeholderDTOWithNestedMetadata extends StakeholderDTO {
  metadata: NestedPassThroughMetadata;
  contactChannels?: ContactChannelWithNestedMetadata[];
  parameters?: ParameterWithNestedMetadata[];
}

const nestedMetadata = (): NestedPassThroughMetadata => ({
  audit: {
    flags: ['original'],
    owner: { name: 'upstream' },
  },
  events: [{ label: 'created' }],
});

describe('stakeholder mapping', () => {
  it('roundtrips contact details and all parameters without mutating either representation', () => {
    const upstreamStakeholder: Stakeholder = {
      externalId: 'person-id',
      role: 'CONTACT',
      firstName: 'Ada',
      lastName: 'Lovelace',
      contactChannels: [
        { type: 'sms', value: '+46709999999' },
        { type: 'Email', value: 'ADA@EXAMPLE.COM' },
        { type: 'Phone', value: '+46701234567' },
      ],
      parameters: [
        { key: 'referenceNumber', displayName: 'Referensnummer', group: 'identity', values: ['REF-123'] },
        { key: 'title', displayName: 'Titel', group: 'employment', values: ['Analytiker', 'Reservtitel'] },
        { key: 'department', displayName: 'Avdelning', values: ['Analys'] },
      ],
    };
    const upstreamSnapshot = structuredClone(upstreamStakeholder);

    const frontendStakeholder = mapStakeholderToStakeholderDTO(upstreamStakeholder, '199001011234');

    expect(upstreamStakeholder).toEqual(upstreamSnapshot);
    expect(frontendStakeholder).toMatchObject({
      externalId: 'person-id',
      role: 'CONTACT',
      firstName: 'Ada',
      lastName: 'Lovelace',
      personNumber: '19900101-1234',
      emails: ['ada@example.com'],
      phoneNumbers: ['+46701234567'],
      title: 'Analytiker',
      department: 'Analys',
      contactChannels: upstreamStakeholder.contactChannels,
      parameters: upstreamStakeholder.parameters,
    });
    expect(frontendStakeholder.contactChannels).not.toBe(upstreamStakeholder.contactChannels);
    expect(frontendStakeholder.parameters).not.toBe(upstreamStakeholder.parameters);
    expect(frontendStakeholder.parameters?.[0]?.values).not.toBe(upstreamStakeholder.parameters?.[0]?.values);

    const frontendSnapshot = structuredClone(frontendStakeholder);
    const roundtrippedStakeholder = mapStakeholderDTOToStakeholder(frontendStakeholder);

    expect(frontendStakeholder).toEqual(frontendSnapshot);
    expect(roundtrippedStakeholder).toEqual(upstreamStakeholder);
  });

  it('deeply isolates unknown JSON metadata in both mapping directions', () => {
    const upstreamStakeholder: StakeholderWithNestedMetadata = {
      metadata: nestedMetadata(),
      contactChannels: [{ type: 'Phone', value: '+46701111111', metadata: nestedMetadata() }],
      parameters: [{ key: 'referenceNumber', values: ['REF-123'], metadata: nestedMetadata() }],
    };
    const upstreamSnapshot = structuredClone(upstreamStakeholder);

    const frontendStakeholder = mapStakeholderToStakeholderDTO(upstreamStakeholder) as StakeholderDTOWithNestedMetadata;
    const frontendChannel = frontendStakeholder.contactChannels?.[0];
    const frontendParameter = frontendStakeholder.parameters?.[0];
    if (!frontendChannel || !frontendParameter) throw new Error('Mapped pass-through metadata is missing');

    frontendStakeholder.metadata.audit.flags.push('frontend');
    frontendChannel.metadata.audit.owner.name = 'frontend';
    frontendParameter.metadata.events.push({ label: 'frontend' });

    expect(upstreamStakeholder).toEqual(upstreamSnapshot);

    const frontendInput: StakeholderDTOWithNestedMetadata = {
      metadata: nestedMetadata(),
      phoneNumbers: ['+46701111111'],
      contactChannels: [{ type: 'Phone', value: '+46701111111', metadata: nestedMetadata() }],
      parameters: [{ key: 'referenceNumber', values: ['REF-123'], metadata: nestedMetadata() }],
    };
    const frontendSnapshot = structuredClone(frontendInput);

    const mappedUpstream = mapStakeholderDTOToStakeholder(frontendInput) as StakeholderWithNestedMetadata;
    const mappedChannel = mappedUpstream.contactChannels?.[0];
    const mappedParameter = mappedUpstream.parameters?.[0];
    if (!mappedChannel || !mappedParameter) throw new Error('Mapped upstream metadata is missing');

    mappedUpstream.metadata.audit.flags.push('upstream');
    mappedChannel.metadata.audit.owner.name = 'upstream';
    mappedParameter.metadata.events.push({ label: 'upstream' });

    expect(frontendInput).toEqual(frontendSnapshot);
  });

  it('updates only the projected managed value, preserves remaining values and leaves unknown parameters untouched', () => {
    const frontendStakeholder: StakeholderDTO = {
      personNumber: '19900101-1234',
      title: 'Ny titel',
      department: '',
      parameters: [
        { key: 'referenceNumber', displayName: 'Referensnummer', values: ['REF-123'] },
        {
          key: 'title',
          displayName: 'Gammal etikett',
          group: 'employment',
          values: ['Gammal titel', 'Oförändrad reservtitel'],
        },
        { key: 'department', displayName: 'Avdelning', values: ['Gammal avdelning'] },
      ],
    };
    const snapshot = structuredClone(frontendStakeholder);

    const upstreamStakeholder = mapStakeholderDTOToStakeholder(frontendStakeholder);

    expect(frontendStakeholder).toEqual(snapshot);
    expect(upstreamStakeholder).not.toHaveProperty('personNumber');
    expect(upstreamStakeholder.parameters).toEqual([
      { key: 'referenceNumber', displayName: 'Referensnummer', values: ['REF-123'] },
      {
        key: 'title',
        displayName: 'Gammal etikett',
        group: 'employment',
        values: ['Ny titel', 'Oförändrad reservtitel'],
      },
    ]);

    const clearedTitle = structuredClone(frontendStakeholder);
    clearedTitle.title = '';
    expect(mapStakeholderDTOToStakeholder(clearedTitle).parameters).toEqual([
      { key: 'referenceNumber', displayName: 'Referensnummer', values: ['REF-123'] },
      {
        key: 'title',
        displayName: 'Gammal etikett',
        group: 'employment',
        values: ['Oförändrad reservtitel'],
      },
    ]);
  });

  it('preserves unknown contact channels while replacing an intentionally edited email projection', () => {
    const frontendStakeholder: StakeholderDTO = {
      contactChannels: [
        { type: 'sms', value: '+46709999999' },
        { type: 'Email', value: 'old@example.com' },
        { type: 'Phone', value: '+46701234567' },
      ],
      emails: ['new@example.com'],
      phoneNumbers: ['+46701234567'],
    };

    expect(mapStakeholderDTOToStakeholder(frontendStakeholder).contactChannels).toEqual([
      { type: 'sms', value: '+46709999999' },
      { type: 'Email', value: 'new@example.com' },
      { type: 'Phone', value: '+46701234567' },
    ]);
  });

  it('treats omitted trailing phone projections as untouched and preserves their metadata', () => {
    const contactChannels = [
      { type: 'sms', value: '+46709999999', source: 'upstream-sms' },
      { type: 'Phone', value: '+46701111111', source: 'primary-phone' },
      { type: 'Phone', value: '+46702222222', source: 'secondary-phone' },
    ];
    const frontendStakeholder: StakeholderDTO = {
      phoneNumbers: ['+46703333333'],
      contactChannels,
    };

    expect(mapStakeholderDTOToStakeholder(frontendStakeholder).contactChannels).toEqual([
      { type: 'sms', value: '+46709999999', source: 'upstream-sms' },
      { type: 'Phone', value: '+46703333333', source: 'primary-phone' },
      { type: 'Phone', value: '+46702222222', source: 'secondary-phone' },
    ]);
  });

  it('preserves legacy managed parameters on no-op and canonicalizes only an intentional edit', () => {
    const legacyStakeholder: Stakeholder = {
      parameters: [{ key: 'title', displayName: 'Sjuksköterska' }],
    };

    const frontendStakeholder = mapStakeholderToStakeholderDTO(legacyStakeholder);
    const upstreamStakeholder = mapStakeholderDTOToStakeholder(frontendStakeholder);
    const editedStakeholder = structuredClone(frontendStakeholder);
    editedStakeholder.title = 'Överläkare';

    expect(frontendStakeholder.title).toBe('Sjuksköterska');
    expect(upstreamStakeholder.parameters).toEqual(legacyStakeholder.parameters);
    expect(mapStakeholderDTOToStakeholder(editedStakeholder).parameters).toEqual([{ key: 'title', displayName: 'Titel', values: ['Överläkare'] }]);
  });

  it('reads a legacy managed parameter that upstream serialized with an empty values list', () => {
    const legacyStakeholder: Stakeholder = {
      parameters: [{ key: 'title', displayName: 'Sjuksköterska', values: [] }],
    };

    const frontendStakeholder = mapStakeholderToStakeholderDTO(legacyStakeholder);
    const editedStakeholder = structuredClone(frontendStakeholder);
    editedStakeholder.title = 'Överläkare';

    expect(frontendStakeholder.title).toBe('Sjuksköterska');
    expect(mapStakeholderDTOToStakeholder(frontendStakeholder).parameters).toEqual(legacyStakeholder.parameters);
    expect(mapStakeholderDTOToStakeholder(editedStakeholder).parameters).toEqual([{ key: 'title', displayName: 'Titel', values: ['Överläkare'] }]);
  });
});

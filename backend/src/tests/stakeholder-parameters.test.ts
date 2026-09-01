import { describe, expect, it } from 'vitest';

import { Stakeholder } from '@/data-contracts/supportmanagement/data-contracts';
import { StakeholderDTO } from '@/responses/supportmanagement.response';
import { mapStakeholderDTOToStakeholder } from '@/utils/stakeholder-mapping';

/**
 * Titel och avdelning ligger i egna fält i DTO:n men som parametrar hos API:t. Övriga parametrar
 * — anställningsform till exempel — hör till parten och får inte tappas i mappningen åt något håll.
 */
describe('stakeholder parameters', () => {
  it('keeps the stakeholders own parameters alongside title and department', () => {
    const stakeholder: StakeholderDTO = {
      role: 'REPORTER',
      title: 'Undersköterska',
      department: 'Hemtjänsten',
      parameters: [{ key: 'employmentType', values: ['VIKARIE'] }],
    };

    const mapped = mapStakeholderDTOToStakeholder(stakeholder);

    expect(mapped.parameters).toEqual([
      { key: 'employmentType', values: ['VIKARIE'] },
      { key: 'title', displayName: 'Undersköterska' },
      { key: 'department', displayName: 'Hemtjänsten' },
    ]);
  });

  it('carries other parameters back to the DTO without duplicating the lifted ones', async () => {
    const { mapStakeholderToStakeholderDTO } = await import('@/utils/stakeholder-mapping');
    const stakeholder: Stakeholder = {
      role: 'REPORTER',
      parameters: [
        { key: 'title', displayName: 'Undersköterska' },
        { key: 'department', displayName: 'Hemtjänsten' },
        { key: 'employmentType', values: ['VIKARIE'] },
      ],
    };

    // Utan externalId slås inget personnummer upp, så mappningen behöver ingen request.
    const dto = await mapStakeholderToStakeholderDTO(stakeholder, {} as never);

    expect(dto.title).toBe('Undersköterska');
    expect(dto.department).toBe('Hemtjänsten');
    expect(dto.parameters).toEqual([{ key: 'employmentType', values: ['VIKARIE'] }]);
  });
});

'use client';

import { Banner } from '@astryxdesign/core/Banner';
import { Stack } from '@astryxdesign/core/Stack';
import { ErrandFormSections } from '@components/errand-pages/errand-form-sections.component';
import { useErrandLockedByStatus } from '@contexts/errand-content-lock-context';
import { useTranslation } from 'react-i18next';

export const CreatedErrand: React.FC = () => {
  const { t } = useTranslation();
  const isLocked = useErrandLockedByStatus();

  return (
    <Stack gap={6}>
      {/* Avsnitten nedan är inaktiverade när ärendet är inlämnat. Utan en
          förklaring syns bara att ingenting går att ändra, inte varför. */}
      {isLocked && <Banner status="info" title={t('errand-information:read_only.notice')} data-cy="read-only-notice" />}
      <ErrandFormSections />
    </Stack>
  );
};

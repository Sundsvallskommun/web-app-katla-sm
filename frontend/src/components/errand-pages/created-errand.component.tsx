'use client';

import { ErrandFormSections } from '@components/errand-pages/errand-form-sections.component';
import { useErrandLockedByStatus } from '@contexts/errand-content-lock-context';
import { Alert } from '@sk-web-gui/react';
import { useTranslation } from 'react-i18next';

export const CreatedErrand: React.FC = () => {
  const { t } = useTranslation();
  const isLocked = useErrandLockedByStatus();

  return (
    <div className="flex flex-col gap-48">
      {/* Avsnitten nedan är inaktiverade när ärendet är inlämnat. Utan en
          förklaring syns bara att ingenting går att ändra, inte varför. */}
      {isLocked && (
        <div data-cy="read-only-notice" role="status">
          <Alert type="info">
            <Alert.Icon />
            <Alert.Content>
              <Alert.Content.Description>{t('errand-information:read_only.notice')}</Alert.Content.Description>
            </Alert.Content>
          </Alert>
        </div>
      )}
      <ErrandFormSections />
    </div>
  );
};

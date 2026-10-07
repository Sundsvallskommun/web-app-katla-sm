'use client';

import { Trans, useTranslation } from 'react-i18next';

import { getUserGuideUiLabels, UNESCAPED_INTERPOLATION } from './user-guide-ui-labels';

interface UserGuideTextProps {
  /** Nyckel i namnrymden user-guide. */
  textKey: string;
}

/**
 * En text ur guiden med appens egna etiketter insatta. <strong> i översättningen blir fetstil,
 * så att knappnamnen sticker ut i texten på samma sätt som de gör på skärmen.
 */
export const UserGuideText: React.FC<UserGuideTextProps> = ({ textKey }) => {
  const { t } = useTranslation('user-guide');

  return (
    <Trans
      t={t}
      i18nKey={textKey}
      values={getUserGuideUiLabels(t)}
      tOptions={UNESCAPED_INTERPOLATION}
      components={{ strong: <strong className="font-bold" /> }}
    />
  );
};

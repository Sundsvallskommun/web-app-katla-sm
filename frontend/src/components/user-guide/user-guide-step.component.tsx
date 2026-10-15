'use client';

import { Label } from '@sk-web-gui/react';
import { useTranslation } from 'react-i18next';
import { appConfig } from 'src/config/appconfig';

import { UserGuideBlock } from './user-guide-block.component';
import { GuideStep, isGuideItemVisible } from './user-guide-steps';

interface UserGuideStepProps {
  step: GuideStep;
  /** Stegets nummer. Utelämnas för avsnitten efter stegen, som inte är en del av flödet. */
  number?: number;
}

/** Ett steg i guiden: rubrik med stegnummer, och stegets text, tips och bilder. */
export const UserGuideStep: React.FC<UserGuideStepProps> = ({ step, number }) => {
  const { t } = useTranslation('user-guide');
  const headingId = `${step.id}-rubrik`;
  const blocks = step.blocks.filter((block) => isGuideItemVisible(block, appConfig.features));

  return (
    <section id={step.id} aria-labelledby={headingId} className="flex scroll-mt-24 flex-col gap-24">
      {/* Numret står kvar till vänster när rubriken bryts, och etiketten får hellre en egen rad. */}
      <div className="flex items-center gap-12">
        {number !== undefined && (
          <span
            aria-hidden="true"
            className="bg-vattjom-surface-primary text-light-primary inline-flex h-[4rem] w-[4rem] shrink-0 items-center justify-center rounded-full text-large font-bold"
          >
            {number}
          </span>
        )}
        <div className="flex min-w-0 flex-wrap items-center gap-x-12 gap-y-8">
          <h2 id={headingId} className="text-h3-sm md:text-h3-md text-dark-primary min-w-0">
            {number !== undefined && <span className="sr-only">{t('step_label', { number })}: </span>}
            {t(step.titleKey)}
          </h2>
          {step.badgeKey && (
            <Label rounded inverted color="vattjom">
              {t(step.badgeKey)}
            </Label>
          )}
        </div>
      </div>
      {blocks.map((block) => (
        <UserGuideBlock key={block.kind === 'figure' ? block.screenshot : block.textKey} block={block} />
      ))}
    </section>
  );
};

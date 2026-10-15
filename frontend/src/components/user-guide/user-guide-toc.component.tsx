'use client';

import { Link } from '@sk-web-gui/react';
import { useTranslation } from 'react-i18next';

import { GuideStep } from './user-guide-steps';

interface UserGuideTocProps {
  steps: GuideStep[];
  appendix: GuideStep[];
}

/** Innehållsförteckningen: stegen numrerade i ordning, avsnitten efter dem utan nummer. */
export const UserGuideToc: React.FC<UserGuideTocProps> = ({ steps, appendix }) => {
  const { t } = useTranslation('user-guide');

  return (
    <nav aria-labelledby="user-guide-toc-heading" className="flex flex-col gap-12">
      <h2 id="user-guide-toc-heading" className="text-h4-sm text-dark-primary">
        {t('toc_title')}
      </h2>
      <ol className="flex list-decimal flex-col gap-8 pl-24">
        {steps.map((step) => (
          <li key={step.id}>
            <Link href={`#${step.id}`}>{t(step.titleKey)}</Link>
          </li>
        ))}
      </ol>
      <ul className="flex flex-col gap-8">
        {appendix.map((section) => (
          <li key={section.id}>
            <Link href={`#${section.id}`}>{t(section.titleKey)}</Link>
          </li>
        ))}
      </ul>
    </nav>
  );
};

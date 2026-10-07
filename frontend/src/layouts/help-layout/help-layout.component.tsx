'use client';

import { AppHeader } from '@layouts/app-header.component';
import { withBasePath } from '@utils/base-path';
import { useTranslation } from 'react-i18next';

/**
 * Hjälpsidornas skal: appens vanliga sidhuvud, med logotypen som väg tillbaka till översikten.
 * Hjälplänken utgår, eftersom den bara hade pekat på sidan man redan står på.
 */
export const HelpLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { t } = useTranslation();

  return (
    <div className="bg-background-content flex min-h-screen flex-col">
      <AppHeader subtitle={t('layout:header.subtitle')} logoHref={withBasePath('/oversikt')} helpLink="none" />
      {children}
    </div>
  );
};

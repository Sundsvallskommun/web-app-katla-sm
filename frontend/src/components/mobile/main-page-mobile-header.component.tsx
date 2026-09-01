'use client';

import { PageHeader } from '@layouts/page-header.component';
import { Logo } from '@sk-web-gui/react';
import NextLink from 'next/link';
import { ReactElement, ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME ?? '';

/** Samma mörka rad som på stor skärm – se AppHeader för varför klasserna sätts här. */
const MOBILE_HEADER_CLASS =
  'bg-inverted-background-100 border-b-1 border-inverted-divider shadow-none px-16 !py-12 [&_.sk-header-top-content]:!py-0';

interface MainPageMobileHeaderProps {
  // Override the left-side icon.
  icon?: ReactElement;
  // Override the right-side action buttons.
  actions?: ReactNode;
  children?: ReactNode;
}

export const MainPageMobileHeader: React.FC<MainPageMobileHeaderProps> = ({ icon, actions, children }) => {
  const { t } = useTranslation();
  const headerIcon = icon ?? (
    <NextLink href="/oversikt" title={t('layout:controls.go_to_start', { app: APP_NAME })}>
      <Logo variant="symbol" inverted className="h-32" />
    </NextLink>
  );

  // Bugfix (static-components): JSX-variabel i stället för komponent skapad under rendering
  const title = (
    <div className="flex items-center gap-8">
      {headerIcon}
      <div className="flex flex-col justify-center">
        <span className="font-header text-inverted-dark-primary text-base font-bold leading-[2rem]">{APP_NAME}</span>
        <span className="text-inverted-dark-secondary text-small leading-[1.6rem]">{t('layout:header.subtitle')}</span>
      </div>
    </div>
  );

  return (
    <div className="flex h-[100dvh] flex-col pt-[env(safe-area-inset-top)]">
      <div className="relative z-[15] flex-shrink-0">
        <PageHeader className={MOBILE_HEADER_CLASS} logo={title} mobileMenu={actions} />
      </div>
      <div className="bg-background-content flex-grow overflow-y-auto">{children}</div>
    </div>
  );
};

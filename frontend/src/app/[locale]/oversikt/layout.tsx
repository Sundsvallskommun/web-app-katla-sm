'use client';
import { OverviewSidebar } from '@components/sidebars/overview-sidebar.component';
import EmptyLayout from '@layouts/empty-layout/empty-layout.component';
import { CookieConsent, Link } from '@sk-web-gui/react';
import NextLink from 'next/link';
import { useTranslation } from 'react-i18next';

export default function OversiktLayout({ children }: { children: React.ReactNode }) {
      const { t } = useTranslation();
  return (
    <EmptyLayout>
      <div className="flex">
        <OverviewSidebar />
        <div className="flex-grow">
          {children}
        </div>
      </div>
      <CookieConsent
        title={t('layout:cookies.title', { app: process.env.NEXT_PUBLIC_APP_NAME })}
        body={
          <p>
            {t('layout:cookies.description')}{' '}
            <NextLink href="/kakor" passHref legacyBehavior>
              <Link>{t('layout:cookies.read_more')}</Link>
            </NextLink>
          </p>
        }
        cookies={[
          {
            optional: false,
            displayName: t('layout:cookies.necessary.displayName'),
            description: t('layout:cookies.necessary.description'),
            cookieName: 'necessary',
          },
          {
            optional: true,
            displayName: t('layout:cookies.func.displayName'),
            description: t('layout:cookies.func.description'),
            cookieName: 'func',
          },
          {
            optional: true,
            displayName: t('layout:cookies.stats.displayName'),
            description: t('layout:cookies.stats.description'),
            cookieName: 'stats',
          },
        ]}
        resetConsentOnInit={false}
        onConsent={() => {
          // FIXME: do stuff with cookies?
          // NO ANO FUNCTIONS
        }}
      />
    </EmptyLayout>
  );
}

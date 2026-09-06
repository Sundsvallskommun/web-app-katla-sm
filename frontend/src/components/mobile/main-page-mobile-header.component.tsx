'use client';

import { Stack } from '@astryxdesign/core/Stack';
import { TopNav, TopNavHeading } from '@astryxdesign/core/TopNav';
import styles from '@layouts/app-shell.module.css';
import NextLink from 'next/link';
import { type ReactElement, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME ?? '';

interface MainPageMobileHeaderProps {
  icon?: ReactElement;
  actions?: ReactNode;
  children?: ReactNode;
}

export const MainPageMobileHeader: React.FC<MainPageMobileHeaderProps> = ({ icon, actions, children }) => {
  const { t } = useTranslation();
  return (
    <div className={styles.mobilePage}>
      <Stack as="header" paddingInline={2} className={`${styles.header} ${styles.mobileHeader}`}>
        <TopNav
          label={APP_NAME}
          heading={
            <TopNavHeading
              heading={APP_NAME}
              subheading={t('layout:header.subtitle')}
              headingHref="/oversikt"
              as={NextLink}
              logo={icon}
            />
          }
          endContent={actions}
        />
      </Stack>
      <div className={styles.mobilePageContent}>{children}</div>
    </div>
  );
};

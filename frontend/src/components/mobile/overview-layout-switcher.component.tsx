'use client';

import { AppShell } from '@astryxdesign/core/AppShell';
import { OverviewSidebar } from '@components/sidebars/overview-sidebar.component';
import { OverviewMobileProvider } from '@contexts/overview-mobile-provider';
import { AppHeader } from '@layouts/app-header.component';
import { useTranslation } from 'react-i18next';
import { MOBILE_BREAKPOINT } from 'src/constants/responsive';
import { useMediaQuery } from 'src/hooks/use-media-query';

export const OverviewLayoutSwitcher: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { t } = useTranslation();
  const isMobile = useMediaQuery(MOBILE_BREAKPOINT);

  return (
    <OverviewMobileProvider value={isMobile}>
      {isMobile ?
        children
      : <AppShell
          variant="section"
          topNav={<AppHeader as="div" subtitle={t('layout:header.subtitle')} />}
          sideNav={<OverviewSidebar />}
          mobileNav={false}
          contentPadding={6}
        >
          {children}
        </AppShell>
      }
    </OverviewMobileProvider>
  );
};

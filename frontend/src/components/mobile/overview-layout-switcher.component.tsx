'use client';

import { OverviewSidebar } from '@components/sidebars/overview-sidebar.component';
import { OverviewMobileProvider } from '@contexts/overview-mobile-provider';
import { AppHeader } from '@layouts/app-header.component';
import { useTranslation } from 'react-i18next';
import { MOBILE_BREAKPOINT } from 'src/constants/responsive';
import { useMediaQuery } from 'src/hooks/use-media-query';

interface OverviewLayoutSwitcherProps {
  children: React.ReactNode;
}

/**
 * Översiktens skal på stor skärm: appens sidhuvud överst, sidopanelen till vänster under det.
 * Mobilen har ett eget skal med sitt sidhuvud och sin meny.
 */
export const OverviewLayoutSwitcher: React.FC<OverviewLayoutSwitcherProps> = ({ children }) => {
  const { t } = useTranslation();
  const isMobile = useMediaQuery(MOBILE_BREAKPOINT);

  return (
    <OverviewMobileProvider value={isMobile}>
      {isMobile ?
        children
      : <div className="bg-background-content flex min-h-screen flex-col">
          <AppHeader subtitle={t('layout:header.subtitle')} />
          <div className="flex flex-1">
            <OverviewSidebar />
            <div className="min-w-0 flex-1">{children}</div>
          </div>
        </div>
      }
    </OverviewMobileProvider>
  );
};

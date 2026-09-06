'use client';

import { SideNav, SideNavHeading } from '@astryxdesign/core/SideNav';
import { LinkButton } from '@components/navigation/link-button.component';
import { Plus } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { OverviewStatusNav } from './overview-status-nav.component';

export const OverviewSidebar: React.FC = () => {
  const { t } = useTranslation();
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <SideNav
      data-cy="overview-aside"
      aria-label={t('filtering:reports_heading')}
      collapsible={{
        isCollapsed,
        onCollapsedChange: setIsCollapsed,
        buttonLabel: t(isCollapsed ? 'layout:controls.open_sidebar' : 'layout:controls.close_sidebar'),
      }}
      topContent={
        <LinkButton
          href="/arende/registrera"
          data-cy="register-new-errand-button"
          variant="primary"
          width={isCollapsed ? undefined : '100%'}
          isIconOnly={isCollapsed}
          icon={<Plus aria-hidden="true" />}
          label={t('filtering:new_errand_mobile')}
        />
      }
    >
      <SideNavHeading heading={t('filtering:reports_heading')} />
      <OverviewStatusNav collapsed={isCollapsed} />
    </SideNav>
  );
};

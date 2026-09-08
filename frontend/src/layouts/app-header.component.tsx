'use client';

import { Stack } from '@astryxdesign/core/Stack';
import { TopNav, TopNavHeading } from '@astryxdesign/core/TopNav';
import { LanguageSwitchButton } from '@components/misc/language-switch-button.component';
import { NotificationsBell } from '@components/notifications/notification-bell';
import { NotificationsWrapper } from '@components/notifications/notification-wrapper';
import { AppUserMenu } from '@components/user-menu/app-user-menu.component';
import { createUserMenuGroups } from '@layouts/userMenuGroup';
import { useUserStore } from '@services/user-service/user-service';
import { type ReactNode, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { appConfig } from 'src/config/appconfig';

interface AppHeaderProps {
  as?: 'header' | 'div';
  logoHref?: string;
  actions?: ReactNode;
  onBeforeLanguageSwitch?: () => void;
}

/** One stable header at every width; page context belongs in the content heading. */
export const AppHeader: React.FC<AppHeaderProps> = ({ as = 'header', logoHref, actions, onBeforeLanguageSwitch }) => {
  const { t } = useTranslation();
  const user = useUserStore((state) => state.user);
  const [showNotifications, setShowNotifications] = useState(false);
  const userMenuGroups = createUserMenuGroups(t, { onBeforeLanguageSwitch });
  if (actions)
    userMenuGroups.unshift({
      label: t('filtering:reports_heading'),
      elements: [{ label: t('filtering:new_errand'), element: () => actions }],
    });

  return (
    <>
      <Stack as={as} paddingInline={2} className="shrink-0 border-b border-default bg-surface">
        <TopNav
          label={appConfig.applicationName}
          heading={
            <TopNavHeading
              heading={appConfig.applicationName}
              headingHref={logoHref}
              superheading={appConfig.mode === 'katla' && appConfig.catalogueUrl ? t('catalogue:title') : undefined}
              superheadingHref={appConfig.mode === 'katla' ? appConfig.catalogueUrl : undefined}
            />
          }
          endContent={
            <Stack direction="horizontal" align="center" gap={1}>
              {appConfig.mode === 'katla' && (
                <NotificationsBell
                  expanded={showNotifications}
                  toggleShow={() => {
                    setShowNotifications((shown) => !shown);
                  }}
                />
              )}
              <LanguageSwitchButton onBeforeSwitch={onBeforeLanguageSwitch} />
              <AppUserMenu
                data-cy="usermenu"
                initials={user.initials}
                menuTitle={user.name}
                menuSubTitle={user.username}
                menuGroups={userMenuGroups}
              />
            </Stack>
          }
        />
      </Stack>
      {appConfig.mode === 'katla' && <NotificationsWrapper show={showNotifications} setShow={setShowNotifications} />}
    </>
  );
};

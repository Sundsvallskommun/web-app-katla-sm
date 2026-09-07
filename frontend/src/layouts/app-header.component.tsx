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

const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME ?? '';

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
          label={APP_NAME}
          heading={<TopNavHeading heading={APP_NAME} headingHref={logoHref} />}
          endContent={
            <Stack direction="horizontal" align="center" gap={1}>
              <NotificationsBell
                expanded={showNotifications}
                toggleShow={() => {
                  setShowNotifications((shown) => !shown);
                }}
              />
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
      <NotificationsWrapper show={showNotifications} setShow={setShowNotifications} />
    </>
  );
};

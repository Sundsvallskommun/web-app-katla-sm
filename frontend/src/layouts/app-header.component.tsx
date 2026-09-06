'use client';

import { Stack } from '@astryxdesign/core/Stack';
import { Text } from '@astryxdesign/core/Text';
import { TopNav, TopNavHeading } from '@astryxdesign/core/TopNav';
import { LanguageSwitchButton } from '@components/misc/language-switch-button.component';
import { NotificationsBell } from '@components/notifications/notification-bell';
import { NotificationsWrapper } from '@components/notifications/notification-wrapper';
import { AppUserMenu } from '@components/user-menu/app-user-menu.component';
import { createUserMenuGroups } from '@layouts/userMenuGroup';
import { useUserStore } from '@services/user-service/user-service';
import NextLink from 'next/link';
import { type ReactNode, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MOBILE_BREAKPOINT } from 'src/constants/responsive';
import { useMediaQuery } from 'src/hooks/use-media-query';

import styles from './app-shell.module.css';

const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME ?? '';

interface AppHeaderProps {
  as?: 'header' | 'div';
  subtitle?: string;
  logoHref?: string;
  brandAside?: ReactNode;
  mobileMenu?: ReactNode;
  actions?: ReactNode;
  onBeforeLanguageSwitch?: () => void;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  as = 'header',
  subtitle,
  logoHref,
  brandAside,
  mobileMenu,
  actions,
  onBeforeLanguageSwitch,
}) => {
  const { t } = useTranslation();
  const user = useUserStore((state) => state.user);
  const isMobile = useMediaQuery(MOBILE_BREAKPOINT);
  const [showNotifications, setShowNotifications] = useState(false);
  const userMenuGroups = createUserMenuGroups(t, { onBeforeLanguageSwitch });
  const controls = (
    <Stack direction="horizontal" align="center" gap={2}>
      <NotificationsBell
        expanded={showNotifications}
        toggleShow={() => {
          setShowNotifications((shown) => !shown);
        }}
      />
      <LanguageSwitchButton onBeforeSwitch={onBeforeLanguageSwitch} />
      {isMobile ?
        mobileMenu
      : <>
          <Stack gap={0}>
            <Text weight="semibold">{user.name}</Text>
            <Text size="sm" color="secondary">
              {user.username}
            </Text>
          </Stack>
          <div data-cy="usermenu">
            <AppUserMenu
              initials={user.initials}
              menuTitle={`${user.name} (${user.username})`}
              menuGroups={userMenuGroups}
            />
          </div>
          {actions}
        </>
      }
    </Stack>
  );

  return (
    <>
      <Stack as={as} paddingInline={2} paddingBlockEnd={isMobile ? 2 : 0} gap={2} className={styles.header}>
        <TopNav
          label={APP_NAME}
          heading={<TopNavHeading heading={APP_NAME} subheading={subtitle} headingHref={logoHref} as={NextLink} />}
          startContent={isMobile ? undefined : brandAside}
          endContent={isMobile ? undefined : controls}
        />
        {isMobile && (
          <Stack direction="horizontal" justify={brandAside ? 'between' : 'end'} align="center" gap={3} wrap="wrap">
            {brandAside}
            {controls}
          </Stack>
        )}
      </Stack>
      <NotificationsWrapper show={showNotifications} setShow={setShowNotifications} />
    </>
  );
};

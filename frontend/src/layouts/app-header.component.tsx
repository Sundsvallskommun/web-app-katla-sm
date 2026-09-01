'use client';

import { LanguageSwitchButton } from '@components/misc/language-switch-button.component';
import { NotificationsBell } from '@components/notifications/notification-bell';
import { NotificationsWrapper } from '@components/notifications/notification-wrapper';
import { AppUserMenu } from '@components/user-menu/app-user-menu.component';
import { PageHeader } from '@layouts/page-header.component';
import { createUserMenuGroups } from '@layouts/userMenuGroup';
import { useUserStore } from '@services/user-service/user-service';
import { Divider, Logo } from '@sk-web-gui/react';
import { ChevronDown } from 'lucide-react';
import { ReactNode, useState } from 'react';
import { useTranslation } from 'react-i18next';

const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME ?? '';

/**
 * Sidhuvudet är mörkt, till skillnad från designsystemets ljusa standardhuvud. Utseendet sätts
 * här i stället för i .sk-header eftersom det gäller den här appen, inte alla appar som använder
 * komponenten. Klasserna ligger i utility-lagret och vinner därför över komponentlagrets egna.
 *
 * PageHeader sätter själv py-2 på .sk-header och py-4 på innehållsraden, så designens lodräta
 * mått måste ta över båda.
 */
const HEADER_CLASS =
  'bg-inverted-background-100 border-b-1 border-inverted-divider shadow-none px-24 !py-16 [&_.sk-header-top-content]:!py-0';

interface AppHeaderProps {
  /** Andra raden i varumärkesblocket: appens undertitel, eller sidans sammanhang. */
  subtitle?: string;
  /** Länkar logotypen till översikten. Utelämnas där en väg bort från sidan inte hör hemma. */
  logoHref?: string;
  /** Står bredvid varumärket, till exempel ärendets statusetikett. */
  brandAside?: ReactNode;
  /** Innehållet i sidhuvudets menyknapp på smal skärm. */
  mobileMenu?: ReactNode;
  /** Extra kontroller till höger, före användarmenyn. */
  actions?: ReactNode;
  /** Sidor med tillstånd i minnet får rädda undan det innan språkbytet navigerar. */
  onBeforeLanguageSwitch?: () => void;
}

/**
 * Appens sidhuvud: varumärke till vänster, aviseringar, språkval och inloggad användare till
 * höger. Delas av rapporteringen och översikten så att de har samma rad högst upp.
 */
export const AppHeader: React.FC<AppHeaderProps> = ({
  subtitle,
  logoHref,
  brandAside,
  mobileMenu,
  actions,
  onBeforeLanguageSwitch,
}) => {
  const { t } = useTranslation();
  const user = useUserStore((s) => s.user);
  const [showNotifications, setShowNotifications] = useState(false);
  const userMenuGroups = createUserMenuGroups(t, { onBeforeLanguageSwitch });

  // Designsystemets service-logotyp är både högre och bredare än designens rad – den har en
  // avdelare mellan symbol och text som designen inte har. Blocket byggs därför av symbolen
  // och de två textraderna, i designens mått.
  const brandBlock = (
    <div className="flex h-[4.6rem] items-center gap-6">
      <Logo variant="symbol" inverted className="h-[4.3rem]" />
      <div className="flex flex-col justify-center">
        <span className="font-header text-inverted-dark-primary text-h4-md font-bold leading-[2.8rem]">{APP_NAME}</span>
        <span className="text-inverted-dark-secondary text-small leading-[1.8rem]">{subtitle}</span>
      </div>
    </div>
  );

  const notificationsBell = (
    <NotificationsBell
      inverted
      expanded={showNotifications}
      toggleShow={() => {
        setShowNotifications((shown) => !shown);
      }}
    />
  );

  return (
    <>
      <div className="relative z-[15]">
        <PageHeader
          className={HEADER_CLASS}
          logo={
            <div className="flex items-center gap-12 md:gap-16">
              {logoHref ?
                <a href={logoHref} title={t('layout:controls.go_to_start', { app: APP_NAME })}>
                  {brandBlock}
                </a>
              : brandBlock}
              {brandAside}
            </div>
          }
          userMenu={
            <div className="flex h-fit items-center">
              {notificationsBell}
              <LanguageSwitchButton inverted onBeforeSwitch={onBeforeLanguageSwitch} />
              <Divider orientation="vertical" className="mx-16" />
              {/* Namn och användarnamn står utskrivna bredvid menyn, så att man ser vem man är
                  inloggad som utan att öppna den. Knappen bär då bara chevronen. */}
              <div className="flex flex-col items-start justify-center whitespace-nowrap">
                <span className="text-inverted-dark-primary text-base font-bold">{user.name}</span>
                <span className="text-inverted-dark-secondary text-small">{user.username}</span>
              </div>
              <div data-cy="usermenu" className="ml-12">
                <AppUserMenu
                  initials={user.initials}
                  buttonInverted
                  buttonIcon={<ChevronDown aria-hidden="true" />}
                  menuTitle={`${user.name} (${user.username})`}
                  menuSubTitle=""
                  menuGroups={userMenuGroups}
                  buttonRounded={false}
                  buttonSize="sm"
                />
              </div>
              {actions}
            </div>
          }
          mobileMenu={
            <div className="flex items-center gap-8">
              {notificationsBell}
              <LanguageSwitchButton inverted onBeforeSwitch={onBeforeLanguageSwitch} />
              {mobileMenu}
            </div>
          }
        />
      </div>
      <NotificationsWrapper show={showNotifications} setShow={setShowNotifications} />
    </>
  );
};

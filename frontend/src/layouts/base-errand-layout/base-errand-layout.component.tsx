import { pathWithoutLocale } from '@app/locale-path';
import { LanguageSwitchButton } from '@components/misc/language-switch-button.component';
import { StatusLabel } from '@components/misc/status-label.component';
import { LinkButton } from '@components/navigation/link-button.component';
import { NotificationsBell } from '@components/notifications/notification-bell';
import { NotificationsWrapper } from '@components/notifications/notification-wrapper';
import { AppUserMenu } from '@components/user-menu/app-user-menu.component';
import { ErrandFormDTO } from '@interfaces/errand-form';
import { PageHeader } from '@layouts/page-header.component';
import { createUserMenuGroups } from '@layouts/userMenuGroup';
import { useUserStore } from '@services/user-service/user-service';
import { Divider, Link, Logo, PopupMenu } from '@sk-web-gui/react';
import { storeErrandFormHandover } from '@utils/errand-form-handover';
import { ChevronDown, Menu } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { useCallback, useState } from 'react';
import { useFormContext } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useWizardStore } from 'src/stores/wizard-store';

interface BaseErrandLayoutProps {
  children: React.ReactNode;
  registerNewErrand: boolean;
}

const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME ?? '';

/**
 * Sidhuvudet är mörkt, till skillnad från designsystemets ljusa standardhuvud. Utseendet sätts
 * här i stället för i .sk-header eftersom det gäller den här appen, inte alla appar som använder
 * komponenten. Klasserna ligger i utility-lagret och vinner därför över komponentlagrets egna.
 */
// PageHeader sätter själv py-2 på .sk-header och py-4 på innehållsraden, så designens
// lodräta mått måste ta över båda.
const HEADER_CLASS =
  'bg-inverted-background-100 border-b-1 border-inverted-divider shadow-none px-24 !py-16 [&_.sk-header-top-content]:!py-0';

export default function BaseErrandLayout({ children, registerNewErrand }: BaseErrandLayoutProps) {
  const user = useUserStore((s) => s.user);
  const { getValues, watch } = useFormContext<ErrandFormDTO>();
  const { t } = useTranslation();
  const pathname = usePathname();
  const [showNotifications, setShowNotifications] = useState(false);

  // Sidhuvudet är det enda stället som både äger språkvalen och ser formuläret, så det är
  // här överlämningen måste skrivas. Nyckeln är sökvägen utan språkprefix – samma sida på
  // ett annat språk ger samma nyckel, vilket är precis den navigering som ska överleva.
  const saveFormBeforeLanguageSwitch = useCallback(() => {
    storeErrandFormHandover({
      path: pathWithoutLocale(pathname),
      values: getValues(),
      wizardStep: useWizardStore.getState().currentStep,
    });
  }, [getValues, pathname]);

  const userMenuGroups = createUserMenuGroups(t, { onBeforeLanguageSwitch: saveFormBeforeLanguageSwitch });

  const errandNumber = watch('errandNumber');
  const status = watch('status');

  // Andra raden bär sidans sammanhang: under registreringen finns inget ärende att peka ut,
  // och då står appens undertitel där i stället för ärendets status och nummer.
  const brandSubtitle = registerNewErrand ? t('layout:header.subtitle') : errandNumber;

  // Designsystemets service-logotyp är både högre och bredare än designens rad – den har en
  // avdelare mellan symbol och text som designen inte har. Blocket byggs därför av symbolen
  // och de två textraderna, i designens mått.
  const brandBlock = (
    <div className="flex h-[4.6rem] items-center gap-6">
      <Logo variant="symbol" inverted className="h-[4.3rem]" />
      <div className="flex flex-col justify-center">
        <span className="font-header text-inverted-dark-primary text-h4-md font-bold leading-[2.8rem]">{APP_NAME}</span>
        <span className="text-inverted-dark-secondary text-small leading-[1.8rem]">{brandSubtitle}</span>
      </div>
    </div>
  );

  // Bugfix (static-components): JSX-variabel i stället för komponent skapad under rendering
  const singleErrandTitle = (
    <div className="flex items-center gap-12 md:gap-16">
      {registerNewErrand ?
        brandBlock
      : <>
          <a
            href={`${process.env.NEXT_PUBLIC_BASE_PATH}/oversikt`}
            title={t('layout:controls.go_to_start', { app: process.env.NEXT_PUBLIC_APP_NAME })}
          >
            {brandBlock}
          </a>
          <StatusLabel status={status} />
        </>
      }
    </div>
  );

  return (
    <>
      <div className="bg-background-content h-screen min-h-screen max-h-screen overflow-hidden w-full flex flex-col">
        <div className="relative z-[15]">
          <PageHeader
            className={HEADER_CLASS}
            logo={singleErrandTitle}
            userMenu={
              <div className="flex items-center h-fit">
                <NotificationsBell
                  inverted
                  expanded={showNotifications}
                  toggleShow={() => {
                    setShowNotifications((shown) => !shown);
                  }}
                />
                <LanguageSwitchButton inverted onBeforeSwitch={saveFormBeforeLanguageSwitch} />
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

                {/* Genvägen till registreringen döljs på registreringssidan – där leder den
                    tillbaka till sidan man redan står på. */}
                {!registerNewErrand && (
                  <>
                    <Divider orientation="vertical" className="mx-24" />
                    <LinkButton
                      href="/arende/registrera"
                      data-cy="register-new-errand-button"
                      color="primary"
                      variant="tertiary"
                      inverted
                    >
                      {t('filtering:new_errand')}
                    </LinkButton>
                  </>
                )}
              </div>
            }
            mobileMenu={
              // Språkvalet ligger utanför menyn, inte i den. Registreringen saknar meny
              // med flit – den ska inte erbjuda vägar bort från formuläret – men språket
              // är inget man ska behöva lämna sidan för att byta.
              <div className="flex items-center gap-8">
                <NotificationsBell
                  inverted
                  expanded={showNotifications}
                  toggleShow={() => {
                    setShowNotifications((shown) => !shown);
                  }}
                />
                <LanguageSwitchButton inverted onBeforeSwitch={saveFormBeforeLanguageSwitch} />
                {!registerNewErrand && (
                  // Eget block, av samma skäl som i LanguageSwitchButton: panelen placeras
                  // utifrån sin statiska position, och raden runt omkring är en flex-container
                  // som annars centrerar den över knappen.
                  <div className="relative">
                    <PopupMenu align="end">
                      <PopupMenu.Button inverted iconButton aria-label={t('layout:controls.open_menu')}>
                        <Menu />
                      </PopupMenu.Button>
                      <PopupMenu.Panel>
                        <PopupMenu.Group>
                          <div className="font-bold">{`${user.name} (${user.username})`}</div>
                        </PopupMenu.Group>
                        <PopupMenu.Items>
                          <PopupMenu.Group>
                            <PopupMenu.Item>
                              <Link href={`${process.env.NEXT_PUBLIC_BASE_PATH}/arende/registrera`}>
                                {t('filtering:new_errand')}
                              </Link>
                            </PopupMenu.Item>
                          </PopupMenu.Group>

                          {userMenuGroups.map((group, groupindex) => (
                            <PopupMenu.Group key={`mobilegroup-${groupindex}`}>
                              {group.elements.map((item, itemindex) => (
                                <PopupMenu.Item key={`mobilegroup-${groupindex}-${itemindex}`}>
                                  {item.element()}
                                </PopupMenu.Item>
                              ))}
                            </PopupMenu.Group>
                          ))}
                        </PopupMenu.Items>
                      </PopupMenu.Panel>
                    </PopupMenu>
                  </div>
                )}
              </div>
            }
          />
        </div>

        {children}
      </div>
      <NotificationsWrapper show={showNotifications} setShow={setShowNotifications} />
    </>
  );
}

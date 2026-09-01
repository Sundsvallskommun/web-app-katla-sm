import { pathWithoutLocale } from '@app/locale-path';
import { StatusLabel } from '@components/misc/status-label.component';
import { LinkButton } from '@components/navigation/link-button.component';
import { ErrandFormDTO } from '@interfaces/errand-form';
import { AppHeader } from '@layouts/app-header.component';
import { createUserMenuGroups } from '@layouts/userMenuGroup';
import { useUserStore } from '@services/user-service/user-service';
import { Divider, Link, PopupMenu } from '@sk-web-gui/react';
import { storeErrandFormHandover } from '@utils/errand-form-handover';
import { Menu } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { useCallback } from 'react';
import { useFormContext } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useWizardStore } from 'src/stores/wizard-store';

interface BaseErrandLayoutProps {
  children: React.ReactNode;
  registerNewErrand: boolean;
}

export default function BaseErrandLayout({ children, registerNewErrand }: BaseErrandLayoutProps) {
  const user = useUserStore((s) => s.user);
  const { getValues, watch } = useFormContext<ErrandFormDTO>();
  const { t } = useTranslation();
  const pathname = usePathname();

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
  // och då står appens undertitel där i stället för ärendets nummer.
  const brandSubtitle = registerNewErrand ? t('layout:header.subtitle') : errandNumber;

  return (
    <div className="bg-background-content flex h-screen max-h-screen min-h-screen w-full flex-col overflow-hidden">
      <AppHeader
        subtitle={brandSubtitle}
        logoHref={registerNewErrand ? undefined : `${process.env.NEXT_PUBLIC_BASE_PATH}/oversikt`}
        brandAside={registerNewErrand ? undefined : <StatusLabel status={status} />}
        onBeforeLanguageSwitch={saveFormBeforeLanguageSwitch}
        actions={
          // Genvägen till registreringen döljs på registreringssidan – där leder den tillbaka
          // till sidan man redan står på.
          registerNewErrand ? undefined : (
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
          )
        }
        mobileMenu={
          // Registreringen saknar meny med flit – den ska inte erbjuda vägar bort från
          // formuläret. Språkvalet ligger utanför menyn och finns kvar även där.
          registerNewErrand ? undefined
            // Eget block, av samma skäl som i LanguageSwitchButton: panelen placeras utifrån sin
            // statiska position, och raden runt omkring är en flex-container som annars
            // centrerar den över knappen.
          : (
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
          )
        }
      />

      {children}
    </div>
  );
}

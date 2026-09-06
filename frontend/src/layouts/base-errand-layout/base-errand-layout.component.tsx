import { pathWithoutLocale } from '@app/locale-path';
import { DropdownMenu, DropdownMenuDivider } from '@astryxdesign/core/DropdownMenu';
import { StatusLabel } from '@components/misc/status-label.component';
import { LinkButton } from '@components/navigation/link-button.component';
import { ErrandFormDTO } from '@interfaces/errand-form';
import { AppHeader } from '@layouts/app-header.component';
import { createUserMenuGroups } from '@layouts/userMenuGroup';
import { useUserStore } from '@services/user-service/user-service';
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

  // Visa appens undertitel tills rapporten har ett ärendenummer.
  const brandSubtitle = registerNewErrand ? t('layout:header.subtitle') : errandNumber;

  return (
    <div className="bg-canvas flex h-dvh max-h-dvh min-h-dvh w-full flex-col overflow-hidden">
      <AppHeader
        subtitle={brandSubtitle}
        logoHref={registerNewErrand ? undefined : '/oversikt'}
        brandAside={
          registerNewErrand ? undefined : (
            <span data-cy="case-status">
              <StatusLabel status={status} />
            </span>
          )
        }
        onBeforeLanguageSwitch={saveFormBeforeLanguageSwitch}
        actions={
          // Genvägen till registreringen döljs på registreringssidan – där leder den tillbaka
          // till sidan man redan står på.
          registerNewErrand ? undefined : (
            <>
              <LinkButton
                href="/arende/registrera"
                data-cy="register-new-errand-button"
                variant="secondary"
                label={t('filtering:new_errand')}
              />
            </>
          )
        }
        mobileMenu={
          registerNewErrand ? undefined : (
            <DropdownMenu
              alignment="end"
              menuWidth={280}
              hasChevron={false}
              button={{
                label: t('layout:controls.open_menu'),
                icon: <Menu aria-hidden="true" size={20} />,
                isIconOnly: true,
                variant: 'ghost',
              }}
            >
              <div className="px-3 py-2 font-bold">{`${user.name} (${user.username})`}</div>
              <DropdownMenuDivider />
              <LinkButton
                href="/arende/registrera"
                role="menuitem"
                tabIndex={-1}
                label={t('filtering:new_errand')}
                variant="ghost"
                width="100%"
              />
              <DropdownMenuDivider />
              {userMenuGroups.map((group) => (
                <div role="group" aria-label={group.label} key={group.label}>
                  {group.elements.map((item) => (
                    <div role="presentation" key={item.label}>
                      {item.element()}
                    </div>
                  ))}
                </div>
              ))}
            </DropdownMenu>
          )
        }
      />

      {children}
    </div>
  );
}

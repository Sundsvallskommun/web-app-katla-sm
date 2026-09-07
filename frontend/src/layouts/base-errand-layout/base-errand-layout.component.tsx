import { pathWithoutLocale } from '@app/locale-path';
import { AppShell } from '@astryxdesign/core/AppShell';
import { LinkButton } from '@components/navigation/link-button.component';
import { ErrandFormDTO } from '@interfaces/errand-form';
import { AppHeader } from '@layouts/app-header.component';
import { storeErrandFormHandover } from '@utils/errand-form-handover';
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
  const { getValues } = useFormContext<ErrandFormDTO>();
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

  return (
    <AppShell
      variant="section"
      mobileNav={false}
      topNav={
        <AppHeader
          as="div"
          logoHref={registerNewErrand ? undefined : '/oversikt'}
          onBeforeLanguageSwitch={saveFormBeforeLanguageSwitch}
          actions={
            registerNewErrand ? undefined : (
              <LinkButton
                href="/arende/registrera"
                data-cy="register-new-errand-button"
                role="menuitem"
                tabIndex={-1}
                variant="ghost"
                width="100%"
                label={t('filtering:new_errand')}
              />
            )
          }
        />
      }
    >
      {children}
    </AppShell>
  );
}

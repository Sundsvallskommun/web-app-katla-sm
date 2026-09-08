import { AppShell } from '@astryxdesign/core/AppShell';
import { ApplicationCatalogue } from '@components/catalogue/application-catalogue.component';
import { CookieConsentSection } from '@components/cookie-consent-section/cookie-consent-section.component';
import { AppHeader } from '@layouts/app-header.component';
import { redirect } from 'next/navigation';
import { appConfig } from 'src/config/appconfig';

export default function CataloguePage() {
  if (appConfig.mode !== 'catalogue') redirect('/oversikt');
  return (
    <>
      <AppShell variant="section" topNav={<AppHeader as="div" logoHref="/katlor" />} mobileNav={false}>
        <ApplicationCatalogue />
      </AppShell>
      <CookieConsentSection />
    </>
  );
}

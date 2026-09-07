import { AppShell } from '@astryxdesign/core/AppShell';
import { CookieConsentSection } from '@components/cookie-consent-section/cookie-consent-section.component';
import { AppHeader } from '@layouts/app-header.component';

export default function OversiktLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AppShell variant="section" topNav={<AppHeader as="div" logoHref="/oversikt" />} mobileNav={false}>
        {children}
      </AppShell>
      <CookieConsentSection />
    </>
  );
}

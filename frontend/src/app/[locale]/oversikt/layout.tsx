import { CookieConsentSection } from '@components/cookie-consent-section/cookie-consent-section.component';
import { OverviewSidebar } from '@components/sidebars/overview-sidebar.component';
import EmptyLayout from '@layouts/empty-layout/empty-layout.component';

export default function OversiktLayout({ children }: { children: React.ReactNode }) {
  return (
    <EmptyLayout>
      <div className="flex">
        <OverviewSidebar />
        <div className="flex-grow">{children}</div>
      </div>
      <CookieConsentSection />
    </EmptyLayout>
  );
}

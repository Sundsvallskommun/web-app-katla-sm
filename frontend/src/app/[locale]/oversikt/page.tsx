'use client';

import { ErrandTable } from '@components/errand-table/errand-table.component';
import { MobileOverviewLayout } from '@components/mobile/mobile-overview-layout.component';
import { useIsOverviewMobile } from '@contexts/overview-mobile-context';
import Main from '@layouts/main/main.component';
import { useStatusButtons } from 'src/hooks/use-status-buttons';

export default function Oversikt() {
  const isMobile = useIsOverviewMobile();
  const { activeStatusLabel } = useStatusButtons();

  if (isMobile) {
    return <MobileOverviewLayout />;
  }

  return (
    <Main>
      {/* Rubriken namnger listan man tittar på, samma namn som den valda posten i sidopanelen. */}
      <div className="flex flex-col gap-24 px-40 py-32">
        <h1 className="text-h1-md text-dark-primary">{activeStatusLabel}</h1>
        <ErrandTable />
      </div>
    </Main>
  );
}

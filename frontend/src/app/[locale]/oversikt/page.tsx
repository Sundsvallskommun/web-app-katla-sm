'use client';

import { Heading } from '@astryxdesign/core/Heading';
import { VStack } from '@astryxdesign/core/VStack';
import { ErrandTable } from '@components/errand-table/errand-table.component';
import { MobileOverviewLayout } from '@components/mobile/mobile-overview-layout.component';
import { useIsOverviewMobile } from '@contexts/overview-mobile-context';
import { useActiveStatusLabel } from 'src/hooks/use-status-buttons';

export default function Oversikt() {
  const isMobile = useIsOverviewMobile();
  const activeStatusLabel = useActiveStatusLabel();

  if (isMobile) {
    return <MobileOverviewLayout />;
  }

  return (
    <VStack gap={6}>
      {/* Rubriken namnger listan man tittar på, samma namn som den valda posten i sidopanelen. */}
      <Heading level={1}>{activeStatusLabel}</Heading>
      <ErrandTable />
    </VStack>
  );
}

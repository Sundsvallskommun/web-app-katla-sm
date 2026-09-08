'use client';

import { Button } from '@astryxdesign/core/Button';
import { EmptyState } from '@astryxdesign/core/EmptyState';
import { Heading } from '@astryxdesign/core/Heading';
import { useMediaQuery } from '@astryxdesign/core/hooks';
import { Layout, LayoutContent } from '@astryxdesign/core/Layout';
import { Stack } from '@astryxdesign/core/Stack';
import { Text } from '@astryxdesign/core/Text';
import { ErrandList } from '@components/errand-table/errand-list.component';
import { ErrandListSkeleton } from '@components/errand-table/errand-list-skeleton.component';
import { ErrandStatusFilter } from '@components/errand-table/errand-status-filter.component';
import { ErrandTable } from '@components/errand-table/errand-table.component';
import { ErrorAlertList } from '@components/misc/error-alert.component';
import { Files, Plus } from 'lucide-react';
import { redirect } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { appConfig } from 'src/config/appconfig';
import { MOBILE_BREAKPOINT } from 'src/constants/responsive';
import { useOverviewErrands } from 'src/hooks/use-overview-errands';
import { useActiveStatusLabel } from 'src/hooks/use-status-buttons';

export default function Oversikt() {
  if (appConfig.mode === 'catalogue') redirect('/katlor');
  return <ErrandOverview />;
}

function ErrandOverview() {
  const { t } = useTranslation();
  const isMobile = useMediaQuery(MOBILE_BREAKPOINT);
  const activeStatusLabel = useActiveStatusLabel();
  const data = useOverviewErrands({ mode: isMobile ? 'mobile' : 'desktop' });
  const { rows, isLoading, totalElements, errandsError, metadataError } = data;
  const errors = [metadataError, errandsError].filter((message): message is string => message !== null);
  const initialLoading = isLoading && rows.length === 0 && errors.length === 0;
  return (
    <Layout height="auto" contentWidth={1200} padding={isMobile ? 4 : 6}>
      <LayoutContent isScrollable={false}>
        <Stack gap={6}>
          <Stack direction="horizontal" justify="between" align="center" gap={4} wrap="wrap">
            <Heading level={1}>{t('filtering:my_reports')}</Heading>
            <Button
              href="/arende/registrera"
              data-cy="register-new-errand-button"
              label={t('filtering:new_errand_mobile')}
              icon={<Plus aria-hidden="true" />}
              size="lg"
              variant="primary"
            />
          </Stack>
          <ErrandStatusFilter />
          <Stack gap={3}>
            <Stack direction="horizontal" justify="between" align="center" gap={3} wrap="wrap">
              <Heading level={2}>{activeStatusLabel}</Heading>
              {!initialLoading && errors.length === 0 && (
                <Text color="secondary" type="supporting" data-cy="errand-count" aria-live="polite">
                  {t('filtering:showing_of', { shown: rows.length, total: totalElements })}
                </Text>
              )}
            </Stack>
            <ErrorAlertList messages={errors} />
            <Text role="status" aria-label={t('filtering:reports_heading')} className="sr-only">
              {initialLoading ? t('common:errand-table.loading') : ''}
            </Text>
            <Stack aria-busy={initialLoading} aria-label={activeStatusLabel} role="region">
              {initialLoading ?
                isMobile ?
                  <ErrandListSkeleton />
                : <ErrandTable {...data} />
              : rows.length > 0 ?
                isMobile ?
                  <ErrandList {...data} />
                : <ErrandTable {...data} />
              : errors.length === 0 && !isLoading ?
                <EmptyState title={t('errand-information:no_errands')} icon={<Files aria-hidden="true" />} />
              : null}
            </Stack>
          </Stack>
        </Stack>
      </LayoutContent>
    </Layout>
  );
}

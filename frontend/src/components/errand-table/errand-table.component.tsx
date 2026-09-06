'use client';

import { Card } from '@astryxdesign/core/Card';
import { EmptyState } from '@astryxdesign/core/EmptyState';
import { Spinner } from '@astryxdesign/core/Spinner';
import { Table, TableBody, TableCell, TableRow } from '@astryxdesign/core/Table';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import { ErrorAlertList } from '@components/misc/error-alert.component';
import { StatusLabel } from '@components/misc/status-label.component';
import { LinkButton } from '@components/navigation/link-button.component';
import { getTypeDisplayName } from '@utils/errand-helpers';
import dayjs from 'dayjs';
import { ArrowRight, Files } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { useOverviewErrands } from 'src/hooks/use-overview-errands';
import { useSortStore } from 'src/stores/sort-store';

import { ErrandTableFooter } from './errand-table-footer.component';
import { ErrandTableHeader } from './errand-table-header.component';

export const ErrandTable: React.FC = () => {
  const { t } = useTranslation();
  const router = useRouter();
  const { rowHeight } = useSortStore();
  const { rows, isLoading, totalPages, totalElements, errandsError, metadataError } = useOverviewErrands();
  const errors = [metadataError, errandsError].filter((message): message is string => message !== null);

  return (
    <VStack gap={4}>
      <ErrorAlertList messages={errors} />
      {isLoading && rows.length === 0 && <Spinner size="xl" label={t('common:errand-table.loading')} />}
      {!isLoading && rows.length === 0 && errors.length === 0 && (
        <EmptyState title={t('errand-information:no_errands')} icon={<Files aria-hidden="true" />} />
      )}
      {rows.length > 0 && (
        <>
          <Text color="secondary" data-cy="errand-count" aria-live="polite">
            {t('filtering:showing_count', { count: totalElements })}
          </Text>
          <Card padding={0}>
            <Table
              data-cy="errand-table"
              aria-label={t('filtering:reports_heading')}
              data-density={rowHeight}
              density={rowHeight === 'dense' ? 'compact' : 'balanced'}
              hasHover
              aria-busy={isLoading}
              className="min-w-[46rem]"
            >
              <ErrandTableHeader />
              <TableBody>
                {rows.map((errand) => {
                  const errandUrl = `/arende/${errand.errandNumber}/grundinformation`;
                  return (
                    <TableRow
                      key={errand.errandNumber}
                      className="cursor-pointer"
                      onClick={() => {
                        router.push(errandUrl);
                      }}
                    >
                      <TableCell>
                        <strong>{getTypeDisplayName(errand, t)}</strong>
                      </TableCell>
                      <TableCell>
                        <StatusLabel status={errand.status} />
                      </TableCell>
                      <TableCell>{errand.errandNumber}</TableCell>
                      <TableCell>{dayjs(errand.created).format('YYYY-MM-DD, HH:mm')}</TableCell>
                      <TableCell>
                        <LinkButton
                          href={errandUrl}
                          data-cy="open-errand-button"
                          label={t('common:errand-table.open_errand', { errandNumber: errand.errandNumber })}
                          isIconOnly
                          variant="ghost"
                          onClick={(event) => {
                            event.stopPropagation();
                          }}
                          icon={<ArrowRight aria-hidden="true" />}
                        />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
            <ErrandTableFooter totalPages={totalPages} />
          </Card>
        </>
      )}
    </VStack>
  );
};

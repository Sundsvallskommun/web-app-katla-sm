'use client';

import { Skeleton } from '@astryxdesign/core/Skeleton';
import { Table, TableBody, TableCell, TableRow } from '@astryxdesign/core/Table';
import { VStack } from '@astryxdesign/core/VStack';
import { StatusLabel } from '@components/misc/status-label.component';
import { LinkButton } from '@components/navigation/link-button.component';
import type { ErrandDTO } from '@data-contracts/backend/data-contracts';
import { getTypeDisplayName } from '@utils/errand-helpers';
import dayjs from 'dayjs';
import { ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { useSortStore } from 'src/stores/sort-store';

import { ErrandTableFooter } from './errand-table-footer.component';
import { ErrandTableHeader } from './errand-table-header.component';

interface ErrandTableProps {
  rows: ErrandDTO[];
  isLoading: boolean;
  totalPages: number;
}

export const ErrandTable: React.FC<ErrandTableProps> = ({ rows, isLoading, totalPages }) => {
  const { t } = useTranslation();
  const router = useRouter();
  const { rowHeight } = useSortStore();
  return (
    <VStack gap={4}>
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
          {isLoading &&
            rows.length === 0 &&
            [0, 1, 2, 3, 4].map((row) => (
              <TableRow key={row} aria-hidden="true" data-cy="errand-table-skeleton">
                {[0, 1, 2, 3, 4].map((column) => (
                  <TableCell key={column}>
                    <Skeleton width="70%" height="1.5em" index={row} />
                  </TableCell>
                ))}
              </TableRow>
            ))}
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
      {rows.length > 0 && <ErrandTableFooter totalPages={totalPages} />}
    </VStack>
  );
};

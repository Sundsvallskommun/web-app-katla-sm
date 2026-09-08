'use client';

import { useClickableContainer } from '@astryxdesign/core/hooks';
import { Link } from '@astryxdesign/core/Link';
import { Skeleton } from '@astryxdesign/core/Skeleton';
import { Table, TableBody, TableCell, TableRow } from '@astryxdesign/core/Table';
import { VStack } from '@astryxdesign/core/VStack';
import { StatusLabel } from '@components/misc/status-label.component';
import type { ErrandDTO } from '@data-contracts/backend/data-contracts';
import { getTypeDisplayName } from '@utils/errand-helpers';
import dayjs from 'dayjs';
import { ArrowRight } from 'lucide-react';
import { useRef } from 'react';
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
          {rows.map((errand) => (
            <ErrandTableRow key={errand.errandNumber} errand={errand} />
          ))}
        </TableBody>
      </Table>
      {rows.length > 0 && <ErrandTableFooter totalPages={totalPages} />}
    </VStack>
  );
};

/** One primary link owns both keyboard navigation and delegated row clicks. */
function ErrandTableRow({ errand }: { errand: ErrandDTO }) {
  const { t } = useTranslation();
  const containerRef = useRef<HTMLTableRowElement>(null);
  const interactiveRef = useRef<HTMLAnchorElement | HTMLButtonElement>(null);
  const rowInteraction = useClickableContainer({ containerRef, interactiveRef });
  return (
    <TableRow ref={containerRef} {...rowInteraction} className="cursor-pointer">
      <TableCell>
        <strong>{getTypeDisplayName(errand, t)}</strong>
      </TableCell>
      <TableCell>
        <StatusLabel status={errand.status} />
      </TableCell>
      <TableCell>
        <Link
          ref={interactiveRef}
          href={`/arende/${errand.errandNumber}/grundinformation`}
          data-cy="open-errand-button"
          hasUnderline
        >
          {errand.errandNumber}
        </Link>
      </TableCell>
      <TableCell>{dayjs(errand.created).format('YYYY-MM-DD, HH:mm')}</TableCell>
      <TableCell>
        <ArrowRight aria-hidden="true" />
      </TableCell>
    </TableRow>
  );
}

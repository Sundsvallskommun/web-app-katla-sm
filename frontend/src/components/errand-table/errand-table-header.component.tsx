import { Button } from '@astryxdesign/core/Button';
import { TableHeader, TableHeaderCell, TableRow } from '@astryxdesign/core/Table';
import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useSortStore } from 'src/stores/sort-store';

export const ErrandTableHeader: React.FC = () => {
  const { t } = useTranslation();
  const { sortColumn, sortOrder, setSort } = useSortStore();
  const headers = [
    { label: t('errand-table.header.classificationType'), property: 'classification.type' },
    { label: t('errand-table.header.status'), property: 'status' },
    { label: t('errand-table.header.errandNumber'), property: 'errandNumber' },
    { label: t('errand-table.header.created'), property: 'created' },
  ];

  return (
    <TableHeader>
      <TableRow isHeaderRow>
        {headers.map((header) => {
          const isActive = sortColumn === header.property;
          const SortIcon =
            isActive ?
              sortOrder === 'asc' ?
                ArrowUp
              : ArrowDown
            : ArrowUpDown;

          return (
            <TableHeaderCell
              key={header.property}
              scope="col"
              aria-sort={
                isActive ?
                  sortOrder === 'asc' ?
                    'ascending'
                  : 'descending'
                : undefined
              }
            >
              <Button
                label={header.label}
                variant="ghost"
                size="sm"
                endContent={<SortIcon size={14} aria-hidden="true" />}
                onClick={() => {
                  setSort(header.property);
                }}
              />
            </TableHeaderCell>
          );
        })}
        <TableHeaderCell scope="col" className="relative">
          <span className="sr-only">{t('errand-table.header.open')}</span>
        </TableHeaderCell>
      </TableRow>
    </TableHeader>
  );
};

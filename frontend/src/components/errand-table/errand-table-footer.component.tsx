import { NumberInput } from '@astryxdesign/core/NumberInput';
import { Pagination } from '@astryxdesign/core/Pagination';
import { Selector } from '@astryxdesign/core/Selector';
import { useTranslation } from 'react-i18next';
import { useSortStore } from 'src/stores/sort-store';

export const ErrandTableFooter: React.FC<{ totalPages: number }> = ({ totalPages }) => {
  const { t } = useTranslation();
  const { page, size, rowHeight, setRowHeight, setPage, setSize } = useSortStore();

  return (
    <div className="flex flex-wrap items-end justify-between gap-4 p-4">
      <NumberInput
        label={t('common:errand-table.rows_per_page')}
        min={1}
        max={100}
        width={120}
        value={size}
        onChange={setSize}
        isIntegerOnly
      />
      <Pagination
        totalPages={totalPages}
        page={page + 1}
        onChange={(nextPage) => {
          setPage(nextPage - 1);
        }}
        siblingCount={1}
      />
      <Selector
        label={t('common:errand-table.row_height')}
        value={rowHeight}
        onChange={setRowHeight}
        options={[
          { value: 'normal', label: t('common:errand-table.row_height_normal') },
          { value: 'dense', label: t('common:errand-table.row_height_dense') },
        ]}
      />
    </div>
  );
};

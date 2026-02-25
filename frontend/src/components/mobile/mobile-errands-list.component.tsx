import { ErrandDTO } from '@data-contracts/backend/data-contracts';
import { getErrands } from '@services/errand-service/errand-service';
import { Button, Disclosure, Spinner } from '@sk-web-gui/react';
import dayjs from 'dayjs';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useFilterStore } from 'src/stores/filter-store';
import { useSortStore } from 'src/stores/sort-store';
import { FilterChips } from './filter-chips.component';
import { MobileErrandItem } from './mobile-errand-item.component';

export const MobileErrandsList: React.FC = () => {
  const { t } = useTranslation();
  const { sortColumn, sortOrder, page, size } = useSortStore();
  const { statuses, categories: selectedCategories, startDate, endDate, queries } = useFilterStore();

  const [rows, setRows] = useState<ErrandDTO[]>([]);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [currentPage, setCurrentPage] = useState<number>(page);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);
  const [disclosureOpen, setDisclosureOpen] = useState<boolean>(false);

  const applyFilters = useCallback(
    (errands: ErrandDTO[]) => {
      let filtered = errands;
      if (startDate && endDate) {
        filtered = filtered.filter((e) => {
          const created = dayjs(e.created);
          return created.isAfter(dayjs(startDate).subtract(1, 'day')) && created.isBefore(dayjs(endDate).add(1, 'day'));
        });
      }
      return filtered;
    },
    [startDate, endDate]
  );

  useEffect(() => {
    setIsLoading(true);
    setCurrentPage(page);
    getErrands({ sortColumn, sortOrder, page, size, statuses, categories: selectedCategories, queries })
      .then((data) => {
        setRows(applyFilters(data.content ?? []));
        setTotalPages(data.totalPages ?? 1);
      })
      .finally(() => setIsLoading(false));
  }, [sortColumn, sortOrder, page, size, statuses, selectedCategories, startDate, endDate, queries, applyFilters]);

  const handleLoadMore = () => {
    const nextPage = currentPage + 1;
    setIsLoadingMore(true);
    getErrands({ sortColumn, sortOrder, page: nextPage, size, statuses, categories: selectedCategories, queries })
      .then((data) => {
        setRows((prev) => [...prev, ...applyFilters(data.content ?? [])]);
        setCurrentPage(nextPage);
      })
      .finally(() => setIsLoadingMore(false));
  };

  const filterCount =
    queries.length + selectedCategories.length + (startDate && endDate ? 1 : 0);

  const hasActiveFilters = filterCount > 0;

  if (isLoading) {
    return (
      <div className="flex justify-center py-40">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="w-full px-16 py-[0.8rem] relative">
      <div className="text-xl font-bold mb-8">Ärenden</div>

      {hasActiveFilters && (
        <div className="mb-8">
          <Disclosure open={disclosureOpen} onToggleOpen={setDisclosureOpen}>
            <Disclosure.Header>
              <Disclosure.Title>Filter ({filterCount})</Disclosure.Title>
              <Disclosure.Button />
            </Disclosure.Header>
            <Disclosure.Content>
              <div className="flex flex-wrap gap-8">
                <FilterChips />
              </div>
            </Disclosure.Content>
          </Disclosure>
        </div>
      )}

      {rows.length === 0 ?
        <div className="text-center py-40 text-dark-secondary">{t('errand-information:no_errands')}</div>
      : <div className="flex flex-col gap-4 pt-8">
          {rows.map((errand, index) => (
            <MobileErrandItem key={`mobile-errand-${index}`} errand={errand} />
          ))}
        </div>
      }

      {currentPage + 1 < totalPages && (
        <div className="mt-4 flex justify-center">
          <Button variant="tertiary" className="w-full" onClick={handleLoadMore} loading={isLoadingMore}>
            {t('common:load_more', 'Läs in fler')}
          </Button>
        </div>
      )}

      {isLoadingMore && (
        <div className="mt-4 flex justify-center items-center">
          <Spinner className="flex items-center" />
        </div>
      )}
    </div>
  );
};

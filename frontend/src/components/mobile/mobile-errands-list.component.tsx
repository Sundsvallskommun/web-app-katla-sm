'use client';

import { Button } from '@astryxdesign/core/Button';
import { Spinner } from '@astryxdesign/core/Spinner';
import { ErrorAlertList } from '@components/misc/error-alert.component';
import { ErrandDTO } from '@data-contracts/backend/data-contracts';
import { useTranslation } from 'react-i18next';

import { MobileErrandCard } from './mobile-errand-card.component';

interface MobileErrandsListProps {
  rows: ErrandDTO[];
  isLoading: boolean;
  hasMore: boolean;
  loadMore: () => void;
  errors?: string[];
}

export const MobileErrandsList: React.FC<MobileErrandsListProps> = ({
  rows,
  isLoading,
  hasMore,
  loadMore,
  errors = [],
}) => {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-4 px-4 pb-6">
      <ErrorAlertList messages={errors} />
      {isLoading && rows.length === 0 && (
        <div className="flex justify-center py-10">
          <Spinner size="xl" label={t('common:errand-table.loading')} />
        </div>
      )}
      {!isLoading && rows.length === 0 && errors.length === 0 && (
        <div className="text-center py-10 text-muted">{t('errand-information:no_errands')}</div>
      )}
      {rows.map((errand) => (
        <MobileErrandCard key={errand.errandNumber} errand={errand} />
      ))}
      {hasMore && (
        <div className="pt-2 pb-4">
          <Button
            label={t('filtering:load_more')}
            variant="secondary"
            isLoading={isLoading}
            onClick={loadMore}
            width="100%"
          />
        </div>
      )}
    </div>
  );
};

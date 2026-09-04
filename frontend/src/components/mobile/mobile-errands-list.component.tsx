'use client';

import { ErrorAlertList } from '@components/misc/error-alert.component';
import { ErrandDTO } from '@data-contracts/backend/data-contracts';
import { Button, Spinner } from '@sk-web-gui/react';
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
    <div className="flex flex-col gap-8 px-16 pb-24">
      {/* Felen står först, av samma skäl som i tabellen: ett stående laddläge får inte dölja dem. */}
      <ErrorAlertList messages={errors} />
      {isLoading && rows.length === 0 && (
        <div className="flex justify-center py-40">
          <Spinner />
        </div>
      )}
      {!isLoading && rows.length === 0 && errors.length === 0 && (
        <div className="text-center py-40 text-dark-secondary">{t('errand-information:no_errands')}</div>
      )}
      {rows.map((errand, index) => (
        <MobileErrandCard key={`mobile-errand-${index}`} errand={errand} />
      ))}
      {hasMore && (
        <div className="pt-8 pb-16">
          <Button variant="tertiary" color="vattjom" loading={isLoading} onClick={loadMore} className="w-full">
            {t('filtering:load_more')}
          </Button>
        </div>
      )}
    </div>
  );
};

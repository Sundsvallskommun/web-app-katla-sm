'use client';

import { StatusLabel } from '@components/misc/status-label.component';
import { LinkButton } from '@components/navigation/link-button.component';
import { ErrandDTO } from '@data-contracts/backend/data-contracts';
import { getTypeDisplayName } from '@utils/errand-helpers';
import dayjs from 'dayjs';
import { ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';

interface MobileErrandCardProps {
  errand: ErrandDTO;
}

/**
 * Ett ärende i mobilens lista. Hela kortet öppnar ärendet för den som pekar; pilen är kvar som
 * riktig länk, eftersom det är den som går att nå med tangentbord och som läses upp.
 */
export const MobileErrandCard: React.FC<MobileErrandCardProps> = ({ errand }) => {
  const { t } = useTranslation();
  const router = useRouter();
  const url = `/arende/${errand.errandNumber}/grundinformation`;

  return (
    <div
      data-cy="mobile-errand-card"
      className="border-divider rounded-utility flex cursor-pointer flex-col gap-16 border-1 p-20"
      onClick={() => {
        router.push(url);
      }}
    >
      <div className="flex items-start justify-between gap-16">
        <span className="text-dark-primary text-base font-bold break-words">{getTypeDisplayName(errand, t)}</span>
        <StatusLabel status={errand.status} />
      </div>

      <div className="flex flex-col gap-8">
        <p className="text-dark-primary text-base">
          <span className="font-bold">{t('common:errand-table.header.errandNumber')}:</span> {errand.errandNumber}
        </p>
        <p className="text-dark-primary text-base">
          <span className="font-bold">{t('common:errand-table.registered')}:</span>{' '}
          {dayjs(errand.created).format('YYYY-MM-DD')}
        </p>
      </div>

      <LinkButton
        href={url}
        aria-label={t('layout:controls.open_errand', { errandNumber: errand.errandNumber })}
        className="self-end"
        iconButton
        showBackground={false}
        leftIcon={<ArrowRight aria-hidden="true" />}
        color="primary"
        variant="tertiary"
      />
    </div>
  );
};

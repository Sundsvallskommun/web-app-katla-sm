'use client';

import { Card } from '@astryxdesign/core/Card';
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
    <Card
      data-cy="mobile-errand-card"
      padding={5}
      className="flex cursor-pointer flex-col gap-4"
      onClick={() => {
        router.push(url);
      }}
    >
      <div className="flex items-start justify-between gap-4">
        <span className="text-foreground text-base font-bold break-words">{getTypeDisplayName(errand, t)}</span>
        <StatusLabel status={errand.status} />
      </div>

      <div className="flex flex-col gap-2">
        <p className="text-foreground text-base">
          <span className="font-bold">{t('common:errand-table.header.errandNumber')}:</span> {errand.errandNumber}
        </p>
        <p className="text-foreground text-base">
          <span className="font-bold">{t('common:errand-table.registered')}:</span>{' '}
          {dayjs(errand.created).format('YYYY-MM-DD')}
        </p>
      </div>

      <LinkButton
        href={url}
        label={t('layout:controls.open_errand', { errandNumber: errand.errandNumber })}
        className="self-end"
        isIconOnly
        icon={<ArrowRight aria-hidden="true" />}
        variant="ghost"
        onClick={(event) => {
          event.stopPropagation();
        }}
      />
    </Card>
  );
};

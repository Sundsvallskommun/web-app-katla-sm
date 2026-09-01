'use client';

import { Button } from '@sk-web-gui/react';
import { ArrowRight, CircleCheckBig } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';

/**
 * Kvittot efter en inskickad rapport. Det ligger kvar i rapporteringens skal — samma sidhuvud
 * och innehållsyta — men utan åtgärder, eftersom det inte finns något kvar att göra.
 *
 * Ytan är samma kort som formulärets avsnitt, så att sidan känns igen. Höjden är satt så att
 * beskedet inte blir en smal remsa högst upp på en tom sida.
 */
export const ReportSubmitted: React.FC = () => {
  const { t } = useTranslation();
  const router = useRouter();

  return (
    <div className="bg-background-color-mixin-1 rounded-utility flex min-h-[48rem] w-full flex-col items-center gap-80 px-32 py-48">
      <div className="flex max-w-[69.6rem] flex-col items-center gap-24 text-center">
        {/* Rubriken bär hela beskedet, så ikonen är dekor och döljs för uppläsning. */}
        <CircleCheckBig size={48} aria-hidden="true" className="text-gronsta-surface-primary" />
        <h2 className="text-h2-lg text-dark-primary">{t('errand-information:submitted.title')}</h2>
      </div>
      <Button
        variant="primary"
        color="vattjom"
        data-cy="back-to-overview"
        rightIcon={<ArrowRight aria-hidden="true" />}
        onClick={() => {
          router.push('/oversikt');
        }}
      >
        {t('errand-information:submitted.back_to_overview')}
      </Button>
    </div>
  );
};

'use client';

import { Button } from '@astryxdesign/core/Button';
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
    <div className="bg-canvas rounded-lg flex min-h-[30rem] w-full flex-col items-center gap-20 px-8 py-12">
      <div className="flex max-w-[43.5rem] flex-col items-center gap-6 text-center">
        {/* Rubriken bär hela beskedet, så ikonen är dekor och döljs för uppläsning. */}
        <CircleCheckBig size={48} aria-hidden="true" className="text-accent" />
        <h2 className="text-2xl font-semibold text-foreground">{t('errand-information:submitted.title')}</h2>
      </div>
      <Button
        label={t('errand-information:submitted.back_to_overview')}
        variant="primary"

        data-cy="back-to-overview"
        endContent={<ArrowRight aria-hidden="true" />}
        onClick={() => {
          router.push('/oversikt');
        }}
      >
        {t('errand-information:submitted.back_to_overview')}
      </Button>
    </div>
  );
};

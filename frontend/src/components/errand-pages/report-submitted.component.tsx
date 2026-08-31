'use client';

import { CenterDiv } from '@layouts/center-div.component';
import { Button } from '@sk-web-gui/react';
import { CircleCheckBig } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';

/**
 * Kvittot efter en inskickad rapport. Det ligger kvar i rapporteringens skal — samma
 * sidhuvud och innehållsyta — men utan åtgärder, eftersom det inte finns något kvar att göra.
 */
export const ReportSubmitted: React.FC = () => {
  const { t } = useTranslation();
  const router = useRouter();

  return (
    <CenterDiv className="py-40">
      {/* Rubriken bär hela beskedet, så ikonen är dekor och döljs för uppläsning. */}
      <CircleCheckBig size={48} aria-hidden="true" className="text-gronsta-surface-primary mb-24" />
      <h2 className="text-h2-md text-center mb-32">{t('errand-information:submitted.title')}</h2>
      <Button
        variant="primary"
        color="vattjom"
        data-cy="back-to-overview"
        onClick={() => {
          router.push('/oversikt');
        }}
      >
        {t('errand-information:submitted.back_to_overview')}
      </Button>
    </CenterDiv>
  );
};

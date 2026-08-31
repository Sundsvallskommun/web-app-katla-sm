'use client';

import { ErrandContentLock } from '@components/errand-content-lock/errand-content-lock.component';
import { ReactNode } from 'react';

/**
 * Ett avsnitt i ärendet: rubrik med innehållet under. Avsnitten går inte att fälla ihop –
 * rapporten fylls i uppifrån och ner, och rubriken finns kvar som orientering.
 *
 * Avdelarna mellan avsnitten sätts av ErrandFormSections, inte här: de hör till hur avsnitten
 * ligger efter varandra på sidan, och alla gränser ska inte ha en.
 */
export const ErrandSection: React.FC<{
  header: string;
  children: ReactNode;
}> = ({ header, children }) => (
  <section className="w-full">
    <h2 className="text-h4-md text-dark-primary mb-16">{header}</h2>
    <ErrandContentLock className="w-full">{children}</ErrandContentLock>
  </section>
);

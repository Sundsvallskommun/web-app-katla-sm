'use client';

import { ErrandContentLock } from '@components/errand-content-lock/errand-content-lock.component';
import { SectionHeader } from '@components/misc/section-header.component';
import { ReactNode } from 'react';

/**
 * Ett avsnitt i ärendet: ett eget kort med rubrik, beskrivning och innehållet under. Avsnitten
 * går inte att fälla ihop – rapporten fylls i uppifrån och ner, och rubriken finns kvar som
 * orientering.
 *
 * Kortets yta är det som skiljer avsnitten åt. Luften mellan korten sätts av ErrandFormSections,
 * inte här: den hör till hur avsnitten ligger efter varandra på sidan.
 */
export const ErrandSection: React.FC<{
  header: string;
  description?: string;
  children: ReactNode;
}> = ({ header, description, children }) => (
  <section className="bg-background-color-mixin-1 rounded-utility flex w-full flex-col gap-32 p-16 md:p-32">
    <SectionHeader title={header} description={description} />
    <ErrandContentLock className="w-full">{children}</ErrandContentLock>
  </section>
);

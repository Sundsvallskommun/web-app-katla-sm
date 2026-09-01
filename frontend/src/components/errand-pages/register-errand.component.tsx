'use client';

import { ErrandFormSections } from '@components/errand-pages/errand-form-sections.component';

export const RegisterErrand: React.FC = () => {
  return (
    <div className="flex flex-col gap-48">
      <ErrandFormSections />
    </div>
  );
};

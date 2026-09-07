'use client';

import { Stack } from '@astryxdesign/core/Stack';
import { ErrandFormSections } from '@components/errand-pages/errand-form-sections.component';

export const RegisterErrand: React.FC = () => {
  return (
    <Stack gap={6}>
      <ErrandFormSections />
    </Stack>
  );
};

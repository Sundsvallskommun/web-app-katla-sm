'use client';

import { Spinner } from '@astryxdesign/core/Spinner';
import EmptyLayout from '@layouts/empty-layout/empty-layout.component';
import { useTranslation } from 'react-i18next';

export default function LoaderFullScreen() {
  const { t } = useTranslation();

  return (
    <EmptyLayout>
      <main>
        <div className="w-screen h-screen flex place-items-center place-content-center">
          <Spinner size="xl" label={t('common:loading_information')} />
        </div>
      </main>
    </EmptyLayout>
  );
}

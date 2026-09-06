'use client';

import { Button } from '@astryxdesign/core/Button';
import { ErrandFilterQuery } from '@components/filtering/errand-filter-query.component';
import Filtering from '@components/filtering/filtering.component';
import { LinkButton } from '@components/navigation/link-button.component';
import { ListFilter, Plus } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { appConfig } from 'src/config/appconfig';

export const ErrandFilter: React.FC = () => {
  const { t } = useTranslation();
  const [show, setShow] = useState(false);

  return (
    <>
      <div className="w-full flex gap-4 max-w-screen-2xl items-center">
        <ErrandFilterQuery />
        {appConfig.features.errandFilter && (
          <Button
            label={show ? t('filtering:hide_filter') : t('filtering:show_filter')}
            aria-controls={show ? 'errand-filter-panel' : undefined}
            aria-expanded={show}
            onClick={() => {
              setShow(!show);
            }}
            data-cy="Show-filters-button"
            variant={show ? 'secondary' : 'ghost'}
            icon={<ListFilter aria-hidden="true" size={18} />}
          />
        )}
        <LinkButton
          label={t('filtering:new_errand')}
          href="/arende/registrera"
          data-cy="register-new-errand-button"
          variant="primary"
          icon={<Plus aria-hidden="true" size={18} />}
        >
          {t('filtering:new_errand')}
        </LinkButton>
      </div>
      {show && (
        <section id="errand-filter-panel" aria-label={t('filtering:filter_panel')}>
          <Filtering />
        </section>
      )}
    </>
  );
};

'use client';

import { LinkButton } from '@components/navigation/link-button.component';
import { Button, cx } from '@sk-web-gui/react';
import { ChevronsLeft, ChevronsRight, Plus } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { OverviewStatusNav } from './overview-status-nav.component';

/**
 * Översiktens vänsterpanel: vägen till en ny rapport och listorna man kan växla mellan.
 * Logotyp, aviseringar och inloggad användare ligger i sidhuvudet ovanför, inte här.
 */
export const OverviewSidebar: React.FC = () => {
  const { t } = useTranslation();
  const [open, setOpen] = useState<boolean>(true);

  return (
    <aside
      data-cy="overview-aside"
      className={cx(
        'bg-background-content border-divider sticky flex flex-col justify-between border-r-1 transition-all duration-150 ease-in-out',
        open ? 'w-[32rem] min-w-[32rem]' : 'w-[5.6rem] min-w-[5.6rem]'
      )}
    >
      <div className={cx('flex flex-col gap-32', open ? 'p-24' : 'items-center px-8 py-24')}>
        <LinkButton
          href="/arende/registrera"
          data-cy="register-new-errand-button"
          variant="primary"
          color="vattjom"
          className={open ? 'w-full' : ''}
          iconButton={!open}
          leftIcon={<Plus aria-hidden="true" />}
          aria-label={open ? undefined : t('filtering:new_errand_mobile')}
        >
          {open ? t('filtering:new_errand_mobile') : undefined}
        </LinkButton>

        <div className="flex flex-col gap-8">
          {open && <h2 className="text-dark-secondary text-small px-12 font-bold">{t('filtering:reports_heading')}</h2>}
          <OverviewStatusNav collapsed={!open} />
        </div>
      </div>

      <div className={cx('p-24', open ? 'self-end' : 'self-center')}>
        <Button
          color="primary"
          size="md"
          variant="tertiary"
          aria-label={open ? t('layout:controls.close_sidebar') : t('layout:controls.open_sidebar')}
          iconButton
          leftIcon={open ? <ChevronsLeft /> : <ChevronsRight />}
          onClick={() => {
            setOpen(!open);
          }}
        />
      </div>
    </aside>
  );
};

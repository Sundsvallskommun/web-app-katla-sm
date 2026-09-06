'use client';

import { IconButton } from '@astryxdesign/core/IconButton';
import { LinkButton } from '@components/navigation/link-button.component';
import { NotificationsBell } from '@components/notifications/notification-bell';
import { NotificationsWrapper } from '@components/notifications/notification-wrapper';
import { capitalize } from 'lodash';
import { Menu, Plus } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useOverviewErrands } from 'src/hooks/use-overview-errands';
import { useActiveStatusLabel } from 'src/hooks/use-status-buttons';

import { MainPageMobileHeader } from './main-page-mobile-header.component';
import { MobileErrandsList } from './mobile-errands-list.component';
import { MobileMenuBody } from './mobile-menu-body.component';

type OverlayType = 'menu' | null;

export const MobileOverviewLayout: React.FC = () => {
  const { t } = useTranslation();
  const [overlay, setOverlay] = useState<OverlayType>(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const activeStatusLabel = useActiveStatusLabel();
  const { rows, isLoading, hasMore, loadMore, totalElements, errandsError, metadataError } = useOverviewErrands({
    mode: 'mobile',
  });
  const errors = [metadataError, errandsError].filter((message): message is string => message !== null);

  const statusLabel = capitalize(activeStatusLabel);

  return (
    <>
      <MainPageMobileHeader
        actions={
          <div className="flex items-center gap-3">
            <NotificationsBell
              expanded={showNotifications}
              toggleShow={() => {
                setShowNotifications((current) => !current);
              }}
            />
            <IconButton
              variant="ghost"
              label={t('layout:controls.open_menu')}
              icon={<Menu aria-hidden="true" />}
              aria-controls={overlay === 'menu' ? 'mobile-overview-menu' : undefined}
              aria-expanded={overlay === 'menu'}
              onClick={() => {
                setOverlay('menu');
              }}
            />
          </div>
        }
      >
        <div className="px-6 py-3">
          <LinkButton
            href="/arende/registrera"
            label={t('filtering:new_errand_mobile')}
            variant="primary"
            className="w-full"
            icon={<Plus aria-hidden="true" />}
          >
            {t('filtering:new_errand_mobile')}
          </LinkButton>
        </div>

        <div className="px-6 pt-2 pb-3">
          <h2 className="text-xl font-semibold">{statusLabel}</h2>
          {rows.length < totalElements && (
            <span className="text-sm text-muted">
              {t('filtering:showing_of', { shown: rows.length, total: totalElements })}
            </span>
          )}
        </div>

        <MobileErrandsList rows={rows} isLoading={isLoading} hasMore={hasMore} loadMore={loadMore} errors={errors} />
      </MainPageMobileHeader>

      <MobileMenuBody
        show={overlay === 'menu'}
        onClose={() => {
          setOverlay(null);
        }}
      />

      <NotificationsWrapper show={showNotifications} setShow={setShowNotifications} />
    </>
  );
};

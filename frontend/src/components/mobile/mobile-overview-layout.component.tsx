'use client';

import { LinkButton } from '@components/navigation/link-button.component';
import { NotificationsBell } from '@components/notifications/notification-bell';
import { NotificationsWrapper } from '@components/notifications/notification-wrapper';
import { Button } from '@sk-web-gui/react';
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
          <div className="flex items-center gap-12">
            <div className="[&>button]:!mx-0">
              <NotificationsBell
                inverted
                expanded={showNotifications}
                toggleShow={() => {
                  setShowNotifications((current) => !current);
                }}
              />
            </div>
            <Button
              inverted
              iconButton
              variant="tertiary"
              aria-label={t('layout:controls.open_menu')}
              aria-controls={overlay === 'menu' ? 'mobile-overview-menu' : undefined}
              aria-expanded={overlay === 'menu'}
              onClick={() => {
                setOverlay('menu');
              }}
            >
              <Menu />
            </Button>
          </div>
        }
      >
        <div className="px-24 py-12">
          <LinkButton
            href="/arende/registrera"
            color="vattjom"
            variant="primary"
            className="w-full"
            leftIcon={<Plus aria-hidden="true" />}
          >
            {t('filtering:new_errand_mobile')}
          </LinkButton>
        </div>

        <div className="px-24 pt-8 pb-12">
          <h2 className="text-h3-md">{statusLabel}</h2>
          {rows.length < totalElements && (
            <span className="text-small text-dark-secondary">
              {t('filtering:showing_of', { shown: rows.length, total: totalElements })}
            </span>
          )}
        </div>

        <MobileErrandsList rows={rows} isLoading={isLoading} hasMore={hasMore} loadMore={loadMore} errors={errors} />
      </MainPageMobileHeader>

      {overlay === 'menu' && (
        <MobileMenuBody
          onClose={() => {
            setOverlay(null);
          }}
        />
      )}

      <NotificationsWrapper show={showNotifications} setShow={setShowNotifications} open={false} />
    </>
  );
};

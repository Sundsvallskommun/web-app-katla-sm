import { NotificationsWrapper } from '@components/notifications/notification-wrapper';
import { getMetadata } from '@services/errand-service/errand-service';
import { useEffect, useState } from 'react';
import { useMetadataStore } from 'src/stores/metadata-store';
import { MobileErrandsList } from './mobile-errands-list.component';
import { MobileMainPageHeader } from './mobile-main-page-header.component';
import { MobileMenuBody } from './mobile-menu-body.component';
import { MobilePage } from './mobile-page.component';
import { MobileSearchBody } from './mobile-search-body.component';

export const MobileOverviewLayout: React.FC = () => {
  const [showSearch, setShowSearch] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const { setMetadata } = useMetadataStore();

  useEffect(() => {
    getMetadata().then((res) => setMetadata(res));
  }, [setMetadata]);

  return (
    <>
      <MobileMainPageHeader
        onSearchOpen={() => setShowSearch(true)}
        onNotificationsOpen={() => setShowNotifications(!showNotifications)}
        onMenuOpen={() => setShowMenu(true)}
      >
        <div className="pt-8">
          <MobileErrandsList />
        </div>
      </MobileMainPageHeader>

      {showSearch && (
        <MobilePage title="Sök & Filtrera" icon="search" onClose={() => setShowSearch(false)}>
          <MobileSearchBody onClose={() => setShowSearch(false)} />
        </MobilePage>
      )}

      {showNotifications && (
        <NotificationsWrapper show={showNotifications} setShow={setShowNotifications} />
      )}

      {showMenu && (
        <MobilePage title="Meny" icon="menu" onClose={() => setShowMenu(false)}>
          <MobileMenuBody />
        </MobilePage>
      )}
    </>
  );
};

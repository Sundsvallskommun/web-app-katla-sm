import { NotificationsBell } from '@components/notifications/notification-bell';
import LucideIcon from '@sk-web-gui/lucide-icon';
import { Button } from '@sk-web-gui/react';
import { ReactNode } from 'react';
import { MobileHeaderLogo } from './mobile-header-logo.component';

interface MobileMainPageHeaderProps {
  onSearchOpen: () => void;
  onNotificationsOpen: () => void;
  onMenuOpen: () => void;
  children: ReactNode;
}

export const MobileMainPageHeader: React.FC<MobileMainPageHeaderProps> = ({
  onSearchOpen,
  onNotificationsOpen,
  onMenuOpen,
  children,
}) => {
  return (
    <div className="flex flex-col h-[100dvh] pt-[env(safe-area-inset-top)]">
      <header className="flex-shrink-0 flex items-center justify-between px-24 bg-vattjom-background-200 min-h-[7rem]">
        <div className="min-w-0 flex-1">
          <MobileHeaderLogo />
        </div>
        <div className="flex items-center gap-12 shrink-0">
          <div className="[&>button]:!mx-0">
            <NotificationsBell toggleShow={onNotificationsOpen} />
          </div>
          <Button iconButton variant="tertiary" aria-label="Sök" onClick={onSearchOpen}>
            <LucideIcon name="search" />
          </Button>
          <Button iconButton variant="tertiary" aria-label="Meny" onClick={onMenuOpen}>
            <LucideIcon name="menu" />
          </Button>
        </div>
      </header>
      <div className="flex-grow overflow-y-auto bg-background-100">{children}</div>
    </div>
  );
};

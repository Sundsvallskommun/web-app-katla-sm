import { LogoutButton } from '@components/buttons/logout-button.component';
import { FilterOverviewSidebarStatusSelector } from '@components/sidebars/filter-overview-sidebar-status-selector.component';
import { useUserStore } from '@services/user-service/user-service';
import LucideIcon from '@sk-web-gui/lucide-icon';
import { Button, Divider, Link, UserMenu } from '@sk-web-gui/react';
import { useTranslation } from 'react-i18next';
import { useShallow } from 'zustand/react/shallow';
import { userMenuGroups } from '@layouts/userMenuGroup';

export const MobileMenuBody: React.FC = () => {
  const { t } = useTranslation();
  const user = useUserStore(useShallow((s) => s.user));

  return (
    <div className="flex flex-col gap-16 p-16">
      <div className="flex items-center gap-12">
        <UserMenu
          initials={`${user.initials}`}
          menuTitle={`${user.name} (${user.username})`}
          menuGroups={userMenuGroups}
          buttonSize="md"
          className="flex-shrink-0"
          buttonRounded={false}
        />
        <span className="leading-tight font-bold">{user.name}</span>
      </div>

      <Link href={`${process.env.NEXT_PUBLIC_BASE_PATH}/arende/registrera`} target="_blank" className="no-underline">
        <Button
          color="primary"
          variant="primary"
          className="w-full"
          rightIcon={<LucideIcon name="external-link" />}
        >
          {t('filtering:new_errand')}
        </Button>
      </Link>

      <Divider />

      <div className="flex flex-col gap-8">
        <FilterOverviewSidebarStatusSelector smallSideBar={false} />
      </div>

      <Divider />

      <LogoutButton />
    </div>
  );
};

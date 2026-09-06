'use client';

import { SideNavItem } from '@astryxdesign/core/SideNav';
import { ErrorAlert } from '@components/misc/error-alert.component';
import { CircleAlert } from 'lucide-react';
import { useStatusButtons } from 'src/hooks/use-status-buttons';

export const OverviewStatusNav: React.FC<{ collapsed?: boolean }> = ({ collapsed = false }) => {
  const { statusButtons, activeStatus, onSelectStatus, error } = useStatusButtons();

  return (
    <>
      {error &&
        (collapsed ?
          <div role="alert" title={error} className="text-danger flex justify-center">
            <CircleAlert aria-hidden="true" />
            <span className="sr-only">{error}</span>
          </div>
        : <ErrorAlert message={error} />)}
      {statusButtons.map((button) => (
        <SideNavItem
          key={button.key}
          label={button.label}
          onClick={() => {
            onSelectStatus(button);
          }}
          isSelected={activeStatus === button.key}
          icon={button.icon}
        />
      ))}
    </>
  );
};

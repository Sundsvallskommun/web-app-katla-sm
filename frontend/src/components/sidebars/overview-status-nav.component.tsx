'use client';

import { ErrorAlert } from '@components/misc/error-alert.component';
import { Button } from '@sk-web-gui/react';
import { CircleAlert } from 'lucide-react';
import { useStatusButtons } from 'src/hooks/use-status-buttons';

/**
 * Listorna man kan växla mellan i översikten. Den valda listan markeras; antalen står inte här
 * utan i rubriken över tabellen, där de gäller det man faktiskt tittar på.
 */
export const OverviewStatusNav: React.FC<{ collapsed?: boolean }> = ({ collapsed = false }) => {
  const { statusButtons, activeStatus, onSelectStatus, error } = useStatusButtons();

  return (
    <nav className="flex flex-col gap-4">
      {error &&
        (collapsed ?
          <div role="alert" title={error} className="text-error mb-8 flex justify-center">
            <CircleAlert aria-hidden="true" />
            <span className="sr-only">{error}</span>
          </div>
        : <ErrorAlert className="mb-8" message={error} />)}
      {statusButtons.map((button) => {
        const isActive = activeStatus === button.key;

        return (
          <Button
            key={button.key}
            onClick={() => {
              onSelectStatus(button);
            }}
            aria-label={collapsed ? button.label : `status-button-${button.label}`}
            aria-current={isActive ? 'page' : undefined}
            variant={isActive ? 'primary' : 'ghost'}
            color="vattjom"
            inverted={isActive}
            className={collapsed ? '' : 'justify-start'}
            leftIcon={button.icon}
            iconButton={collapsed}
          >
            {collapsed ? undefined : button.label}
          </Button>
        );
      })}
    </nav>
  );
};

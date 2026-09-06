'use client';

import { Badge } from '@astryxdesign/core/Badge';
import { Button } from '@astryxdesign/core/Button';
import { ErrorAlert } from '@components/misc/error-alert.component';
import { capitalize } from 'lodash';
import { useStatusButtons } from 'src/hooks/use-status-buttons';

export const MobileStatusTabs: React.FC = () => {
  const { statusButtons, activeStatus, onSelectStatus, isLoading, error } = useStatusButtons();

  return (
    <div>
      {error && <ErrorAlert className="mx-4 mt-2" message={error} />}
      <div className="flex gap-2 overflow-x-auto px-4 py-2 ">
        {statusButtons.map((button) => {
          const isActive = activeStatus === button.key;
          return (
            <Button
              key={button.key}
              label={capitalize(button.label)}
              onClick={() => {
                onSelectStatus(button);
              }}
              variant={isActive ? 'primary' : 'ghost'}
              size="lg"
              className="flex-shrink-0 min-h-[44px] gap-2"
              icon={button.icon}
              aria-label={`status-${button.label}`}
              aria-current={isActive ? 'page' : undefined}
              endContent={
                <Badge
                  label={
                    isLoading ? '-'
                    : button.errandsCount > 999 ?
                      '999+'
                    : button.errandsCount || '0'
                  }
                />
              }
            />
          );
        })}
      </div>
    </div>
  );
};

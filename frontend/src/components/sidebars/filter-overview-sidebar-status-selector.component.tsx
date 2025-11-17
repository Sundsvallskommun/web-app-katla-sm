import { getErrandsCount } from '@services/errand-service/errand-service';
import LucideIcon from '@sk-web-gui/lucide-icon';
import { Badge, Button } from '@sk-web-gui/react';
import { capitalize } from 'lodash';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useErrandCountStore } from 'src/stores/errand-count-store';
import { useFilterStore } from 'src/stores/filter-store';

//TODO: Set correct statuses

type LucideIconName = React.ComponentProps<typeof LucideIcon>['name'];

interface SidebarButton {
  label: string;
  statuses: string[];
  icon: LucideIconName;
  errandsCount: number;
}

export const FilterOverviewSidebarStatusSelector: React.FC<{
  smallSideBar: boolean;
}> = ({ smallSideBar }) => {
  const [Isloading, setIsLoading] = useState<boolean>(false);
  const { t } = useTranslation();
  const { activeStatus, setActiveStatus, setStatuses, statuses } = useFilterStore();
  const {
    newErrandCount,
    draftErrandCount,
    closedErrandCount,
    setNewErrandCount,
    setDraftErrandCount,
    setClosedErrandCount,
  } = useErrandCountStore();

  useEffect(() => {
    if (!activeStatus) {
      setActiveStatus(t('filtering:errands.open'));
    }
  }, [t, activeStatus, setActiveStatus]);

  const supportSidebarButtons: SidebarButton[] = [
    {
      label: t('filtering:errands.open'),
      statuses: ['NEW'],
      icon: 'clipboard-pen',
      errandsCount: newErrandCount,
    },
    {
      label: t('filtering:errands.draft'),
      statuses: ['SUSPENDED', 'ASSIGNED'],
      icon: 'square-pen',
      errandsCount: draftErrandCount,
    },
    {
      label: t('filtering:errands.closed'),
      statuses: ['SOLVED'],
      icon: 'circle-check-big',
      errandsCount: closedErrandCount,
    },
  ];

  useEffect(() => {
    setIsLoading(true);
    getErrandsCount({ statuses: supportSidebarButtons[0].statuses }).then((data) => {
      setNewErrandCount(data.count || 0);
    });
    getErrandsCount({ statuses: supportSidebarButtons[1].statuses }).then((data) => {
      setDraftErrandCount(data.count || 0);
    });
    getErrandsCount({ statuses: supportSidebarButtons[2].statuses }).then((data) => {
      setClosedErrandCount(data.count || 0);
    });
    setIsLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statuses]);

  return (
    <>
      {supportSidebarButtons?.map((button) => {
        const isActive = activeStatus === button.label;
        return (
          <Button
            onClick={() => {
              setActiveStatus(button.label);
              setStatuses(button.statuses);
            }}
            aria-label={`status-button-${button.label}`}
            variant={isActive ? 'primary' : 'ghost'}
            className={`${!smallSideBar && 'justify-start'} ${!isActive && 'hover:bg-dark-ghost'}`}
            leftIcon={<LucideIcon name={button.icon} />}
            key={button.label}
            iconButton={smallSideBar}
          >
            {!smallSideBar && (
              <span className="w-full flex justify-between">
                {capitalize(button.label)}
                <Badge
                  className="min-w-fit px-4"
                  inverted={!isActive}
                  color={isActive ? 'tertiary' : 'vattjom'}
                  counter={
                    Isloading ? '-'
                    : button.errandsCount > 999 ?
                      '999+'
                    : button.errandsCount || '0'
                  }
                />
              </span>
            )}
          </Button>
        );
      })}
    </>
  );
};

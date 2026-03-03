import { getErrandsCount } from '@services/errand-service/errand-service';
import { CircleCheckBig, ClipboardPen, SquarePen } from 'lucide-react';
import { Badge, Button } from '@sk-web-gui/react';
import { ReactElement } from 'react';
import { capitalize } from 'lodash';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useErrandCountStore } from 'src/stores/errand-count-store';
import { useFilterStore } from 'src/stores/filter-store';
import { useSortStore } from 'src/stores/sort-store';

//TODO: Set correct statuses

interface SidebarButton {
  label: string;
  statuses: string[];
  icon: ReactElement;
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
  const {reset} = useSortStore()
  const draftEnabled = process.env.NEXT_PUBLIC_DRAFT_ERRAND === 'true';

  useEffect(() => {
    if (!activeStatus) {
      setActiveStatus(t('filtering:errands.open'));
    }
  }, [t, activeStatus, setActiveStatus]);

  const allSidebarButtons: SidebarButton[] = [
    {
      label: t('filtering:errands.open'),
      statuses: ['NEW'],
      icon: <ClipboardPen />,
      errandsCount: newErrandCount,
    },
    {
      label: t('filtering:errands.draft'),
      statuses: ['DRAFT'],
      icon: <SquarePen />,
      errandsCount: draftErrandCount,
    },
    {
      label: t('filtering:errands.closed'),
      statuses: ['SOLVED'],
      icon: <CircleCheckBig />,
      errandsCount: closedErrandCount,
    },
  ];

  const supportSidebarButtons = draftEnabled
    ? allSidebarButtons
    : allSidebarButtons.filter((button) => !button.statuses.includes('DRAFT'));

  useEffect(() => {
    setIsLoading(true);
    getErrandsCount({ statuses: ['NEW'] }).then((data) => {
      setNewErrandCount(data.count || 0);
    });
    if (draftEnabled) {
      getErrandsCount({ statuses: ['DRAFT'] }).then((data) => {
        setDraftErrandCount(data.count || 0);
      });
    }
    getErrandsCount({ statuses: ['SOLVED'] }).then((data) => {
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
              reset();

            }}
            aria-label={`status-button-${button.label}`}
            variant={isActive ? 'primary' : 'ghost'}
            className={`${!smallSideBar && 'justify-start'} ${!isActive && 'hover:bg-dark-ghost'}`}
            leftIcon={button.icon}
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

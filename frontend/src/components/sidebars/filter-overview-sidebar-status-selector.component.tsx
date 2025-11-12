import { useSidebarStore } from '@services/sidebar-store';
import LucideIcon from '@sk-web-gui/lucide-icon';
import { Badge, Button } from '@sk-web-gui/react';
import { capitalize } from 'lodash';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

// export interface SupportManagementStatusFilter {
//   status: Status[];
// }

// export const SupportManagementStatusValues = {
//   status: [],
// };

type LucideIconName = React.ComponentProps<typeof LucideIcon>['name'];

interface SidebarButton {
  label: string;
  //   key: Status | ErrandStatus;
  //   statuses: Status[] | ErrandStatus[];
  icon: LucideIconName;
  totalStatusErrands: number;
}

export const FilterOverviewSidebarStatusSelector: React.FC<{
  smallSideBar: boolean;
}> = ({ smallSideBar }) => {
  const { t } = useTranslation();
  const { activeStatus, setActiveStatus } = useSidebarStore();

  useEffect(() => {
    if (!activeStatus) {
      setActiveStatus(t('filtering:errands.open'));
    }
  }, [t, activeStatus, setActiveStatus]);

  //   const {
  //     isLoading,
  //     setSidebarLabel,
  //     setSelectedSupportErrandStatuses,
  //     selectedSupportErrandStatuses,
  //     newSupportErrands,
  //     ongoingSupportErrands,
  //     assignedSupportErrands,
  //     suspendedSupportErrands,
  //     solvedSupportErrands,
  //   }: AppContextInterface = useAppContext();

  //   const updateStatusFilter = (ss: Status[]) => {
  //     try {
  //       const storedFilter = store.get('filter');
  //       const jsonparsedstatus = JSON.parse(storedFilter);
  //       const status = ss.join(',');
  //       jsonparsedstatus.status = status;
  //       const stringified = JSON.stringify(jsonparsedstatus);
  //       store.set('filter', stringified);
  //       setSelectedSupportErrandStatuses(ss);
  //     } catch (error) {
  //       console.error('Error updating status filter');
  //     }
  //   };


  const supportSidebarButtons: SidebarButton[] = [
    {
      label: t('filtering:errands.open'),
      // key: newStatuses[0],
      // statuses: newStatuses,
      icon: 'clipboard-pen',
      totalStatusErrands: 1,
    },
    {
      label: t('filtering:errands.draft'),
      // key: newStatuses[0],
      // statuses: newStatuses,
      icon: 'square-pen',
      totalStatusErrands: 2,
    },
    {
      label: t('filtering:errands.closed'),
      // key: newStatuses[0],
      // statuses: newStatuses,
      icon: 'circle-check-big',
      totalStatusErrands: 3,
    },
  ];

  return (
    <>
      {supportSidebarButtons?.map((button) => {
        const isActive = activeStatus === button.label;
        return (
          <Button
            onClick={() => {
              setActiveStatus(button.label);
              //   updateStatusFilter(button.statuses as Status[]);
              //   setShowAttestationTable(false);
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
                    !activeStatus ? '-'
                    : button.totalStatusErrands > 999 ?
                      '999+'
                    : button.totalStatusErrands || '0'
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

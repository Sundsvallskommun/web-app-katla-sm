'use client';

import { SegmentedControl, SegmentedControlItem } from '@astryxdesign/core/SegmentedControl';
import { useTranslation } from 'react-i18next';
import { useStatusButtons } from 'src/hooks/use-status-buttons';

/** Both presentations use the same status selection and metadata owner. */
export const ErrandStatusFilter: React.FC = () => {
  const { t } = useTranslation();
  const { statusButtons, activeStatus, onSelectStatus } = useStatusButtons();
  return (
    <SegmentedControl
      data-cy="errand-status-filter"
      label={t('filtering:filter_panel')}
      value={activeStatus}
      size="lg"
      layout="fill"
      onChange={(key) => {
        const option = statusButtons.find((button) => button.key === key);
        if (option) onSelectStatus(option);
      }}
    >
      {statusButtons.map((button) => (
        <SegmentedControlItem key={button.key} value={button.key} label={button.label} />
      ))}
    </SegmentedControl>
  );
};

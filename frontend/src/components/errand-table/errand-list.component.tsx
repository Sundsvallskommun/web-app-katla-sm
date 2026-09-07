import { Button } from '@astryxdesign/core/Button';
import { List } from '@astryxdesign/core/List';
import { Stack } from '@astryxdesign/core/Stack';
import { ErrandDTO } from '@data-contracts/backend/data-contracts';
import { useTranslation } from 'react-i18next';

import { ErrandListItem } from './errand-list-item.component';

interface ErrandListProps {
  rows: ErrandDTO[];
  isLoading: boolean;
  hasMore: boolean;
  loadMore: () => void;
}
export const ErrandList: React.FC<ErrandListProps> = ({ rows, isLoading, hasMore, loadMore }) => {
  const { t } = useTranslation();
  return (
    <Stack gap={4}>
      <List hasDividers density="spacious" aria-label={t('filtering:reports_heading')}>
        {rows.map((errand) => (
          <ErrandListItem key={errand.errandNumber} errand={errand} />
        ))}
      </List>
      {hasMore && (
        <Button
          label={t('filtering:load_more')}
          variant="secondary"
          size="lg"
          isLoading={isLoading}
          isDisabled={isLoading}
          onClick={loadMore}
          width="100%"
        />
      )}
    </Stack>
  );
};

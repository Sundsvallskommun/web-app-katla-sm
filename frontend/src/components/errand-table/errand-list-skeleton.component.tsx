import { List, ListItem } from '@astryxdesign/core/List';
import { Skeleton } from '@astryxdesign/core/Skeleton';
import { Stack } from '@astryxdesign/core/Stack';

/** Mirrors ErrandListItem's three content lines without fake record data. */
export const ErrandListSkeleton: React.FC = () => (
  <List hasDividers density="spacious" aria-hidden="true" data-cy="errand-list-skeleton">
    {[0, 1, 2].map((index) => (
      <ListItem
        key={index}
        label=""
        description={
          <Stack gap={2}>
            <Skeleton width="40%" height="1.25em" index={index} />
            <Skeleton width="55%" height="1.25em" index={index} />
            <Stack direction="horizontal" gap={3}>
              <Skeleton width="25%" height="1.5em" index={index} />
              <Skeleton width="30%" height="1.5em" index={index} />
            </Stack>
          </Stack>
        }
      />
    ))}
  </List>
);

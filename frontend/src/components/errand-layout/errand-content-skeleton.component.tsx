import { Skeleton } from '@astryxdesign/core/Skeleton';
import { Stack } from '@astryxdesign/core/Stack';

export const ErrandContentSkeleton: React.FC = () => (
  <Stack gap={6} aria-hidden="true" data-cy="errand-content-skeleton">
    <Skeleton width="60%" height="2em" />
    <Skeleton width="80%" height="2.5em" />
    {[0, 1, 2].map((index) => (
      <Stack gap={3} key={index}>
        <Skeleton width="35%" height="1.5em" index={index} />
        <Skeleton width="75%" height="1em" index={index} />
        <Skeleton height="5em" index={index} />
      </Stack>
    ))}
  </Stack>
);

import { Skeleton } from '@astryxdesign/core/Skeleton';
import { Stack } from '@astryxdesign/core/Stack';

export const MessageListSkeleton: React.FC = () => (
  <Stack aria-hidden="true" data-cy="message-list-skeleton" className="divide-y divide-default">
    {[0, 1].map((index) => (
      <Stack key={index} gap={4} paddingBlock={4}>
        <Stack direction="horizontal" gap={3} align="center">
          <Skeleton width="2.5em" height="2.5em" radius="rounded" index={index} />
          <Stack gap={2} width="60%">
            <Skeleton width="60%" height="1.25em" index={index} />
            <Skeleton width="80%" height="1em" index={index} />
          </Stack>
        </Stack>
        <Skeleton width="90%" height="1em" index={index} />
        <Skeleton width="65%" height="1em" index={index} />
      </Stack>
    ))}
  </Stack>
);

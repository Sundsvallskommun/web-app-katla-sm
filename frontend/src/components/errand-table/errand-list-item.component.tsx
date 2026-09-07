'use client';

import { ListItem } from '@astryxdesign/core/List';
import { Stack } from '@astryxdesign/core/Stack';
import { Text } from '@astryxdesign/core/Text';
import { StatusLabel } from '@components/misc/status-label.component';
import { ErrandDTO } from '@data-contracts/backend/data-contracts';
import { getTypeDisplayName } from '@utils/errand-helpers';
import dayjs from 'dayjs';
import { ChevronRight } from 'lucide-react';
import NextLink from 'next/link';
import { useRef } from 'react';
import { useTranslation } from 'react-i18next';

export const ErrandListItem: React.FC<{ errand: ErrandDTO }> = ({ errand }) => {
  const { t } = useTranslation();
  const linkRef = useRef<HTMLAnchorElement>(null);
  return (
    <ListItem
      data-cy="errand-list-item"
      label={getTypeDisplayName(errand, t)}
      // Enlarge the real Next link's tap target without adding a second tab stop.
      interactiveRef={linkRef}
      description={
        <Stack gap={2}>
          <NextLink
            ref={linkRef}
            href={`/arende/${errand.errandNumber}/grundinformation`}
            aria-label={t('layout:controls.open_errand', { errandNumber: errand.errandNumber })}
            className="text-primary underline decoration-current underline-offset-2"
          >
            {errand.errandNumber}
          </NextLink>
          <Stack direction="horizontal" align="center" gap={3} wrap="wrap">
            <StatusLabel status={errand.status} />
            <Text color="secondary" type="supporting">
              <time dateTime={errand.created}>{dayjs(errand.created).format('YYYY-MM-DD')}</time>
            </Text>
          </Stack>
        </Stack>
      }
      endContent={<ChevronRight aria-hidden="true" />}
    />
  );
};

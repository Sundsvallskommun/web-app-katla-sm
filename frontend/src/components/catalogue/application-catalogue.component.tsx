'use client';

import { Button } from '@astryxdesign/core/Button';
import { EmptyState } from '@astryxdesign/core/EmptyState';
import { Heading } from '@astryxdesign/core/Heading';
import { Layout, LayoutContent } from '@astryxdesign/core/Layout';
import { List, ListItem } from '@astryxdesign/core/List';
import { Spinner } from '@astryxdesign/core/Spinner';
import { Stack } from '@astryxdesign/core/Stack';
import { Text } from '@astryxdesign/core/Text';
import { ErrorAlert } from '@components/misc/error-alert.component';
import type { ApplicationSummaryDTO } from '@data-contracts/backend/data-contracts';
import { getApplications } from '@services/application-service';
import { ArrowRight, LayoutGrid } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

type CatalogueState =
  { status: 'loading' } | { status: 'error' } | { status: 'ready'; applications: ApplicationSummaryDTO[] };

/** A single capped column of server-authorised destinations at every viewport width. */
export const ApplicationCatalogue = () => {
  const { t } = useTranslation();
  const [state, setState] = useState<CatalogueState>({ status: 'loading' });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    void getApplications(controller.signal)
      .then((applications) => {
        if (!controller.signal.aborted) setState({ status: 'ready', applications });
      })
      .catch(() => {
        if (!controller.signal.aborted) setState({ status: 'error' });
      });
    return () => {
      controller.abort();
    };
  }, [attempt]);

  return (
    <Layout height="auto" contentWidth={960} padding={4}>
      <LayoutContent isScrollable={false}>
        <Stack gap={6}>
          <Stack gap={2}>
            <Heading level={1}>{t('catalogue:title')}</Heading>
            <Text color="secondary">{t('catalogue:description')}</Text>
          </Stack>
          {state.status === 'loading' && <Spinner size="lg" label={t('catalogue:loading')} />}
          {state.status === 'error' && (
            <Stack gap={4} align="start">
              <ErrorAlert message={t('catalogue:error')} />
              <Button
                label={t('catalogue:retry')}
                onClick={() => {
                  setState({ status: 'loading' });
                  setAttempt((value) => value + 1);
                }}
              />
            </Stack>
          )}
          {state.status === 'ready' &&
            (state.applications.length === 0 ?
              <EmptyState
                headingLevel={2}
                title={t('catalogue:empty_title')}
                description={t('catalogue:empty_description')}
                icon={<LayoutGrid aria-hidden="true" />}
              />
            : <List header={<Heading level={2}>{t('catalogue:available')}</Heading>} density="spacious" hasDividers>
                {state.applications.map((application) => (
                  <ListItem
                    key={application.id}
                    label={application.applicationName}
                    description={
                      application.description ? <Text color="secondary">{application.description}</Text> : undefined
                    }
                    href={application.url}
                    endContent={
                      <Stack direction="horizontal" align="center" gap={2} aria-hidden="true">
                        <Text>{t('catalogue:open')}</Text>
                        <ArrowRight />
                      </Stack>
                    }
                  />
                ))}
              </List>)}
        </Stack>
      </LayoutContent>
    </Layout>
  );
};

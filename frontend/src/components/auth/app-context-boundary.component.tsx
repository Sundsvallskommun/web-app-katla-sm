'use client';

import { localeFromPath } from '@app/locale-path';
import { Button } from '@astryxdesign/core/Button';
import { Heading } from '@astryxdesign/core/Heading';
import { Spinner } from '@astryxdesign/core/Spinner';
import { Stack } from '@astryxdesign/core/Stack';
import { Text } from '@astryxdesign/core/Text';
import { ErrorAlert } from '@components/misc/error-alert.component';
import { AppContextMismatchError, verifyApplicationContext } from '@services/application-service';
import { usePathname } from 'next/navigation';
import { type ReactNode, useEffect, useState } from 'react';
import { appConfig } from 'src/config/appconfig';

import english from '../../../locales/en/application.json';
import swedish from '../../../locales/sv/application.json';

type ContextState = 'loading' | 'ready' | 'mismatch' | 'unavailable';

/** Above localisation and authenticated views: an incompatible deployment must never mount case hooks. */
export const AppContextBoundary = ({ children }: { children: ReactNode }) => {
  const pathname = usePathname();
  const messages = localeFromPath(pathname) === 'en' ? english : swedish;
  const [state, setState] = useState<ContextState>('loading');
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    void verifyApplicationContext(
      {
        mode: appConfig.mode,
        katlaId: appConfig.katla?.id,
        definitionRevision: appConfig.definitionRevision ?? undefined,
      },
      controller.signal
    )
      .then(() => {
        if (!controller.signal.aborted) setState('ready');
      })
      .catch((error: unknown) => {
        if (!controller.signal.aborted) setState(error instanceof AppContextMismatchError ? 'mismatch' : 'unavailable');
      });
    return () => {
      controller.abort();
    };
  }, [attempt]);

  if (state === 'ready') return children;

  return (
    <Stack as="main" minHeight="100dvh" padding={6} justify="center" align="center" gap={4}>
      {state === 'loading' ?
        <Spinner size="lg" label={messages.loading} />
      : <>
          <Heading level={1}>{messages.title}</Heading>
          <ErrorAlert message={messages[state]} />
          <Text>{messages.next_step}</Text>
          <Button
            label={messages.retry}
            onClick={() => {
              setState('loading');
              setAttempt((value) => value + 1);
            }}
          />
        </>
      }
    </Stack>
  );
};

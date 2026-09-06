import { Stack } from '@astryxdesign/core/Stack';
import { LanguageSwitchButton } from '@components/misc/language-switch-button.component';
import type { ReactNode } from 'react';

import styles from './app-shell.module.css';
import { MunicipalityLogo } from './municipality-logo.component';

export const EntryLayout = ({
  children,
  className,
  logoClasses,
}: {
  children: ReactNode;
  className?: string;
  logoClasses?: string;
}) => (
  <Stack minHeight="100dvh" padding={6} gap={8}>
    <Stack direction="horizontal" justify="end">
      <LanguageSwitchButton />
    </Stack>
    <Stack
      align="center"
      gap={8}
      paddingBlock={8}
      className={[styles.entryContent, className].filter(Boolean).join(' ')}
    >
      <MunicipalityLogo className={logoClasses} />
      {children}
    </Stack>
  </Stack>
);

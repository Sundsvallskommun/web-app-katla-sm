'use client';

// Sidoeffekt: registrerar dayjs-plugins och locale-data högst upp i trädet, innan någon
// vy hinner formatera ett datum. Själva språkvalet sätts av LocalizationProvider.
import '@utils/dayjs-locale';

import { LinkProvider } from '@astryxdesign/core/Link';
import { Theme } from '@astryxdesign/core/theme';
import { useUserStore } from '@services/user-service/user-service';
import { useLocalStorage } from '@utils/use-localstorage.hook';
import NextLink from 'next/link';
import { ReactNode, useEffect } from 'react';
import { useShallow } from 'zustand/react/shallow';

import { katlaTheme } from '../../theme/generated/katla';

interface ClientApplicationProps {
  children: ReactNode;
}

const AppLayout = ({ children }: ClientApplicationProps) => {
  const colorScheme = useLocalStorage(useShallow((state) => state.colorScheme));
  const getMe = useUserStore((state) => state.getMe);

  useEffect(() => {
    void getMe();
  }, [getMe]);

  return (
    <LinkProvider component={NextLink}>
      <Theme theme={katlaTheme} mode={colorScheme}>
        {children}
      </Theme>
    </LinkProvider>
  );
};

export default AppLayout;

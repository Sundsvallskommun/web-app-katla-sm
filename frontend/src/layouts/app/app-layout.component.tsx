'use client';

import { ReactNode, useEffect, useState } from 'react';
import 'dayjs/locale/sv';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import updateLocale from 'dayjs/plugin/updateLocale';
import { GuiProvider } from '@sk-web-gui/react';
import { useLocalStorage } from '@utils/use-localstorage.hook';
import { useShallow } from 'zustand/react/shallow';
import { useUserStore } from '@services/user-service/user-service';
import LoaderFullScreen from '@components/loader/loader-fullscreen';

dayjs.extend(utc);
dayjs.locale('sv');
dayjs.extend(updateLocale);
dayjs.updateLocale('sv', {
  months: [
    'Januari',
    'Februari',
    'Mars',
    'April',
    'Maj',
    'Juni',
    'Juli',
    'Augusti',
    'September',
    'Oktober',
    'November',
    'December',
  ],
  monthsShort: ['Jan', 'Feb', 'Mar', 'Apr', 'Maj', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dec'],
});

interface ClientApplicationProps {
  children: ReactNode;
}

const AppLayout = ({ children }: ClientApplicationProps) => {
  const colorScheme = useLocalStorage(useShallow((state) => state.colorScheme));
  const getMe = useUserStore((state) => state.getMe);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    getMe();
    setMounted(true);
  }, [getMe, setMounted]);

  if (!mounted) {
    return <LoaderFullScreen />;
  }

  return <GuiProvider colorScheme={colorScheme}>{children}</GuiProvider>;
};

export default AppLayout;

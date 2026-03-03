import '@styles/tailwind.scss';
import { ReactNode } from 'react';
import AppLayout from '@layouts/app/app-layout.component';
import i18nConfig from './i18nConfig';

const RootLayout = ({ children }: { children: ReactNode }) => {
  return (
    <html lang={i18nConfig.defaultLocale}>
      <body>
        <AppLayout>{children}</AppLayout>
      </body>
    </html>
  );
};

export default RootLayout;

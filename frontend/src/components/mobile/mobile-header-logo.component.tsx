import { Logo } from '@sk-web-gui/react';
import NextLink from 'next/link';

export const MobileHeaderLogo: React.FC = () => {
  return (
    <NextLink
      href="/"
      className="no-underline overflow-hidden block max-w-[16rem] sm:max-w-[20rem]"
      aria-label={`Katla - ${process.env.NEXT_PUBLIC_APP_NAME}. Gå till startsidan.`}
    >
      <Logo
        variant="service"
        title="Katla"
        subtitle={process.env.NEXT_PUBLIC_APP_NAME}
        className="max-w-full [&_.sk-logo-title]:truncate [&_.sk-logo-subtitle]:truncate"
      />
    </NextLink>
  );
};

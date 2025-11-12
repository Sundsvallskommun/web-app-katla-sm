'use client';

import { useUserStore } from '@services/user-service/user-service';
import { appURL } from '@utils/app-url';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useShallow } from 'zustand/react/shallow';

const Logout: React.FC = () => {
  const router = useRouter();

  const resetUser = useUserStore(useShallow((s) => s.reset));

  useEffect(() => {
    resetUser();
    localStorage.clear();

    const query = new URLSearchParams({
      successRedirect: `${appURL()}/login?loggedout`,
    });
    router.push(`${process.env.NEXT_PUBLIC_API_URL}/saml/logout?${query.toString()}`);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <></>;
};

export default Logout;

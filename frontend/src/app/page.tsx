'use client';

import LoaderFullScreen from '@components/loader/loader-fullscreen';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

const RootIndex = () => {
  const router = useRouter();

  useEffect(() => {
    router.push('/login');
  }, [router]);

  return <LoaderFullScreen />;
};

export default RootIndex;
